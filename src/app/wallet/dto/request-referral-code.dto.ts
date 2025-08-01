import {ApiProperty} from "@nestjs/swagger";
import {IsString, IsNotEmpty, Length} from "class-validator";

export class RequestReferralCodeDto {
  @ApiProperty({
    description: "Referral code provided by the user",
    example: "abc123",
    minLength: 5,
    maxLength: 8
  })
  @IsString()
  @IsNotEmpty()
  @Length(5)
  referralCode: string;
}
