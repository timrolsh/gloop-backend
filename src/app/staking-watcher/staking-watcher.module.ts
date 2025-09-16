import {Module} from "@nestjs/common";
import {StakingWatcherService} from "./staking-watcher.service";
import {StakingEventModule} from "../staking-event/staking-event.module";
import {WalletModule} from "../wallet/wallet.module";

@Module({
  imports: [StakingEventModule, WalletModule],
  providers: [StakingWatcherService],
  exports: [StakingWatcherService]
})
export class StakingWatcherModule {}
