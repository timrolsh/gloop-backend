import {Module} from "@nestjs/common";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {TypeOrmModule, TypeOrmModuleOptions} from "@nestjs/typeorm";
import {SeedingModule} from "./seeding/seeding.module";

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
          ssl: process.env.DATABASE_SSL === 'true' ? {rejectUnauthorized: false} : false,
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
