import {Module} from "@nestjs/common";
import {LiquidationService} from "./liquidation.service";
import {LiquidationController} from "./liquidation.controller";
import {TransactionModule} from "../transaction/transaction.module";

@Module({
  imports: [TransactionModule],
  controllers: [LiquidationController],
  providers: [LiquidationService]
})
export class LiquidationModule {}
