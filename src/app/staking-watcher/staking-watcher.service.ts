import {Injectable, Logger, OnModuleInit} from "@nestjs/common";
import {ethers} from "ethers";
import {ABI_STAKING} from "../watcher/data/abi-staking";
import {ConfigService} from "@nestjs/config";
import {StakingEventService, CreateStakingEventDto} from "../staking-event/staking-event.service";
import {StakingEventType} from "../staking-event/entities/staking-event.entity";
import {WalletService} from "../wallet/wallet.service";

@Injectable()
export class StakingWatcherService implements OnModuleInit {
  private logger = new Logger(StakingWatcherService.name);
  private provider!: ethers.WebSocketProvider;
  private stakingContract!: ethers.Contract;
  private lendingContract!: ethers.Contract;

  private readonly stakingABI: Object[] = ABI_STAKING;

  constructor(
    private readonly stakingEventService: StakingEventService,
    private readonly walletService: WalletService,
    private readonly config: ConfigService
  ) {}

  async onModuleInit() {
    this.logger.log("Initializing Staking Watcher Service...");
    await this.initializeProviderAndContracts();
    await this.syncHistoricalStakingEvents();
  }

  private async syncHistoricalStakingEvents() {
    const latestBlock = await this.provider.getBlockNumber();
    // Sync from the same historical range as your main watcher
    const fromBlock = latestBlock - 65000000;

    const stakingEventsToSync = ["Staked", "Unstaked"];

    for (const eventName of stakingEventsToSync) {
      try {
        const logs = await this.stakingContract.queryFilter(
          this.stakingContract.filters[eventName](),
          fromBlock,
          latestBlock
        );

        for (const log of logs) {
          const parsed = this.stakingContract.interface.parseLog(log);
          await this.handleStakingEvent(eventName, parsed.args, {log} as any);
        }

        this.logger.log(`Synced ${logs.length} historical ${eventName} events`);
      } catch (err) {
        this.logger.error(`Error syncing ${eventName} events:`, err);
      }
    }
  }

  private async initializeProviderAndContracts() {
    try {
      if (this.provider) {
        this.provider.removeAllListeners();
      }
      if (this.stakingContract) {
        this.stakingContract.removeAllListeners();
      }

      this.provider = new ethers.WebSocketProvider(this.config.get("crypto.rpcSocket"));
      this.provider.on("error", (error) => this.handleProviderError(error));

      this.stakingContract = new ethers.Contract(
        this.config.get("crypto.stakingContractAddress"),
        this.stakingABI,
        this.provider
      );

      // We also need the lending contract to get user balances at time of staking events
      const lendingABI = require("../watcher/data/abi").ABI;
      this.lendingContract = new ethers.Contract(
        this.config.get("crypto.contractAddress"),
        lendingABI,
        this.provider
      );

      await this.watchStakingEvents();
    } catch (error) {
      this.logger.error("Error initializing staking watcher:", error);
      this.handleProviderError(error);
    }
  }

  private async watchStakingEvents() {
    try {
      // Listen for Staked events
      this.stakingContract.on("Staked", async (user, amount, lockDuration, event) => {
        await this.handleStakingEvent("Staked", {user, amount, lockDuration}, event);
      });

      // Listen for Unstaked events
      this.stakingContract.on("Unstaked", async (user, amount, event) => {
        await this.handleStakingEvent("Unstaked", {user, amount}, event);
      });

      this.logger.log("Started watching for staking contract events...");
    } catch (error) {
      this.logger.error("Error watching for staking events:", error);
    }
  }

