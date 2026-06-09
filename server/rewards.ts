import { db } from "./db";
import { userRewards, rewardLedger, rewardRedemptions, referrals, users, toys, foundingMembers, launchSettings } from "@shared/schema";
import { eq, and, sql, gte, lte, inArray, desc, gt, count, isNull } from "drizzle-orm";

const BASE_FREE_LISTINGS = 5;
const BASE_FREE_REQUESTS = 3;
const BASE_FREE_EXCHANGES = 2;
const MAX_BOOSTED_PER_USER = 2;

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
  const activeBoostedToys = await db.select({ id: toys.id, name: toys.name, boostedUntil: toys.boostedUntil })
    .from(toys).where(and(eq(toys.ownerId, userId), gt(toys.boostedUntil, new Date())));
  // Look up founding member info for badge display
  let foundingMember: { memberNumber: number | null; awardedAt: string | null } | null = null;
  const user = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  if (user.length && user[0].email) {
    const fm = await db.select({ memberNumber: foundingMembers.memberNumber, badgeAwarded: foundingMembers.badgeAwarded })
      .from(foundingMembers).where(eq(foundingMembers.email, user[0].email)).limit(1);
    if (fm.length) {
      const badgeData = (reward[0]?.badges as any[] || []).find((b: any) => b.type === "founding_member");
      foundingMember = { memberNumber: fm[0].memberNumber, awardedAt: badgeData?.awardedAt || null };
    }
  }

  return {
    pointsBalance: reward[0]?.pointsBalance || 0,
    pointsLifetime: reward[0]?.pointsLifetime || 0,
    badges: reward[0]?.badges || [],
    lastPremiumRedeemAt: reward[0]?.lastPremiumRedeemAt || null,
    recentLedger: ledger,
    recentRedemptions: redemptions,
    entitlements,
    activeBoostedToys,
    isPremium: entitlements.isPremium,
    foundingMember,
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

export async function checkMonthlyReferralCap(userId: string): Promise<boolean> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const [result] = await db.select({ count: sql<number>`count(*)` }).from(rewardLedger).where(
    and(eq(rewardLedger.userId, userId), eq(rewardLedger.eventType, "REFERRAL_QUALIFIED"), gte(rewardLedger.createdAt, startOfMonth))
  );
  return (result?.count || 0) < 5;
}

export async function countActiveBoosts(userId: string): Promise<number> {
  const now = new Date();
  const [result] = await db.select({ count: sql<number>`count(*)` }).from(toys)
    .where(and(eq(toys.ownerId, userId), gt(toys.boostedUntil, now)));
  return Number(result?.count || 0);
}

export async function redeemPointsBoost(toyId: number, userId: string, hours: number, costPoints: number): Promise<{ ok: boolean; message: string; code?: string }> {
  const toy = await db.select().from(toys).where(eq(toys.id, toyId)).limit(1);
  if (!toy.length) return { ok: false, message: "Toy not found" };
  if (toy[0].ownerId !== userId) return { ok: false, message: "Not your toy" };
  if (!toy[0].isAvailable) return { ok: false, code: "TOY_UNAVAILABLE", message: "This listing must be available to be boosted." };
  const activeCount = await countActiveBoosts(userId);
  if (activeCount >= 2) return { ok: false, message: "Maximum 2 boosted listings allowed" };
  const reward = await db.select().from(userRewards).where(eq(userRewards.userId, userId)).limit(1);
  if (!reward.length || reward[0].pointsBalance < costPoints) return { ok: false, message: "Insufficient points" };
  const now = new Date();
  const existingEnd = toy[0].boostedUntil && toy[0].boostedUntil > now ? toy[0].boostedUntil : now;
  const newEnd = new Date(Math.max(existingEnd.getTime(), now.getTime()) + hours * 60 * 60 * 1000);
  await db.update(toys).set({ boostedUntil: newEnd }).where(eq(toys.id, toyId));
  await spendPoints({ userId, rewardType: `BOOST_LISTING_LITE_48H`, costPoints, meta: { toyId, hours }, expiresAt: newEnd });
  return { ok: true, message: "Toy boosted!" };
}

