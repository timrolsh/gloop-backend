import {Controller, Get, Query} from "@nestjs/common";
import {LiquidationService} from "./liquidation.service";
import {ApiTags} from "@nestjs/swagger";
import {Public} from "src/common/Auth/public-action.decorator";
import {PaginationDto} from "src/common/querying/dto/pagination.dto";

@Controller("liquidation")
@ApiTags("Liquidation")
// @ApiBearerAuth("JWT")
export class LiquidationController {
  constructor(private readonly liquidationService: LiquidationService) {}

  @Get()
  @Public()
  async getLiquidation(@Query() paginationDto: PaginationDto) {
    return await this.liquidationService.getLiquidation(paginationDto);
  }
}
