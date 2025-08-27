import {MigrationInterface, QueryRunner} from "typeorm";

export class AddStakingBoostToWallet1731230311549 implements MigrationInterface {
  name = "AddStakingBoostToWallet1731230311549";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD "stakingBoost" numeric(18,2) NOT NULL DEFAULT '0'`
    );
    await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "lendingUSDCPoints" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "wallets" ALTER COLUMN "lendingUSDCPoints" SET DEFAULT '0'`
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ALTER COLUMN "borrowingUSDCPoints" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ALTER COLUMN "borrowingUSDCPoints" SET DEFAULT '0'`
    );
    await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "totalEarnedPoints" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "wallets" ALTER COLUMN "totalEarnedPoints" SET DEFAULT '0'`
    );
    await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "claimedPoints" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "claimedPoints" SET DEFAULT '0'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "claimedPoints" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "claimedPoints" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "totalEarnedPoints" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "totalEarnedPoints" DROP NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "wallets" ALTER COLUMN "borrowingUSDCPoints" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ALTER COLUMN "borrowingUSDCPoints" DROP NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "lendingUSDCPoints" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "lendingUSDCPoints" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "stakingBoost"`);
  }
}
