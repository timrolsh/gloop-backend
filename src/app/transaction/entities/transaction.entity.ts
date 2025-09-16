import {BaseCustomEntity} from "../../../common/entities/base-custom.entity";
import {Entity, Column, ManyToOne, JoinColumn} from "typeorm";
import {ExistsEvent} from "../enum/exists-event.enum";
import {Wallet} from "../../wallet/entities/wallet.entity";

@Entity("transactions")
export class Transaction extends BaseCustomEntity {
  @Column()
  walletId: string;

  @Column({type: "decimal", precision: 30, scale: 18})
  amount: number;

  @Column()
  tokenName: string;

  @Column()
  asset: string;

  @Column({
    type: "enum",
    enum: ExistsEvent
  })
  event: ExistsEvent;

  @Column({unique: true})
  transactionHash: string;

  @Column({type: "timestamp", nullable: true})
  blockTimestamp: Date;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions)
  @JoinColumn({name: "walletId"})
  wallet: Wallet;

  /**
   * Get the actual timestamp when this transaction occurred on the blockchain
   * Falls back to createdAt if blockTimestamp is not available (for legacy data)
   */
  getActualTimestamp(): Date {
    return this.blockTimestamp || this.createdAt;
  }
}
