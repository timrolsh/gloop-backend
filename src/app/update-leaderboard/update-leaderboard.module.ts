import { Module } from "@nestjs/common";
import { UpdateLeaderboardService } from "./update-leaderboard.service";
import { UpdateLeaderboardController } from "./update-leaderboard.controller";
import { WalletModule } from "../wallet/wallet.module";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
    imports: [ScheduleModule.forRoot(), WalletModule],
    controllers: [UpdateLeaderboardController],
    providers: [UpdateLeaderboardService],
})
export class UpdateLeaderboardModule {}
