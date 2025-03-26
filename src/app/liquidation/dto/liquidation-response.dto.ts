import { ApiProperty } from "@nestjs/swagger";

export class TotalCollateralValue {
    @ApiProperty({ description: "The asset name or symbol", example: "ETH" })
    assetName: string;

    @ApiProperty({ description: "The asset address", example: "0xE...54B23f46" })
    assetAddress: string;

    @ApiProperty({ description: "The total value of the collateral for the asset", example: 1000 })
    totalValue: number;
}

export class LiquidationRequestDto {
    @ApiProperty({ description: "The wallet address associated with the liquidation request", example: "0xAbC123..." })
    walletAddress: string;

    @ApiProperty({
        description: "An array of total collateral values for different assets",
        type: [TotalCollateralValue],
    })
    totalCollateralValue: TotalCollateralValue[];

    @ApiProperty({ description: "The total USDC debt associated with the wallet", example: 500 })
    usdcDebt: number;

    @ApiProperty({ description: "", example: "USDC" })
    borrowedAsset: string;

    @ApiProperty({ description: "", example: "0xAbC123.." })
    borrowedAssetAddress: string;

    @ApiProperty()
    healthFactor: number;
}
