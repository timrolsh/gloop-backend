import {MigrationInterface, QueryRunner} from "typeorm";

export class AddPointsLeaderboardViews1758766450000 implements MigrationInterface {
  name = "AddPointsLeaderboardViews1758766450000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing objects to rebuild them
    await queryRunner.query(`DROP VIEW IF EXISTS points_leaderboard CASCADE`);
    await queryRunner.query(`DROP VIEW IF EXISTS wallet_points_detailed CASCADE`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS get_staking_boost_multiplier(NUMERIC) CASCADE`);

    // Helper function to get staking boost multiplier
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION get_staking_boost_multiplier(lock_duration_seconds NUMERIC)
      RETURNS NUMERIC AS $$
      BEGIN
          CASE
              WHEN lock_duration_seconds >= 56 * 24 * 60 * 60 THEN RETURN 1.0;  -- 100% boost
              WHEN lock_duration_seconds >= 28 * 24 * 60 * 60 THEN RETURN 0.5;  -- 50% boost
              WHEN lock_duration_seconds >= 14 * 24 * 60 * 60 THEN RETURN 0.25; -- 25% boost
              ELSE RETURN 0.1; -- No-lock stake or any other locked stake
          END CASE;
      END;
      $$ LANGUAGE plpgsql IMMUTABLE;
    `);

