import {HttpStatus, Injectable} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Transaction} from "./entities/transaction.entity";
import {WalletService} from "../wallet/wallet.service";
import {CreateTransactionDto} from "./dto/create-transaction.dto";
import {throwCustomHttpException} from "src/common/utils/exception.util";
import {ExistsEvent} from "./enum/exists-event.enum";
import {ResponseMessage, ResultDto} from "src/common/dto/result.dto";
import {LiquidationRequestDto} from "../liquidation/dto/liquidation-response.dto";
import {PaginationService} from "src/common/querying/pagination.service";
import {PaginationDto} from "src/common/querying/dto/pagination.dto";
import {DefaultPageSize} from "src/common/querying/util/querying.constants";
import {ConfigService} from "@nestjs/config";
import {ABI} from "../watcher/data/abi";

@Injectable()
export class TransactionService {
  private ABI: Object[] = ABI;

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly walletService: WalletService,

    private readonly paginationService: PaginationService,
    private readonly configService: ConfigService
  ) {}

  async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const {walletAddress, amount, event, transactionHash, tokenName, asset, blockTimestamp} = createTransactionDto;

    const wallet = await this.walletService.findByAddress(walletAddress);

    if (!wallet) {
      throwCustomHttpException(
        `Wallet with address ${walletAddress} not found`,
        `Wallet with address ${walletAddress} not found`,
        HttpStatus.NOT_FOUND
      );
    }

    // const isAny = await this.transactionRepository.existsBy({ transactionHash });

    // if (isAny) {
    //     throwCustomHttpException("Transaction exists", "Transaction exists");
    // }

    const transaction = this.transactionRepository.create({
      walletId: wallet.id,
      tokenName,
      asset,
      amount,
      event,
      transactionHash,
      blockTimestamp
    });

    return await this.transactionRepository.save(transaction);
  }

  async getLiquidations(paginationDto: PaginationDto): Promise<ResultDto<LiquidationRequestDto[]>> {
    const {page} = paginationDto;
    const limit = paginationDto.limit ?? DefaultPageSize.default;
    const offset = this.paginationService.calculateOffset(limit, page);

    const cryptoConfig = {
      btc: this.configService.get<string>("crypto.gmBtc"),
      eth: this.configService.get<string>("crypto.gmETH"),
      sol: this.configService.get<string>("crypto.gmSOL"),
      usdc: this.configService.get<string>("crypto.usdc")
    };

    const assets = [
      {name: "BTC", address: cryptoConfig.btc},
      {name: "ETH", address: cryptoConfig.eth},
      {name: "SOL", address: cryptoConfig.sol}
    ];

    const walletData: Record<string, LiquidationRequestDto> = {};

    try {
      await this.populateCollateralData(assets, walletData, limit, offset);
      // console.log('[getLiquidations] After collateral data:', JSON.stringify(walletData, null, 2));
      
      await this.populateUsdcDebtData(walletData, limit, offset, cryptoConfig.usdc);
      // console.log('[getLiquidations] After USDC debt data:', JSON.stringify(walletData, null, 2));

      const data = Object.values(walletData);
      const totalWallets = await this.getTotalWalletsCount(assets, cryptoConfig.usdc);

      let orderData = data
        .filter((c) => c.usdcDebt > 0)
        .sort((a, b) => {
          const healthFactorA = a.healthFactor ?? Number.MAX_SAFE_INTEGER;
          const healthFactorB = b.healthFactor ?? Number.MAX_SAFE_INTEGER;
          return healthFactorA - healthFactorB;
        });

      // console.log('[getLiquidations] Final orderData:', JSON.stringify(orderData, null, 2));

      const meta = this.paginationService.createMeta(limit, page, totalWallets);

      const result = new ResultDto(
        orderData,
        new ResponseMessage("Data retrieve successfully", "Data retrieve successfully")
      );
      result.paging = meta;

      // console.log('[getLiquidations] Returning result with', orderData.length, 'positions');
      return result;
    } catch (error) {
      console.error(`Error fetching liquidations: ${error.message}`);
      throw new Error("Failed to fetch liquidation data.");
    }
  }

  private async populateCollateralData(
    assets: {name: string; address: string}[],
    walletData: Record<string, LiquidationRequestDto>,
    limit: number,
    offset: number
  ) {
    for (const asset of assets) {
      const collateralResults = await this.transactionRepository
        .createQueryBuilder("transaction")
        .leftJoinAndSelect("transaction.wallet", "wallet")
        .where("transaction.asset = :assetAddress", {assetAddress: asset.address})
        .select("wallet.address", "walletAddress")
        .addSelect("wallet.healthFactor", "healthFactor")
        .addSelect("transaction.asset", "assetAddress")
        .addSelect(
          `COALESCE(
                        SUM(CASE WHEN transaction.event = :deposit THEN transaction.amount ELSE 0 END)
                        - SUM(CASE WHEN transaction.event = :withdraw THEN transaction.amount ELSE 0 END),
                        0
                    )`,
          "totalValue"
        )
        .addSelect(
          `ARRAY_AGG(
                        ROW(transaction.event, transaction.amount)
                    ) FILTER (WHERE transaction.event IN (:...borrowRepayEvents))`,
          "borrowRepayDetails"
        )
        .setParameter("deposit", ExistsEvent.DEPOSIT)
        .setParameter("withdraw", ExistsEvent.WITHDRAW)
        .setParameter("borrowRepayEvents", [ExistsEvent.BORROW, ExistsEvent.REPAY])
        .groupBy("wallet.address")
        .addGroupBy("wallet.healthFactor")
        .addGroupBy("transaction.asset")
        .skip(offset)
        .take(limit)
        .getRawMany();

      this.processCollateralResults(collateralResults, asset, walletData);
    }
  }

  private processCollateralResults(
    results: any[],
    asset: {name: string; address: string},
    walletData: Record<string, LiquidationRequestDto>
  ) {
    // console.log(`[processCollateralResults] Processing ${results.length} results for ${asset.name}`);
    for (const result of results) {
      const {walletAddress, healthFactor, totalValue, assetAddress, borrowRepayDetails} = result;
      // console.log(`[processCollateralResults] Wallet: ${walletAddress}, HF: ${healthFactor}, totalValue: ${totalValue}`);

      if (!walletData[walletAddress]) {
        walletData[walletAddress] = this.initializeWallet(walletAddress, healthFactor);
      }

      walletData[walletAddress].totalCollateralValue.push({
        assetName: asset.name,
        assetAddress,
        totalValue: Number(totalValue)
      });

      if (borrowRepayDetails) {
        const parsedDetails = this.parseBorrowRepayDetails(borrowRepayDetails);
        for (const detail of parsedDetails) {
          walletData[walletAddress].totalCollateralValue.push({
            assetName: asset.name,
            assetAddress,
            totalValue: Number(detail.amount)
          });
        }
      }
    }
  }
  private parseBorrowRepayDetails(details: string): {event: string; amount: number}[] {
    return details
      .replace(/[{}]/g, "")
      .split(",")
      .map((item) => {
        const [event, amount] = item.replace(/[()]/g, "").split(",");
        return {event, amount: parseFloat(amount)};
      });
  }

  private async populateUsdcDebtData(
    walletData: Record<string, LiquidationRequestDto>,
    limit: number,
    offset: number,
    usdcAddress: string
  ) {
    const usdcDebtResults = await this.transactionRepository
      .createQueryBuilder("transaction")
      .leftJoinAndSelect("transaction.wallet", "wallet")
      .where("transaction.asset = :usdcAddress", {usdcAddress})
      .select("wallet.address", "walletAddress")
      .addSelect("wallet.usdcDebt", "usdcDebt")
      .addSelect("wallet.healthFactor", "healthFactor")
      .groupBy("wallet.address")
      .addGroupBy("wallet.usdcDebt")
      .addGroupBy("wallet.healthFactor")
      .skip(offset)
      .take(limit)
      .getRawMany();

    this.processUsdcDebtResults(usdcDebtResults, walletData);
  }

  private processUsdcDebtResults(
    results: any[],
    walletData: Record<string, LiquidationRequestDto>
  ) {
    // console.log(`[processUsdcDebtResults] Processing ${results.length} USDC debt results`);
    for (const result of results) {
      const {walletAddress, healthFactor, usdcDebt} = result;
      // console.log(`[processUsdcDebtResults] Wallet: ${walletAddress}, HF: ${healthFactor}, usdcDebt: ${usdcDebt}`);
      if (Number(usdcDebt) > 0) {
        if (!walletData[walletAddress]) {
          // console.log(`[processUsdcDebtResults] Initializing new wallet with HF: ${healthFactor}`);
          walletData[walletAddress] = this.initializeWallet(walletAddress, healthFactor);
        }

        walletData[walletAddress].usdcDebt = Number(usdcDebt);
      }
    }
  }

  private initializeWallet(walletAddress: string, healthFactor: number): LiquidationRequestDto {
    return {
      walletAddress,
      totalCollateralValue: [],
      usdcDebt: 0,
      borrowedAsset: "USDC",
      borrowedAssetAddress: this.configService.get<string>("crypto.usdc"),
      healthFactor: healthFactor
    };
  }

  private async getTotalWalletsCount(
    assets: {name: string; address: string}[],
    usdcAddress: string
  ): Promise<number> {
    const assetAddresses = assets.map((asset) => asset.address);

    const result = await this.transactionRepository
      .createQueryBuilder("transaction")
      .leftJoin("transaction.wallet", "wallet")
      .select("COUNT(DISTINCT wallet.address)", "totalCount")
      .where("transaction.asset IN (:...assetAddresses)", {assetAddresses})
      .orWhere("transaction.asset = :usdcAddress", {usdcAddress})
      .getRawOne();

    return Number(result?.totalCount) || 0;
  }

  async isExists(transactionHash): Promise<boolean> {
    return await this.transactionRepository.existsBy({
      transactionHash: transactionHash
    });
  }
}
