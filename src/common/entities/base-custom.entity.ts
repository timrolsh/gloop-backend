import {PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity} from "typeorm";

export abstract class BaseCustomEntity extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @CreateDateColumn({type: "timestamp"})
  createdAt: Date;

  @UpdateDateColumn({type: "timestamp"})
  updatedAt: Date;
}