    // VIEW 1: Detailed, period-by-period points calculation for all wallets
    await queryRunner.query(`
CREATE OR REPLACE VIEW wallet_points_detailed AS
WITH
    -- Define program start time (Unix timestamp: 1759237200)
    program_start AS (
        SELECT TO_TIMESTAMP(1759237200) AS ts
    ),

    -- Define program end time (Unix timestamp: 1759410000)
    program_end AS (
        SELECT TO_TIMESTAMP(1759410000) AS ts
    ),

    -- **MODIFIED**: Determine the effective end time for point calculation.
    -- This is the EARLIER of the program's defined end or the current time,
    -- preventing point projection into the future.
    effective_end_time AS (
        SELECT LEAST(NOW(), (SELECT ts FROM program_end)) AS ts
    ),

    -- This section calculates the starting balances for each wallet BEFORE the program_start timestamp.
    initial_transaction_balances AS (
        SELECT
            t."walletId",
            SUM(CASE WHEN t.event IN ('Deposit', 'Withdraw') THEN CASE WHEN t.event = 'Deposit' THEN t.amount ELSE -t.amount END ELSE 0 END) as initial_usdc_lending,
            SUM(CASE WHEN t.event IN ('Borrow', 'Repay') THEN CASE WHEN t.event = 'Borrow' THEN t.amount ELSE -t.amount END ELSE 0 END) as initial_usdc_borrowing
        FROM transactions t, program_start ps
        WHERE t."blockTimestamp" < ps.ts AND t."tokenName" = 'USDC'
        GROUP BY t."walletId"
    ),

    -- This section calculates the initial staking state for each wallet BEFORE the program_start timestamp.
    initial_staking_state AS (
        SELECT
            s."walletId",
            SUM(CASE WHEN s."eventType" = 'STAKE' THEN s."gloopAmount" ELSE -s."gloopAmount" END) as initial_gloop_staked,
            (SELECT s2."lockDurationSeconds" FROM staking_events s2, program_start ps WHERE s2."walletId" = s."walletId" AND s2."blockTimestamp" < ps.ts AND s2."eventType" = 'STAKE' ORDER BY s2."blockTimestamp" DESC LIMIT 1) as initial_lock_duration,
            (SELECT s2."blockTimestamp" FROM staking_events s2, program_start ps WHERE s2."walletId" = s."walletId" AND s2."blockTimestamp" < ps.ts AND s2."eventType" = 'STAKE' ORDER BY s2."blockTimestamp" DESC LIMIT 1) as initial_stake_time
        FROM staking_events s, program_start ps
        WHERE s."blockTimestamp" < ps.ts
        GROUP BY s."walletId"
    ),

    -- Calculate the initial state for every wallet.
    initial_states AS (
        SELECT
            w.id AS wallet_id,
            w.address AS wallet_address,
            COALESCE(itb.initial_usdc_lending, 0) AS initial_usdc_lending,
            COALESCE(itb.initial_usdc_borrowing, 0) AS initial_usdc_borrowing,
            COALESCE(iss.initial_gloop_staked, 0) AS initial_gloop_staked,
            iss.initial_lock_duration,
            iss.initial_stake_time
        FROM wallets w
        LEFT JOIN initial_transaction_balances itb ON w.id = itb."walletId"
        LEFT JOIN initial_staking_state iss ON w.id = iss."walletId"
    ),

    -- **MODIFIED**: Gather all events that occurred *within* the defined program start and end times.
    program_events AS (
        SELECT "walletId" AS wallet_id, "blockTimestamp" AS event_time, 'TRANSACTION' AS event_type, id AS source_id,
               CASE WHEN event = 'Deposit' THEN amount WHEN event = 'Withdraw' THEN -amount ELSE 0 END AS lending_delta,
               CASE WHEN event = 'Borrow' THEN amount WHEN event = 'Repay' THEN -amount ELSE 0 END AS borrowing_delta,
               0::numeric AS staking_delta, NULL::numeric AS new_lock_duration, NULL::timestamp AS new_stake_time
        FROM transactions t, program_start ps, program_end pe
        WHERE t."blockTimestamp" >= ps.ts AND t."blockTimestamp" < pe.ts AND t."tokenName" = 'USDC'
        UNION ALL
        SELECT "walletId" AS wallet_id, "blockTimestamp" AS event_time, 'STAKING' AS event_type, id AS source_id,
               0::numeric AS lending_delta, 0::numeric AS borrowing_delta,
               CASE WHEN "eventType" = 'STAKE' THEN "gloopAmount" WHEN "eventType" = 'UNSTAKE' THEN -"gloopAmount" ELSE 0 END AS staking_delta,
               CASE WHEN "eventType" = 'STAKE' THEN "lockDurationSeconds" ELSE NULL END AS new_lock_duration,
               CASE WHEN "eventType" = 'STAKE' THEN "blockTimestamp" ELSE NULL END AS new_stake_time
        FROM staking_events s, program_start ps, program_end pe
        WHERE s."blockTimestamp" >= ps.ts AND s."blockTimestamp" < pe.ts
        UNION ALL
        -- Add synthetic LOCK_EXPIRY events when a lock period ends (user drops from locked boost to 10% unlocked boost)
        SELECT "walletId" AS wallet_id, 
               "blockTimestamp" + (("lockDurationSeconds" || ' seconds')::interval) AS event_time, 
               'LOCK_EXPIRY' AS event_type, 
               id AS source_id,
               0::numeric AS lending_delta, 
               0::numeric AS borrowing_delta,
               0::numeric AS staking_delta, 
               0::numeric AS new_lock_duration,  -- Set to 0 to indicate unlocked but still staked (10% boost)
               "blockTimestamp" AS new_stake_time  -- Keep original stake time
        FROM staking_events s, program_start ps, effective_end_time eet
        WHERE s."eventType" = 'STAKE' 
          AND s."lockDurationSeconds" > 0
          AND s."blockTimestamp" + ((s."lockDurationSeconds" || ' seconds')::interval) >= ps.ts 
          AND s."blockTimestamp" + ((s."lockDurationSeconds" || ' seconds')::interval) < eet.ts
    ),

    -- Unify initial state and subsequent events into a single, time-ordered series for each wallet.
    unified_timeline AS (
        SELECT wallet_id, wallet_address, (SELECT ts FROM program_start) AS event_time, 'INITIAL' AS event_type, NULL::uuid AS source_id,
               initial_usdc_lending AS lending_delta, initial_usdc_borrowing AS borrowing_delta, initial_gloop_staked AS staking_delta,
               initial_lock_duration AS new_lock_duration, initial_stake_time AS new_stake_time
        FROM initial_states
        UNION ALL
        SELECT pe.wallet_id, w.address, pe.event_time, pe.event_type, pe.source_id,
               pe.lending_delta, pe.borrowing_delta, pe.staking_delta,
               pe.new_lock_duration, pe.new_stake_time
        FROM program_events pe
        JOIN wallets w ON w.id = pe.wallet_id
    ),

    -- Create grouping keys to carry forward non-null values.
    states_with_groups AS (
        SELECT *,
               COUNT(new_lock_duration) OVER (PARTITION BY wallet_id ORDER BY event_time, event_type, source_id) as lock_group,
               COUNT(new_stake_time) OVER (PARTITION BY wallet_id ORDER BY event_time, event_type, source_id) as stake_group
        FROM unified_timeline
    ),

    -- Calculate the running state at each point in the timeline.
    running_states AS (
        SELECT
            wallet_id, wallet_address, event_time,
            SUM(lending_delta) OVER (PARTITION BY wallet_id ORDER BY event_time, event_type, source_id) AS usdc_lending_balance,
            SUM(borrowing_delta) OVER (PARTITION BY wallet_id ORDER BY event_time, event_type, source_id) AS usdc_borrowing_balance,
            SUM(staking_delta) OVER (PARTITION BY wallet_id ORDER BY event_time, event_type, source_id) AS gloop_staked,
            FIRST_VALUE(new_lock_duration) OVER (PARTITION BY wallet_id, lock_group ORDER BY event_time, event_type, source_id) AS current_lock_duration,
            FIRST_VALUE(new_stake_time) OVER (PARTITION BY wallet_id, stake_group ORDER BY event_time, event_type, source_id) AS stake_start_time,
            -- **MODIFIED**: The next event time is now capped by the effective_end_time.
            LEAD(event_time, 1, (SELECT ts FROM effective_end_time)) OVER (PARTITION BY wallet_id ORDER BY event_time, event_type, source_id) AS next_event_time
        FROM states_with_groups
    ),

    -- Calculate points earned during each period between events.
    points_per_period AS (
        SELECT
            wallet_id, wallet_address,
            event_time AS period_start,
            -- **MODIFIED**: The period end is also capped to ensure it doesn't exceed the calculation window.
            LEAST(next_event_time, (SELECT ts FROM effective_end_time)) AS period_end,
            -- **MODIFIED**: The duration is calculated based on this potentially capped period.
            EXTRACT(EPOCH FROM (LEAST(next_event_time, (SELECT ts FROM effective_end_time)) - event_time)) AS period_seconds,
            usdc_lending_balance, usdc_borrowing_balance, gloop_staked,
            CASE
                WHEN gloop_staked <= 0 OR usdc_lending_balance < 100 THEN 0
                WHEN current_lock_duration IS NULL THEN 0.1
                WHEN current_lock_duration = 0 THEN 0.1
                WHEN stake_start_time IS NULL THEN 0.1
                WHEN stake_start_time + (current_lock_duration || ' seconds')::interval < event_time THEN 0.1
                ELSE get_staking_boost_multiplier(current_lock_duration)
            END AS boost_multiplier
        FROM running_states
        -- **MODIFIED**: Ensure we only calculate points for periods that have already started.
        WHERE event_time < (SELECT ts FROM effective_end_time)
          AND EXTRACT(EPOCH FROM (LEAST(next_event_time, (SELECT ts FROM effective_end_time)) - event_time)) > 1e-6
    )

-- Final SELECT to calculate and present the detailed points.
SELECT
    ppp.wallet_id, ppp.wallet_address, ppp.period_start, ppp.period_end, ppp.period_seconds,
    ppp.usdc_lending_balance, ppp.usdc_borrowing_balance, ppp.gloop_staked, ppp.boost_multiplier,
    CASE WHEN ppp.usdc_lending_balance >= 100 THEN (2 * ppp.usdc_lending_balance * ppp.period_seconds / 1000) ELSE 0 END AS base_lending_points,
    CASE WHEN ppp.usdc_lending_balance >= 100 THEN (1 * ppp.usdc_borrowing_balance * ppp.period_seconds / 1000) ELSE 0 END AS base_borrowing_points,
    CASE WHEN ppp.usdc_lending_balance >= 100 THEN (2 * LEAST(ppp.gloop_staked, ppp.usdc_lending_balance) * ppp.boost_multiplier * ppp.period_seconds / 1000) ELSE 0 END AS boosted_lending_points,
    CASE WHEN ppp.usdc_lending_balance >= 100 THEN (1 * LEAST(ppp.gloop_staked, ppp.usdc_borrowing_balance) * ppp.boost_multiplier * ppp.period_seconds / 1000) ELSE 0 END AS boosted_borrowing_points,
    (CASE WHEN ppp.usdc_lending_balance >= 100 THEN (2 * ppp.usdc_lending_balance * ppp.period_seconds / 1000) + (1 * ppp.usdc_borrowing_balance * ppp.period_seconds / 1000) + (2 * LEAST(ppp.gloop_staked, ppp.usdc_lending_balance) * ppp.boost_multiplier * ppp.period_seconds / 1000) + (1 * LEAST(ppp.gloop_staked, ppp.usdc_borrowing_balance) * ppp.boost_multiplier * ppp.period_seconds / 1000) ELSE 0 END) as total_period_points,
    SUM(CASE WHEN ppp.usdc_lending_balance >= 100 THEN (2 * ppp.usdc_lending_balance * ppp.period_seconds / 1000) + (1 * ppp.usdc_borrowing_balance * ppp.period_seconds / 1000) + (2 * LEAST(ppp.gloop_staked, ppp.usdc_lending_balance) * ppp.boost_multiplier * ppp.period_seconds / 1000) + (1 * LEAST(ppp.gloop_staked, ppp.usdc_borrowing_balance) * ppp.boost_multiplier * ppp.period_seconds / 1000) ELSE 0 END) OVER (PARTITION BY ppp.wallet_id ORDER BY ppp.period_start) as cumulative_total_points
FROM points_per_period ppp;
    `);

