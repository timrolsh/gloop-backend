import {Controller, Get} from "@nestjs/common";
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
}
