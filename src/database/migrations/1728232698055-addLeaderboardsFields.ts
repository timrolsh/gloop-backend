import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLeaderboardsFields1728232698055 implements MigrationInterface {
    name = 'AddLeaderboardsFields1728232698055'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallets" ADD "lastUpdateTime" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD "lendingUSDCPoints" numeric`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD "borrowingUSDCPoints" numeric`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD "totalEarnedPoints" numeric`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD "claimedPoints" numeric`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "claimedPoints"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "totalEarnedPoints"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "borrowingUSDCPoints"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "lendingUSDCPoints"`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "lastUpdateTime"`);
    }

}
