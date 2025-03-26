import { Module } from "@nestjs/common";
import { WatcherService } from "./watcher.service";
import { TransactionModule } from "../transaction/transaction.module";
import { BlockModule } from "../block/block.module";
import { BlockCheckerModule } from "../block-checker/block-checker.module";

@Module({
    imports: [TransactionModule, BlockModule, BlockCheckerModule],
    providers: [WatcherService],
})
export class WatcherModule {}
