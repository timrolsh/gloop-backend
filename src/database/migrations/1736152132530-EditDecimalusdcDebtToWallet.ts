import { MigrationInterface, QueryRunner } from "typeorm";

export class EditDecimalusdcDebtToWallet1736152132530 implements MigrationInterface {
    name = 'EditDecimalusdcDebtToWallet1736152132530'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "usdcDebt" TYPE numeric(18,6)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "usdcDebt" TYPE numeric(18,2)`);
    }

}
