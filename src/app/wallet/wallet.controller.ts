import {Public} from "./../../common/Auth/public-action.decorator";
import {Controller, Get, Query, Post} from "@nestjs/common";
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
}