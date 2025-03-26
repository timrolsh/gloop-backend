import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHealthFactorToWallet1734598398569 implements MigrationInterface {
    name = 'AddHealthFactorToWallet1734598398569'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallets" ADD "healthFactor" numeric(18,8) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "healthFactor"`);
    }

}
