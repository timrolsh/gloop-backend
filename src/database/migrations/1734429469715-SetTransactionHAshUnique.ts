import { MigrationInterface, QueryRunner } from "typeorm";

export class SetTransactionHAshUnique1734429469715 implements MigrationInterface {
    name = 'SetTransactionHAshUnique1734429469715'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "UQ_361ad2cfa130373a31d8c9cc672" UNIQUE ("transactionHash")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "UQ_361ad2cfa130373a31d8c9cc672"`);
    }

}
