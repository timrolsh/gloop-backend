import {Controller} from "@nestjs/common";
import {TransactionService} from "./transaction.service";
import {ApiTags} from "@nestjs/swagger";

@Controller("transaction")
@ApiTags("Transaction")
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}
}
