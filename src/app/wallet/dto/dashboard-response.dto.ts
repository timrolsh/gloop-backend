import {ApiProperty} from "@nestjs/swagger";
import {Expose} from "class-transformer";

export class DashboardResponseDto {
  @ApiProperty({
    description: "Lending points in USDC",
    example: 1000.5,
    required: false
  })
  @Expose()
  lendingUSDCPoints?: number;

  @ApiProperty({
    description: "Borrowing points in USDC",
    example: 500.75,
    required: false
  })
  @Expose()
  borrowingUSDCPoints?: number;

  @ApiProperty({
    description: "Total earned points in USDC",
    example: 1500.25,
    required: false
  })
  @Expose()
  totalEarnedPoints?: number; // TotalPoint

  @ApiProperty({
    description: "rank",
    example: 9,
    required: false
  })
  @Expose()
  rank?: number | null;
}
