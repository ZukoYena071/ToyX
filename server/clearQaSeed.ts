import "dotenv/config";
import { db } from "./db";
import { users, toys, exchanges, messages, favorites, reviews, userRewards, rewardLedger, rewardRedemptions, referrals, toyInteractions } from "@shared/schema";
import { inArray, or, like } from "drizzle-orm";

async function clearQaSeed() {
  const seedUsers = await db.select({ id: users.id }).from(users).where(
    or(like(users.id, "seed_%"), like(users.email, "%@toyx.test%"))
  );
  const ids = seedUsers.map(u => u.id);

  if (ids.length === 0) {
    console.log("No QA seed users found.");
    return;
  }

  const existingToys = await db.select({ id: toys.id }).from(toys).where(inArray(toys.ownerId, ids));
  const toyIds = existingToys.map(t => t.id);

  if (toyIds.length > 0) {
    const existingExchanges = await db.select({ id: exchanges.id }).from(exchanges).where(
      or(inArray(exchanges.toyId, toyIds), inArray(exchanges.requesterId, ids), inArray(exchanges.ownerId, ids))
    );
    const exchangeIds = existingExchanges.map(e => e.id);

    if (exchangeIds.length > 0) {
      await db.delete(messages).where(inArray(messages.exchangeId, exchangeIds));
      await db.delete(reviews).where(inArray(reviews.exchangeId, exchangeIds));
      await db.delete(exchanges).where(inArray(exchanges.id, exchangeIds));
    }

    await db.delete(toyInteractions).where(or(inArray(toyInteractions.toyId, toyIds), inArray(toyInteractions.userId, ids)));
    await db.delete(favorites).where(inArray(favorites.toyId, toyIds));
    await db.delete(toys).where(inArray(toys.id, toyIds));
  } else {
    await db.delete(toyInteractions).where(inArray(toyInteractions.userId, ids));
  }

  await db.delete(rewardRedemptions).where(inArray(rewardRedemptions.userId, ids));
  await db.delete(rewardLedger).where(inArray(rewardLedger.userId, ids));
  await db.delete(referrals).where(or(inArray(referrals.referrerId, ids), inArray(referrals.refereeId, ids)));
  await db.delete(userRewards).where(inArray(userRewards.userId, ids));
  await db.delete(favorites).where(inArray(favorites.userId, ids));
  await db.delete(users).where(inArray(users.id, ids));

  console.log(`QA seed data cleared. Removed users: ${ids.join(", ")}`);
}

clearQaSeed().catch(e => { console.error(e); process.exit(1); });
