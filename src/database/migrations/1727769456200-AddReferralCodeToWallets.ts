import {MigrationInterface, QueryRunner} from "typeorm";
import {v4 as uuidv4} from "uuid";

export class AddReferralCodeToWallets1727769456200 implements MigrationInterface {
  name = "AddReferralCodeToWallets1727769456200";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "wallets" ADD "referralCode" character varying(5)`);

    const existingWallets = await queryRunner.query(`SELECT id FROM "wallets"`);

    for (const wallet of existingWallets) {
      let referralCode;
      let isUnique = false;

      do {
        referralCode = uuidv4().slice(0, 5);
        const existingCode = await queryRunner.query(
          `SELECT id FROM "wallets" WHERE "referralCode" = $1`,
          [referralCode]
        );
        if (existingCode.length === 0) {
          isUnique = true;
        }
      } while (!isUnique);

      await queryRunner.query(`UPDATE "wallets" SET "referralCode" = $1 WHERE "id" = $2`, [
        referralCode,
        wallet.id
      ]);
    }

    await queryRunner.query(`ALTER TABLE "wallets" ALTER COLUMN "referralCode" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD CONSTRAINT "UQ_8625039ffb57cf4971c87f3e4dd" UNIQUE ("referralCode")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP CONSTRAINT "UQ_8625039ffb57cf4971c87f3e4dd"`
    );
    await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "referralCode"`);
  }
}
