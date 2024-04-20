import dotenv from "dotenv";
import fs from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { DataSource } from "typeorm";
import { Device } from "./models/device";
import { GPSPosition } from "./models/position";
import { User } from "./models/user";

dotenv.config({ debug: false });

const { parsed } = dotenv.config({ path: "../.env" });
for (const key in parsed) process.env[key] = parsed[key];

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
  logging: true,
  entities: [User, Device, GPSPosition],
  subscribers: [],
  // migrations: [],
  migrationsTableName: "migrations",
  // entities: [`${__dirname}/models/*.ts`],
  migrations: [`${__dirname}/migrations/*.ts`],
});
