import {ApiProperty} from "@nestjs/swagger";

export class GreetingResponseDto {
  @ApiProperty({
    description: "The greeting message returned by the system",
    example: "Welcome to the Gloop."
  })
  message: string;

  @ApiProperty({
    description: "A cryptographic nonce used for signature verification",
    example: "0x1234567890abcdef"
  })
  nonce: string;

  constructor(message: string, nonce: string) {
    this.message = message;
    this.nonce = nonce;
  }
}
