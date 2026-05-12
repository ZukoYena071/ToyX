import { db } from "./db";
import { userRewards, rewardLedger, rewardRedemptions, referrals, users, toys } from "@shared/schema";
import { eq, and, sql, gte, inArray, desc } from "drizzle-orm";

const BASE_FREE_LISTINGS = 5;
const BASE_FREE_REQUESTS = 3;
const BASE_FREE_EXCHANGES = 2;

export async function ensureUserRewards(userId: string) {
  const existing = await db.select().from(userRewards).where(eq(userRewards.userId, userId)).limit(1);
  if (existing.length === 0) {
    await db.insert(userRewards).values({ userId, pointsBalance: 0, pointsLifetime: 0, badges: [] });
  }
}

export async function awardPoints(opts: {
  userId: string;
  eventType: string;
  referenceType: string;
  referenceId: string;
  points: number;
  meta?: any;
}): Promise<{ awarded: boolean }> {
  await ensureUserRewards(opts.userId);
  try {
    await db.insert(rewardLedger).values({
      userId: opts.userId,
      eventType: opts.eventType,
      points: opts.points,
      referenceType: opts.referenceType,
      referenceId: opts.referenceId,
      meta: opts.meta || null,
    });
    await db.update(userRewards)
      .set({
        pointsBalance: sql`${userRewards.pointsBalance} + ${opts.points}`,
        pointsLifetime: sql`${userRewards.pointsLifetime} + ${opts.points}`,
        updatedAt: new Date(),
      })
      .where(eq(userRewards.userId, opts.userId));
    return { awarded: true };
  } catch (e: any) {
    if (e.code === "23505") return { awarded: false };
    throw e;
  }
}

export async function spendPoints(opts: {
  userId: string;
  rewardType: string;
  costPoints: number;
  meta?: any;
  expiresAt?: Date;
}): Promise<{ ok: boolean; balance: number }> {
  await ensureUserRewards(opts.userId);
  const reward = await db.select().from(userRewards).where(eq(userRewards.userId, opts.userId)).limit(1);
  if (!reward.length || reward[0].pointsBalance < opts.costPoints) {
    return { ok: false, balance: reward[0]?.pointsBalance || 0 };
  }
  const refId = `${opts.rewardType}_${Date.now()}`;
  await db.insert(rewardLedger).values({
    userId: opts.userId,
    eventType: "REDEEM",
    points: -opts.costPoints,
    referenceType: "redeem",
    referenceId: refId,
    meta: { rewardType: opts.rewardType, ...opts.meta },
  });
  await db.update(userRewards)
    .set({
      pointsBalance: sql`${userRewards.pointsBalance} - ${opts.costPoints}`,
      updatedAt: new Date(),
    })
    .where(eq(userRewards.userId, opts.userId));
  await db.insert(rewardRedemptions).values({
    userId: opts.userId,
    rewardType: opts.rewardType,
    costPoints: opts.costPoints,
    meta: opts.meta || null,
    expiresAt: opts.expiresAt || null,
  });
  const updated = await db.select().from(userRewards).where(eq(userRewards.userId, opts.userId)).limit(1);
  return { ok: true, balance: updated[0]?.pointsBalance || 0 };
}

