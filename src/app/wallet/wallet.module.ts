import {Module} from "@nestjs/common";
import {WalletService} from "./wallet.service";
import {WalletController} from "./wallet.controller";
import {TypeOrmModule} from "@nestjs/typeorm";
import {Wallet} from "./entities/wallet.entity";
import {QueryingModule} from "src/common/querying/querying.module";
import {WatcherReferralModule} from "../watcher-referral/watcher-referral.module";

@Module({
  imports: [TypeOrmModule.forFeature([Wallet]), QueryingModule, WatcherReferralModule],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService]
})
export class WalletModule {}
