/**
 * One-time backfill: award Founding Member badges to existing founding members
 * whose badge_awarded is false but have a matching user account by email.
 *
 * Idempotent — safe to run multiple times.
 * Uses the existing awardFoundingMemberBadge() function which handles
 * duplicate prevention, badge structure, and badge_awarded update.
 *
 * Usage: npm run db:backfill:badges
 */
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env") });

async function main() {
  const { db } = await import("./db");
  const { sql } = await import("drizzle-orm");
  const { awardFoundingMemberBadge } = await import("./rewards");
  const { foundingMembers, users } = await import("@shared/schema");
  const { eq, and } = await import("drizzle-orm");

  // Find founding members who haven't been badged but have matching user accounts
  const rows = await db.select({
    fmEmail: foundingMembers.email,
    fmId: foundingMembers.id,
  }).from(foundingMembers)
    .innerJoin(users, eq(foundingMembers.email, users.email))
    .where(eq(foundingMembers.badgeAwarded, false));

  console.log(`[backfill] Found ${rows.length} founding members with matching accounts needing badges.`);

  let awarded = 0;
  let skipped = 0;
  for (const row of rows) {
    const userRows = await db.select({ id: users.id }).from(users).where(eq(users.email, row.fmEmail)).limit(1);
    if (!userRows.length) { skipped++; continue; }
    const ok = await awardFoundingMemberBadge(userRows[0].id);
    if (ok) awarded++; else skipped++;
  }

  console.log(`[backfill] Complete: ${awarded} badges awarded, ${skipped} skipped (already had badge or ineligible).`);
}

main().catch(console.error);
