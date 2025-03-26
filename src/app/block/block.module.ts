import { Module } from "@nestjs/common";
import { BlockService } from "./block.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Block } from "./entities/block.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Block])],
    providers: [BlockService],
    exports: [BlockService],
})
export class BlockModule {}
