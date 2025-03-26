import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { SeedingModule } from "./seeding/seeding.module";
import * as path from "path";
import * as fs from "fs";
import { TlsOptions } from "tls";

@Module({
    imports: [
        SeedingModule,
        ConfigModule,
        TypeOrmModule.forRootAsync({
            useFactory: (conf: ConfigService): TypeOrmModuleOptions => {
                return {
                    type: "postgres",
                    url: conf.get("DATABASE_URL"),
                    entities: ["**/*.entity.js"],
                    synchronize: false,
                };
            },
            inject: [ConfigService],
        }),
        SeedingModule,
    ],
    exports: [TypeOrmModule],
})
export class DatabaseModule {}
