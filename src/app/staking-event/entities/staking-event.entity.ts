import {Entity, Column, ManyToOne, JoinColumn} from "typeorm";
import {BaseCustomEntity} from "../../../common/entities/base-custom.entity";
import {Wallet} from "../../wallet/entities/wallet.entity";

export enum StakingEventType {
  STAKE = "STAKE",
  UNSTAKE = "UNSTAKE"
}

@Entity("staking_events")
export class StakingEvent extends BaseCustomEntity {
  @Column()
  walletId: string;

  @Column({
    type: "enum",
    enum: StakingEventType
  })
  eventType: StakingEventType;

  @Column({type: "decimal", precision: 30, scale: 18})
  gloopAmount: number;

  @Column({type: "numeric", default: 0})
  lockDurationSeconds: number;

  // Points earned during this staking window (calculated at unstake)
  @Column({type: "numeric", default: 0})
  boostedPointsEarned: number;

  // Base points at start of staking period
  @Column({type: "numeric", default: 0})
  basePointsAtStake: number;

  // Base points at end of staking period (at unstake)
  @Column({type: "numeric", default: 0})
  basePointsAtUnstake: number;

  // USDC lending balance when this event occurred
  @Column({type: "numeric", default: 0})
  usdcLendingBalanceAtEvent: number;

  // USDC borrowing balance when this event occurred  
  @Column({type: "numeric", default: 0})
  usdcBorrowingBalanceAtEvent: number;

  // Staking boost multiplier at time of event
  @Column({type: "numeric", default: 1})
  stakingBoostMultiplier: number;

  // GLOOP price in USD at time of event (for future implementation)
  @Column({type: "numeric", default: 0})
  gloopPriceUSD: number;

  @Column({unique: true})
  transactionHash: string;

  @Column()
  blockNumber: number;

  @Column({type: "timestamp", nullable: true})
  blockTimestamp: Date;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions)
  @JoinColumn({name: "walletId"})
  wallet: Wallet;

  /**
   * Get the actual timestamp when this staking event occurred on the blockchain
   * Falls back to createdAt if blockTimestamp is not available (for legacy data)
   */
  getActualTimestamp(): Date {
    return this.blockTimestamp || this.createdAt;
  }
}
