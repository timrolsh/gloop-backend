import { Controller, Get, Post, Body, Patch, Param, Delete } from "@nestjs/common";
import { TransactionService } from "./transaction.service";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { Public } from "src/common/Auth/public-action.decorator";

@Controller("transaction")
@ApiTags("Transaction")
export class TransactionController {
    constructor(private readonly transactionService: TransactionService) {}
}
