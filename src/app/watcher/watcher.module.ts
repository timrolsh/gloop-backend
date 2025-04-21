import { Module } from "@nestjs/common";
import { WatcherService } from "./watcher.service";
import { TransactionModule } from "../transaction/transaction.module";
import { BlockModule } from "../block/block.module";
import { BlockCheckerModule } from "../block-checker/block-checker.module";
import { WalletModule } from "../wallet/wallet.module";

@Module({
    imports: [TransactionModule, BlockModule, BlockCheckerModule, WalletModule],
    providers: [WatcherService],
})
export class WatcherModule {}

