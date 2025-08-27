import {Injectable, Logger, OnModuleInit} from "@nestjs/common";
import {ethers} from "ethers";
import {ConfigService} from "@nestjs/config";
import {WalletService} from "../wallet/wallet.service";
import {Cron, CronExpression} from "@nestjs/schedule";
import {UpdateLeaderboardDto} from "./dto/update-leaderboard.dto";
import BigNumber from "bignumber.js";
import {ABI} from "../watcher/data/abi";
import {ABI_STAKING} from "../watcher/data/abi-staking";
import {ABI as GM_POINTS_ABI} from "./data/abi";

@Injectable()
export class UpdateLeaderboardService implements OnModuleInit {
  private logger = new Logger(UpdateLeaderboardService.name);
  private provider!: ethers.JsonRpcProvider;
  private lendingContract!: ethers.Contract;
  private stakingContract!: ethers.Contract;
  private gmPointsContract!: ethers.Contract;
  private readonly abiLending = ABI;
  private readonly abiStaking = ABI_STAKING;
  private readonly abiGmPoints = GM_POINTS_ABI;

  constructor(
    private readonly config: ConfigService,
    private readonly walletService: WalletService
  ) {
    this.initializeProviderAndContract();
  }

  private initializeProviderAndContract() {
    try {
      const rpcUrl = this.config.get<string>("crypto.rpcUrl");
      const contractAddress = this.config.get<string>("crypto.contractAddress");
      const gmPointsContractAddress = this.config.get<string>("crypto.gmPointContactAddress");
      const stakingContractAddress = this.config.get<string>("crypto.stakingContractAddress");

      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      this.lendingContract = new ethers.Contract(contractAddress, this.abiLending, this.provider);

      this.stakingContract = new ethers.Contract(
        stakingContractAddress,
        this.abiStaking,
        this.provider
      );

      this.gmPointsContract = new ethers.Contract(
        gmPointsContractAddress,
        this.abiGmPoints,
        this.provider
      );
    } catch (error) {
      this.logger.error("Error initializing provider and contract:", error);
    }
  }

  async onModuleInit() {
    this.logger.log("UpdateLeaderboardService initialized - running initial leaderboard update...");
    try {
      await this.updateLeaderboard();
      this.logger.log("Initial leaderboard update completed successfully");
    } catch (error) {
      this.logger.error("Initial leaderboard update failed:", error.message);
    }
  }

  /**
   * Calculate staking boost percentage based on staked amount and lock duration
   * Based on the documentation:
   * - 14-day stake: 25% boost
   * - 28-day stake: 50% boost
   * - 56-day stake: 100% boost
   * - No stake: 0% boost
   */
  private async calculateStakingBoost(address: string): Promise<number> {
    try {
      // Get user staked amount
      const stakedAmount = await this.stakingContract.getUserStakedAmount(address);
      const stakedAmountBN = new BigNumber(stakedAmount.toString());

      // If no tokens staked, return 0% boost
      if (stakedAmountBN.isZero()) {
        return 0;
      }

      // Get staker info to determine lock duration
      const stakerInfo = await this.stakingContract.stakers(address);
      const lockDuration = new BigNumber(stakerInfo.lockDuration.toString());

      // Convert lock duration from seconds to days
      const lockDurationDays = lockDuration.dividedBy(24 * 60 * 60);

      // Determine boost based on lock duration
      if (lockDurationDays.gte(56)) {
        return 100; // 56+ days = 100% boost
      } else if (lockDurationDays.gte(28)) {
        return 50; // 28+ days = 50% boost
      } else if (lockDurationDays.gte(14)) {
        return 25; // 14+ days = 25% boost
      } else {
        return 0; // Less than 14 days = 0% boost
      }
    } catch (error) {
      this.logger.error(`Failed to calculate staking boost for ${address}: ${error.message}`);
      return 0; // Default to 0% if any error occurs
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async updateLeaderboard(): Promise<void> {
    const walletMap = await this.walletService.getWalletAddressToIdMap();
    const usdcContract = this.config.get("crypto.usdc");
    this.logger.log(`Updating leaderboard for ${Object.entries(walletMap).length} addresses`);
    for (const [address, walletId] of Object.entries(walletMap)) {
      try {
        // Check if wallet exists before trying to query contract data
        const wallet = await this.walletService.getWalletByAddress(address);
        if (!wallet) {
          this.logger.warn(`Skipping leaderboard update for unknown wallet: ${address}`);
          continue;
        }

        // Try contract calls with individual error handling
        let userData, userUSDCDepositBalance;

        try {
          userData = await this.gmPointsContract.getUserData(address);
        } catch (error) {
          this.logger.error(`Failed to get user data for ${address}: ${error.message}`);
          continue;
        }

        if (userData) {
          const lastUpdateTime = new Date(Number(userData[0]) * 1000);

          const storedLendingPointsBN = new BigNumber(userData[3].toString()); // lendingUSDCPoints
          const storedBorrowingPointsBN = new BigNumber(userData[4].toString()); // borrowingUSDCPoints

          try {
            userUSDCDepositBalance = await this.lendingContract.balanceOf(usdcContract, address);
          } catch (error) {
            this.logger.error(`Failed to get USDC balance for ${address}: ${error.message}`);
            continue;
          }

          // Calculate staking boost based on user's staked amount and lock duration
          const stakingBoostPercentage = await this.calculateStakingBoost(address);

          let floatings;
          try {
            floatings = await this.gmPointsContract.calculateFloatingPoints(
              address,
              0, // activity: 0 = deposit (as suggested in docs)
              userUSDCDepositBalance
            );
          } catch (error) {
            this.logger.error(`Failed to calculate floating points for ${address}: ${error.message}`);
            continue;
          }

          const floatingLendingPointsBN = new BigNumber(floatings[0].toString());
          const floatingBorrowingPointsBN = new BigNumber(floatings[1].toString());

          const totalLendingPointsBN = storedLendingPointsBN.plus(floatingLendingPointsBN);
          const totalBorrowingPointsBN = storedBorrowingPointsBN.plus(floatingBorrowingPointsBN);

          const totalLendingUSDCPoints = totalLendingPointsBN;
          const totalBorrowingUSDCPoints = totalBorrowingPointsBN;

          const totalEarnedPointsBN = totalLendingPointsBN.plus(totalBorrowingPointsBN);
          const totalEarnedPoints = totalEarnedPointsBN;

          const claimedPointsBN = new BigNumber(userData[6].toString()); // claimedPoints
          const claimedPoints = claimedPointsBN;

          const stakingBoost = stakingBoostPercentage.toString(10);

          const updateLeaderboardDto: UpdateLeaderboardDto = {
            walletId,
            lastUpdateTime,
            lendingUSDCPoints: totalLendingUSDCPoints.toString(10),
            borrowingUSDCPoints: totalBorrowingUSDCPoints.toString(10),
            totalEarnedPoints: totalEarnedPoints.toString(10),
            claimedPoints: claimedPoints.toString(10),
            stakingBoost
          };

          await this.walletService.updateLeaderboard(updateLeaderboardDto);
        }
      } catch (error) {
        this.logger.error(`Error updating leaderboard for address ${address}: ${error.message}`);
      }
    }
  }
}
