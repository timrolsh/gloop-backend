import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeAmountInTransactions1733054453993 implements MigrationInterface {
    name = 'ChangeAmountInTransactions1733054453993'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "amount" TYPE numeric(30,18)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "amount" TYPE numeric`);
    }

}
