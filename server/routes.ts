import crypto from "crypto";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { eq, and, or, gte, inArray, isNull, sql, desc } from "drizzle-orm";
import cors from "cors";
import multer from "multer";
import { uploadImage, validateImage, isR2Configured, processImages } from "./r2";
import { storage } from "./storage";
import { db } from "./db";
import { users, toys, exchanges, messages, reviews, referrals, rewardRedemptions, rewardLedger, reports, moderationActions, moderationMessages, marketingSubscribers, insertMarketingSubscriberSchema } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./localAuth";
import { insertToySchema, insertExchangeSchema, insertMessageSchema, insertFavoriteSchema, insertReviewSchema } from "@shared/schema";
import { computeEntitlements, awardPoints, checkDailyCap, qualifyReferral, getRewardsProfile, spendPoints, ensureUserRewards, countActiveBoosts, checkMonthlyReferralCap, redeemPointsBoost, applyPaidBoost } from "./rewards";
import { haversineKm } from "./utils/distance";

async function getPremiumStatus(userId: string) {
  const e = await computeEntitlements(userId);
  return e.isPremium;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // CORS for the marketing landing page
  app.use("/api/marketing", cors({
    origin: ["https://toyxchange.online", "http://localhost:3001", "http://127.0.0.1:3001"],
    credentials: true,
  }));

  // Newsletter / marketing subscribe
  app.post("/api/marketing/subscribe", async (req, res) => {
    try {
      const parsed = insertMarketingSubscriberSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid email address" });
      }
      const { email } = parsed.data;

      // Always save to DB
      await db.insert(marketingSubscribers).values({ email }).onConflictDoNothing();

      // Send branded welcome email via Resend if key is configured
      if (process.env.RESEND_API_KEY) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "The ToyX Team <hello@toyxchange.online>",
              to: email,
              subject: "Welcome to the ToyX Family! 💜",
              html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ToyX</title>
</head>
<body style="margin:0;padding:0;background-color:#F7F5FB;font-family:'Inter','Helvetica',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F5FB;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:40px 24px 24px;">
              <img src="https://toyxchange.online/assets/toyx-logo.png" alt="ToyX" style="max-height:50px;width:auto;display:block;" />
            </td>
          </tr>

          <!-- Hero Image -->
          <tr>
            <td align="center" style="padding:0 24px 24px;">
              <img src="https://toyxchange.online/assets/hero.png" alt="ToyX Heroes" style="width:100%;max-width:432px;border-radius:12px;display:block;" />
            </td>
          </tr>

          <!-- Headline -->
          <tr>
            <td align="center" style="padding:0 24px 8px;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#1f2937;letter-spacing:-0.5px;">Share toys, spread joy.</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td align="center" style="padding:0 24px 24px;">
              <p style="margin:0;font-size:16px;line-height:1.7;color:#6b7280;">
                Hi there! Thanks for joining the ToyX community. We're building the safest space for parents in South Africa to swap toys, save money, and live greener. Your journey to discovery starts now!
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding:0 24px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background:linear-gradient(135deg,#8B5CF6,#EC4899);border-radius:12px;">
                    <a href="https://toyxchange.online/go/app" target="_blank" style="display:inline-block;padding:14px 40px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">Start Exploring</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F9FAFB;padding:20px 24px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                &copy; 2024 ToyX. All Rights Reserved. Made with 💜 for South African Parents.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
            }),
          });
        } catch (emailErr) {
          console.error("MARKETING_SUBSCRIPTION_EMAIL_ERROR:", emailErr);
        }
      } else {
        console.warn("Missing RESEND_API_KEY");
      }

      res.json({ message: "Subscribed successfully" });
    } catch (error) {
      console.error("MARKETING_SUBSCRIPTION_ERROR:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Google Places API proxy (no auth required — used for location autocomplete)
  app.get("/api/location/autocomplete", async (req, res) => {
    try {
      const input = req.query.input as string;
      if (!input || input.length < 2) {
        return res.json({ predictions: [] });
      }
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return res.json({ predictions: [] });
      }
      const googleRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${apiKey}`
      );
      const data = await googleRes.json();
      res.json(data);
    } catch (error) {
      console.error("Location autocomplete error:", error);
      res.json({ predictions: [] });
    }
  });

  // Place details proxy (used by frontend to get lat/lng from place_id)
  app.get("/api/location/place-details", async (req, res) => {
    try {
      const placeId = req.query.place_id as string;
      if (!placeId) {
        return res.status(400).json({ error: "place_id required" });
      }
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        return res.json({ error: "API key not configured" });
      }
      const googleRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address&key=${apiKey}`
      );
      const data = await googleRes.json();
      res.json(data);
    } catch (error) {
      console.error("Place details error:", error);
      res.json({ error: "Failed to fetch place details" });
    }
  });

  // Dev/test auth bypass (only when DEV_AUTH_BYPASS=true and not production)
  if (process.env.DEV_AUTH_BYPASS === "true" && process.env.NODE_ENV !== "production") {
    app.get("/api/dev/login/:userId", async (req: any, res, next) => {
      try {
        const user = await storage.getUser(req.params.userId);
        if (!user) return res.status(404).json({ message: "User not found" });
        req.login({ id: user.id, sub: user.id, claims: { sub: user.id }, expires_at: Math.floor(Date.now() / 1000) + 86400, access_token: "dev", refresh_token: "dev" }, (err: any) => {
          if (err) return next(err);
          res.json({ message: "Dev login ok", user });
        });
      } catch (e: any) {
        res.status(500).json({ message: e.message });
      }
    });

    app.post("/api/dev/set-plan", async (req: any, res) => {
      try {
        const { userId, plan } = req.body;
        if (!userId || !plan) return res.status(400).json({ message: "userId and plan required" });
        const user = await storage.getUser(userId);
        if (!user) return res.status(404).json({ message: "User not found" });
        const now = new Date();
        const currentPeriodEnd = plan !== "free" ? new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000) : null;
        await storage.updateUser(userId, { plan, subscriptionStatus: plan !== "free" ? "active" : "inactive", currentPeriodEnd });
        res.json({ message: "Plan updated", plan, subscriptionStatus: plan !== "free" ? "active" : "inactive" });
      } catch (e: any) {
        res.status(500).json({ message: e.message });
      }
    });

    // Reset onboarding (dev-only)
    app.post("/api/dev/reset-onboarding", isAuthenticated, async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        await storage.updateUser(userId, { onboardingVersion: 0 });
        res.json({ ok: true });
      } catch (e: any) {
        res.status(500).json({ message: e.message });
      }
    });

    console.log("DEV_AUTH_BYPASS endpoints registered");
  }

  // Dev test points award (used by API tests)
  app.post("/api/rewards/award-test-points", async (req: any, res) => {
    try {
      const { userId, points } = req.body;
      if (!userId || !points) return res.status(400).json({ message: "userId and points required" });
      const result = await awardPoints({ userId, eventType: "TEST_AWARD", referenceType: "test", referenceId: `test_${Date.now()}`, points });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user && user.profileImageUrl) {
        user.profileImageUrl = user.profileImageUrl.replace(/^http:/, "https:");
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Signup - create a new user and log them in
  app.post('/api/signup', async (req: any, res, next) => {
    try {
      const { email, firstName } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const existing = await storage.searchUsersByEmail(email);
      if (existing.length > 0) {
        return res.status(409).json({ message: "Email already in use" });
      }
      const userId = `user-${Date.now()}`;
      await storage.upsertUser({
        id: userId,
        email,
        firstName: firstName || email.split('@')[0],
        lastName: "",
        profileImageUrl: null,
        hasPassword: true,
      });
      req.logIn({ id: userId, sub: userId, claims: { sub: userId } }, (err: any) => {
        if (err) return next(err);
        res.json({ message: "Account created", user: { id: userId, email, firstName: firstName || email.split('@')[0] } });
      });
    } catch (error) {
      console.error("Error in signup:", error);
      res.status(500).json({ message: "Signup failed" });
    }
  });

  // Dev login - quick login as demo user
  app.post('/api/dev-login', async (req: any, res, next) => {
    try {
      const { userId } = req.body;
      const user = await storage.getUser(userId || "demo-user-1");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      req.logIn({ id: user.id, sub: user.id, claims: { sub: user.id } }, (err: any) => {
        if (err) return next(err);
        res.json({ message: "Logged in", user });
      });
    } catch (error) {
      console.error("Error in dev login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // User profile routes

  // Get privacy settings (must be BEFORE /api/users/:id wildcard)
  app.get('/api/users/privacy', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({
        showLocation: user.showLocation,
        showEmail: user.showEmail,
        showPhone: user.showPhone,
        messagePrivacy: user.messagePrivacy,
      });
    } catch (error) {
      console.error("Error fetching privacy settings:", error);
      res.status(500).json({ message: "Failed to fetch privacy settings" });
    }
  });

  // Update privacy settings
  app.patch('/api/users/privacy', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { showLocation, showEmail, showPhone, messagePrivacy } = req.body;
      const updatedUser = await storage.updateUser(userId, {
        showLocation,
        showEmail,
        showPhone,
        messagePrivacy,
      });
      res.json({
        showLocation: updatedUser.showLocation,
        showEmail: updatedUser.showEmail,
        showPhone: updatedUser.showPhone,
        messagePrivacy: updatedUser.messagePrivacy,
      });
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      res.status(500).json({ message: "Failed to update privacy settings" });
    }
  });

  // Get logged-in user's toys (for boost selection)
  app.get('/api/users/me/toys', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userToys = await storage.getToysByUser(userId);
      const now = new Date();
      const toysWithMeta = await Promise.all(userToys.map(async (t: any) => {
        const [exch] = await db.select({ id: exchanges.id }).from(exchanges).where(
          or(eq(exchanges.toyId, t.id), eq(exchanges.offeredToyId, t.id))
        ).limit(1);
        return { ...t, isBoosted: !!(t as any).boostedUntil && new Date((t as any).boostedUntil) > now, hasExchangeHistory: !!exch, canDeletePermanently: !exch };
      }));
      res.json(toysWithMeta);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get my aggregated wishlist categories
  app.get('/api/me/wishlist', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const myToys = await db.select({ lookingForCategories: toys.lookingForCategories }).from(toys)
        .where(and(eq(toys.ownerId, userId), eq(toys.isAvailable, true), isNull(toys.deletedAt)));
      const allCats = new Set<string>();
      for (const t of myToys) {
        if (t.lookingForCategories) {
          for (const c of t.lookingForCategories) allCats.add(c);
        }
      }
      res.json({ categories: Array.from(allCats) });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get matches for my wishlist
  app.get('/api/me/matches', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { limit = 20 } = req.query;
      // Compute wishlist categories directly (no internal HTTP fetch)
      const myToys = await db.select({ lookingForCategories: toys.lookingForCategories }).from(toys)
        .where(and(eq(toys.ownerId, userId), eq(toys.isAvailable, true), isNull(toys.deletedAt)));
      const allCats = new Set<string>();
      for (const t of myToys) {
        if (t.lookingForCategories) {
          for (const c of t.lookingForCategories) allCats.add(c);
        }
      }
      const cats = Array.from(allCats);
      if (!cats.length) return res.json([]);
      const now = new Date();
      // Build category IN clause safely
      const catList = cats.map(c => `'${c.replace(/'/g, "''")}'`).join(",");
      const results = await db.execute(sql`
        SELECT t.*, row_to_json(u.*) as owner,
          CASE WHEN t.boosted_until > ${now} THEN 0 ELSE 1 END AS sort_order
        FROM toys t
        LEFT JOIN users u ON u.id = t.owner_id
        WHERE t.is_available = true
          AND t.deleted_at IS NULL
          AND t.owner_id != ${userId}
          AND t.category IN (${sql.raw(catList)})
        ORDER BY sort_order ASC, t.boosted_until DESC NULLS LAST, t.created_at DESC, t.id DESC
        LIMIT ${Number(limit)}
      `);
      const matched = (results as any).rows.map((r: any) => ({
        id: r.id, name: r.name, description: r.description, category: r.category,
        ageGroup: r.age_group, condition: r.condition, imageUrls: r.image_urls,
        ownerId: r.owner_id, isAvailable: r.is_available, location: r.location,
        latitude: r.latitude, longitude: r.longitude, boostedUntil: r.boosted_until,
        createdAt: r.created_at, updatedAt: r.updated_at,
        owner: r.owner, isBoosted: !!(r.boosted_until && new Date(r.boosted_until) > now),
      }));
      res.json(matched);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Moderation messages for the logged-in user
  app.get('/api/me/moderation-messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const msgs = await db.select().from(moderationMessages).where(eq(moderationMessages.userId, userId)).orderBy(desc(moderationMessages.createdAt)).limit(20);
      const unread = msgs.filter(m => !m.readAt).length;
      res.json({ messages: msgs, unreadCount: unread });
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.get('/api/me/moderation-messages/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [result] = await db.select({ count: sql<number>`count(*)` }).from(moderationMessages).where(and(eq(moderationMessages.userId, userId), sql`${moderationMessages.readAt} IS NULL`));
      const [latest] = await db.select({ id: moderationMessages.id }).from(moderationMessages).where(and(eq(moderationMessages.userId, userId), sql`${moderationMessages.readAt} IS NULL`)).orderBy(desc(moderationMessages.createdAt)).limit(1);
      res.json({ unreadCount: Number(result?.count || 0), latestUnreadId: latest?.id || null });
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  app.patch('/api/me/moderation-messages/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const [updated] = await db.update(moderationMessages).set({ readAt: new Date() }).where(and(eq(moderationMessages.id, parseInt(req.params.id)), eq(moderationMessages.userId, userId))).returning();
      res.json({ ok: true });
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  // Update user profile
  app.patch('/api/users/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updateData = req.body;
      if (updateData.profileImageUrl) {
        updateData.profileImageUrl = updateData.profileImageUrl.replace(/^http:/, "https:");
      }
      const updatedUser = await storage.updateUser(userId, updateData);
      if (updatedUser.profileImageUrl) {
        updatedUser.profileImageUrl = updatedUser.profileImageUrl.replace(/^http:/, "https:");
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // User search (used by report flow)
  app.get('/api/users/search', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const q = (req.query.q as string || "").trim();
      if (q.length < 2) return res.json([]);
      const results = await db.select({
        id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email, profileImageUrl: users.profileImageUrl,
      }).from(users).where(and(sql`LOWER(${users.firstName}) LIKE ${'%' + q.toLowerCase() + '%'}`, sql`${users.id} != ${userId}`)).limit(10);
      res.json(results.map(u => ({ ...u, profileImageUrl: u.profileImageUrl?.replace(/^http:/, "https:") || null })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/users/:id', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.profileImageUrl) {
        user.profileImageUrl = user.profileImageUrl.replace(/^http:/, "https:");
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  app.get('/api/users/:id/toys', async (req, res) => {
    try {
      const toys = await storage.getToysByUser(req.params.id);
      const toysWithMeta = await Promise.all(toys.map(async (t: any) => {
        const [exch] = await db.select({ id: exchanges.id }).from(exchanges).where(
          or(eq(exchanges.toyId, t.id), eq(exchanges.offeredToyId, t.id))
        ).limit(1);
        return { ...t, hasExchangeHistory: !!exch, canDeletePermanently: !exch };
      }));
      res.json(toysWithMeta);
    } catch (error) {
      console.error("Error fetching toys:", error);
      res.status(500).json({ message: "Failed to fetch toys" });
    }
  });

  // ---- Personalization routes ----

  // Update user location
  app.post('/api/users/location', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.updateUserLocation(userId, req.body);
      res.json(user);
    } catch (error) {
      console.error("Error updating location:", error);
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  // Log interaction event
  app.post('/api/interactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { toyId, eventType } = req.body;
      if (!toyId || !eventType) return res.status(400).json({ message: "toyId and eventType required" });
      await storage.logToyInteraction(userId, toyId, eventType);
      res.json({ ok: true });
    } catch (error) {
      console.error("Error logging interaction:", error);
      res.status(500).json({ message: "Failed to log interaction" });
    }
  });

  // Home recommendations
  app.get('/api/recommendations/home', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const usedLocation = !!(user.locationEnabled && user.latitude && user.longitude);
      const taste = await storage.getUserTasteProfile(userId);

      // Recently added — always
      let recentlyAdded = await storage.getToysWithOwners(and(eq(toys.isAvailable, true), isNull(toys.deletedAt)), 10);

      let nearYou: any[] = [];
      let forYou: any[] = [];

      if (usedLocation) {
        nearYou = await storage.getCandidateToysNearUser(userId, user.latitude!, user.longitude!, 20);
        // Score candidates for "For You"
        const threeDaysAgo = Date.now() - 3 * 86400000;
        const sevenDaysAgo = Date.now() - 7 * 86400000;
        const scored = nearYou.map((t: any) => {
          let score = 0;
          score += Math.max(0, 20 - t.distanceKm); // closer = more points
          if (taste.topCategories.some((c: string) => t.category?.includes(c))) score += 20;
          if (taste.topAges.some((a: string) => t.ageGroup?.includes(a))) score += 15;
          const created = new Date(t.createdAt).getTime();
          if (created > threeDaysAgo) score += 10;
          else if (created > sevenDaysAgo) score += 5;
          return { ...t, _score: score };
        });
        scored.sort((a: any, b: any) => b._score - a._score);
        forYou = scored.slice(0, 10);
      } else {
        const allToys = await storage.getToysWithOwners(and(eq(toys.isAvailable, true), isNull(toys.deletedAt)));
        const scored = allToys.map((t: any) => {
          let score = 0;
          if (taste.topCategories.some((c: string) => t.category?.includes(c))) score += 20;
          if (taste.topAges.some((a: string) => t.ageGroup?.includes(a))) score += 15;
          const created = new Date(t.createdAt).getTime();
          if (created > Date.now() - 3 * 86400000) score += 10;
          else if (created > Date.now() - 7 * 86400000) score += 5;
          return { ...t, _score: score };
        });
        scored.sort((a: any, b: any) => b._score - a._score);
        forYou = scored.slice(0, 10);
        nearYou = recentlyAdded;
      }

      // Add isFavorited + isBoosted for each toy
      const now = new Date();
      const addFav = async (toy: any) => { 
        toy.isFavorited = await storage.isFavorite(userId, toy.id); 
        toy.isBoosted = !!(toy.boostedUntil && new Date(toy.boostedUntil) > now);
        return toy; 
      };
      forYou = await Promise.all(forYou.map(addFav));
      nearYou = await Promise.all(nearYou.map(addFav));
      recentlyAdded = await Promise.all(recentlyAdded.map(addFav));

      res.json({ forYou, nearYou, recentlyAdded, meta: { usedLocation, radiusKm: 20, topAges: taste.topAges, topCategories: taste.topCategories } });
    } catch (error) {
      console.error("Error getting recommendations:", error);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  // ---- Toy routes ----
  app.get('/api/toys', async (req: any, res) => {
    try {
      const { search, category } = req.query;
      let toys;
      
      if (search) {
        toys = await storage.searchToys(search as string);
      } else if (category) {
        toys = await storage.getToysByCategory(category as string);
      } else {
        toys = await storage.getToys();
      }
      
      // Add favorite status, owner rating, and exchange status
      const uid = req.user?.claims?.sub;
      for (const toy of toys) {
        toy.isFavorited = uid ? await storage.isFavorite(uid, toy.id) : false;
        toy.ownerRating = await storage.getUserAverageRating(toy.ownerId);
        const activeEx = await db.select({ id: exchanges.id }).from(exchanges).where(
          and(
            or(eq(exchanges.toyId, toy.id), eq(exchanges.offeredToyId, toy.id)),
            inArray(exchanges.status, ["pending", "accepted"])
          )
        ).limit(1);
        toy.inExchange = activeEx.length > 0;
      }
      
      // Add isBoosted to each toy
      const now = new Date();
      for (const toy of toys) {
        (toy as any).isBoosted = !!(toy as any).boostedUntil && new Date((toy as any).boostedUntil) > now;
      }
      
      // Compute distance from viewer if location is enabled
      const viewer = uid ? await storage.getUser(uid) : null;
      if (viewer?.locationEnabled && viewer.latitude != null && viewer.longitude != null) {
        for (const toy of toys) {
          if (toy.latitude != null && toy.longitude != null) {
            toy.distanceKm = haversineKm(viewer.latitude, viewer.longitude, toy.latitude, toy.longitude);
          }
        }
      }
      
      // Sort: boosted first (boostedUntil DESC), then distance ASC, then createdAt DESC, then id DESC
      toys.sort((a: any, b: any) => {
        const aBoosted = !!(a.boostedUntil && new Date(a.boostedUntil) > now);
        const bBoosted = !!(b.boostedUntil && new Date(b.boostedUntil) > now);
        if (aBoosted !== bBoosted) return aBoosted ? -1 : 1;
        if (aBoosted && bBoosted) return new Date(b.boostedUntil).getTime() - new Date(a.boostedUntil).getTime();
        if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
        const aTime = new Date(a.createdAt || 0).getTime();
        const bTime = new Date(b.createdAt || 0).getTime();
        if (aTime !== bTime) return bTime - aTime;
        return (b.id || 0) - (a.id || 0);
      });
      
      res.json(toys);
    } catch (error) {
      console.error("Error fetching toys:", error);
      res.status(500).json({ message: "Failed to fetch toys" });
    }
  });

  app.get('/api/toys/:id', async (req, res) => {
    try {
      const toyId = parseInt(req.params.id);
      
      if (isNaN(toyId)) {
        return res.status(400).json({ message: "Invalid toy ID" });
      }
      
      const toy = await storage.getToy(toyId);
      
      if (!toy) {
        return res.status(404).json({ message: "Toy not found" });
      }
      
      res.json(toy);
    } catch (error) {
      console.error("Error fetching toy:", error);
      res.status(500).json({ message: "Failed to fetch toy" });
    }
  });

  // Toy image proxy — serves the first toy image with proper Content-Type for social crawlers
  app.get('/api/listings/:id/image', async (req, res) => {
    try {
      const toyId = parseInt(req.params.id);
      if (isNaN(toyId)) {
        return res.status(400).json({ message: "Invalid toy ID" });
      }
      const toy = await storage.getToy(toyId);
      if (!toy) {
        return res.status(404).json({ message: "Toy not found" });
      }
      const imageUrl = Array.isArray(toy.imageUrls) ? toy.imageUrls.find(Boolean) : null;
      if (!imageUrl) {
        return res.status(404).json({ message: "No image available" });
      }
      const imageRes = await fetch(imageUrl);
      if (!imageRes.ok) {
        return res.status(502).json({ message: "Failed to fetch image" });
      }
      const contentType = imageRes.headers.get("content-type") || "image/jpeg";
      const buffer = Buffer.from(await imageRes.arrayBuffer());
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(buffer);
    } catch (error) {
      console.error("Image proxy error:", error);
      res.status(500).json({ message: "Failed to serve image" });
    }
  });

  // ── R2 upload test endpoint ──────────────────────────────────────────

  const r2Upload = multer({
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req: any, file: any, cb: any) => {
      const error = validateImage(file.mimetype, 0);
      cb(error ? new Error(error) : null, !error);
    },
  });

  app.post("/api/r2-upload-test", r2Upload.single("image"), async (req: any, res) => {
    try {
      if (!isR2Configured()) {
        return res.status(503).json({ success: false, error: "R2 not configured" });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, error: "No image file provided" });
      }
      const sizeError = validateImage(req.file.mimetype, req.file.size);
      if (sizeError) {
        return res.status(400).json({ success: false, error: sizeError });
      }
      const result = await uploadImage(req.file.buffer, req.file.mimetype);
      res.json(result);
    } catch (error: any) {
      console.error("R2 test upload error:", error);
      if (error.message?.includes("Unsupported file type")) {
        return res.status(400).json({ success: false, error: error.message });
      }
      res.status(500).json({ success: false, error: error.message || "Upload failed" });
    }
  });

  // Enforcement: check if user is suspended or banned
  const checkNotRestricted = async (req: any, res: any, next: any) => {
    try {
      const user = await storage.getUser(req.user?.claims?.sub);
      if (!user) return res.status(401).json({ message: "Unauthorized" });
      if ((user as any).bannedAt) return res.status(403).json({ code: "BANNED", message: "Your account has been banned" });
      if ((user as any).suspendedUntil && new Date((user as any).suspendedUntil) > new Date()) {
        return res.status(403).json({ code: "SUSPENDED", message: `Account suspended until ${new Date((user as any).suspendedUntil).toLocaleDateString()}` });
      }
      next();
    } catch { next(); }
  };

  app.post('/api/toys', isAuthenticated, checkNotRestricted, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const entitlements = await computeEntitlements(userId);
      if (!entitlements.isPremium) {
        const activeCount = await storage.countActiveListings(userId);
        if (activeCount >= entitlements.maxActiveListings) {
          return res.status(403).json({
            code: "LIMIT_ACTIVE_LISTINGS",
            message: "Free tier allows up to " + entitlements.maxActiveListings + " active listings. Upgrade to Premium or redeem points to list more.",
            upgradeUrl: "/pricing",
          });
        }
      }
      const body = req.body;
      let imgs = Array.isArray(body.imageUrls) ? body.imageUrls : [];
      if (imgs.length > 6) {
        return res.status(400).json({ code: "TOO_MANY_IMAGES", message: "Maximum 6 photos allowed." });
      }
      // Upload base64 images to R2, keep existing HTTP URLs as-is
      imgs = await processImages(imgs);
      body.imageUrls = imgs;
      if (body.lookingForCategories && (!Array.isArray(body.lookingForCategories) || body.lookingForCategories.length > 5)) {
        return res.status(400).json({ code: "INVALID_LOOKING_FOR", message: "Maximum 5 looking-for categories allowed." });
      }
      if (body.lookingForDetails && typeof body.lookingForDetails === "string" && body.lookingForDetails.length > 200) {
        return res.status(400).json({ code: "LOOKING_FOR_DETAILS_TOO_LONG", message: "Looking for details max 200 characters." });
      }
      const toyData = insertToySchema.parse({ ...req.body, ownerId: userId });
      const toy = await storage.createToy(toyData);
      // Award quality listing points
      const imagesCount = Array.isArray(toy.imageUrls) ? toy.imageUrls.filter(Boolean).length : 0;
      const descLen = (toy.description ?? "").trim().length;
      const qualifies = imagesCount >= 2 && descLen >= 30;
      let awarded = false;
      if (qualifies && await checkDailyCap(userId, "TOY_LISTED_QUALITY", 5)) {
        const result = await awardPoints({ userId, eventType: "TOY_LISTED_QUALITY", referenceType: "toy", referenceId: String(toy.id), points: 5 });
        awarded = result.awarded;
      }
      res.status(201).json({
        ...toy,
        reward: { awarded, points: awarded ? 5 : 0, criteria: { minImagesForReward: 2, minDescriptionChars: 30 } },
      });
    } catch (error) {
      if ((error as any).name === "ZodError") {
        return res.status(400).json({ code: "VALIDATION_ERROR", message: "Please add at least 1 photo before listing." });
      }
      console.error("Error creating toy:", error);
      res.status(500).json({ message: "Failed to create toy" });
    }
  });

  app.get('/api/users/:userId/toys', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const toys = await storage.getToysByUser(userId);
      const toysWithMeta = await Promise.all(toys.map(async (t: any) => {
        const [exch] = await db.select({ id: exchanges.id }).from(exchanges).where(
          or(eq(exchanges.toyId, t.id), eq(exchanges.offeredToyId, t.id))
        ).limit(1);
        return { ...t, hasExchangeHistory: !!exch, canDeletePermanently: !exch };
      }));
      res.json(toysWithMeta);
    } catch (error) {
      console.error("Error fetching user toys:", error);
      res.status(500).json({ message: "Failed to fetch user toys" });
    }
  });

  app.patch('/api/toys/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const toyId = parseInt(req.params.id);
      const toy = await storage.getToy(toyId);
      if (!toy) return res.status(404).json({ message: "Toy not found" });
      if (toy.ownerId !== userId) return res.status(403).json({ message: "Not your toy" });
      const body = req.body;
      if (body.lookingForCategories && (!Array.isArray(body.lookingForCategories) || body.lookingForCategories.length > 5)) {
        return res.status(400).json({ code: "INVALID_LOOKING_FOR", message: "Maximum 5 looking-for categories allowed." });
      }
      if (body.lookingForDetails && typeof body.lookingForDetails === "string" && body.lookingForDetails.length > 200) {
        return res.status(400).json({ code: "LOOKING_FOR_DETAILS_TOO_LONG", message: "Looking for details max 200 characters." });
      }
      const updated = await storage.updateToy(toyId, body);
      // Award quality listing points if newly qualifying
      const imgCount = body.imageUrls?.length || updated.imageUrls?.length || 0;
      const descLen = (body.description || updated.description || "").length;
      if (imgCount >= 2 && descLen >= 30 && await checkDailyCap(userId, "TOY_LISTED", 5)) {
        await awardPoints({ userId, eventType: "TOY_LISTED", referenceType: "toy", referenceId: String(toyId), points: 5 });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update toy" });
    }
  });

  app.delete('/api/toys/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const toyId = parseInt(req.params.id);
      const toy = await storage.getToy(toyId);
      if (!toy) return res.status(404).json({ message: "Toy not found" });
      if (toy.ownerId !== userId) return res.status(403).json({ message: "Not your toy" });
      // Check if toy has any exchanges referencing it
      const [exch] = await db.select({ id: exchanges.id }).from(exchanges).where(
        or(eq(exchanges.toyId, toyId), eq(exchanges.offeredToyId, toyId))
      ).limit(1);
      if (exch) {
        return res.status(409).json({ code: "TOY_HAS_EXCHANGES", message: "This listing has exchange history and can't be permanently deleted. Archive it instead." });
      }
      await storage.deleteToy(toyId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete toy" });
    }
  });

  // Unlist (set unavailable)
  app.post('/api/toys/:toyId/unlist', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const toyId = parseInt(req.params.toyId);
      const toy = await storage.getToy(toyId);
      if (!toy) return res.status(404).json({ message: "Toy not found" });
      if (toy.ownerId !== userId) return res.status(403).json({ message: "Not your toy" });
      await db.update(toys).set({ isAvailable: false, updatedAt: new Date() }).where(eq(toys.id, toyId));
      res.json({ ok: true, message: "Listing unlisted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to unlist" });
    }
  });

  // Archive (soft delete)
  app.post('/api/toys/:toyId/archive', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const toyId = parseInt(req.params.toyId);
      const toy = await storage.getToy(toyId);
      if (!toy) return res.status(404).json({ message: "Toy not found" });
      if (toy.ownerId !== userId) return res.status(403).json({ message: "Not your toy" });
      await db.update(toys).set({ deletedAt: new Date(), isAvailable: false, updatedAt: new Date() }).where(eq(toys.id, toyId));
      res.json({ ok: true, message: "Listing archived" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to archive" });
    }
  });

  // Relist (make available)
  app.post('/api/toys/:toyId/relist', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const toyId = parseInt(req.params.toyId);
      const toy = await storage.getToy(toyId);
      if (!toy) return res.status(404).json({ message: "Toy not found" });
      if (toy.ownerId !== userId) return res.status(403).json({ message: "Not your toy" });
      await db.update(toys).set({ isAvailable: true, updatedAt: new Date() }).where(eq(toys.id, toyId));
      res.json({ ok: true, message: "Listing relisted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to relist" });
    }
  });

  // Exchange routes
  app.get('/api/exchanges', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exchanges = await storage.getExchanges(userId);
      // Add hasUnread for each exchange
      const withUnread = exchanges.map((ex: any) => {
        const lastRead = ex.requesterId === userId ? ex.requesterLastReadAt : ex.ownerLastReadAt;
        const lastMsg = ex.messages?.[ex.messages.length - 1];
        const hasUnread = lastMsg && lastMsg.senderId !== userId && (!lastRead || new Date(lastMsg.createdAt).getTime() > new Date(lastRead).getTime());
        return { ...ex, hasUnread: !!hasUnread };
      });
      res.json(withUnread);
    } catch (error) {
      console.error("Error fetching exchanges:", error);
      res.status(500).json({ message: "Failed to fetch exchanges" });
    }
  });

  app.get('/api/exchanges/:id', isAuthenticated, async (req, res) => {
    try {
      const exchangeId = parseInt(req.params.id);
      const exchange = await storage.getExchange(exchangeId);
      
      if (!exchange) {
        return res.status(404).json({ message: "Exchange not found" });
      }
      
      res.json(exchange);
    } catch (error) {
      console.error("Error fetching exchange:", error);
      res.status(500).json({ message: "Failed to fetch exchange" });
    }
  });

  app.post('/api/exchanges', isAuthenticated, checkNotRestricted, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const entitlements = await computeEntitlements(userId);
      if (!entitlements.isPremium) {
        const monthlyRequests = await storage.countOutgoingExchangeRequestsThisMonth(userId);
        if (monthlyRequests >= entitlements.maxMonthlyRequests) {
          return res.status(403).json({
            code: "LIMIT_MONTHLY_REQUESTS",
            message: "Free tier allows up to " + entitlements.maxMonthlyRequests + " outgoing exchange requests per month. Upgrade to Premium or redeem points for more.",
            upgradeUrl: "/pricing",
          });
        }
        const activeExchanges = await storage.countActiveOutgoingExchanges(userId);
        if (activeExchanges >= 2) {
          return res.status(403).json({
            code: "LIMIT_ACTIVE_EXCHANGES",
            message: "Free tier allows up to 2 active outgoing exchanges. Upgrade to Premium for more.",
            upgradeUrl: "/pricing",
          });
        }
      }
      console.log("Creating exchange request:", { 
        body: req.body, 
        userId 
      });
      
      // Get the toy to find the owner
      const toy = await storage.getToy(req.body.toyId);
      if (!toy) {
        return res.status(404).json({ message: "Toy not found" });
      }
      
      const exchangeData = insertExchangeSchema.parse({ 
        ...req.body, 
        requesterId: userId,
        ownerId: toy.ownerId
      });

      // Block enforcement: check if either user has blocked the other
      const [blockedByOwner, blockedByRequester] = await Promise.all([
        storage.isBlocked(toy.ownerId, userId),
        storage.isBlocked(userId, toy.ownerId),
      ]);
      if (blockedByOwner) return res.status(403).json({ message: "You cannot request an exchange with this user" });
      if (blockedByRequester) return res.status(403).json({ message: "You have blocked this user. Unblock them to request an exchange." });
      
      console.log("Exchange data to insert:", exchangeData);
      const exchange = await storage.createExchange(exchangeData);
      console.log("Exchange created:", exchange);
      // Log interaction
      await storage.logToyInteraction(userId, exchangeData.toyId, "EXCHANGE_REQUEST_CREATED").catch(() => {});
      
      // If there's a request message, create it as the first chat message
      if (exchangeData.requestMessage && exchangeData.requestMessage.trim()) {
        try {
          const messageData = insertMessageSchema.parse({
            exchangeId: exchange.id,
            senderId: userId,
            content: exchangeData.requestMessage.trim(),
            messageType: "text"
          });
            const message = await storage.createMessage(messageData);
            // Mark requester as read
            await storage.markExchangeRead(exchange.id, userId).catch(() => {});
          console.log("Initial message created:", message);
        } catch (messageError) {
          console.error("Failed to create initial message:", messageError);
          // Don't fail the exchange creation if message creation fails
        }
      }
      // Insert safety reminder as a system message in the new exchange
      try {
        const safetyContent = "For safer swaps, always meet in a public, well-lit location such as a shopping mall, coffee shop, or community centre. Avoid sharing unnecessary personal information and inspect toys before completing the exchange. — ToyX Safety Team";
        await db.insert(messages).values({
          exchangeId: exchange.id,
          senderId: userId,
          content: safetyContent,
          messageType: "system",
          createdAt: new Date(),
        });
      } catch (safetyError) {
        console.error("Failed to insert safety reminder:", safetyError);
      }
      
      res.status(201).json(exchange);
    } catch (error: any) {
      console.error("Error creating exchange:", error);
      res.status(500).json({ message: error.message || "Failed to create exchange" });
    }
  });

  app.patch('/api/exchanges/:id/status', isAuthenticated, async (req, res) => {
    try {
      const exchangeId = parseInt(req.params.id);
      const { status } = req.body;
      const exchange = await storage.updateExchangeStatus(exchangeId, status);
      // If completed, mark both toys as unavailable
      if (status === "completed") {
        const exch = await db.select({ toyId: exchanges.toyId, offeredToyId: exchanges.offeredToyId }).from(exchanges).where(eq(exchanges.id, exchangeId)).limit(1);
        if (exch.length) {
          await db.update(toys).set({ isAvailable: false }).where(eq(toys.id, exch[0].toyId));
          if (exch[0].offeredToyId) {
            await db.update(toys).set({ isAvailable: false }).where(eq(toys.id, exch[0].offeredToyId));
          }
        }
      }
      res.json(exchange);
    } catch (error) {
      console.error("Error updating exchange status:", error);
      res.status(500).json({ message: "Failed to update exchange status" });
    }
  });

  app.post('/api/exchanges/:id/confirm', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exchangeId = parseInt(req.params.id);
      const exchange = await storage.confirmExchangeCompletion(exchangeId, userId);
      // If exchange completed, mark toys as unavailable and award points
      if (exchange.status === "completed") {
        await db.update(toys).set({ isAvailable: false }).where(eq(toys.id, exchange.toyId));
        if (exchange.offeredToyId) {
          await db.update(toys).set({ isAvailable: false }).where(eq(toys.id, exchange.offeredToyId));
        }
        await awardPoints({ userId: exchange.requesterId, eventType: "EXCHANGE_COMPLETED", referenceType: "exchange", referenceId: `${exchange.id}:requester`, points: 50 });
        await awardPoints({ userId: exchange.ownerId, eventType: "EXCHANGE_COMPLETED", referenceType: "exchange", referenceId: `${exchange.id}:owner`, points: 50 });
        await storage.logToyInteraction(exchange.requesterId, exchange.toyId, "EXCHANGE_COMPLETED").catch(() => {});
        await storage.logToyInteraction(exchange.ownerId, exchange.toyId, "EXCHANGE_COMPLETED").catch(() => {});
        // Check for referral qualification
        await qualifyReferral(exchange.requesterId);
        await qualifyReferral(exchange.ownerId);
      }
      res.json(exchange);
    } catch (error: any) {
      console.error("Error confirming exchange completion:", error);
      res.status(400).json({ message: error.message || "Failed to confirm exchange completion" });
    }
  });

  // Message routes
  app.get('/api/exchanges/:id/messages', isAuthenticated, async (req, res) => {
    try {
      const exchangeId = parseInt(req.params.id);
      const messages = await storage.getMessages(exchangeId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Mark exchange as read
  app.post('/api/exchanges/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exchangeId = parseInt(req.params.id);
      await storage.markExchangeRead(exchangeId, userId);
      res.json({ ok: true });
    } catch (error) {
      console.error("Error marking exchange read:", error);
      res.status(500).json({ message: "Failed to mark exchange read" });
    }
  });

  // Reaction toggle
  app.post('/api/exchanges/:id/messages/:messageId/react', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messageId = parseInt(req.params.messageId);
      const { emoji } = req.body;
      if (!emoji) return res.status(400).json({ message: "emoji required" });

      const [message] = await db.select().from(messages).where(eq(messages.id, messageId));
      if (!message) return res.status(404).json({ message: "Message not found" });

      const currentReactions: Array<{ userId: string; emoji: string }> = Array.isArray(message.reactions) ? message.reactions : [];
      const existing = currentReactions.findIndex((r) => r.userId === userId && r.emoji === emoji);
      if (existing >= 0) {
        currentReactions.splice(existing, 1);
      } else {
        currentReactions.push({ userId, emoji });
      }

      const [updated] = await db.update(messages).set({ reactions: currentReactions }).where(eq(messages.id, messageId)).returning();
      res.json(updated);
    } catch (error: any) {
      console.error("Error toggling reaction:", error);
      res.status(500).json({ message: error.message || "Failed to toggle reaction" });
    }
  });

  // Favorite routes
  app.get('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorites = await storage.getFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post('/api/favorites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const favoriteData = insertFavoriteSchema.parse({
        ...req.body,
        userId
      });
      const favorite = await storage.addFavorite(favoriteData);
      res.status(201).json(favorite);
    } catch (error) {
      console.error("Error adding favorite:", error);
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  app.delete('/api/favorites/:toyId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const toyId = parseInt(req.params.toyId);
      await storage.removeFavorite(userId, toyId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing favorite:", error);
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  app.get('/api/favorites/:toyId/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const toyId = parseInt(req.params.toyId);
      const isFavorite = await storage.isFavorite(userId, toyId);
      res.json({ isFavorite });
    } catch (error) {
      console.error("Error checking favorite status:", error);
      res.status(500).json({ message: "Failed to check favorite status" });
    }
  });

  // Review routes
  app.get('/api/users/:userId/reviews', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const reviews = await storage.getReviews(userId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });

  app.get('/api/users/:userId/rating', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const averageRating = await storage.getUserAverageRating(userId);
      res.json({ averageRating });
    } catch (error) {
      console.error("Error fetching user rating:", error);
      res.status(500).json({ message: "Failed to fetch user rating" });
    }
  });

  app.post('/api/reviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        reviewerId: userId
      });
      
      // Check if user can review this exchange
      const canReview = await storage.canUserReview(reviewData.exchangeId, userId);
      if (!canReview) {
        return res.status(400).json({ message: "Cannot review this exchange" });
      }
      
      const review = await storage.createReview(reviewData);
      // Award points for leaving a review (cap 3/day)
      if (await checkDailyCap(reviewData.reviewerId, "REVIEW_LEFT", 3)) {
        await awardPoints({ userId: reviewData.reviewerId, eventType: "REVIEW_LEFT", referenceType: "review", referenceId: String(review.id), points: 10 });
      }
      // Award bonus for 5-star review received
      if (reviewData.rating === 5 && (reviewData.comment?.length || 0) >= 30) {
        await awardPoints({ userId: reviewData.revieweeId, eventType: "REVIEW_RECEIVED_5STAR", referenceType: "review", referenceId: String(review.id), points: 5 });
      }
      res.json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });

  app.get('/api/exchanges/:exchangeId/can-review', isAuthenticated, async (req: any, res) => {
    try {
      const { exchangeId } = req.params;
      const userId = req.user.claims.sub;
      console.log(`Checking review eligibility for exchange ${exchangeId}, user ${userId}`);
      const canReview = await storage.canUserReview(parseInt(exchangeId), userId);
      console.log(`Can review result: ${canReview}`);
      res.json({ canReview });
    } catch (error) {
      console.error("Error checking review eligibility:", error);
      res.status(500).json({ message: "Failed to check review eligibility" });
    }
  });

  // ---- Block / Report routes ----

  app.post('/api/users/:id/block', isAuthenticated, async (req: any, res) => {
    try {
      const blockerId = req.user.claims.sub;
      const blockedId = req.params.id;
      if (blockerId === blockedId) return res.status(400).json({ message: "Cannot block yourself" });
      await storage.blockUser(blockerId, blockedId);
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to block user" });
    }
  });

  app.post('/api/users/:id/unblock', isAuthenticated, async (req: any, res) => {
    try {
      const blockerId = req.user.claims.sub;
      const blockedId = req.params.id;
      await storage.unblockUser(blockerId, blockedId);
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to unblock user" });
    }
  });

  app.get('/api/exchanges/:id/block-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exchangeId = parseInt(req.params.id);
      const exchange = await storage.getExchange(exchangeId);
      if (!exchange) return res.status(404).json({ message: "Exchange not found" });
      const otherUserId = exchange.requesterId === userId ? exchange.ownerId : exchange.requesterId;
      const [blockedByMe, blockedMe] = await Promise.all([
        storage.isBlocked(userId, otherUserId),
        storage.isBlocked(otherUserId, userId),
      ]);
      res.json({ blockedByMe, blockedMe });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to check block status" });
    }
  });

  app.get('/api/block/status/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const targetId = req.params.id;
      const [blockedByMe, blockedMe] = await Promise.all([
        storage.isBlocked(userId, targetId),
        storage.isBlocked(targetId, userId),
      ]);
      res.json({ blockedByMe, blockedMe });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to check block status" });
    }
  });

  app.get('/api/block/list', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const blockedIds = await storage.getBlockedUserIds(userId);
      const blockedUsers = await Promise.all(blockedIds.map(id => storage.getUser(id)));
      res.json(blockedUsers.filter(Boolean));
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to get blocked users" });
    }
  });

  app.post('/api/users/:id/report', isAuthenticated, async (req: any, res) => {
    try {
      const reporterId = req.user.claims.sub;
      const reportedId = req.params.id;
      if (reporterId === reportedId) return res.status(400).json({ message: "Cannot report yourself" });
      const { reason, details, contextType, contextId, alsoBlock } = req.body;
      if (!reason) return res.status(400).json({ code: "REASON_REQUIRED", message: "Reason is required" });
      const validReasons = ["Scam/Fraud", "Harassment", "Spam", "Inappropriate content", "Safety concern", "Other"];
      if (!validReasons.includes(reason)) return res.status(400).json({ code: "INVALID_REASON", message: "Invalid reason" });
      // Rate limit: max 5 reports per day
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const [countRes] = await db.select({ count: sql<number>`count(*)` }).from(reports).where(
        and(eq(reports.reporterId, reporterId), gte(reports.createdAt, today))
      );
      if (Number(countRes?.count || 0) >= 5) return res.status(429).json({ code: "RATE_LIMIT", message: "Maximum 5 reports per day" });
      // Dedupe: prevent duplicate open reports for same context within 24h
      if (contextType && contextType !== "profile") {
        const dayAgo = new Date(Date.now() - 86400000);
        const dupConditions: any[] = [eq(reports.reporterId, reporterId), eq(reports.reportedId, reportedId), eq(reports.status, "open"), gte(reports.createdAt, dayAgo)];
        if (contextType) dupConditions.push(eq(reports.contextType, contextType));
        if (contextId) dupConditions.push(eq(reports.contextId, contextId));
        const [dup] = await db.select({ id: reports.id }).from(reports).where(and(...dupConditions)).limit(1);
        if (dup) return res.status(409).json({ code: "DUPLICATE_REPORT", message: "You already have an open report for this user" });
      }
      // Capture message snapshot if context is chat/exchange
      let messageSnapshot = null;
      if ((contextType === "chat" || contextType === "exchange") && contextId) {
        const msgs = await db.select({ id: messages.id, senderId: messages.senderId, content: messages.content, createdAt: messages.createdAt })
          .from(messages).where(eq(messages.exchangeId, parseInt(contextId))).orderBy(desc(messages.createdAt)).limit(20);
        messageSnapshot = msgs.map(m => ({ ...m, createdAt: m.createdAt?.toISOString() }));
      }
      const [report] = await db.insert(reports).values({
        reporterId, reportedId, reason, details: details || null,
        contextType: contextType || "profile", contextId: contextId || null,
        messageSnapshot, status: "open",
      }).returning();
      if (alsoBlock) {
        await storage.blockUser(reporterId, reportedId);
      }
      res.status(201).json({ ok: true, id: report.id });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to report user" });
    }
  });

  // Admin middleware
  const isAdmin = async (req: any, res: any, next: any) => {
    try {
      const user = await storage.getUser(req.user?.claims?.sub);
      if (!user || !(user as any).isAdmin) return res.status(403).json({ code: "FORBIDDEN", message: "Admin access required" });
      next();
    } catch { res.status(403).json({ code: "FORBIDDEN", message: "Admin access required" }); }
  };

  // Admin: list reports
  app.get('/api/admin/reports', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { status: filterStatus = "open", limit = 20, offset = 0 } = req.query;
      const whereClause = filterStatus === "all" ? undefined : eq(reports.status, filterStatus as string);
      const items = await db.select().from(reports).where(whereClause).orderBy(desc(reports.createdAt)).limit(Number(limit)).offset(Number(offset));
      // Compute counts for each status
      const allRes = await db.select({ status: reports.status, count: sql<number>`count(*)` }).from(reports).groupBy(reports.status);
      const counts: Record<string, number> = { all: 0, open: 0, reviewing: 0, resolved: 0, dismissed: 0 };
      for (const r of allRes) { counts[r.status] = Number(r.count); counts.all += Number(r.count); }
      const enriched = await Promise.all(items.map(async (r: any) => {
        const reporter = await storage.getUser(r.reporterId);
        const reported = await storage.getUser(r.reportedId);
        return { ...r, reporter: reporter ? { id: reporter.id, firstName: reporter.firstName, email: reporter.email } : null, reported: reported ? { id: reported.id, firstName: reported.firstName, email: reported.email } : null };
      }));
      res.json({ reports: enriched, counts, total: counts[filterStatus === "all" ? "all" : filterStatus as string] || 0 });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin: get report detail
  app.get('/api/admin/reports/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const [report] = await db.select().from(reports).where(eq(reports.id, parseInt(req.params.id))).limit(1);
      if (!report) return res.status(404).json({ message: "Report not found" });
      const reporter = await storage.getUser(report.reporterId);
      const reported = await storage.getUser(report.reportedId);
      res.json({ ...report, reporter, reported });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin: update report status
  app.patch('/api/admin/reports/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { status, resolutionNote } = req.body;
      const [updated] = await db.update(reports).set({ status: status || undefined, resolutionNote: resolutionNote || undefined, updatedAt: new Date() }).where(eq(reports.id, parseInt(req.params.id))).returning();
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin: suspend user
  app.post('/api/admin/users/:userId/suspend', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const targetId = req.params.userId;
      const { days, reason, messageToUser, reportId } = req.body;
      if (!days || ![1, 7, 30].includes(days)) return res.status(400).json({ message: "days must be 1, 7, or 30" });
      const expiresAt = new Date(Date.now() + days * 86400000);
      await db.update(users).set({ suspendedUntil: expiresAt, suspensionReason: reason || null }).where(eq(users.id, targetId));
      await db.insert(moderationActions).values({ adminUserId: adminId, targetUserId: targetId, reportId: reportId || null, actionType: "suspend", message: reason || null, durationDays: days, expiresAt }).returning();
      if (messageToUser) {
        await db.insert(moderationMessages).values({ userId: targetId, adminUserId: adminId, reportId: reportId || null, subject: "Account suspended", body: messageToUser });
      }
      res.json({ ok: true, suspendedUntil: expiresAt });
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  // Admin: ban user
  app.post('/api/admin/users/:userId/ban', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const targetId = req.params.userId;
      const { reason, messageToUser, reportId } = req.body;
      await db.update(users).set({ bannedAt: new Date(), suspensionReason: reason || null }).where(eq(users.id, targetId));
      await db.insert(moderationActions).values({ adminUserId: adminId, targetUserId: targetId, reportId: reportId || null, actionType: "ban", message: reason || null }).returning();
      if (messageToUser) {
        await db.insert(moderationMessages).values({ userId: targetId, adminUserId: adminId, reportId: reportId || null, subject: "Account banned", body: messageToUser });
      }
      res.json({ ok: true });
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  // Admin: send message to user
  app.post('/api/admin/users/:userId/message', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const targetId = req.params.userId;
      const { subject, body: msgBody, reportId } = req.body;
      if (!msgBody) return res.status(400).json({ message: "Message body required" });
      const [msg] = await db.insert(moderationMessages).values({ userId: targetId, adminUserId: adminId, reportId: reportId || null, subject: subject || "Message from ToyX", body: msgBody }).returning();
      await db.insert(moderationActions).values({ adminUserId: adminId, targetUserId: targetId, reportId: reportId || null, actionType: "message", message: msgBody }).returning();
      res.json({ ok: true, id: msg.id });
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  // Admin: get moderation actions for a user
  app.get('/api/admin/users/:userId/moderation-actions', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const actions = await db.select().from(moderationActions).where(eq(moderationActions.targetUserId, req.params.userId)).orderBy(desc(moderationActions.createdAt)).limit(10);
      res.json(actions);
    } catch (error: any) { res.status(500).json({ message: error.message }); }
  });

  // Block enforcement on message sending
  app.post('/api/exchanges/:id/messages', isAuthenticated, checkNotRestricted, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exchangeId = parseInt(req.params.id);
      const exchange = await storage.getExchange(exchangeId);
      if (!exchange) return res.status(404).json({ message: "Exchange not found" });
      const otherUserId = exchange.requesterId === userId ? exchange.ownerId : exchange.requesterId;
      // Check if either user has blocked the other
      const [blockedByOther, blockedOther] = await Promise.all([
        storage.isBlocked(otherUserId, userId),
        storage.isBlocked(userId, otherUserId),
      ]);
      if (blockedByOther) return res.status(403).json({ message: "You cannot send messages to this user" });
      if (blockedOther) return res.status(403).json({ message: "You have blocked this user. Unblock them to send messages." });
      const messageData = insertMessageSchema.parse({
        ...req.body,
        exchangeId,
        senderId: userId
      });
      const message = await storage.createMessage(messageData);
      const messageWithSender = {
        ...message,
        sender: await storage.getUser(userId)
      };
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'new_message',
            data: messageWithSender
          }));
        }
      });
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Rewards endpoints
  app.get('/api/rewards/me', isAuthenticated, async (req: any, res) => {
    try {
      const profile = await getRewardsProfile(req.user.claims.sub);
      res.json(profile);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post('/api/rewards/redeem', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { rewardType, toyId } = req.body;
      if (!rewardType) return res.status(400).json({ message: "rewardType required" });

      // Free-tier rewards
      const freeRewards: Record<string, { cost: number; expiresDays?: number; cooldownDays?: number }> = {
        ADD_REQUESTS_1: { cost: 50 },
        ADD_REQUESTS_5_30D: { cost: 200, expiresDays: 30 },
        ADD_LISTINGS_5_30D: { cost: 250, expiresDays: 30 },
        BOOST_LISTING_LITE_48H: { cost: 300 },
        PREMIUM_PASS_7D: { cost: 1200, cooldownDays: 30 },
      };
      // Premium-tier rewards
      const premiumRewards: Record<string, { cost: number; expiresDays?: number; cooldownDays?: number }> = {
        BUMP_LISTING_8H: { cost: 80 },
        BOOST_LISTING_LITE_48H: { cost: 300 },
        HIGHLIGHT_LISTING_3D: { cost: 450 },
      };

      const entitlements = await computeEntitlements(userId);
      const rewards = entitlements.isPremium ? premiumRewards : freeRewards;
      const def = rewards[rewardType];
      if (!def) return res.status(400).json({ message: "Unknown reward type" });

      // Boost limit check
      if (["BOOST_LISTING_LITE_48H", "BUMP_LISTING_8H", "HIGHLIGHT_LISTING_3D"].includes(rewardType)) {
        if (!toyId) return res.status(400).json({ message: "toyId required for boost" });
        const activeBoosts = await countActiveBoosts(userId);
        if (activeBoosts >= 2) return res.status(400).json({ message: "Maximum 2 boosted listings allowed" });
      }

      let expiresAt: Date | undefined;
      if (def.expiresDays) {
        expiresAt = new Date(Date.now() + def.expiresDays * 24 * 60 * 60 * 1000);
      }

      if (def.cooldownDays) {
        const userR = await db.select().from(rewardLedger).where(
          and(eq(rewardLedger.userId, userId), eq(rewardLedger.eventType, "REDEEM_PREMIUM_PASS"), gte(rewardLedger.createdAt, new Date(Date.now() - def.cooldownDays * 24 * 60 * 60 * 1000)))
        ).limit(1);
        if (userR.length) return res.status(400).json({ message: "Premium Pass can only be redeemed once every 30 days" });
      }

      const result = await spendPoints({ userId, rewardType, costPoints: def.cost, meta: rewardType.includes("BOOST") || rewardType.includes("BUMP") || rewardType.includes("HIGHLIGHT") ? { toyId } : undefined, expiresAt });
      if (!result.ok) return res.status(400).json({ message: "Insufficient points", balance: result.balance });

      // Apply boosts
      if (["BOOST_LISTING_LITE_48H", "BUMP_LISTING_8H", "HIGHLIGHT_LISTING_3D"].includes(rewardType) && toyId) {
        const durations: Record<string, number> = { BOOST_LISTING_LITE_48H: 48, BUMP_LISTING_8H: 8, HIGHLIGHT_LISTING_3D: 72 };
        await db.update(toys).set({ boostedUntil: new Date(Date.now() + (durations[rewardType] || 48) * 60 * 60 * 1000) }).where(eq(toys.id, toyId));
      }
      if (rewardType === "PREMIUM_PASS_7D") {
        const existingPass = await db.select({ premiumPassUntil: users.premiumPassUntil }).from(users).where(eq(users.id, userId)).limit(1);
        const currentEnd = existingPass[0]?.premiumPassUntil || new Date();
        const newEnd = new Date(Math.max(currentEnd.getTime(), Date.now()) + 7 * 24 * 60 * 60 * 1000);
        await db.update(users).set({ premiumPassUntil: newEnd }).where(eq(users.id, userId));
      }

      res.json({ ok: true, balance: result.balance });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Per-toy points boost redeem
  app.post('/api/toys/:toyId/boost/redeem', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const toyId = parseInt(req.params.toyId);
      const { hours = 48, costPoints = 300 } = req.body;
      const result = await redeemPointsBoost(toyId, userId, hours, costPoints);
      if (!result.ok) return res.status(400).json(result);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Per-toy paid boost init
  app.post('/api/toys/:toyId/boost/paystack/init', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.email) return res.status(400).json({ message: "User email not found" });
      const toyId = parseInt(req.params.toyId);
      const { boostType, returnTo } = req.body;
      const plans: Record<string, { amount: number; hours: number; label: string }> = {
        boost_lite: { amount: 1900, hours: 24, label: "Boost Lite" },
        boost_plus: { amount: 4900, hours: 72, label: "Boost Plus" },
        boost_max: { amount: 9900, hours: 168, label: "Boost Max" },
      };
      const plan = plans[boostType];
      if (!plan) return res.status(400).json({ message: "Invalid boost type" });
      const activeBoosts = await countActiveBoosts(userId);
      if (activeBoosts >= 2) return res.status(400).json({ message: "Maximum 2 boosted listings allowed" });
      const toy = await storage.getToy(toyId);
      if (!toy) return res.status(404).json({ message: "Toy not found" });
      if (toy.ownerId !== userId) return res.status(403).json({ message: "Not your toy" });
      if (toy.isAvailable === false) return res.status(400).json({ code: "TOY_UNAVAILABLE", message: "This listing must be available to be boosted." });
      const result = await paystackFetch("/transaction/initialize", {
        method: "POST",
        body: JSON.stringify({
          email: user.email,
          amount: plan.amount,
          callback_url: `${APP_BASE_URL}/billing-success`,
          metadata: { userId, toyId, boostType, hours: plan.hours, purpose: "toy_boost", ...(returnTo ? { returnTo } : {}) },
        }),
      });
      if (!result.status) return res.status(400).json({ message: result.message || "Paystack init failed" });
      res.json({ authorizationUrl: result.data.authorization_url });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Referral endpoints
  app.get('/api/referrals/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      let code = user?.referralCode;
      if (!code) {
        code = (user?.firstName || user?.email || "user").substring(0, 4).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
        await db.update(users).set({ referralCode: code }).where(eq(users.id, userId));
      }
      const myRefs = await db.select().from(referrals).where(eq(referrals.referrerId, userId)).orderBy(referrals.createdAt).limit(20);
      res.json({ referralCode: code, inviteLink: `/welcome?ref=${code}`, referrals: myRefs });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post('/api/referrals/claim', async (req: any, res) => {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ message: "Referral code required" });
      const referrers = await db.select().from(users).where(eq(users.referralCode, code)).limit(1);
      if (!referrers.length) return res.status(404).json({ message: "Invalid referral code" });
      const referrer = referrers[0];
      if (req.user && (req.user as any).claims?.sub === referrer.id) {
        return res.status(400).json({ message: "Cannot refer yourself" });
      }
      if (req.user) {
        const userId = (req.user as any).claims?.sub;
        const existing = await db.select().from(referrals).where(
          and(eq(referrals.referrerId, referrer.id), eq(referrals.refereeId, userId))
        ).limit(1);
        if (existing.length) return res.status(400).json({ message: "Already referred" });
        await db.insert(referrals).values({ referrerId: referrer.id, refereeId: userId, status: "pending" });
      }
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Paystack billing endpoints
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
  const PAYSTACK_MONTHLY_PLAN_CODE = process.env.PAYSTACK_MONTHLY_PLAN_CODE || "PLN_qa2hymptm1v3pks";
  const PAYSTACK_YEARLY_PLAN_CODE = process.env.PAYSTACK_YEARLY_PLAN_CODE || "PLN_6r1rrbz34iv7ct4";
  const PAYSTACK_MONTHLY_AMOUNT = parseInt(process.env.PAYSTACK_MONTHLY_AMOUNT || "8900");
  const PAYSTACK_YEARLY_AMOUNT = parseInt(process.env.PAYSTACK_YEARLY_AMOUNT || "44900");
  const APP_BASE_URL = process.env.APP_BASE_URL || "";

  async function paystackFetch(path: string, options: any = {}) {
    const res = await fetch(`https://api.paystack.co${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        ...options.headers,
      },
    });
    return res.json();
  }

  app.post('/api/billing/paystack/initialize', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.email) {
        return res.status(400).json({ message: "User email not found" });
      }
      const { planType, returnTo } = req.body;
      console.log("PAYSTACK_INIT: returnTo from client:", returnTo);
      if (planType !== "monthly" && planType !== "yearly") {
        return res.status(400).json({ message: "planType must be 'monthly' or 'yearly'" });
      }
      const planCode = planType === "monthly" ? PAYSTACK_MONTHLY_PLAN_CODE : PAYSTACK_YEARLY_PLAN_CODE;
      const amount = planType === "monthly" ? PAYSTACK_MONTHLY_AMOUNT : PAYSTACK_YEARLY_AMOUNT;
      const result = await paystackFetch("/transaction/initialize", {
        method: "POST",
        body: JSON.stringify({
          email: user.email,
          amount,
          plan: planCode,
          callback_url: `${APP_BASE_URL}/billing-success`,
          metadata: { userId, ...(returnTo ? { returnTo } : {}), ...(req.body.action ? { action: req.body.action } : {}) },
        }),
      });
      if (!result.status) {
        return res.status(400).json({ message: result.message || "Paystack initialization failed" });
      }
      res.json({ authorizationUrl: result.data.authorization_url });
    } catch (error: any) {
      console.error("Error initializing Paystack:", error);
      res.status(500).json({ message: error.message || "Failed to initialize payment" });
    }
  });

  app.get('/api/billing/paystack/verify', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { reference } = req.query;
      if (!reference) {
        return res.status(400).json({ message: "Reference is required" });
      }
      const result = await paystackFetch(`/transaction/verify/${reference}`);
      if (!result.status) {
        return res.status(400).json({ message: result.message || "Verification failed" });
      }
      const data = result.data;
      const now = new Date();
      let plan = "premium_monthly";
      let currentPeriodEnd: Date;
      if (data.plan?.plan_code === PAYSTACK_YEARLY_PLAN_CODE) {
        plan = "premium_yearly";
        currentPeriodEnd = new Date(now.getTime() + 366 * 24 * 60 * 60 * 1000);
      } else {
        currentPeriodEnd = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);
      }
      const updateData: any = {
        plan,
        subscriptionStatus: "active",
        currentPeriodEnd,
      };
      if (data.customer?.customer_code) {
        updateData.paystackCustomerCode = data.customer.customer_code;
      }
      if (data.subscription?.subscription_code) {
        updateData.paystackSubscriptionCode = data.subscription.subscription_code;
      }
      if (data.subscription?.email_token) {
        updateData.paystackEmailToken = data.subscription.email_token;
      }
      // Handle toy_boost payments separately — do NOT update subscription
      if (data.metadata?.purpose === "toy_boost") {
        const { toyId, boostType, returnTo } = data.metadata;
        const hours: Record<string, number> = { boost_lite: 24, boost_plus: 72, boost_max: 168 };
        const h = hours[boostType] || 24;
        if (toyId) {
          await applyPaidBoost(toyId, userId, h);
          await awardPoints({ userId, eventType: "PAID_BOOST", referenceType: "toy", referenceId: String(toyId), points: 0, meta: { boostType, hours: h, amount: data.amount } });
        }
        return res.json({ ok: true, purpose: "toy_boost", boostedToyId: toyId, returnTo: returnTo || null });
      }

      const updatedUser = await storage.setUserSubscriptionByUserId(userId, updateData);
      const returnTo = data.metadata?.returnTo || null;
      const action = data.metadata?.action || null;
      res.json({ ok: true, user: updatedUser, returnTo, action });
    } catch (error: any) {
      console.error("Error verifying Paystack transaction:", error);
      res.status(500).json({ message: error.message || "Verification failed" });
    }
  });

  // Paid boost via Paystack
  app.post('/api/billing/paystack/boost', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user?.email) return res.status(400).json({ message: "User email not found" });
      const { toyId, boostType } = req.body;
      if (!toyId || !boostType) return res.status(400).json({ message: "toyId and boostType required" });
      const plans: Record<string, { amount: number; hours: number; label: string }> = {
        boost_lite: { amount: 1900, hours: 24, label: "Boost Lite" },
        boost_plus: { amount: 4900, hours: 72, label: "Boost Plus" },
        boost_max: { amount: 9900, hours: 168, label: "Boost Max" },
      };
      const plan = plans[boostType];
      if (!plan) return res.status(400).json({ message: "Invalid boost type" });
      const activeBoosts = await countActiveBoosts(userId);
      if (activeBoosts >= 2) return res.status(400).json({ message: "Maximum 2 boosted listings allowed" });
      const result = await paystackFetch("/transaction/initialize", {
        method: "POST",
        body: JSON.stringify({
          email: user.email,
          amount: plan.amount,
          callback_url: `${APP_BASE_URL}/billing-success`,
          metadata: { userId, toyId, boostType, purpose: "toy_boost" },
        }),
      });
      if (!result.status) return res.status(400).json({ message: result.message || "Paystack init failed" });
      res.json({ authorizationUrl: result.data.authorization_url });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to initiate boost payment" });
    }
  });

  // Paystack webhook handler
  app.post('/api/billing/paystack/webhook', async (req: any, res) => {
    const signature = req.headers["x-paystack-signature"] as string;
    if (!signature) {
      return res.status(401).json({ message: "Missing signature" });
    }
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(req.rawBody)
      .digest("hex");
    if (hash !== signature) {
      return res.status(401).json({ message: "Invalid signature" });
    }
    try {
      const event = req.body;
      const data = event.data;
      switch (event.event) {
        case "subscription.create":
        case "subscription.enable": {
          const customerCode = data.customer?.customer_code;
          const email = data.customer?.email;
          let userId = data.metadata?.userId;
          if (!userId && customerCode) {
            const usersByCode = await db.select().from(users).where(eq(users.paystackCustomerCode, customerCode)).limit(1);
            userId = usersByCode[0]?.id;
          }
          if (!userId && email) {
            const usersByEmail = await storage.searchUsersByEmail(email);
            userId = usersByEmail[0]?.id;
          }
          if (userId) {
            const planCode = data.plan?.plan_code || data.plan_code;
            const plan = planCode === PAYSTACK_YEARLY_PLAN_CODE ? "premium_yearly" : "premium_monthly";
            const now = new Date();
            const nextPaymentDate = data.next_payment_date ? new Date(data.next_payment_date) : null;
            const updateData: any = {
              plan,
              subscriptionStatus: "active",
              paystackSubscriptionCode: data.subscription_code || data.subscription?.subscription_code,
              paystackEmailToken: data.email_token || data.subscription?.email_token,
            };
            if (customerCode) updateData.paystackCustomerCode = customerCode;
            if (nextPaymentDate) updateData.currentPeriodEnd = nextPaymentDate;
            await storage.setUserSubscriptionByUserId(userId, updateData);
          }
          break;
        }
        case "subscription.disable":
        case "subscription.expire": {
          const subCode = data.subscription_code || data.subscription?.subscription_code;
          if (subCode) {
            const usersBySub = await db.select().from(users).where(eq(users.paystackSubscriptionCode, subCode)).limit(1);
            if (usersBySub[0]) {
              await storage.setUserSubscriptionByUserId(usersBySub[0].id, { subscriptionStatus: "canceled" });
            }
          }
          break;
        }
        case "charge.success": {
          if (data.metadata?.purpose === "toy_boost") {
            const { userId, toyId } = data.metadata;
            const hours: Record<string, number> = { boost_lite: 24, boost_plus: 72, boost_max: 168 };
            const boostType = data.metadata.boostType || "boost_lite";
            const h = hours[boostType] || 24;
            await applyPaidBoost(toyId, userId, h);
            await awardPoints({ userId, eventType: "PAID_BOOST", referenceType: "toy", referenceId: String(toyId), points: 0, meta: { boostType, hours: h, amount: data.amount } });
          }
          break;
        }
        case "invoice.payment_failed":
        case "charge.failed": {
          const custCode = data.customer?.customer_code;
          if (custCode) {
            await storage.setUserSubscriptionByCustomerCode(custCode, { subscriptionStatus: "past_due" });
          }
          break;
        }
      }
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error("Error handling webhook:", error);
      res.status(200).json({ ok: true });
    }
  });

  app.post('/api/billing/paystack/cancel', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      // Try Paystack API if we have subscription details
      if (user?.paystackSubscriptionCode && user?.paystackEmailToken) {
        try {
          await paystackFetch("/subscription/disable", {
            method: "POST",
            body: JSON.stringify({
              code: user.paystackSubscriptionCode,
              token: user.paystackEmailToken,
            }),
          });
        } catch (paystackErr) {
          console.warn("Paystack cancel API failed, canceling locally:", paystackErr);
        }
      }
      await storage.setUserSubscriptionByUserId(userId, {
        plan: "free",
        subscriptionStatus: "canceled",
        paystackSubscriptionCode: null,
        paystackEmailToken: null,
      });
      res.json({ ok: true });
    } catch (error: any) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ message: error.message || "Failed to cancel subscription" });
    }
  });

  const httpServer = createServer(app);
  
  // WebSocket server for real-time messaging
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        // Handle different message types if needed
        console.log('Received WebSocket message:', data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  // API 404 fallback — unknown /api/* routes return JSON, never Vite HTML
  app.use("/api", (req, res) => {
    res.status(404).json({ code: "NOT_FOUND", message: "API route not found" });
  });

  return httpServer;
}
