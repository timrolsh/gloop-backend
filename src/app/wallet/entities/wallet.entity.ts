import {Entity, Column, OneToMany} from "typeorm";
import {BaseCustomEntity} from "../../../common/entities/base-custom.entity";
import {Transaction} from "../../transaction/entities/transaction.entity";

@Entity("wallets")
export class Wallet extends BaseCustomEntity {
  @Column({type: "varchar", length: 200, unique: true})
  address: string;

  @OneToMany(() => Transaction, (transaction) => transaction.wallet)
  transactions: Transaction[];

  @Column({type: "timestamp", nullable: true})
  lastUpdateTime: Date;

  @Column({type: "numeric", default: 0.0})
  lendingUSDCPoints: number;

  @Column({type: "numeric", default: 0.0})
  borrowingUSDCPoints: number;

  @Column({type: "numeric", default: 0.0})
  totalEarnedPoints: number;

  @Column({type: "numeric", default: 0.0})
  claimedPoints: number;

  @Column({type: "numeric", precision: 18, scale: 2, default: 0.0})
  stakingBoost: number;

  @Column({type: "decimal", precision: 18, scale: 0, default: 0})
  healthFactor: number;

  @Column({type: "varchar", length: 20, default: "0.0"})
  usdcDebt: string;

  // Snapshot fields for tracking boosted points over time
  @Column({type: "numeric", default: 0.0})
  accumulatedBoostedPoints: number;

  @Column({type: "timestamp", nullable: true})
  lastStakingChangeTime: Date;

  @Column({type: "numeric", default: 0.0})
  basePointsAtLastSnapshot: number;

  @Column({type: "boolean", default: false})
  isCurrentlyStaking: boolean;

  @Column({type: "numeric", default: 0.0})
  currentStakingBoostMultiplier: number;
}
