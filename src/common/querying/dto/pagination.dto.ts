import { IsOptional, Max } from "class-validator";
import { MAX_PAGE_SIZE, MAX_PAGE_NUMBER } from "../util/querying.constants";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsCardinal } from "../decorators/validators/is-cardinal.decorator";

export class PaginationDto {
    @ApiPropertyOptional({ description: "The numbers of items to return", example: 10 })
    @IsOptional()
    @Max(MAX_PAGE_SIZE)
    @IsCardinal()
    readonly limit?: number = 10;

    @ApiPropertyOptional({ description: "The numbers of page", example: 1 })
    @IsOptional()
    @Max(MAX_PAGE_NUMBER)
    @IsCardinal()
    readonly page?: number = 1;
}
