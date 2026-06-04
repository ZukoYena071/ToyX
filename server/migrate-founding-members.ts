/**
 * Migration: Add member_number and signup_source to founding_members.
 * Backfill existing members with sequential member numbers ordered by joined_at.
 *
 * Usage: npm run db:migrate:founding
 */
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });

const { db } = await import("./db");
const { sql } = await import("drizzle-orm");

async function main() {
  console.log("[migrate-founding] Creating table if not exists...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS founding_members (
      id SERIAL PRIMARY KEY,
      first_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      city TEXT NOT NULL,
      phone TEXT,
      status TEXT NOT NULL DEFAULT 'WAITLIST',
      joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
      invited_at TIMESTAMP,
      activated_at TIMESTAMP,
      bonus_points_awarded BOOLEAN NOT NULL DEFAULT FALSE,
      badge_awarded BOOLEAN NOT NULL DEFAULT FALSE
    )
  `);
  await db.execute(sql`ALTER TABLE founding_members ADD COLUMN IF NOT EXISTS member_number INTEGER UNIQUE`);
  await db.execute(sql`ALTER TABLE founding_members ADD COLUMN IF NOT EXISTS signup_source TEXT DEFAULT 'unknown'`);
  console.log("[migrate-founding] Columns added. Backfilling member numbers...");

  await db.execute(sql`
    WITH numbered AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY joined_at ASC) AS rn
      FROM founding_members WHERE member_number IS NULL
    )
    UPDATE founding_members
    SET member_number = numbered.rn + COALESCE((SELECT MAX(member_number) FROM founding_members), 0)
    FROM numbered WHERE founding_members.id = numbered.id
  `);

  await db.execute(sql`UPDATE founding_members SET signup_source = 'unknown' WHERE signup_source IS NULL`);

  const r = await db.execute(sql`SELECT count(*) as total, (SELECT count(*) FROM founding_members WHERE member_number IS NOT NULL) as numbered FROM founding_members`);
  const row = r.rows?.[0] || r[0];
  console.log("[migrate-founding] Complete:", row);
}

main().catch(console.error);
