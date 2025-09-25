import {Injectable, Logger} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {StakingEvent, StakingEventType} from "./entities/staking-event.entity";
import {WalletService} from "../wallet/wallet.service";
import BigNumber from "bignumber.js";

export interface CreateStakingEventDto {
  walletAddress: string;
  eventType: StakingEventType;
  gloopAmount: number;
  lockDurationSeconds: number;
  transactionHash: string;
  blockNumber: number;
  blockTimestamp?: Date;
  usdcLendingBalance?: number;
  usdcBorrowingBalance?: number;
  stakingBoostMultiplier?: number;
  gloopPriceUSD?: number;
}

@Injectable()
export class StakingEventService {
  private readonly logger = new Logger(StakingEventService.name);

  constructor(
    @InjectRepository(StakingEvent)
    public readonly stakingEventRepository: Repository<StakingEvent>,
    private readonly walletService: WalletService
  ) {}

  async create(createStakingEventDto: CreateStakingEventDto): Promise<StakingEvent> {
    const {walletAddress, ...eventData} = createStakingEventDto;

    const wallet = await this.walletService.findByAddress(walletAddress);
    if (!wallet) {
      throw new Error(`Wallet with address ${walletAddress} not found`);
    }

    // For UNSTAKE events, calculate boosted points earned during this staking period
    let boostedPointsEarned = 0;
    let basePointsAtStake = 0;
    let basePointsAtUnstake = 0;

    if (eventData.eventType === StakingEventType.UNSTAKE) {
      const {earned, stakePoints, unstakePoints} = await this.calculateBoostedPointsForUnstake(wallet.id);
      boostedPointsEarned = earned;
      basePointsAtStake = stakePoints;
      basePointsAtUnstake = unstakePoints;
    }

    const stakingEvent = this.stakingEventRepository.create({
      walletId: wallet.id,
      ...eventData,
      boostedPointsEarned,
      basePointsAtStake,
      basePointsAtUnstake,
      usdcLendingBalanceAtEvent: eventData.usdcLendingBalance || 0,
      usdcBorrowingBalanceAtEvent: eventData.usdcBorrowingBalance || 0,
      stakingBoostMultiplier: eventData.stakingBoostMultiplier || 1,
      gloopPriceUSD: eventData.gloopPriceUSD || 0,
      blockTimestamp: eventData.blockTimestamp
    });

    const savedEvent = await this.stakingEventRepository.save(stakingEvent);

    this.logger.log(
      `Created ${eventData.eventType} event for wallet ${walletAddress}: ` +
      `GLOOP: ${eventData.gloopAmount}, Lock: ${eventData.lockDurationSeconds}s, ` +
      `Boosted Points: ${boostedPointsEarned}`
    );

    return savedEvent;
  }