export async function computeEntitlements(userId: string) {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length) {
    return { isPremium: false, hasPremiumPass: false, maxActiveListings: BASE_FREE_LISTINGS, maxMonthlyRequests: BASE_FREE_REQUESTS, maxActiveOutgoingExchanges: BASE_FREE_EXCHANGES };
  }
  const u = user[0];
  const now = new Date();
  const isPaystackPremium = u.plan?.startsWith("premium_") && u.subscriptionStatus === "active" && (!u.currentPeriodEnd || u.currentPeriodEnd > now);
  const hasPremiumPass = !!u.premiumPassUntil && u.premiumPassUntil > now;
  const isPremium = isPaystackPremium || hasPremiumPass;

  // Active boosts from redemptions
  const activeBoosts = await db.select().from(rewardRedemptions).where(
    and(eq(rewardRedemptions.userId, userId), gte(rewardRedemptions.expiresAt || now, now))
  );
  let extraListings = 0;
  let extraRequests = 0;
  for (const b of activeBoosts) {
    if (b.rewardType === "ADD_LISTINGS_5_30D") extraListings += 5;
    if (b.rewardType === "ADD_REQUESTS_5_30D") extraRequests += 5;
  }

  return {
    isPremium,
    hasPremiumPass,
    maxActiveListings: isPremium ? 9999 : BASE_FREE_LISTINGS + extraListings,
    maxMonthlyRequests: isPremium ? 9999 : BASE_FREE_REQUESTS + extraRequests,
    maxActiveOutgoingExchanges: isPremium ? 9999 : BASE_FREE_EXCHANGES,
  };
}

export async function getRewardsProfile(userId: string) {
  await ensureUserRewards(userId);
  const reward = await db.select().from(userRewards).where(eq(userRewards.userId, userId)).limit(1);
  const ledger = await db.select().from(rewardLedger).where(eq(rewardLedger.userId, userId)).orderBy(desc(rewardLedger.createdAt)).limit(20);
  const entitlements = await computeEntitlements(userId);
  const redemptions = await db.select().from(rewardRedemptions).where(eq(rewardRedemptions.userId, userId)).orderBy(desc(rewardRedemptions.createdAt)).limit(10);
  return {
    pointsBalance: reward[0]?.pointsBalance || 0,
    pointsLifetime: reward[0]?.pointsLifetime || 0,
    badges: reward[0]?.badges || [],
    lastPremiumRedeemAt: reward[0]?.lastPremiumRedeemAt || null,
    recentLedger: ledger,
    recentRedemptions: redemptions,
    entitlements,
  };
}

export async function checkDailyCap(userId: string, eventType: string, maxPerDay: number): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [result] = await db.select({ count: sql<number>`count(*)` }).from(rewardLedger).where(
    and(eq(rewardLedger.userId, userId), eq(rewardLedger.eventType, eventType), gte(rewardLedger.createdAt, today))
  );
  return (result?.count || 0) < maxPerDay;
}

export async function qualifyReferral(refereeId: string) {
  const refs = await db.select().from(referrals).where(
    and(eq(referrals.refereeId, refereeId), eq(referrals.status, "pending"))
  ).limit(1);
  if (!refs.length) return;
  const ref = refs[0];
  await db.update(referrals).set({ status: "qualified", qualifiedAt: new Date() }).where(eq(referrals.id, ref.id));
  // Award referrer
  await awardPoints({ userId: ref.referrerId, eventType: "REFERRAL_QUALIFIED", referenceType: "referral", referenceId: `ref_${ref.id}_referrer`, points: 200, meta: { refereeId } });
  const referrer = await db.select().from(users).where(eq(users.id, ref.referrerId)).limit(1);
  if (referrer.length) {
    const existingPass = referrer[0].premiumPassUntil || new Date();
    const newPass = new Date(Math.max(existingPass.getTime(), Date.now()) + 7 * 24 * 60 * 60 * 1000);
    await db.update(users).set({ premiumPassUntil: newPass }).where(eq(users.id, ref.referrerId));
  }
  // Award referee
  await awardPoints({ userId: refereeId, eventType: "REFERRAL_QUALIFIED_REFEREE", referenceType: "referral", referenceId: `ref_${ref.id}_referee`, points: 100, meta: { referrerId: ref.referrerId } });
  const referee = await db.select().from(users).where(eq(users.id, refereeId)).limit(1);
  if (referee.length) {
    const existingPass = referee[0].premiumPassUntil || new Date();
    const newPass = new Date(Math.max(existingPass.getTime(), Date.now()) + 7 * 24 * 60 * 60 * 1000);
    await db.update(users).set({ premiumPassUntil: newPass }).where(eq(users.id, refereeId));
  }
}
