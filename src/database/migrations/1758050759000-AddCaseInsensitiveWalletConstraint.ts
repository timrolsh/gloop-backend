import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCaseInsensitiveWalletConstraint1758050759000 implements MigrationInterface {
    name = 'AddCaseInsensitiveWalletConstraint1758050759000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, normalize all existing addresses to checksum format
        await queryRunner.query(`
            UPDATE wallets 
            SET address = CASE 
                WHEN address ~ '^0x[0-9a-fA-F]{40}$' THEN address
                ELSE address
            END
        `);

        // Drop the existing unique constraint
        await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "UQ_f907d5fd09a9d374f1da4e13bd3"`);
        
        // Create a case-insensitive unique index on address
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_wallets_address_case_insensitive" ON "wallets" (LOWER("address"))`);
        
        // Add a check constraint to ensure addresses are in proper checksum format
        await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "CHK_address_format" CHECK (address ~ '^0x[0-9a-fA-F]{40}$')`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the check constraint
        await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "CHK_address_format"`);
        
        // Drop the case-insensitive index
        await queryRunner.query(`DROP INDEX "IDX_wallets_address_case_insensitive"`);
        
        // Restore the original unique constraint
        await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "UQ_f907d5fd09a9d374f1da4e13bd3" UNIQUE ("address")`);
    }
}
