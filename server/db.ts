import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("sslmode=require") || (process.env.NODE_ENV !== "development" && process.env.NODE_ENV !== undefined)
    ? { rejectUnauthorized: false }
    : false,
});
pool.on('connect', (client) => {
  client.query("SET TIMEZONE TO 'UTC'");
});
export const db = drizzle({ client: pool, schema });