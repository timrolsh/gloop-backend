import { BaseCustomEntity } from "../../../common/entities/base-custom.entity";
import { Entity, Column } from "typeorm";

@Entity("blocks")
export class Block extends BaseCustomEntity {
    @Column({ type: "int" })
    blockNumber: number;

    @Column({ type: "varchar", length: 100 })
    blockHash: string;

    @Column({ type: "boolean", default: false })
    isAnyTransaction: boolean;

    @Column({ type: "boolean", default: false })
    isMissed: boolean;

    @Column({ type: "boolean", default: false })
    checkedTillHere: boolean;

    constructor(blockNumber: number, blockHash: string, isAnyTransaction: boolean = false, isMissed: boolean = false) {
        super();
        this.blockNumber = blockNumber;
        this.blockHash = blockHash;
        this.isAnyTransaction = isAnyTransaction;
        this.isMissed = isMissed;
    }
}
