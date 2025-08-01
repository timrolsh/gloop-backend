import {ApiPropertyOptional} from "@nestjs/swagger";
import {IsEnum, IsOptional} from "class-validator";
import {PaginationDto} from "src/common/querying/dto/pagination.dto";

export enum SortOrder {
  ASC = "ASC",
  DESC = "DESC"
}

export enum SortBy {
  LENDING_USDC_POINTS = "lendingUSDCPoints",
  BORROWING_USDC_POINTS = "borrowingUSDCPoints",
  TOTAL_EARNED_POINTS = "totalEarnedPoints",
  CLAIMED_POINTS = "claimedPoints"
}

export class LeaderboardListRequestDto extends PaginationDto {
  @ApiPropertyOptional({
    description: "The field to sort the leaderboard by",
    enum: SortBy,
    default: SortBy.TOTAL_EARNED_POINTS
  })
  @IsEnum(SortBy)
  @IsOptional()
  sortBy: SortBy = SortBy.TOTAL_EARNED_POINTS;

  @ApiPropertyOptional({
    description: "The sort order, either ascending (ASC) or descending (DESC)",
    enum: SortOrder,
    default: SortOrder.DESC
  })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder: SortOrder = SortOrder.DESC;
}
