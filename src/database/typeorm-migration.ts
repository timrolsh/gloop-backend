import {config} from "dotenv";
import {DataSource, DataSourceOptions} from "typeorm";
import * as path from "path";

const envFilePath = `${process.env.NODE_ENV || ""}.env`;
config({path: envFilePath});

const dataSourceOptions: DataSourceOptions = {
  type: "postgres",
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: process.env.DATABASE_SSL === "true" ? {rejectUnauthorized: false} : false,
  entities: [path.join(__dirname, "../**/**/**/**/entities/", "*.entity.{ts,js}")],
  migrations: [path.join(__dirname, "./migrations", "*.{ts,js}")],
  migrationsTableName: "typeorm_migrations",
  synchronize: false,
  logging: false
};

export default new DataSource(dataSourceOptions);
