import {Injectable, Logger, NotFoundException} from "@nestjs/common";
import {CreateWalletDto} from "./dto/create-wallet.dto";
import {InjectRepository} from "@nestjs/typeorm";
import {Brackets, Not, Repository} from "typeorm";
import {Wallet} from "./entities/wallet.entity";
import {ResultDto} from "src/common/dto/result.dto";
import {ResponseMessage} from "src/common/dto/result.dto";
import {DefaultPageSize} from "src/common/querying/util/querying.constants";
import {PaginationService} from "src/common/querying/pagination.service";
import {plainToInstance} from "class-transformer";
import {throwCustomHttpException} from "src/common/utils/exception.util";
import {DashboardResponseDto} from "./dto/dashboard-response.dto";
import {UpdateLeaderboardDto} from "../update-leaderboard/dto/update-leaderboard.dto";
import {LeaderboardListResponseDto} from "./dto/leaderboard-list-response.dto";
import {LeaderboardListRequestDto} from "./dto/leaderboard-list-request.dto";

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,

    private readonly paginationService: PaginationService,
  ) {}

  async create(createWalletDto: CreateWalletDto): Promise<Wallet> {
    const wallet = this.walletRepository.create(createWalletDto);
    const savedWallet = await this.walletRepository.save(wallet);
    return savedWallet;
  }

  async getUserDashboard(walletId: string): Promise<ResultDto<DashboardResponseDto>> {
    const wallet = await this.walletRepository.findOne({where: {id: walletId}});
    if (!wallet) {
      throwCustomHttpException("User not found!", "User not found!");
    }

    const rankQuery = this.walletRepository
      .createQueryBuilder("wallet")
      .select("COUNT(*)", "rank")
      .where(
        new Brackets((qb) => {
          qb.where("wallet.totalEarnedPoints > :totalEarnedPoints", {
            totalEarnedPoints: wallet.totalEarnedPoints
          }).orWhere(
            "wallet.totalEarnedPoints = :totalEarnedPoints AND wallet.createdAt < :createdAt",
            {
              totalEarnedPoints: wallet.totalEarnedPoints,
              createdAt: wallet.createdAt
            }
          );
        })
      );

    const rankResult = await rankQuery.getRawOne();
    const rank = rankResult ? Number(rankResult.rank) + 1 : 1;

    const res = plainToInstance(DashboardResponseDto, wallet, {excludeExtraneousValues: true});
    res.rank = res.totalEarnedPoints > 0 ? rank : null;
    return new ResultDto(res);
  }

  async updateLeaderboard(model: UpdateLeaderboardDto) {
    try {
      const {
        walletId,
        lastUpdateTime,
        lendingUSDCPoints,
        borrowingUSDCPoints,
        totalEarnedPoints,
        claimedPoints,
        stakingBoost
      } = model;

      await this.walletRepository.update(
        {id: walletId},
        {
          lastUpdateTime,
          lendingUSDCPoints: parseFloat(lendingUSDCPoints),
          borrowingUSDCPoints: parseFloat(borrowingUSDCPoints),
          totalEarnedPoints: parseFloat(totalEarnedPoints),
          claimedPoints: parseFloat(claimedPoints),
          stakingBoost: parseFloat(stakingBoost)
        }
      );
    } catch (error) {
      console.log(error);
    }
  }

  async findByAddress(address: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({where: {address}});
    return wallet;
  }

  async findOne(id: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({where: {id}});

    if (!wallet) {
      this.logger.warn(`Wallet with id: ${id} not found`);
      throw new NotFoundException(`Wallet with ID ${id} not found`);
    }

    return wallet;
  }

  async remove(id: string): Promise<ResultDto<null>> {
    this.logger.log(`Removing wallet with id: ${id}`);

    const wallet = await this.walletRepository.findOne({where: {id}});

    if (!wallet) {
      this.logger.warn(`Wallet with id: ${id} not found`);
      throw new NotFoundException(`Wallet with ID ${id} not found`);
    }

    await this.walletRepository.remove(wallet);
    const message = new ResponseMessage(
      "Wallet removed successfully",
      "Wallet removed successfully"
    );

    return new ResultDto(null, message);
  }

  async getAllWallets(): Promise<string[]> {
    const wallets = await this.walletRepository.find({select: ["address"]});
    return wallets.map((wallet) => wallet.address);
  }

  async getWalletAddressToIdMap(): Promise<{[address: string]: string}> {
    const wallets = await this.walletRepository.find({select: ["id", "address"]});
    const walletMap: {[address: string]: string} = {};

    wallets.forEach((wallet) => {
      walletMap[wallet.address] = wallet.id;
    });

    return walletMap;
  }

  async getWalletAddressForHealthFactor(): Promise<{[address: string]: string}> {
    const wallets = await this.walletRepository.find({select: ["id", "address"]});
    const walletMap: {[address: string]: string} = {};

    wallets.forEach((wallet) => {
      walletMap[wallet.address] = wallet.id;
    });

    return walletMap;
  }

  async getLeaderboardList(paginationDto: LeaderboardListRequestDto): Promise<
    ResultDto<{
      LeaderboardList: LeaderboardListResponseDto[];
      totalUsers: number;
      totalPoints: number;
    }>
  > {
    const {page} = paginationDto;
    const limit = paginationDto.limit ?? DefaultPageSize.default;
    const offset = this.paginationService.calculateOffset(limit, page);

    // Subquery to calculate rank
    const subQuery = this.walletRepository
      .createQueryBuilder("w2")
      .select("COUNT(*)")
      .where(
        new Brackets((qb) => {
          qb.where("w2.totalEarnedPoints > wallet.totalEarnedPoints").orWhere(
            new Brackets((qb2) => {
              qb2
                .where("w2.totalEarnedPoints = wallet.totalEarnedPoints")
                .andWhere("w2.createdAt < wallet.createdAt");
            })
          );
        })
      );

    // Main query to get leaderboard data with rank
    const query = this.walletRepository
      .createQueryBuilder("wallet")
      .where({totalEarnedPoints: Not(0)})
      .addSelect(`(${subQuery.getQuery()}) + 1`, "rank")
      .orderBy("rank", "ASC")
      .skip(offset)
      .take(limit);

    // Pass parameters from subquery to main query
    query.setParameters(subQuery.getParameters());

    const [data, count] = await query.getManyAndCount();

    const totalUsers = await this.walletRepository.count({where: {totalEarnedPoints: Not(0)}});

    // Calculate total points across all users
    const totalPointsResult = await this.walletRepository
      .createQueryBuilder("wallet")
      .select("SUM(wallet.totalEarnedPoints)", "sum")
      .getRawOne();
    const totalPoints = Number(totalPointsResult.sum) || 0;

    // Create pagination metadata
    const meta = this.paginationService.createMeta(limit, page, count);

    // Map data to response DTO including rank
    const res = data.map((wallet) => {
      const leaderboardDto = plainToInstance(LeaderboardListResponseDto, wallet, {
        excludeExtraneousValues: true
      });
      leaderboardDto.rank = Number(wallet["rank"]);
      return leaderboardDto;
    });

    const result = new ResultDto({
      LeaderboardList: res,
      totalUsers,
      totalPoints
    });
    result.paging = meta;
    return result;
  }

  async getAll() {
    const wallets = await this.walletRepository.find();
    return wallets;
  }

  async getWalletByAddress(address: string): Promise<Wallet> {
    const wallet = await this.walletRepository.findOne({where: {address}});
    return wallet;
  }

  async updateHealthFactor(walletId: string, healthFactor: number): Promise<void> {
    await this.walletRepository.update(walletId, {healthFactor});
  }

  async updateUsdcDebt(walletId: string, usdcDebt: string): Promise<void> {
    await this.walletRepository.update(walletId, {usdcDebt});
  }
}