  /**
   * Calculate boosted points earned during the most recent staking period
   * This is called when an UNSTAKE event occurs
   * Updated formula: 1 GLOOP = $1 USD for boost calculations (simplified)
   */
  private async calculateBoostedPointsForUnstake(walletId: string): Promise<{
    earned: number;
    stakePoints: number;
    unstakePoints: number;
  }> {
    try {
      // Find the most recent STAKE event for this wallet
      const lastStakeEvent = await this.stakingEventRepository.findOne({
        where: {
          walletId,
          eventType: StakingEventType.STAKE
        },
        order: {createdAt: "DESC"}
      });

      if (!lastStakeEvent) {
        this.logger.warn(`No previous STAKE event found for wallet ${walletId}`);
        return {earned: 0, stakePoints: 0, unstakePoints: 0};
      }

      // Get current base points from wallet (this should be the contract-calculated points)
      const wallet = await this.walletService.findOne(walletId);
      const currentBasePoints = wallet.totalEarnedPoints || 0;
      const basePointsAtStake = lastStakeEvent.basePointsAtStake || 0;

      // Points earned during staking period (base points, no boost applied yet)
      const basePointsEarnedDuringStaking = currentBasePoints - basePointsAtStake;

      if (basePointsEarnedDuringStaking <= 0) {
        return {
          earned: 0,
          stakePoints: basePointsAtStake,
          unstakePoints: currentBasePoints
        };
      }

      // 1 GLOOP = $1 USD
      const gloopStaked = lastStakeEvent.gloopAmount; // No USD conversion needed
      const usdcLendingBalance = lastStakeEvent.usdcLendingBalanceAtEvent || 0;
      const usdcBorrowingBalance = lastStakeEvent.usdcBorrowingBalanceAtEvent || 0;
      const stakingMultiplier = lastStakeEvent.stakingBoostMultiplier || 1;

      // Apply Kamino boost model (position-based, not time-based)
      // Kamino model: For each 1 GLOOP staked, boost applies to $1 USD of position value
      
      const totalPositionValue = usdcLendingBalance + usdcBorrowingBalance;
      
      // Calculate coverage ratio (how much of position is covered by staking)
      const coverageRatio = totalPositionValue > 0 ? Math.min(1, gloopStaked / totalPositionValue) : 1;
      
      // Get boost percentage (convert multiplier to percentage)
      const boostPercentage = (stakingMultiplier - 1);
      
      // Calculate effective boost percentage
      const effectiveBoostPercentage = coverageRatio * boostPercentage;
      
      // Apply boost to base points earned during staking
      const totalBoostedPoints = basePointsEarnedDuringStaking * effectiveBoostPercentage;

      this.logger.log(
        `Kamino boosted points for wallet ${walletId}: ` +
        `GLOOP staked: ${gloopStaked}, Position value: $${totalPositionValue}, ` +
        `Coverage ratio: ${(coverageRatio * 100).toFixed(1)}%, Boost: ${(boostPercentage * 100).toFixed(1)}%, ` +
        `Effective boost: ${(effectiveBoostPercentage * 100).toFixed(1)}%, ` +
        `Base points earned: ${basePointsEarnedDuringStaking}, Boosted points: ${totalBoostedPoints.toFixed(2)}`
      );

      return {
        earned: totalBoostedPoints,
        stakePoints: basePointsAtStake,
        unstakePoints: currentBasePoints
      };
    } catch (error) {
      this.logger.error(`Error calculating boosted points for wallet ${walletId}: ${error.message}`);
      return {earned: 0, stakePoints: 0, unstakePoints: 0};
    }
  }

  /**
   * Check if a staking event already exists
   */
  async eventExists(transactionHash: string): Promise<boolean> {
    return await this.stakingEventRepository.existsBy({transactionHash});
  }

  /**
   * Get all staking events for a wallet
   */
  async getEventsForWallet(walletId: string): Promise<StakingEvent[]> {
    return await this.stakingEventRepository.find({
      where: {walletId},
      order: {createdAt: "ASC"}
    });
  }

  /**
   * Calculate total accumulated boosted points for a wallet
   * This sums up all the boosted points from completed staking periods
   */
  async getTotalBoostedPointsForWallet(walletId: string): Promise<number> {
    const result = await this.stakingEventRepository
      .createQueryBuilder("event")
      .select("SUM(event.boostedPointsEarned)", "total")
      .where("event.walletId = :walletId", {walletId})
      .andWhere("event.eventType = :eventType", {eventType: StakingEventType.UNSTAKE})
      .getRawOne();

    return Number(result?.total) || 0;
  }

  /**
   * Get current staking status for a wallet
   */
  async getCurrentStakingStatus(walletId: string): Promise<{
    isStaking: boolean;
    stakeEvent?: StakingEvent;
  }> {
    // Get the most recent staking event
    const lastEvent = await this.stakingEventRepository.findOne({
      where: {walletId},
      order: {createdAt: "DESC"}
    });

    if (!lastEvent) {
      return {isStaking: false};
    }

    // If last event was STAKE, user is currently staking
    // If last event was UNSTAKE, user is not staking
    const isStaking = lastEvent.eventType === StakingEventType.STAKE;

    return {
      isStaking,
      stakeEvent: isStaking ? lastEvent : undefined
    };
  }

