import "dotenv/config";
import { db } from "./db";
import { users, toys, exchanges, messages, favorites, reviews, userRewards, rewardLedger, rewardRedemptions, referrals, toyInteractions } from "@shared/schema";
import { inArray, or, eq } from "drizzle-orm";

async function seedTest() {
  console.log("Seeding test users…");

  const testUsers = [
    { id: "seed_user_1", email: "seed1@toyx.test", firstName: "Test", lastName: "One", plan: "free", subscriptionStatus: "inactive" },
    { id: "seed_user_2", email: "seed2@toyx.test", firstName: "Test", lastName: "Two", plan: "free", subscriptionStatus: "inactive" },
    { id: "seed_user_3", email: "seed3@toyx.test", firstName: "Test", lastName: "Three", plan: "free", subscriptionStatus: "inactive" },
  ];

  const ids = testUsers.map(u => u.id);

  // Clean up in FK-safe order
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
  await db.delete(referrals).where(inArray(referrals.referrerId, ids));
  await db.delete(userRewards).where(inArray(userRewards.userId, ids));
  await db.delete(favorites).where(inArray(favorites.userId, ids));
  await db.delete(users).where(inArray(users.id, ids));

  for (const u of testUsers) {
    await db.insert(users).values({ ...u, createdAt: new Date(), updatedAt: new Date() });
  }

  console.log(`Test seed complete: ${testUsers.length} users`);
}

seedTest().catch(e => { console.error(e); process.exit(1); });
