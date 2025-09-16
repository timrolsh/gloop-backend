import {Controller, Get, Post, Param} from "@nestjs/common";
import {UpdateLeaderboardService} from "./update-leaderboard.service";
import {Public} from "src/common/Auth/public-action.decorator";

@Controller("update-leaderboard")
export class UpdateLeaderboardController {
  constructor(private readonly updateLeaderboardService: UpdateLeaderboardService) {}

  @Get()
  @Public()
  async update() {
    await this.updateLeaderboardService.updateLeaderboard();
  }

  // Keep only for debugging/testing purposes
  @Post("debug-snapshot/:address")
  @Public()
  async takeDebugSnapshot(@Param("address") address: string) {
    await this.updateLeaderboardService.forceSnapshotForAddress(address);
  }
}
