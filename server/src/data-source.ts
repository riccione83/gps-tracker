import { DataSource } from "typeorm";
import { User } from "./models/user";
import { Device } from "./models/device";
import { GPSPosition } from "./models/position";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config({ debug: false });

export const AppDataSource = new DataSource({
  type: "postgres",
  host: !process.env.DB_URL ? process.env.DB_HOST : undefined, //"localhost",
  url: process.env.DB_URL,
  ssl: process.env.DB_URL
    ? {
        ca: fs.readFileSync(__dirname + "/ca.crt").toString(),
        rejectUnauthorized: false,
      }
    : undefined,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  synchronize: true,
  logging: false,
  entities: [User, Device, GPSPosition],
  subscribers: [],
  migrations: [],
  migrationsTableName: "migrations",
});
