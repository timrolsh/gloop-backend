import {MigrationInterface, QueryRunner} from "typeorm";

export class AddusdcDebtToWallet1736149588835 implements MigrationInterface {
  name = "AddusdcDebtToWallet1736149588835";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD "usdcDebt" numeric(18,2) NOT NULL DEFAULT '0'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "usdcDebt"`);
  }
}
