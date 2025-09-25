import {Public} from "./../../common/Auth/public-action.decorator";
import {Controller, Get, Query, Post, Param} from "@nestjs/common";
import {WalletService} from "./wallet.service";
import {ApiTags, ApiBearerAuth} from "@nestjs/swagger";
import {ResultDto} from "src/common/dto/result.dto";
import {ApiResponseResult} from "src/common/swagger/decorators/api-response-result.decorator";
import {GetWalletFactory} from "src/common/Auth/get-wallet.decorator";
import {DashboardResponseDto} from "./dto/dashboard-response.dto";
import {LeaderboardListResponseDto} from "./dto/leaderboard-list-response.dto";
import {LeaderboardListRequestDto} from "./dto/leaderboard-list-request.dto";

@Controller("user")
@ApiTags("User")
@ApiBearerAuth("JWT")
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get("me")
  @ApiResponseResult(DashboardResponseDto, false)
  async getUserDashboard(
    @GetWalletFactory() walletId: string
  ): Promise<ResultDto<DashboardResponseDto>> {
    return await this.walletService.getUserDashboard(walletId);
  }

  @Get("leaderboard")
  @Public()
  @ApiResponseResult(LeaderboardListResponseDto, true)
  async getLeaderboardList(
    @Query() leaderboardListRequestDto: LeaderboardListRequestDto
  ): Promise<ResultDto<{LeaderboardList: LeaderboardListResponseDto[]; totalUsers: number}>> {
    return await this.walletService.getLeaderboardList(leaderboardListRequestDto);
  }

  /**
   * Debug endpoint to check points calculation for a specific wallet
   */
  @Get("debug/:address")
  @Public()
  async debugWalletPoints(@Param("address") address: string): Promise<any> {
    try {
      const wallet = await this.walletService.getWalletByAddress(address);
      if (!wallet) {
        return { error: "Wallet not found" };
      }

      return {
        walletId: wallet.id,
        address: wallet.address,
        storedPoints: {
          lendingUSDCPoints: wallet.lendingUSDCPoints,
          borrowingUSDCPoints: wallet.borrowingUSDCPoints,
          totalEarnedPoints: wallet.totalEarnedPoints,
          claimedPoints: wallet.claimedPoints,
          stakingBoost: wallet.stakingBoost
        },
        stakingStatus: {
          isCurrentlyStaking: wallet.isCurrentlyStaking,
          currentStakingBoostMultiplier: wallet.currentStakingBoostMultiplier,
          lastStakingChangeTime: wallet.lastStakingChangeTime,
          basePointsAtLastSnapshot: wallet.basePointsAtLastSnapshot,
          accumulatedBoostedPoints: wallet.accumulatedBoostedPoints
        },
        message: "Points calculation has been updated to use Kamino model. Redeploy and run leaderboard update to see corrected values."
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}