    // VIEW 2: Current staking boost for each wallet
    await queryRunner.query(`
      CREATE OR REPLACE VIEW wallet_current_staking_boost AS
      WITH staking_timeline AS (
          SELECT 
              "walletId",
              "blockTimestamp",
              "eventType",
              "lockDurationSeconds",
              CASE WHEN "eventType" = 'STAKE' THEN 1 ELSE -1 END AS stake_delta,
              ROW_NUMBER() OVER (PARTITION BY "walletId" ORDER BY "blockTimestamp" DESC, id DESC) as rn
          FROM staking_events
      ),
      wallet_positions AS (
          SELECT 
              "walletId",
              SUM(stake_delta) OVER (PARTITION BY "walletId" ORDER BY "blockTimestamp" DESC, rn DESC) as running_position,
              "eventType",
              "lockDurationSeconds",
              "blockTimestamp",
              rn
          FROM staking_timeline
      ),
      current_stakes AS (
          SELECT DISTINCT ON ("walletId")
              "walletId",
              CASE WHEN running_position = 1 THEN "lockDurationSeconds" ELSE NULL END as current_lock_duration,
              CASE WHEN running_position = 1 THEN "blockTimestamp" ELSE NULL END as stake_time
          FROM wallet_positions
          WHERE "eventType" = 'STAKE'
          ORDER BY "walletId", "blockTimestamp" DESC, rn DESC
      )
      SELECT 
          w.id as wallet_id,
          w.address as wallet_address,
          CASE 
              -- No stake or unstaked -> 0% boost
              WHEN cs.current_lock_duration IS NULL THEN 0
              WHEN cs.stake_time IS NULL THEN 0
              -- Stake is active but lock has expired -> 10% boost (unlocked staking)
              WHEN cs.stake_time + (cs.current_lock_duration || ' seconds')::interval < NOW() THEN 0.1
              -- Stake is active and lock is still valid -> use the boost multiplier for the lock duration
              ELSE get_staking_boost_multiplier(cs.current_lock_duration)
          END as current_staking_boost
      FROM wallets w
      LEFT JOIN current_stakes cs ON w.id = cs."walletId";
    `);

