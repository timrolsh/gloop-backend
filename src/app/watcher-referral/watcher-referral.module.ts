import { Module } from "@nestjs/common";
import { WatcherReferralService } from "./watcher-referral.service";
import { WatcherReferralController } from "./watcher-referral.controller";
import { WalletModule } from "../wallet/wallet.module";

@Module({
    controllers: [WatcherReferralController],
    providers: [WatcherReferralService],
    exports: [WatcherReferralService],
})
export class WatcherReferralModule {}
