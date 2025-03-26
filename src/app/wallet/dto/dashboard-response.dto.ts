import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class DashboardResponseDto {
    @ApiProperty({ description: "Referral code of the user." })
    @Expose()
    referralCode: string;

    @ApiProperty({ description: "Number of users referred by the user." })
    @Expose()
    usersReferred?: number;

    @ApiProperty({
        description: "Lending points in USDC",
        example: 1000.5,
        required: false,
    })
    @Expose()
    lendingUSDCPoints?: number;

    @ApiProperty({
        description: "Borrowing points in USDC",
        example: 500.75,
        required: false,
    })
    @Expose()
    borrowingUSDCPoints?: number;

    @ApiProperty({
        description: "Total earned points in USDC",
        example: 1500.25,
        required: false,
    })
    @Expose()
    totalEarnedPoints?: number; // TotalPoint

    @ApiProperty({
        description: "Points that have been claimed by the user",
        example: 750.0,
        required: false,
    })
    @Expose()
    claimedPoints?: number;

    @ApiProperty({
        description: "rank",
        example: 9,
        required: false,
    })
    @Expose()
    rank?: number | null;

    @ApiProperty({
        description: "referral Boost",
        example: 9,
        required: false,
    })
    @Expose()
    referralBoost: number;
}
