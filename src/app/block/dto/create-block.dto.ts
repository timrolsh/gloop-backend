import { IsInt, IsString, IsBoolean, Length } from "class-validator";

export class CreateBlockDto {
    @IsInt()
    blockNumber: number;

    @IsString()
    @Length(1, 64)
    blockHash: string;

    @IsBoolean()
    isAnyTransaction: boolean;

    @IsBoolean()
    isMissed: boolean;

    constructor(blockNumber: number, blockHash: string, isAnyTransaction: boolean = false, isMissed: boolean = false) {
        this.blockNumber = blockNumber;
        this.blockHash = blockHash;
        this.isAnyTransaction = isAnyTransaction;
        this.isMissed = isMissed;
    }
}
