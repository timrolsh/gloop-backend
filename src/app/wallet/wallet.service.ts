import {Injectable, Logger, NotFoundException} from "@nestjs/common";
import {CreateWalletDto} from "./dto/create-wallet.dto";
import {InjectRepository} from "@nestjs/typeorm";
import {Brackets, Not, Repository, DataSource} from "typeorm";
import {Wallet} from "./entities/wallet.entity";
import {ResultDto} from "src/common/dto/result.dto";
import {ResponseMessage} from "src/common/dto/result.dto";
import {DefaultPageSize} from "src/common/querying/util/querying.constants";
import {PaginationService} from "src/common/querying/pagination.service";
import {plainToInstance} from "class-transformer";
import {throwCustomHttpException} from "src/common/utils/exception.util";
import {DashboardResponseDto} from "./dto/dashboard-response.dto";
import {LeaderboardListResponseDto} from "./dto/leaderboard-list-response.dto";
import {LeaderboardListRequestDto} from "./dto/leaderboard-list-request.dto";
import {getAddress, isAddress} from "ethers";

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    private readonly dataSource: DataSource,
    private readonly paginationService: PaginationService
  ) {}

  /**
   * Normalize Ethereum address to proper checksum format
   * This ensures consistent address format across the application
   */
  private normalizeAddress(address: string): string {
    if (!address) {
      throw new Error("Address cannot be empty");
    }

    // Remove any whitespace
    const cleanAddress = address.trim();

    // Validate that it's a valid Ethereum address
    if (!isAddress(cleanAddress)) {
      throw new Error(`Invalid Ethereum address: ${cleanAddress}`);
    }

    // Convert to checksum format (proper capitalization)
    return getAddress(cleanAddress);
  }

  async create(createWalletDto: CreateWalletDto): Promise<Wallet> {
    try {
      // Normalize the address to proper checksum format
      const normalizedAddress = this.normalizeAddress(createWalletDto.address);
      const normalizedDto = {...createWalletDto, address: normalizedAddress};

      const wallet = this.walletRepository.create(normalizedDto);
      const savedWallet = await this.walletRepository.save(wallet);
      return savedWallet;
    } catch (error) {
      // Handle duplicate key constraint violation
      if (error.code === "23505" || error.message?.includes("duplicate key")) {
        const normalizedAddress = this.normalizeAddress(createWalletDto.address);
        this.logger.warn(
          `Wallet with address ${normalizedAddress} already exists, fetching existing wallet`
        );
        const existingWallet = await this.walletRepository.findOne({
          where: {address: normalizedAddress}
        });
        if (existingWallet) {
          return existingWallet;
        }
      }
      throw error;
    }
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

  async findByAddress(address: string): Promise<Wallet> {
    const normalizedAddress = this.normalizeAddress(address);
    const wallet = await this.walletRepository.findOne({where: {address: normalizedAddress}});
    return wallet;
  }

  /**
   * Find or create a wallet by address using UPSERT pattern
   * This prevents race conditions by using database-level operations
   */
  async findOrCreateByAddress(address: string): Promise<Wallet> {
    const normalizedAddress = this.normalizeAddress(address);

    // First, try to find existing wallet
    let wallet = await this.findByAddress(normalizedAddress);
    if (wallet) {
      return wallet;
    }

    // If not found, try to create it
    try {
      const createWalletDto = new CreateWalletDto(normalizedAddress);
      wallet = await this.create(createWalletDto);
      return wallet;
    } catch (error) {
      // If creation fails due to race condition (duplicate key), try to find it again
      if (error.code === "23505" || error.message?.includes("duplicate key")) {
        this.logger.verbose(
          `Race condition detected for address ${normalizedAddress}, refetching wallet`
        );
        wallet = await this.findByAddress(normalizedAddress);
        if (wallet) {
          return wallet;
        }
      }
      throw error;
    }
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

    // Get leaderboard data from the SQL view with pagination
    const leaderboardQuery = `
      SELECT
        pl.*, 
        w."stakingBoost"
      FROM
        points_leaderboard AS pl
      JOIN
        wallets AS w ON pl.wallet_address = w.address
      ORDER BY pl.rank ASC
      LIMIT $1 OFFSET $2
    `;

    // Get total counts
    const countQuery = `
      SELECT 
        COUNT(*) as total_users,
        COALESCE(SUM(total_points), 0) as total_points
      FROM points_leaderboard
    `;

    const [leaderboardData, countData] = await Promise.all([
      this.dataSource.query(leaderboardQuery, [limit, offset]),
      this.dataSource.query(countQuery)
    ]);

    const totalUsers = Number(countData[0]?.total_users) || 0;
    const totalPoints = Number(countData[0]?.total_points) || 0;

    // Create pagination metadata
    const meta = this.paginationService.createMeta(limit, page, totalUsers);

    // Map data to response DTO format
    const res: LeaderboardListResponseDto[] = leaderboardData.map((row: any) => ({
      rank: Number(row.rank),
      address: row.wallet_address,
      lastUpdateTime: null, // Not available in the new view, set to null
      lendingUSDCPoints: Math.round(Number(row.current_usdc_lending) * 2), // Approximate based on current balance
      borrowingUSDCPoints: Math.round(Number(row.current_usdc_borrowing) * 1), // Approximate based on current balance
      totalEarnedPoints: Math.round(Number(row.total_points)),
      claimedPoints: 0, // Set to 0 as per your example
      stakingBoost: Number(row.stakingBoost)
    }));

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
    const normalizedAddress = this.normalizeAddress(address);
    const wallet = await this.walletRepository.findOne({where: {address: normalizedAddress}});
    return wallet;
  }

  async updateHealthFactor(walletId: string, healthFactor: number): Promise<void> {
    await this.walletRepository.update(walletId, {healthFactor});
  }

  async updateUsdcDebt(walletId: string, usdcDebt: string): Promise<void> {
    await this.walletRepository.update(walletId, {usdcDebt});
  }

  /**
   * Clean up duplicate wallets in the database, including case-variant duplicates
   * This method should be run after deploying the fix to remove existing duplicates
   * WARNING: This method modifies data - use with caution!
   */
  async cleanupDuplicateWallets(): Promise<{
    cleaned: number;
    preserved: number;
    caseVariantsCleaned: number;
  }> {
    this.logger.warn("Starting duplicate wallet cleanup process...");

    let cleanedCount = 0;
    let preservedCount = 0;
    let caseVariantsCleaned = 0;

    // First, handle case-variant duplicates (same address but different case)
    caseVariantsCleaned = await this.cleanupCaseVariantDuplicates();

    // Then handle exact duplicates
    const duplicateAddresses = await this.walletRepository
      .createQueryBuilder("wallet")
      .select("wallet.address")
      .addSelect("COUNT(*)", "count")
      .groupBy("wallet.address")
      .having("COUNT(*) > 1")
      .getRawMany();

    for (const duplicate of duplicateAddresses) {
      const address = duplicate.wallet_address;
      this.logger.log(`Processing duplicates for address: ${address}`);

      // Get all wallets for this address, ordered by creation date (keep oldest)
      const wallets = await this.walletRepository.find({
        where: {address},
        order: {createdAt: "ASC"}
      });

      if (wallets.length > 1) {
        const keepWallet = wallets[0]; // Keep the oldest one
        const duplicateWallets = wallets.slice(1);

        preservedCount++;

        for (const duplicateWallet of duplicateWallets) {
          await this.mergeDuplicateWalletData(keepWallet, duplicateWallet);
          await this.walletRepository.remove(duplicateWallet);
          cleanedCount++;

          this.logger.log(`Removed duplicate wallet ${duplicateWallet.id} for address ${address}`);
        }
      }
    }

    this.logger.warn(
      `Cleanup completed: ${cleanedCount} duplicates removed, ${preservedCount} wallets preserved, ${caseVariantsCleaned} case variants cleaned`
    );
    return {cleaned: cleanedCount, preserved: preservedCount, caseVariantsCleaned};
  }

  /**
   * Handle case-variant duplicates by normalizing addresses to checksum format
   */
  private async cleanupCaseVariantDuplicates(): Promise<number> {
    this.logger.log("Cleaning up case-variant duplicates...");

    // Get all wallets
    const allWallets = await this.walletRepository.find({
      order: {createdAt: "ASC"}
    });

    // Group by normalized address
    const addressGroups = new Map<string, Wallet[]>();

    for (const wallet of allWallets) {
      try {
        const normalizedAddress = this.normalizeAddress(wallet.address);

        if (!addressGroups.has(normalizedAddress)) {
          addressGroups.set(normalizedAddress, []);
        }
        addressGroups.get(normalizedAddress).push(wallet);
      } catch (error) {
        this.logger.warn(`Invalid address found: ${wallet.address}, skipping...`);
        continue;
      }
    }

    let caseVariantsCleaned = 0;

    // Process each group
    for (const [normalizedAddress, wallets] of addressGroups) {
      if (wallets.length > 1) {
        // Keep the wallet with checksum address if it exists, otherwise keep the oldest
        let keepWallet = wallets.find((w) => w.address === normalizedAddress) || wallets[0];
        const duplicateWallets = wallets.filter((w) => w.id !== keepWallet.id);

        // Update the kept wallet's address to proper checksum format
        if (keepWallet.address !== normalizedAddress) {
          await this.walletRepository.update(keepWallet.id, {address: normalizedAddress});
          keepWallet.address = normalizedAddress;
        }

        for (const duplicateWallet of duplicateWallets) {
          await this.mergeDuplicateWalletData(keepWallet, duplicateWallet);
          await this.walletRepository.remove(duplicateWallet);
          caseVariantsCleaned++;

          this.logger.log(`Merged case variant ${duplicateWallet.address} → ${normalizedAddress}`);
        }
      }
    }

    this.logger.log(`Case variant cleanup completed: ${caseVariantsCleaned} variants cleaned`);
    return caseVariantsCleaned;
  }

  /**
   * Merge data from duplicate wallet into the keeper wallet
   */
  private async mergeDuplicateWalletData(
    keepWallet: Wallet,
    duplicateWallet: Wallet
  ): Promise<void> {
    // Update any transactions that reference the duplicate wallet
    await this.walletRepository.manager.query(
      'UPDATE transactions SET "walletId" = $1 WHERE "walletId" = $2',
      [keepWallet.id, duplicateWallet.id]
    );

    // Update any staking events that reference the duplicate wallet
    await this.walletRepository.manager.query(
      'UPDATE staking_events SET "walletId" = $1 WHERE "walletId" = $2',
      [keepWallet.id, duplicateWallet.id]
    );

    // Merge the points data (keep the highest values)
    const mergedData = {
      lendingUSDCPoints: Math.max(
        keepWallet.lendingUSDCPoints || 0,
        duplicateWallet.lendingUSDCPoints || 0
      ),
      borrowingUSDCPoints: Math.max(
        keepWallet.borrowingUSDCPoints || 0,
        duplicateWallet.borrowingUSDCPoints || 0
      ),
      totalEarnedPoints: Math.max(
        keepWallet.totalEarnedPoints || 0,
        duplicateWallet.totalEarnedPoints || 0
      ),
      claimedPoints: Math.max(keepWallet.claimedPoints || 0, duplicateWallet.claimedPoints || 0),
      stakingBoost: Math.max(keepWallet.stakingBoost || 0, duplicateWallet.stakingBoost || 0),
      healthFactor: Math.max(keepWallet.healthFactor || 0, duplicateWallet.healthFactor || 0),
      lastUpdateTime:
        duplicateWallet.lastUpdateTime > keepWallet.lastUpdateTime
          ? duplicateWallet.lastUpdateTime
          : keepWallet.lastUpdateTime,
      // Handle accumulated boosted points
      accumulatedBoostedPoints: Math.max(
        keepWallet.accumulatedBoostedPoints || 0,
        duplicateWallet.accumulatedBoostedPoints || 0
      ),
      basePointsAtLastSnapshot: Math.max(
        keepWallet.basePointsAtLastSnapshot || 0,
        duplicateWallet.basePointsAtLastSnapshot || 0
      ),
      currentStakingBoostMultiplier: Math.max(
        keepWallet.currentStakingBoostMultiplier || 0,
        duplicateWallet.currentStakingBoostMultiplier || 0
      ),
      // Keep the more recent staking status
      isCurrentlyStaking:
        duplicateWallet.lastStakingChangeTime > keepWallet.lastStakingChangeTime
          ? duplicateWallet.isCurrentlyStaking
          : keepWallet.isCurrentlyStaking,
      lastStakingChangeTime:
        duplicateWallet.lastStakingChangeTime > keepWallet.lastStakingChangeTime
          ? duplicateWallet.lastStakingChangeTime
          : keepWallet.lastStakingChangeTime
    };

    await this.walletRepository.update(keepWallet.id, mergedData);

    // Update the keepWallet object for subsequent comparisons
    Object.assign(keepWallet, mergedData);
  }
}
