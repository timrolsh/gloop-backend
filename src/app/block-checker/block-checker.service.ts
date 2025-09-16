import {Injectable, Logger} from "@nestjs/common";
import {ethers} from "ethers";
import {Cron, CronExpression} from "@nestjs/schedule";
import {ConfigService} from "@nestjs/config";
import {WalletService} from "../wallet/wallet.service";
import {BlockService} from "../block/block.service";
import {TransactionService} from "../transaction/transaction.service";
import {CreateTransactionDto} from "../transaction/dto/create-transaction.dto";
import {CreateBlockDto} from "../block/dto/create-block.dto";
import {ABI} from "../watcher/data/abi";
import {ExistsEvent} from "../transaction/enum/exists-event.enum";

@Injectable()
export class BlockCheckerService {
  private readonly logger = new Logger(BlockCheckerService.name);
  private provider!: ethers.JsonRpcProvider;
  private contract!: ethers.Contract;
  private readonly abi = ABI;

  constructor(
    private readonly config: ConfigService,
    private readonly walletService: WalletService,
    private readonly blockService: BlockService,
    private readonly transactionService: TransactionService
  ) {
    this.initializeProviderAndContract();
  }

  private initializeProviderAndContract() {
    try {
      const rpcUrl = this.config.get<string>("crypto.rpcUrl");
      const contractAddress = this.config.get<string>("crypto.contractAddress");

      if (!rpcUrl || !contractAddress) {
        this.logger.error("Missing contract or RPC URL configuration.");
        throw new Error("Invalid configuration.");
      }

      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.contract = new ethers.Contract(contractAddress, this.abi, this.provider);
    } catch (error) {
      this.logger.error("Error initializing provider and contract:", error);
    }
  }
  private async ensureWalletExists(address: string): Promise<void> {
    try {
      await this.walletService.findOrCreateByAddress(address);
      // this.logger.verbose(`Wallet ensured for address: ${address}`);
    } catch (error) {
      this.logger.error(`Failed to ensure wallet exists for address ${address}:`, error.message);
      throw error;
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async checkMissingBlocks(): Promise<void> {
    try {
      const latestBlockNumber = await this.provider.getBlockNumber();
      const missingBlocks = await this.blockService.findMissingBlocks(latestBlockNumber);
      this.logger.log(`Found ${missingBlocks.length} missing blocks to check.`);

      const walletAddresses = await this.walletService.getAllWallets();
      const batchSize = 10000;
      this.logger.log(`Start Checking`);

      for (let i = 0; i < missingBlocks.length; i += batchSize) {
        await new Promise((resolve) => setImmediate(resolve));
        const blockBatch = missingBlocks.slice(i, i + batchSize);
        await this.processBlocksInBatch(blockBatch, walletAddresses);
      }

      const insertBatchSize = 500;
      this.logger.log(`Start Adding to database`);
      for (let i = 0; i < missingBlocks.length; i += insertBatchSize) {
        await new Promise((resolve) => setImmediate(resolve));
        const blockBatch = missingBlocks.slice(i, i + insertBatchSize);
        const blockDtos = blockBatch.map((blockNumber) => new CreateBlockDto(blockNumber, ""));
        await this.blockService.createBlocks(blockDtos);
      }

      this.logger.log(`Start set Latest Block `);

      let latestBlockNo = missingBlocks[0];
      for (let i = 1; i < missingBlocks.length; i++) {
        if (missingBlocks[i] > latestBlockNo) {
          latestBlockNo = missingBlocks[i];
        }
      }
      this.logger.log(`latest block is ${latestBlockNo} `);

      await this.blockService.markLatestBlockAsChecked(latestBlockNo);
      this.logger.log(`Batch inserted ${missingBlocks.length} blocks.`);
      this.logger.log(`Latest block ${latestBlockNo} has been marked as checked.`);
    } catch (error) {
      this.logger.error(`Failed to check missing blocks: ${error.message}`, error.stack);
    }
  }

  private async processBlocksInBatch(
    blockNumbers: number[],
    walletAddresses: string[]
  ): Promise<void> {
    const borrowFilter = this.contract.filters.Borrow(walletAddresses, null);
    const depositFilter = this.contract.filters.Deposit(walletAddresses, null);
    const withdrawFilter = this.contract.filters.Withdraw(walletAddresses, null);
    const repayFilter = this.contract.filters.Repay(walletAddresses, null);

    const borrowLogs = await this.contract.queryFilter(
      borrowFilter,
      Math.min(...blockNumbers),
      Math.max(...blockNumbers)
    );
    const depositLogs = await this.contract.queryFilter(
      depositFilter,
      Math.min(...blockNumbers),
      Math.max(...blockNumbers)
    );
    const withdrawLogs = await this.contract.queryFilter(
      withdrawFilter,
      Math.min(...blockNumbers),
      Math.max(...blockNumbers)
    );
    const repayLogs = await this.contract.queryFilter(
      repayFilter,
      Math.min(...blockNumbers),
      Math.max(...blockNumbers)
    );

    const allLogs = [...borrowLogs, ...depositLogs, ...withdrawLogs, ...repayLogs];

    if (allLogs.length > 0) {
      await this.processTransactionLogs(allLogs);
    }
  }

  private async processTransactionLogs(logs: ethers.Log[]): Promise<void> {
    const transactionPromises = logs.map(async (log) => {
      const parsedLog = this.contract.interface.parseLog(log);
      const {from, asset, amount} = parsedLog.args;

      // Ensure wallet exists before processing transaction
      await this.ensureWalletExists(from);

      const isExists = await this.transactionService.isExists(log.transactionHash);
      if (isExists) {
        this.logger.log(`Transaction ${log.transactionHash} already exists. Skipping.`);
        return;
      }
      const tokenName = this.getTokenName(asset);

      let amountNumber = ethers.formatEther(amount);

      if (tokenName === "USDC") {
        amountNumber = ethers.formatUnits(amount, 6);
      } else {
        amountNumber = ethers.formatUnits(amount, 18);
      }
      // const amountNumber = ethers.formatEther(amount);
      const transaction = await this.provider.getTransaction(log.transactionHash);

      const createTransactionDto: CreateTransactionDto = {
        walletAddress: from,
        tokenName,
        asset: asset,
        amount: parseFloat(amountNumber),
        event: this.getEnumValueFromName(parsedLog.name),
        transactionHash: transaction.hash
      };

      await this.transactionService.create(createTransactionDto);

      this.logger.log(
        `Processed transaction ${transaction.hash} from block ${transaction.blockNumber}.`
      );
    });

    await Promise.all(transactionPromises);
  }

  getTokenName(asset: string): string {
    const btc = this.config.get<string>("crypto.gmBtc");
    const ETH = this.config.get<string>("crypto.gmETH");
    const SOL = this.config.get<string>("crypto.gmSOL");
    const usdc = this.config.get<string>("crypto.usdc");

    if (asset === btc) {
      return "BTC";
    } else if (asset === ETH) {
      return "ETH";
    } else if (asset === SOL) {
      return "SOL";
    } else if (asset === usdc) {
      return "USDC";
    }
    return "";
  }

  private getEnumValueFromName(event: string): ExistsEvent | undefined {
    const enumValue = Object.values(ExistsEvent).find((value) => value === event);
    return enumValue ? (enumValue as ExistsEvent) : undefined;
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async updateHealthFactor() {
    try {
      // Fetch wallet address-to-ID map
      const walletMap = await this.walletService.getWalletAddressForHealthFactor();
      const usdc = this.config.get<string>("crypto.usdc");
      // Iterate over each wallet address and update health factor
      for (const [address, walletId] of Object.entries(walletMap)) {
        try {
          const debt = await this.contract.borrowBalance(usdc, address);
          if (debt <= 0) {
            continue;
          }
          // Call the contract method
          const healthFactor = await this.contract.calculateHealthFactor(
            usdc, // USDC contract address
            address,
            "0"
          );

          // Format and calculate health factor percentage
          const formattedHF = ethers.formatEther(healthFactor);
          const health = parseFloat(formattedHF) * 100;

          // Update the wallet in the database
          await this.walletService.updateHealthFactor(walletId, parseFloat(health.toFixed(0)));
        } catch (err) {
          this.logger.error(`Failed to update healthFactor wallet ${address}: ${err.message}`);
        }
      }
    } catch (err) {
      this.logger.error(`Failed to update healthFactor factors: ${err.message}`);
    }
  }

  async updateHealthFactorByTransaction(walletAddress: string) {
    try {
      const usdc = this.config.get<string>("crypto.usdc");
      const wallet = await this.walletService.getWalletByAddress(walletAddress);

      if (!wallet) {
        this.logger.error(
          `Wallet ${walletAddress} not found. Source: updateHealthFactorByTransaction`
        );
        return;
      }

      try {
        // Call the contract method
        const healthFactor = await this.contract.calculateHealthFactor(
          usdc, // USDC contract address
          walletAddress,
          "0"
        );

        // Format and calculate health factor percentage
        const formattedHF = ethers.formatEther(healthFactor);
        const health = parseFloat(formattedHF) * 100;

        // Update the wallet in the database
        let finalNumber = parseFloat(health.toFixed(0));
        if (finalNumber > 1e9) {
          console.log("health cutoff for overflow done at 1e9");
          finalNumber = 1e9;
        }
        await this.walletService.updateHealthFactor(wallet.id, finalNumber);
      } catch (err) {
        this.logger.error(`Failed to update healthFactor wallet ${walletAddress}: ${err.message}`);
      }
    } catch (err) {
      this.logger.error(`Failed to update healthFactor factors: ${err.message}`);
    }
  }

  async updateUsdcDebt(walletAddress: string) {
    const usdc = this.config.get<string>("crypto.usdc");
    const wallet = await this.walletService.getWalletByAddress(walletAddress);
    if (!wallet) {
      this.logger.error(`Wallet ${walletAddress} not found. Source: updateUsdcDebt`);
      return;
    }

    try {
      // Call the contract method  410041n   -  0.4553
      const usdcDebt = await this.contract.borrowBalance(
        usdc, // USDC contract address
        walletAddress
      );

      const formattedHF = ethers.formatUnits(usdcDebt, 6);

      // Update the wallet in the database
      await this.walletService.updateUsdcDebt(wallet.id, formattedHF);
      this.logger.verbose(
        `USDC debt updated for wallet ${walletAddress}: ${formattedHF} transaction`
      );
    } catch (err) {
      this.logger.error(`Failed to update USDC debt wallet ${walletAddress}: ${err.message}`);
    }
  }

  //TODO: Remove this after testing
  @Cron(CronExpression.EVERY_10_MINUTES)
  async updateUsdcDebtByTransaction() {
    const wallets = await this.walletService.getAllWallets();
    this.logger.log(`Updating USDC debt for ${wallets.length} wallets`);
    for (const wallet of wallets) {
      await this.updateUsdcDebtCron(wallet);
    }
  }

  async updateUsdcDebtCron(walletAddress: string) {
    const usdc = this.config.get<string>("crypto.usdc");
    const wallet = await this.walletService.getWalletByAddress(walletAddress);
    if (!wallet) {
      this.logger.error(`Wallet ${walletAddress} not found. Source: updateUsdcDebtCron `);
      return;
    }

    try {
      // Call the contract method  410041n   -  0.4553
      const usdcDebt = await this.contract.borrowBalance(
        usdc, // USDC contract address
        walletAddress
      );

      const formattedHF = ethers.formatUnits(usdcDebt, 6);

      // Update the wallet in the database
      await this.walletService.updateUsdcDebt(wallet.id, formattedHF);
    } catch (err) {
      this.logger.error(`Failed to update USDC debt wallet ${walletAddress}: ${err.message}`);
    }
  }
}
