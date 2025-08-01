import {Injectable, Logger, OnModuleInit} from "@nestjs/common";
import {ethers, formatUnits} from "ethers";
import {ABI} from "./data/abi";
import {ConfigService} from "@nestjs/config";
import {ExistsEvent} from "../transaction/enum/exists-event.enum";
import {CreateTransactionDto} from "../transaction/dto/create-transaction.dto";
import {TransactionService} from "../transaction/transaction.service";
import {BlockService} from "../block/block.service";
import {CreateBlockDto} from "../block/dto/create-block.dto";
import {BlockCheckerService} from "../block-checker/block-checker.service";
import {WalletService} from "../wallet/wallet.service";
import {CreateWalletDto} from "../wallet/dto/create-wallet.dto";

@Injectable()
export class WatcherService implements OnModuleInit {
  private logger = new Logger(WatcherService.name);
  private provider!: ethers.WebSocketProvider;
  private contract!: ethers.Contract;

  private ABI: Object[] = ABI;

  constructor(
    private readonly transactionService: TransactionService,
    private readonly blockService: BlockService,
    private readonly blockCheckerService: BlockCheckerService,
    private readonly config: ConfigService,
    private readonly walletService: WalletService
  ) {}

  async onModuleInit() {
    this.logger.log("Initializing USDC Tracker Service...");
    await this.initializeProviderAndContract();
    await this.syncHistoricalEvents();
  }

  private async syncHistoricalEvents() {
    const latestBlock = await this.provider.getBlockNumber();
    // About 6 months back worth of blocks
    const fromBlock = latestBlock - 65000000;

    const eventsToSync = [
      ExistsEvent.DEPOSIT,
      ExistsEvent.WITHDRAW,
      ExistsEvent.BORROW,
      ExistsEvent.REPAY,
      ExistsEvent.LIQUIDATION
    ];

    for (const event of eventsToSync) {
      try {
        const logs = await this.contract.queryFilter(
          this.contract.filters[event](),
          fromBlock,
          latestBlock
        );

        for (const log of logs) {
          const parsed = this.contract.interface.parseLog(log);
          await this.handleEvent(event, parsed.args, {log} as any);
        }

        this.logger.log(`Synced ${logs.length} historical ${event} events`);
      } catch (err) {
        this.logger.error(`Error syncing ${event} events:`, err);
      }
    }
  }

  private async ensureWalletExists(address: string): Promise<void> {
    const existing = await this.walletService.getWalletByAddress(address);
    if (!existing) {
      this.logger.log(`Creating new wallet for address: ${address}`);
      await this.walletService.create(new CreateWalletDto(address));
    }
  }

  private async initializeProviderAndContract() {
    try {
      if (this.provider) {
        this.provider.removeAllListeners();
      }
      if (this.contract) {
        this.contract.removeAllListeners();
      }

      this.provider = new ethers.WebSocketProvider(this.config.get("crypto.rpcSocket"));
      this.provider.on("error", (error) => this.handleProviderError(error));
      this.contract = new ethers.Contract(
        this.config.get("crypto.contractAddress"),
        this.ABI,
        this.provider
      );

      await this.checkNetworkConnection();
    } catch (error) {
      this.logger.error("Error initializing provider and contract:", error);
      this.handleProviderError(error);
    }
  }

  private async handleProviderError(error: any) {
    this.logger.error("WebSocket error:", error);
    await this.reconnectProvider();
  }

  private handleProviderClose(code: number) {
    this.logger.error(`WebSocket closed with code ${code}`);
    this.reconnectProvider();
  }

