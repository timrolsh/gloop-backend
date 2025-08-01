import {IsDate, IsNumber, IsOptional} from "class-validator";
import {Expose, Type} from "class-transformer";
import {ApiProperty} from "@nestjs/swagger";

export class LeaderboardListResponseDto {
  @ApiProperty({
    description: "The rank of the leaderboard entry",
    example: 1
  })
  @Expose()
  rank?: number | null;

  @ApiProperty({
    description: "The wallet address associated with the leaderboard entry",
    example: "0x55F34B40d33d75aEA47499890708C372817D5901"
  })
  @Expose()
  address: string;

  @ApiProperty({
    description: "The last update time of the leaderboard entry",
    example: "2023-10-06T00:00:00.000Z",
    required: false
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  @Expose()
  lastUpdateTime?: Date;

  @ApiProperty({
    description: "Lending points in USDC",
    example: 1000.5,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Expose()
  lendingUSDCPoints?: number;

  @ApiProperty({
    description: "Borrowing points in USDC",
    example: 500.75,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Expose()
  borrowingUSDCPoints?: number;

  @ApiProperty({
    description: "Total earned points in USDC",
    example: 1500.25,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Expose()
  totalEarnedPoints?: number; // TotalPoint

  @ApiProperty({
    description: "Points that have been claimed by the user",
    example: 750.0,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Expose()
  claimedPoints?: number;

  @ApiProperty({
    description: "referral Boost",
    example: 9,
    required: false
  })
  @Expose()
  referralBoost: number;
}