    // VIEW 3: Simple leaderboard - one row per wallet with totals and current status
    await queryRunner.query(`
      CREATE OR REPLACE VIEW points_leaderboard AS
      WITH wallet_totals AS (
          SELECT
              wallet_id,
              wallet_address,
              SUM(GREATEST(total_period_points, 0)) AS total_points,
              SUM(GREATEST(base_lending_points + boosted_lending_points, 0)) AS total_lending_points,
              SUM(GREATEST(base_borrowing_points + boosted_borrowing_points, 0)) AS total_borrowing_points
          FROM wallet_points_detailed
          GROUP BY wallet_id, wallet_address
      ),
      current_states AS (
          -- Use DISTINCT ON to efficiently get the single most recent state for each wallet
          SELECT DISTINCT ON (wallet_id)
              wallet_id,
              usdc_lending_balance AS current_usdc_lending,
              usdc_borrowing_balance AS current_usdc_borrowing,
              gloop_staked AS current_gloop_staked,
              boost_multiplier AS current_boost_multiplier
          FROM wallet_points_detailed
          ORDER BY wallet_id, period_end DESC
      )
      SELECT
          wt.wallet_address,
          wt.total_points,
          wt.total_lending_points,
          wt.total_borrowing_points,
          cs.current_usdc_lending,
          cs.current_usdc_borrowing,
          cs.current_gloop_staked,
          cs.current_boost_multiplier,
          wsb.current_staking_boost,
          RANK() OVER (ORDER BY wt.total_points DESC) as rank
      FROM wallet_totals wt
      JOIN current_states cs ON wt.wallet_id = cs.wallet_id
      LEFT JOIN wallet_current_staking_boost wsb ON wt.wallet_id = wsb.wallet_id
      WHERE wt.total_points > 0
      ORDER BY wt.total_points DESC;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP VIEW IF EXISTS points_leaderboard CASCADE`);
    await queryRunner.query(`DROP VIEW IF EXISTS wallet_current_staking_boost CASCADE`);
    await queryRunner.query(`DROP VIEW IF EXISTS wallet_points_detailed CASCADE`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS get_staking_boost_multiplier(NUMERIC) CASCADE`);
  }
}
