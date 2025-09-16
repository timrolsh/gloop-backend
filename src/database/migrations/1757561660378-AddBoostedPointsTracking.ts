import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBoostedPointsTracking1757561660378 implements MigrationInterface {
    name = 'AddBoostedPointsTracking1757561660378'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallets" ADD "accumulatedBoostedPoints" numeric NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD "lastStakingChangeTime" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD "basePointsAtLastSnapshot" numeric NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD "isCurrentlyStaking" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD "currentStakingBoostMultiplier" numeric NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TYPE "public"."transactions_event_enum" RENAME TO "transactions_event_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_event_enum" AS ENUM('Withdraw', 'Deposit', 'Borrow', 'Repay', 'Liquidation')`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "event" TYPE "public"."transactions_event_enum" USING "event"::"text"::"public"."transactions_event_enum"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_event_enum_old"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "usdcDebt"`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD "usdcDebt" character varying(20) NOT NULL DEFAULT '0.0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "usdcDebt"`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD "usdcDebt" numeric(18,6) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`CREATE TYPE "public"."transactions_event_enum_old" AS ENUM('Withdraw', 'Deposit', 'Borrow', 'Repay')`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "event" TYPE "public"."transactions_event_enum_old" USING "event"::"text"::"public"."transactions_event_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."transactions_event_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."transactions_event_enum_old" RENAME TO "transactions_event_enum"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "currentStakingBoostMultiplier"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "isCurrentlyStaking"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "basePointsAtLastSnapshot"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "lastStakingChangeTime"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "accumulatedBoostedPoints"`);
    }

}
