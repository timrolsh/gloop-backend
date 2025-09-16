import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStakingEvents1757563925220 implements MigrationInterface {
    name = 'AddStakingEvents1757563925220'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create staking events table
        await queryRunner.query(`CREATE TYPE "public"."staking_events_eventtype_enum" AS ENUM('STAKE', 'UNSTAKE')`);
        await queryRunner.query(`CREATE TABLE "staking_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "walletId" uuid NOT NULL, "eventType" "public"."staking_events_eventtype_enum" NOT NULL, "gloopAmount" numeric(30,18) NOT NULL, "lockDurationSeconds" numeric NOT NULL DEFAULT '0', "boostedPointsEarned" numeric NOT NULL DEFAULT '0', "basePointsAtStake" numeric NOT NULL DEFAULT '0', "basePointsAtUnstake" numeric NOT NULL DEFAULT '0', "usdcLendingBalanceAtEvent" numeric NOT NULL DEFAULT '0', "usdcBorrowingBalanceAtEvent" numeric NOT NULL DEFAULT '0', "stakingBoostMultiplier" numeric NOT NULL DEFAULT '1', "gloopPriceUSD" numeric NOT NULL DEFAULT '0', "transactionHash" character varying NOT NULL, "blockNumber" integer NOT NULL, CONSTRAINT "UQ_28a642dbd3e0c567d1d042edf99" UNIQUE ("transactionHash"), CONSTRAINT "PK_3bbbf4cf97430c2695c4b6095a5" PRIMARY KEY ("id"))`);
        
        // Add foreign key constraint
        await queryRunner.query(`ALTER TABLE "staking_events" ADD CONSTRAINT "FK_d7d583e42149a1f0c86d6963150" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove foreign key constraint and drop staking events table
        await queryRunner.query(`ALTER TABLE "staking_events" DROP CONSTRAINT "FK_d7d583e42149a1f0c86d6963150"`);
        await queryRunner.query(`DROP TABLE "staking_events"`);
        await queryRunner.query(`DROP TYPE "public"."staking_events_eventtype_enum"`);
    }

}
