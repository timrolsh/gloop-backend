import { Module } from "@nestjs/common";
import { TransactionService } from "./transaction.service";
import { TransactionController } from "./transaction.controller";
import { WalletModule } from "../wallet/wallet.module";
import { Transaction } from "./entities/transaction.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { QueryingModule } from "src/common/querying/querying.module";

@Module({
    imports: [TypeOrmModule.forFeature([Transaction]), WalletModule, QueryingModule],
    controllers: [TransactionController],
    providers: [TransactionService],
    exports: [TransactionService],
})
export class TransactionModule {}
