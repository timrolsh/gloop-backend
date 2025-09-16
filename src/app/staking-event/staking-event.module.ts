import {Module} from "@nestjs/common";
import {TypeOrmModule} from "@nestjs/typeorm";
import {StakingEvent} from "./entities/staking-event.entity";
import {StakingEventService} from "./staking-event.service";
import {WalletModule} from "../wallet/wallet.module";

@Module({
  imports: [TypeOrmModule.forFeature([StakingEvent]), WalletModule],
  providers: [StakingEventService],
  exports: [StakingEventService]
})
export class StakingEventModule {}
