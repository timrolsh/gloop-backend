import {MigrationInterface, QueryRunner} from "typeorm";

export class AddReferredByToWallets1727770559692 implements MigrationInterface {
  name = "AddReferredByToWallets1727770559692";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "wallets" ADD "referredBy" character varying`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "referredBy"`);
  }
}