export async function applyPaidBoost(toyId: number, userId: string, hours: number): Promise<{ ok: boolean; message: string; code?: string }> {
  const toy = await db.select().from(toys).where(eq(toys.id, toyId)).limit(1);
  if (!toy.length) return { ok: false, message: "Toy not found" };
  if (toy[0].ownerId !== userId) return { ok: false, message: "Not your toy" };
  if (!toy[0].isAvailable) return { ok: false, code: "TOY_UNAVAILABLE", message: "This listing must be available to be boosted." };
  const now = new Date();
  const existingEnd = toy[0].boostedUntil && toy[0].boostedUntil > now ? toy[0].boostedUntil : now;
  const newEnd = new Date(Math.max(existingEnd.getTime(), now.getTime()) + hours * 60 * 60 * 1000);
  await db.update(toys).set({ boostedUntil: newEnd }).where(eq(toys.id, toyId));
  return { ok: true, message: "Toy boosted!" };
}

export async function qualifyReferral(refereeId: string) {
  console.log(`[referral] qualifyReferral called for refereeId=${refereeId}`);
  const refs = await db.select().from(referrals).where(
    and(eq(referrals.refereeId, refereeId), eq(referrals.status, "pending"))
  ).limit(1);
  if (!refs.length) {
    console.log(`[referral] no pending referral found for refereeId=${refereeId}`);
    return null;
  }
  console.log(`[referral] found pending referral id=${refs[0].id} referrerId=${refs[0].referrerId}`);
  const ref = refs[0];
  await db.update(referrals).set({ status: "qualified", qualifiedAt: new Date() }).where(eq(referrals.id, ref.id));
  if (await checkMonthlyReferralCap(ref.referrerId)) {
    await awardPoints({ userId: ref.referrerId, eventType: "REFERRAL_QUALIFIED", referenceType: "referral", referenceId: `ref_${ref.id}_referrer`, points: 200, meta: { refereeId } });
  }
  const referrer = await db.select().from(users).where(eq(users.id, ref.referrerId)).limit(1);
  if (referrer.length) {
    const existingPass = referrer[0].premiumPassUntil || new Date();
    const newPass = new Date(Math.max(existingPass.getTime(), Date.now()) + 7 * 24 * 60 * 60 * 1000);
    await db.update(users).set({ premiumPassUntil: newPass }).where(eq(users.id, ref.referrerId));
  }
  await awardPoints({ userId: refereeId, eventType: "REFERRAL_QUALIFIED_REFEREE", referenceType: "referral", referenceId: `ref_${ref.id}_referee`, points: 100, meta: { referrerId: ref.referrerId } });
  const referee = await db.select().from(users).where(eq(users.id, refereeId)).limit(1);
  let refereePremiumUnlocked = false;
  if (referee.length) {
    const existingPass = referee[0].premiumPassUntil || new Date();
    const newPass = new Date(Math.max(existingPass.getTime(), Date.now()) + 7 * 24 * 60 * 60 * 1000);
    const wasFree = !referee[0].premiumPassUntil || referee[0].premiumPassUntil <= new Date();
    await db.update(users).set({ premiumPassUntil: newPass }).where(eq(users.id, refereeId));
    refereePremiumUnlocked = wasFree;
    console.log(`[referral] referee ${refereeId} premiumPassUntil set to ${newPass.toISOString()} (wasFree=${wasFree})`);
  }
  console.log(`[referral] referral ${ref.id} qualified successfully for referee ${refereeId}`);
  return { userId: refereeId, refereeUnlockedPremium: refereePremiumUnlocked, pointsAwarded: 100 };
}

