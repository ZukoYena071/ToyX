import "dotenv/config";
import { db } from "./db";

async function migrate() {
  console.log("Running provider-tracking migration...");

  await db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS has_password boolean DEFAULT false");
  console.log("  - has_password: OK");

  await db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS google_connected boolean DEFAULT false");
  console.log("  - google_connected: OK");

  await db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS facebook_connected boolean DEFAULT false");
  console.log("  - facebook_connected: OK");

  // Now set flags for existing users based on their id prefix
  const googleResult = await db.execute("UPDATE users SET google_connected = true WHERE id LIKE 'google_%' AND google_connected = false");
  console.log(`  - google_connected set for existing Google users`);

  const facebookResult = await db.execute("UPDATE users SET facebook_connected = true WHERE id LIKE 'facebook_%' AND facebook_connected = false");
  console.log(`  - facebook_connected set for existing Facebook users`);

  const passwordResult = await db.execute("UPDATE users SET has_password = true WHERE id LIKE 'user-%' AND has_password = false");
  console.log(`  - has_password set for existing password users`);

  console.log("Migration complete.");
}

migrate().catch((e) => {
  console.error("Migration failed:", e.message);
  process.exit(1);
});
