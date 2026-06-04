/**
 * Migration: Add member_number and signup_source to founding_members.
 * Backfill existing members with sequential member numbers ordered by joined_at.
 *
 * Usage: NODE_ENV=development tsx server/migrate-founding-members.ts
 */
import { db } from "./db";
import { foundingMembers } from "@shared/schema";
import { sql } from "drizzle-orm";

async function main() {
  console.log("[migrate-founding] Adding columns...");

  await db.execute(sql`ALTER TABLE founding_members ADD COLUMN IF NOT EXISTS member_number INTEGER UNIQUE`);
  await db.execute(sql`ALTER TABLE founding_members ADD COLUMN IF NOT EXISTS signup_source TEXT DEFAULT 'unknown'`);

  console.log("[migrate-founding] Columns added. Backfilling member numbers...");

  // Assign sequential member numbers ordered by joined_at for rows that don't have one
  await db.execute(sql`
    WITH numbered AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY joined_at ASC) AS rn
      FROM founding_members
      WHERE member_number IS NULL
    )
    UPDATE founding_members
    SET member_number = numbered.rn + COALESCE((SELECT MAX(member_number) FROM founding_members), 0)
    FROM numbered
    WHERE founding_members.id = numbered.id
  `);

  // Update signup_source default for any nulls
  await db.execute(sql`UPDATE founding_members SET signup_source = 'unknown' WHERE signup_source IS NULL`);

  const [count] = await db.select({ total: sql<number>`count(*)` }).from(foundingMembers);
  const [withNumbers] = await db.select({ total: sql<number>`count(*)` }).from(foundingMembers).where(sql`member_number IS NOT NULL`);
  console.log(`[migrate-founding] Complete: ${count.total} total members, ${withNumbers.total} with member numbers.`);
}

main().catch(console.error);
