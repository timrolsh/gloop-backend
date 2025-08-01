import {Injectable} from "@nestjs/common";
import {TransactionService} from "../transaction/transaction.service";
import {PaginationDto} from "src/common/querying/dto/pagination.dto";

@Injectable()
export class LiquidationService {
  constructor(private readonly transactionService: TransactionService) {}

  async getLiquidation(paginationDto: PaginationDto) {
    return await this.transactionService.getLiquidations(paginationDto);
  }
}
