import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveScaleFromHealthFctor1734618308840 implements MigrationInterface {
    name = 'RemoveScaleFromHealthFctor1734618308840'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "healthFactor" TYPE numeric(18,0)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "healthFactor" TYPE numeric(18,8)`);
    }

}
