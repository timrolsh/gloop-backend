import {Module} from "@nestjs/common";
import {BlockCheckerService} from "./block-checker.service";
import {BlockCheckerController} from "./block-checker.controller";
import {WalletModule} from "../wallet/wallet.module";
import {BlockModule} from "../block/block.module";
import {TransactionModule} from "../transaction/transaction.module";
import {ScheduleModule} from "@nestjs/schedule";

@Module({
  imports: [ScheduleModule.forRoot(), WalletModule, BlockModule, TransactionModule],
  controllers: [BlockCheckerController],
  providers: [BlockCheckerService],
  exports: [BlockCheckerService]
})
export class BlockCheckerModule {}
