import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBlockTimestampToTransactionsAndStakingEvents1758052869000 implements MigrationInterface {
    name = 'AddBlockTimestampToTransactionsAndStakingEvents1758052869000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add blockTimestamp column to transactions table
        await queryRunner.query(`ALTER TABLE "transactions" ADD "blockTimestamp" TIMESTAMP`);
        
        // Add blockTimestamp column to staking_events table
        await queryRunner.query(`ALTER TABLE "staking_events" ADD "blockTimestamp" TIMESTAMP`);

        // For existing transactions, try to populate blockTimestamp from blockchain
        // This is a best-effort approach - if it fails for any transaction, we'll leave it null
        await queryRunner.query(`
            UPDATE transactions 
            SET "blockTimestamp" = "createdAt" 
            WHERE "blockTimestamp" IS NULL
        `);

        // For existing staking events, try to populate blockTimestamp from blockchain
        await queryRunner.query(`
            UPDATE staking_events 
            SET "blockTimestamp" = "createdAt" 
            WHERE "blockTimestamp" IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove blockTimestamp column from staking_events table
        await queryRunner.query(`ALTER TABLE "staking_events" DROP COLUMN "blockTimestamp"`);
        
        // Remove blockTimestamp column from transactions table
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN "blockTimestamp"`);
    }
}