// Award Founding Member badge (Model C: joined before launch + qualifying contribution)
export async function awardFoundingMemberBadge(userId: string): Promise<boolean> {
  // 1. Get user and launch date
  const user = await db.select({ email: users.email, createdAt: users.createdAt }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length || !user[0].email) return false;
  const u = user[0];

  let cutoff = new Date(Date.now() + 30 * 86400000); // fallback: 30 days from now
  try {
    const [settings] = await db.select({ launchDate: launchSettings.launchDate }).from(launchSettings).limit(1);
    if (settings?.launchDate) cutoff = new Date(settings.launchDate);
  } catch { /* launch_settings table may not exist yet — use fallback */ }
  if (u.createdAt && new Date(u.createdAt) >= cutoff) return false; // joined after launch

  // 2. Check qualifying contributions
  const [toyResult] = await db.select({ count: sql<number>`count(*)` }).from(toys).where(and(eq(toys.ownerId, userId), isNull(toys.deletedAt)));
  const hasListed = Number(toyResult?.count || 0) > 0;

  const [refResult] = await db.select({ count: sql<number>`count(*)` }).from(referrals).where(and(eq(referrals.referrerId, userId), eq(referrals.status, "qualified")));
  const hasReferred = Number(refResult?.count || 0) > 0;

  const fmRows = u.email ? await db.select({ id: foundingMembers.id }).from(foundingMembers).where(eq(foundingMembers.email, u.email)).limit(1) : [];
  const isInFoundingForm = fmRows.length > 0;

  if (!hasListed && !hasReferred && !isInFoundingForm) return false; // no qualifying contribution

  // 3. Award badge (prevent duplicate)
  await ensureUserRewards(userId);
  const existing = await db.select({ badges: userRewards.badges }).from(userRewards).where(eq(userRewards.userId, userId)).limit(1);
  const badges = Array.isArray(existing[0]?.badges) ? existing[0].badges as any[] : [];
  if (badges.some((b: any) => b.type === "founding_member")) return false;

  badges.push({ type: "founding_member", awardedAt: new Date().toISOString() });
  await db.update(userRewards).set({ badges, updatedAt: new Date() }).where(eq(userRewards.userId, userId));
  if (isInFoundingForm && fmRows[0]) {
    await db.update(foundingMembers).set({ badgeAwarded: true }).where(eq(foundingMembers.id, fmRows[0].id));
  }

  console.log(`[badge] founding_member awarded to user ${userId} (listed=${hasListed}, referred=${hasReferred}, form=${isInFoundingForm})`);
  return true;
}

// Calculate contribution score for a user (used by Launch Control)
export async function computeContributionScore(userId: string): Promise<{
  score: number;
  breakdown: { label: string; points: number }[];
  toyCount: number;
  referralCount: number;
  foundingMember: boolean;
  daysSinceJoin: number;
  lastActive: Date | null;
}> {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length) return { score: 0, breakdown: [], toyCount: 0, referralCount: 0, foundingMember: false, daysSinceJoin: 0, lastActive: null };

  const u = user[0];
  const daysSinceJoin = u.createdAt ? Math.floor((Date.now() - new Date(u.createdAt).getTime()) / 86400000) : 0;

  const [toyResult] = await db.select({ count: sql<number>`count(*)` }).from(toys).where(and(eq(toys.ownerId, userId), isNull(toys.deletedAt)));
  const toyCount = Number(toyResult?.count || 0);

  const [refResult] = await db.select({ count: sql<number>`count(*)` }).from(referrals).where(and(eq(referrals.referrerId, userId), eq(referrals.status, "qualified")));
  const referralCount = Number(refResult?.count || 0);

  const fm = await db.select({ id: foundingMembers.id }).from(foundingMembers).where(eq(foundingMembers.email, u.email || "")).limit(1);
  const foundingMember = fm.length > 0;

  const breakdown: { label: string; points: number }[] = [];
  let score = 0;

  const toyPts = toyCount * 2;
  if (toyPts > 0) { breakdown.push({ label: "Toys Listed", points: toyPts }); score += toyPts; }

  const refPts = referralCount * 3;
  if (refPts > 0) { breakdown.push({ label: "Qualified Referrals", points: refPts }); score += refPts; }

  if (foundingMember) { breakdown.push({ label: "Founding Member", points: 1 }); score += 1; }

  const tenurePts = Math.min(daysSinceJoin, 30) * 0.1;
  if (tenurePts > 0) { breakdown.push({ label: "Days Active", points: Math.round(tenurePts * 10) / 10 }); score += tenurePts; }

  // Last active: most recent of createdAt, toy creation, referral, exchange
  const [lastToy] = await db.select({ created: toys.createdAt }).from(toys).where(eq(toys.ownerId, userId)).orderBy(desc(toys.createdAt)).limit(1);
  const [lastRef] = await db.select({ created: referrals.createdAt }).from(referrals).where(eq(referrals.referrerId, userId)).orderBy(desc(referrals.createdAt)).limit(1);
  const timestamps = [u.createdAt, lastToy?.created, lastRef?.created].filter(Boolean) as Date[];
  const lastActive = timestamps.length ? new Date(Math.max(...timestamps.map(d => d.getTime()))) : u.createdAt;

  return { score: Math.min(Math.round(score * 10) / 10, 10), breakdown, toyCount, referralCount, foundingMember, daysSinceJoin, lastActive };
}
