import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });

async function main() {
  const { db } = await import("./db");
  const { sql } = await import("drizzle-orm");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS founding_console_actions (
      id SERIAL PRIMARY KEY,
      admin_id VARCHAR NOT NULL REFERENCES users(id),
      action_type VARCHAR(32) NOT NULL,
      target_email VARCHAR,
      target_member_id INTEGER REFERENCES founding_members(id),
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log("[migrate-founding-console] Table created.");
}

main().catch(console.error);