  private async handleStakingEvent(
    eventName: string,
    data: any,
    event: ethers.ContractEventPayload
  ) {
    try {
      const {user, amount, lockDuration} = data;
      const userAddress = user.toLowerCase();

      // Ensure wallet exists
      await this.ensureWalletExists(userAddress);

      // Check if event already processed
      const transactionHash = event.log.transactionHash;
      const eventExists = await this.stakingEventService.eventExists(transactionHash);
      if (eventExists) {
        this.logger.log(`Staking event ${transactionHash} already processed`);
        return;
      }

      // Get user's current USDC balances from lending contract
      const usdcAddress = this.config.get("crypto.usdc");
      const usdcLendingBalanceBigInt = await this.getUserUSDCBalance(userAddress, usdcAddress);
      const usdcLendingBalance = parseFloat(ethers.formatUnits(usdcLendingBalanceBigInt, 6)); // Convert to number for storage
      const usdcBorrowingBalance = 0; // Implement based on your debt tracking system

      // Calculate staking boost multiplier
      const lockDurationSecondsNum = lockDuration ? Number(lockDuration) : 0;
      const stakingBoostMultiplier = this.calculateStakingMultiplier(lockDurationSecondsNum);

      // For STAKE events, we need to capture the base points at the time of staking
      let basePointsAtStake = 0;
      if (eventName === "Staked") {
        basePointsAtStake = await this.getCurrentBasePoints(userAddress);
      }

      const gloopAmount = parseFloat(ethers.formatEther(amount));

      const createStakingEventDto: CreateStakingEventDto = {
        walletAddress: userAddress,
        eventType: eventName === "Staked" ? StakingEventType.STAKE : StakingEventType.UNSTAKE,
        gloopAmount,
        lockDurationSeconds: lockDurationSecondsNum,
        transactionHash,
        blockNumber: event.log.blockNumber,
        usdcLendingBalance,
        usdcBorrowingBalance,
        stakingBoostMultiplier,
        // Fixed at $1 USD per GLOOP (simplified approach)
        gloopPriceUSD: 1
      };

      // Create the staking event record
      const stakingEvent = await this.stakingEventService.create(createStakingEventDto);

      // If this is a STAKE event, record base points at stake time
      if (eventName === "Staked") {
        await this.stakingEventService.stakingEventRepository.update(stakingEvent.id, {
          basePointsAtStake
        });
      }

      // Note: Leaderboard will be updated by the 10-minute cron job
      // Real-time updates can be added later if needed

      this.logger.log(
        `Processed ${eventName} event: User ${userAddress}, Amount: ${gloopAmount} GLOOP, ` +
          `Lock: ${lockDurationSecondsNum}s, Multiplier: ${stakingBoostMultiplier}x`
      );
    } catch (error) {
      this.logger.error(`Error handling ${eventName} event:`, error);
    }
  }

  private async ensureWalletExists(address: string): Promise<void> {
    try {
      await this.walletService.findOrCreateByAddress(address);
      // this.logger.verbose(`Wallet ensured for staking address: ${address}`);
    } catch (error) {
      this.logger.error(`Failed to ensure wallet exists for staking address ${address}:`, error.message);
      throw error;
    }
  }

  private async getUserUSDCBalance(userAddress: string, usdcAddress: string): Promise<bigint> {
    try {
      const balance = await this.lendingContract.balanceOf(usdcAddress, userAddress);
      return balance; // Return as BigInt to avoid conversion issues
    } catch (error) {
      this.logger.error(`Error getting USDC balance for ${userAddress}: ${error.message}`);
      return BigInt(0);
    }
  }

  private async getCurrentBasePoints(userAddress: string): Promise<number> {
    try {
      // Get points from the GM Points contract
      const gmPointsContract = new ethers.Contract(
        this.config.get("crypto.gmPointContactAddress"),
        require("../update-leaderboard/data/abi").ABI,
        this.provider
      );

      const userData = await gmPointsContract.getUserData(userAddress);
      const storedLendingPoints = userData[3];
      const storedBorrowingPoints = userData[4];

      // Get floating points
      const usdcAddress = this.config.get("crypto.usdc");
      const userUSDCBalance = await this.getUserUSDCBalance(userAddress, usdcAddress);
      const floatings = await gmPointsContract.calculateFloatingPoints(
        userAddress,
        0,
        userUSDCBalance
      );

      // Properly convert BigInt values to numbers
      const storedLendingNum = Number(storedLendingPoints.toString());
      const storedBorrowingNum = Number(storedBorrowingPoints.toString());
      const floatingLendingNum = Number(floatings[0].toString());
      const floatingBorrowingNum = Number(floatings[1].toString());

      const totalLendingPoints = storedLendingNum + floatingLendingNum;
      const totalBorrowingPoints = storedBorrowingNum + floatingBorrowingNum;

      return totalLendingPoints + totalBorrowingPoints;
    } catch (error) {
      this.logger.error(`Error getting base points for ${userAddress}: ${error.message}`);
      return 0;
    }
  }

  private calculateStakingMultiplier(lockDurationSeconds: number): number {
    const lockDurationDays = lockDurationSeconds / (24 * 60 * 60);

    if (lockDurationDays >= 56) {
      return 2; // 100% boost = 2x multiplier
    } else if (lockDurationDays >= 28) {
      return 1.5; // 50% boost = 1.5x multiplier
    } else if (lockDurationDays >= 14) {
      return 1.25; // 25% boost = 1.25x multiplier
    } else if (lockDurationDays > 0 || lockDurationSeconds > 0) {
      return 1.1; // 10% boost for any staking = 1.1x multiplier
    } else {
      return 1; // No boost = 1x multiplier
    }
  }

  private handleProviderError(error: any) {
    this.logger.error("Staking watcher provider error:", error);
    setTimeout(() => {
      this.logger.log("Attempting to reconnect staking watcher...");
      this.initializeProviderAndContracts();
    }, 5000);
  }
}
