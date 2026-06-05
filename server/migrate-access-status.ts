/**
 * Migration: Add access_status column to users table.
 * Existing users → 'live' (no lockout).
 * Admins → 'live' (already covered by blanket update).
 * Future signups → default 'waitlist' (schema default).
 *
 * Usage: npm run db:migrate:access-status
 */
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });

async function main() {
  const { db } = await import("./db");
  const { sql } = await import("drizzle-orm");

  console.log("[migrate-access-status] Adding column...");
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS access_status TEXT NOT NULL DEFAULT 'waitlist'`);

  console.log("[migrate-access-status] Setting existing users to 'live'...");
  await db.execute(sql`UPDATE users SET access_status = 'live' WHERE access_status = 'waitlist'`);

  console.log("[migrate-access-status] Complete.");
}

main().catch(console.error);
