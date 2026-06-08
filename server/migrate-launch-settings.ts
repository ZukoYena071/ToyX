import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });

async function main() {
  const { db } = await import("./db");
  const { sql } = await import("drizzle-orm");

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS launch_settings (
      id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      launch_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '30 days',
      families_target INTEGER NOT NULL DEFAULT 100,
      listings_target INTEGER NOT NULL DEFAULT 500,
      beta_target INTEGER NOT NULL DEFAULT 50,
      beta_threshold INTEGER NOT NULL DEFAULT 4,
      live_threshold INTEGER NOT NULL DEFAULT 7,
      updated_by VARCHAR NOT NULL DEFAULT 'system',
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  // Insert default row if not exists
  await db.execute(sql`
    INSERT INTO launch_settings (id, launch_date, updated_by)
    VALUES (1, NOW() + INTERVAL '30 days', 'migration')
    ON CONFLICT (id) DO NOTHING
  `);
  console.log("[migrate-launch-settings] Table created with default row.");
}

main().catch(console.error);
