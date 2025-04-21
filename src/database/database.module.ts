import {Module} from "@nestjs/common";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {TypeOrmModule, TypeOrmModuleOptions} from "@nestjs/typeorm";
import {SeedingModule} from "./seeding/seeding.module";
import * as path from "path";
import * as fs from "fs";
import {TlsOptions} from "tls";

@Module({
  imports: [
    SeedingModule,
    ConfigModule,
    TypeOrmModule.forRootAsync({
      useFactory: (conf: ConfigService): TypeOrmModuleOptions => {
        return {
          type: "postgres",
          host: conf.get("DATABASE_HOST"),
          port: conf.get("DATABASE_PORT"),
          username: conf.get("DATABASE_USER"),
          password: conf.get("DATABASE_PASSWORD"),
          database: conf.get("DATABASE_NAME"),
          ssl: {rejectUnauthorized: false},
          entities: ["**/*.entity.js"],
          synchronize: false
        };
      },
      inject: [ConfigService]
    }),
    SeedingModule
  ],
  exports: [TypeOrmModule]
})
export class DatabaseModule {}