  /**
   * Handle balance changes during active staking periods
   * This creates a snapshot when USDC balances change significantly
   */
  async handleBalanceChange(
    walletAddress: string, 
    newUsdcLendingBalance: number, 
    newUsdcBorrowingBalance: number,
    transactionHash: string,
    blockNumber: number
  ): Promise<void> {
    const wallet = await this.walletService.getWalletByAddress(walletAddress);
    if (!wallet) return;

    const {isStaking, stakeEvent} = await this.getCurrentStakingStatus(wallet.id);
    
    // Only create snapshot if user is currently staking and balances changed significantly
    if (isStaking && stakeEvent) {
      const balanceChanged = 
        Math.abs(newUsdcLendingBalance - (stakeEvent.usdcLendingBalanceAtEvent || 0)) > 1 ||
        Math.abs(newUsdcBorrowingBalance - (stakeEvent.usdcBorrowingBalanceAtEvent || 0)) > 1;

      if (balanceChanged) {
        // Create a snapshot with current boosted points, then start a new period
        const currentBasePoints = await this.getCurrentBasePointsFromContract(walletAddress);
        
        // Calculate and store boosted points for the period that just ended
        const {earned} = await this.calculateBoostedPointsForUnstake(wallet.id);
        
        // Create a new "stake" event with updated balances (continuing the same staking position)
        const newStakeEventDto: CreateStakingEventDto = {
          walletAddress,
          eventType: StakingEventType.STAKE,
          gloopAmount: stakeEvent.gloopAmount,
          lockDurationSeconds: stakeEvent.lockDurationSeconds,
          transactionHash,
          blockNumber,
          usdcLendingBalance: newUsdcLendingBalance,
          usdcBorrowingBalance: newUsdcBorrowingBalance,
          stakingBoostMultiplier: stakeEvent.stakingBoostMultiplier,
          gloopPriceUSD: 1
        };

        await this.create(newStakeEventDto);
        
        this.logger.log(
          `Balance change snapshot for ${walletAddress}: ` +
          `Lending: ${stakeEvent.usdcLendingBalanceAtEvent} → ${newUsdcLendingBalance}, ` +
          `Borrowing: ${stakeEvent.usdcBorrowingBalanceAtEvent} → ${newUsdcBorrowingBalance}, ` +
          `Earned boost points: ${earned}`
        );
      }
    }
  }

  /**
   * Get current base points from the GM Points contract
   */
  private async getCurrentBasePointsFromContract(address: string): Promise<number> {
    // This would need to be implemented with the same logic as in staking-watcher
    // For now, returning 0 as placeholder
    return 0;
  }

  /**
   * Calculate boosted points for current staking status using Kamino model
   * Kamino model: For each 1 GLOOP staked, boost applies to $1 USD of position value
   * Boost percentage applies to the rewards APY, not time-based multiplication
   */
  async getCurrentBoostedPoints(walletId: string, currentBasePoints: number, currentUsdcBalance: number): Promise<number> {
    const {isStaking, stakeEvent} = await this.getCurrentStakingStatus(walletId);

    if (!isStaking || !stakeEvent) {
      return 0;
    }

    // Kamino Formula Implementation:
    // 1. Determine effective staking coverage
    const gloopStaked = stakeEvent.gloopAmount; // 1 GLOOP = $1 USD coverage
    const totalPositionValue = currentUsdcBalance; // Current USD position value
    
    // 2. Calculate coverage ratio (how much of position is covered by staking)
    const coverageRatio = Math.min(1, gloopStaked / totalPositionValue);
    
    // 3. Get the boost percentage from the staking event
    const boostPercentage = (stakeEvent.stakingBoostMultiplier || 1) - 1; // Convert multiplier to percentage
    
    // 4. Calculate effective boost percentage
    const effectiveBoostPercentage = coverageRatio * boostPercentage;
    
    // 5. Calculate base points earned since staking began
    const basePointsEarnedSinceStaking = currentBasePoints - (stakeEvent.basePointsAtStake || 0);
    
    if (basePointsEarnedSinceStaking <= 0) {
      return 0;
    }
    
    // 6. Apply the effective boost to the base points earned during staking
    const boostedPoints = basePointsEarnedSinceStaking * effectiveBoostPercentage;
    
    this.logger.debug(`Kamino Boost Calculation:
      GLOOP Staked: ${gloopStaked}
      Position Value: ${totalPositionValue}
      Coverage Ratio: ${coverageRatio}
      Boost %: ${boostPercentage * 100}%
      Effective Boost %: ${effectiveBoostPercentage * 100}%
      Base Points Since Staking: ${basePointsEarnedSinceStaking}
      Boosted Points: ${boostedPoints}`);
    
    return Math.max(0, boostedPoints);
  }
}
