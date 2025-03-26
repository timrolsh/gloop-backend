import { IsEnum, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { ExistsEvent } from "../enum/exists-event.enum";

export class CreateTransactionDto {
    @IsString()
    @IsNotEmpty()
    walletAddress: string;

    @IsString()
    @IsNotEmpty()
    tokenName: string;

    @IsString()
    @IsNotEmpty()
    asset: string;

    @IsNumber()
    @IsNotEmpty()
    amount: number;

    @IsEnum(ExistsEvent)
    event: ExistsEvent;

    @IsString()
    @IsNotEmpty()
    transactionHash: string;
}
