import {Module} from "@nestjs/common";
import {WatcherReferralService} from "./watcher-referral.service";
import {WatcherReferralController} from "./watcher-referral.controller";

@Module({
  controllers: [WatcherReferralController],
  providers: [WatcherReferralService],
  exports: [WatcherReferralService]
})
export class WatcherReferralModule {}
