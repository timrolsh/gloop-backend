import {ApiProperty} from "@nestjs/swagger";

export class ReferralResponseDto {
  @ApiProperty({
    description: "The wallet address associated with the referral",
    example: "0x1234567890abcdef1234567890abcdef12345678"
  })
  walletAddress: string;

  constructor(walletAddress: string) {
    this.walletAddress = walletAddress;
  }
}
