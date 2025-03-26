import { IsNotEmpty, IsString, Length } from "class-validator";

export class CreateWalletDto {
    @IsNotEmpty()
    @IsString()
    @Length(1, 200)
    address: string;

    constructor(address: string) {
        this.address = address;
    }
}
