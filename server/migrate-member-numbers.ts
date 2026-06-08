import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });

async function main() {
  const { db } = await import("./db");
  const { sql } = await import("drizzle-orm");

  // Step 1: Create sequence starting at current max + 1 (or 1 if table is empty)
  await db.execute(sql`
    DO $$
    DECLARE
      max_num INTEGER;
    BEGIN
      SELECT COALESCE(MAX(member_number), 0) INTO max_num FROM founding_members;
      EXECUTE 'CREATE SEQUENCE IF NOT EXISTS founding_member_number_seq START WITH ' || (max_num + 1);
    END $$;
  `);

  // Step 2: Backfill existing NULL member_number rows using the sequence
  await db.execute(sql`
    WITH numbered AS (
      SELECT id, nextval('founding_member_number_seq') AS num
      FROM founding_members WHERE member_number IS NULL
      ORDER BY joined_at ASC
    )
    UPDATE founding_members SET member_number = numbered.num
    FROM numbered WHERE founding_members.id = numbered.id
  `);

  // Step 3: Set column default to auto-assign from sequence for future inserts
  await db.execute(sql`ALTER TABLE founding_members ALTER COLUMN member_number SET DEFAULT nextval('founding_member_number_seq')`);

  const r = await db.execute(sql`SELECT count(*) as total, count(member_number) as numbered FROM founding_members`);
  console.log("[migrate-member-numbers] Complete:", (r as any).rows?.[0] || r);
}

main().catch(console.error);