  private async reconnectProvider(): Promise<void> {
    let attempt = 1;
    let delay = 1000;
    while (true) {
      this.logger.log(`Reconnecting to WebSocket provider... (Attempt ${attempt})`);
      try {
        this.initializeProviderAndContract();

        this.logger.log("Reconnected successfully.");
        return;
      } catch (error) {
        this.logger.error(`Reconnection attempt ${attempt} failed:`, error);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * 2, 60000); // Cap the delay to 60 seconds
        attempt++;
      }
    }
  }

  private async checkNetworkConnection() {
    try {
      const network = await this.provider.getNetwork();
      this.logger.log(
        `Connected to network (${this.config.get("crypto.network")}): ${network.name} (${network.chainId})`
      );
      await this.watchOnline();
    } catch (error) {
      this.logger.error("Failed to connect to network:", error);
      await this.reconnectProvider();
    }
  }

  private async watchOnline() {
    try {
      this.contract.on(ExistsEvent.WITHDRAW, async (from, asset, amount, event) => {
        await this.handleEvent(ExistsEvent.WITHDRAW, {from, asset, amount}, event);
      });

      this.contract.on(ExistsEvent.DEPOSIT, async (from, asset, amount, event) => {
        await this.handleEvent(ExistsEvent.DEPOSIT, {from, asset, amount}, event);
      });

      this.contract.on(ExistsEvent.BORROW, async (from, asset, amount, event) => {
        await this.handleEvent(ExistsEvent.BORROW, {from, asset, amount}, event);
      });

      this.contract.on(ExistsEvent.REPAY, async (from, asset, amount, event) => {
        await this.handleEvent(ExistsEvent.REPAY, {from, asset, amount}, event);
      });

      this.contract.on(
        ExistsEvent.LIQUIDATION,
        async (liquidator, liquidated, seizedValue, event) => {
          await this.handleEvent(
            ExistsEvent.LIQUIDATION,
            {liquidator, liquidated, seizedValue},
            event
          );
        }
      );

      this.logger.log("Started watching for contract events...");
    } catch (error) {
      this.logger.error("Error watching for contract events:", error);
    }
  }

  private async handleEvent(eventName: ExistsEvent, data: any, event: ethers.ContractEventPayload) {
    let amount = 0;

    const tokenName = this.getTokenName(data.asset);

    if (tokenName === "USDC") {
      amount = parseFloat(formatUnits(data.amount, 6));
    } else {
      amount = parseFloat(formatUnits(data.amount, 18));
    }

    if (eventName === ExistsEvent.LIQUIDATION) {
      await this.ensureWalletExists(data.liquidated);
      await this.ensureWalletExists(data.liquidator);

      await this.blockCheckerService.updateHealthFactorByTransaction(data.liquidated);
      await this.blockCheckerService.updateHealthFactorByTransaction(data.liquidator);
      this.logger.verbose(`Health factor updated for wallet ${data.liquidated}`);
      this.logger.verbose(`Health factor updated for wallet ${data.liquidator}`);

      await this.blockCheckerService.updateUsdcDebt(data.liquidated);
      await this.blockCheckerService.updateUsdcDebt(data.liquidator);
      this.logger.verbose(`USDC debt updated for wallet liquidated ${data.liquidated}`);
      this.logger.verbose(`USDC debt updated for wallet liquidator ${data.liquidator}`);
    } else {
      // Ensure wallet exists before updating health factor
      await this.ensureWalletExists(data.from);
      await this.blockCheckerService.updateHealthFactorByTransaction(data.from);
      this.logger.verbose(`Health factor updated for wallet ${data.from}`);
    }

    if (eventName === ExistsEvent.BORROW || eventName === ExistsEvent.REPAY) {
      // Wallet should already exist from above, but ensure it exists before updating USDC debt
      await this.ensureWalletExists(data.from);
      await this.blockCheckerService.updateUsdcDebt(data.from);

      this.logger.verbose(`USDC debt updated for wallet ${data.from}`);
    }

    const createTransactionDto: CreateTransactionDto = {
      walletAddress: data.from,
      tokenName: tokenName,
      asset: data.asset,
      amount,
      event: eventName,
      transactionHash: event.log.transactionHash
    };

    const createBlockDto: CreateBlockDto = {
      blockHash: event.log.blockHash,
      blockNumber: event.log.blockNumber,
      isAnyTransaction: true,
      isMissed: false
    };

    try {
      // Check if transaction already exists to prevent duplicates
      const isExists = await this.transactionService.isExists(event.log.transactionHash);
      if (isExists) {
        this.logger.log(`Transaction ${event.log.transactionHash} already exists. Skipping.`);
        return;
      }

      // Wallet already ensured to exist above
      await this.transactionService.create(createTransactionDto);
      await this.blockService.create(createBlockDto);
      this.logger.log("Transaction saved successfully.");
    } catch (error) {
      this.logger.error("Error saving transaction:", error.message);
    }
  }

  private getTokenName(asset: string): string {
    switch (asset) {
      case this.config.get<string>("crypto.gmBtc"):
        return "BTC";
      case this.config.get<string>("crypto.gmETH"):
        return "ETH";
      case this.config.get<string>("crypto.gmSOL"):
        return "SOL";
      case this.config.get<string>("crypto.usdc"):
        return "USDC";
      default:
        return null;
    }
  }
}
