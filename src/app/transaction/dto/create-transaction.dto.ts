import {IsEnum, IsNotEmpty, IsNumber, IsString, IsOptional, IsDate} from "class-validator";
import {Type} from "class-transformer";
import {ExistsEvent} from "../enum/exists-event.enum";

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

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  blockTimestamp?: Date;
}
