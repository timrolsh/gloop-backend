import {MigrationInterface, QueryRunner} from "typeorm";

export class AddBlock1727677764498 implements MigrationInterface {
  name = "AddBlock1727677764498";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "blocks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "blockNumber" integer NOT NULL, "blockHash" character varying(100) NOT NULL, "isAnyTransaction" boolean NOT NULL DEFAULT false, "isMissed" boolean NOT NULL DEFAULT false, "checkedTillHere" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_8244fa1495c4e9222a01059244b" PRIMARY KEY ("id"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "blocks"`);
  }
}
