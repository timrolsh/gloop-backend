import { config } from "dotenv";
import { DataSource, DataSourceOptions } from "typeorm";
import * as path from "path";
import * as fs from "fs";
import { TlsOptions } from "tls";

const envFilePath = `${process.env.NODE_ENV || ""}.env`;
config({ path: envFilePath });

const dataSourceOptions: DataSourceOptions = {
    type: "postgres",
    url: process.env.DATABASE_URL,

    entities: [path.join(__dirname, "../**/**/**/**/entities/", "*.entity.{ts,js}")],
    migrations: [path.join(__dirname, "./migrations", "*.{ts,js}")],
    migrationsTableName: "typeorm_migrations",
    synchronize: false,
    logging: false,
};

export default new DataSource(dataSourceOptions);
