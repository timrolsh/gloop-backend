import {Injectable, Logger} from "@nestjs/common";
import {ethers} from "ethers";
import {ABI_REFERRAL} from "../watcher-referral/data/abi-referral";
import {ConfigService} from "@nestjs/config";
import {WalletService} from "../wallet/wallet.service";
import {Cron, CronExpression} from "@nestjs/schedule";
import {UpdateLeaderboardDto} from "./dto/update-leaderboard.dto";
import BigNumber from "bignumber.js";
import {ABI} from "../watcher/data/abi";

@Injectable()
export class UpdateLeaderboardService {
  private logger = new Logger(UpdateLeaderboardService.name);
  private provider!: ethers.JsonRpcProvider;
  private contractReferral!: ethers.Contract;

  private lendingContract!: ethers.Contract;

  private readonly abiReferral = ABI_REFERRAL;

  private readonly abiLending = ABI;

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
      const contractAddressReferral = this.config.get<string>("crypto.gmPointContactAddress");

      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.contractReferral = new ethers.Contract(
        contractAddressReferral,
        this.abiReferral,
        this.provider
      );

      this.lendingContract = new ethers.Contract(contractAddress, this.abiLending, this.provider);
    } catch (error) {
      this.logger.error("Error initializing provider and contract:", error);
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
        let points, totalBoostRaw, userUSDCDepositBalance;

        try {
          points = await this.contractReferral.getUserPoints(address);
        } catch (error) {
          this.logger.error(`Failed to get user points for ${address}: ${error.message}`);
          continue;
        }

        if (points) {
          const lastUpdateTime = new Date(Number(points[0]) * 1000);

          const storedLendingPointsBN = new BigNumber(points[1].toString());
          const storedBorrowingPointsBN = new BigNumber(points[2].toString());

          try {
            totalBoostRaw = await this.contractReferral.calculateCurrentBoost(address);
          } catch (error) {
            this.logger.error(`Failed to calculate boost for ${address}: ${error.message}`);
            continue;
          }

          try {
            userUSDCDepositBalance = await this.lendingContract.balanceOf(usdcContract, address);
          } catch (error) {
            this.logger.error(`Failed to get USDC balance for ${address}: ${error.message}`);
            continue;
          }

          const totalBoostBN = new BigNumber(totalBoostRaw.toString());

          let floatings;
          try {
            floatings = await this.contractReferral.calculateFloatingPoints(
              address,
              0,
              userUSDCDepositBalance,
              totalBoostRaw
            );
          } catch (error) {
            this.logger.error(
              `Failed to calculate floating points for ${address}: ${error.message}`
            );
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

          const claimedPointsBN = new BigNumber(points[4].toString());
          const claimedPoints = claimedPointsBN;

          const referralBoostBN = totalBoostBN.dividedBy(100);
          const referralBoost = referralBoostBN.toString(10);

          const updateLeaderboardDto: UpdateLeaderboardDto = {
            walletId,
            lastUpdateTime,
            lendingUSDCPoints: totalLendingUSDCPoints.toString(10),
            borrowingUSDCPoints: totalBorrowingUSDCPoints.toString(10),
            totalEarnedPoints: totalEarnedPoints.toString(10),
            claimedPoints: claimedPoints.toString(10),
            referralBoost
          };

          await this.walletService.updateLeaderboard(updateLeaderboardDto);
        }
      } catch (error) {
        this.logger.error(`Error updating leaderboard for address ${address}: ${error.message}`);
      }
    }
  }
}
