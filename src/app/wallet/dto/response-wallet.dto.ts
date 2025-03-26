import { ApiProperty } from "@nestjs/swagger";
import { Wallet } from "../entities/wallet.entity";
import { Expose } from "class-transformer";

export class ResponseWalletDto {
    @ApiProperty({
        description: "The address of the wallet.",
        example: "0x1234567890abcdef1234567890abcdef12345678",
    })
    @Expose()
    address: string;
}
