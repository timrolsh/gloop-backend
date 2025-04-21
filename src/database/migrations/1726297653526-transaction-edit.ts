import {MigrationInterface, QueryRunner} from "typeorm";

export class TransactionEdit1726297653526 implements MigrationInterface {
  name = "TransactionEdit1726297653526";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD "tokenName" character varying NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "transactions" ADD "asset" character varying NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "asset"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "tokenName"`);
  }
}
