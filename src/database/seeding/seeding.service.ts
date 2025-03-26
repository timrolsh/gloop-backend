import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";

@Injectable()
export class SeedingService {
    private readonly logger = new Logger(SeedingService.name);

    constructor(private readonly dataSource: DataSource) {}

    async seed() {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            await queryRunner.commitTransaction();
            this.logger.log("Seeding completed successfully.");
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error("Error during seeding, transaction rolled back.", error.stack);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}
