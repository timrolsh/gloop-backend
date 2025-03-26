import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveReferrerFromWallet1735647810259 implements MigrationInterface {
    name = 'RemoveReferrerFromWallet1735647810259'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "UQ_8625039ffb57cf4971c87f3e4dd"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "referralCode"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "referredBy"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallets" ADD "referredBy" character varying`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD "referralCode" character varying(5) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "UQ_8625039ffb57cf4971c87f3e4dd" UNIQUE ("referralCode")`);
    }

}
