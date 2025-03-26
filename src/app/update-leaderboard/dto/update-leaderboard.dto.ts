import { IsDate, IsNumber, IsOptional } from "class-validator";
import { Type } from "class-transformer";

export class UpdateLeaderboardDto {
    walletId: string;

    @IsOptional()
    @Type(() => Date)
    @IsDate()
    lastUpdateTime?: Date;

    @IsOptional()
    lendingUSDCPoints: string;

    @IsOptional()
    borrowingUSDCPoints: string;

    @IsOptional()
    totalEarnedPoints: string;

    @IsOptional()
    claimedPoints: string;

    referralBoost: string;
}
