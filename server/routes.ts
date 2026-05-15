import crypto from "crypto";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { eq, and, or, gte, inArray } from "drizzle-orm";
import { storage } from "./storage";
import { db } from "./db";
import { users, toys, exchanges, messages, reviews, referrals, rewardRedemptions, rewardLedger } from "@shared/schema";
import { setupAuth, isAuthenticated } from "./localAuth";
import { insertToySchema, insertExchangeSchema, insertMessageSchema, insertFavoriteSchema, insertReviewSchema } from "@shared/schema";
import { computeEntitlements, awardPoints, checkDailyCap, qualifyReferral, getRewardsProfile, spendPoints, ensureUserRewards } from "./rewards";

async function getPremiumStatus(userId: string) {
  const e = await computeEntitlements(userId);
  return e.isPremium;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

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
      res.json(toys);
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
      let recentlyAdded = await storage.getToysWithOwners(eq(toys.isAvailable, true), 10);

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
        const allToys = await storage.getToysWithOwners(eq(toys.isAvailable, true));
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

      // Add isFavorited for each toy
      const addFav = async (toy: any) => { toy.isFavorited = await storage.isFavorite(userId, toy.id); return toy; };
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

  app.post('/api/toys', isAuthenticated, async (req: any, res) => {
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
      const toyData = insertToySchema.parse({ ...req.body, ownerId: userId });
      const toy = await storage.createToy(toyData);
      // Award quality listing points
      const isQuality = (toyData.imageUrls?.length || 0) >= 2 && (toyData.description?.length || 0) >= 30;
      if (isQuality && await checkDailyCap(userId, "TOY_LISTED", 5)) {
        await awardPoints({ userId, eventType: "TOY_LISTED", referenceType: "toy", referenceId: String(toy.id), points: 5 });
      }
      res.status(201).json(toy);
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
      res.json(toys);
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
      const updated = await storage.updateToy(toyId, req.body);
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
      await storage.deleteToy(toyId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to delete toy" });
    }
  });

  // Exchange routes
  app.get('/api/exchanges', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exchanges = await storage.getExchanges(userId);
      res.json(exchanges);
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

  app.post('/api/exchanges', isAuthenticated, async (req: any, res) => {
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
          console.log("Initial message created:", message);
        } catch (messageError) {
          console.error("Failed to create initial message:", messageError);
          // Don't fail the exchange creation if message creation fails
        }
      }
      
      res.status(201).json(exchange);
    } catch (error) {
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
    } catch (error) {
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

  app.post('/api/exchanges/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exchangeId = parseInt(req.params.id);
      const messageData = insertMessageSchema.parse({
        ...req.body,
        exchangeId,
        senderId: userId
      });
      const message = await storage.createMessage(messageData);
      
      // Broadcast message to WebSocket clients
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
      if (reviewData.rating === 5) {
        await awardPoints({ userId: reviewData.revieweeId, eventType: "REVIEW_RECEIVED_5STAR", referenceType: "review", referenceId: String(review.id), points: 10 });
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

      // Define rewards
      const rewards: Record<string, { cost: number; expiresDays?: number; cooldownDays?: number }> = {
        BOOST_LISTING_48H: { cost: 300 },
        ADD_REQUESTS_5_30D: { cost: 200, expiresDays: 30 },
        ADD_LISTINGS_5_30D: { cost: 250, expiresDays: 30 },
        PREMIUM_PASS_7D: { cost: 1200, cooldownDays: 30 },
      };
      const def = rewards[rewardType];
      if (!def) return res.status(400).json({ message: "Unknown reward type" });

      let expiresAt: Date | undefined;
      if (def.expiresDays) {
        expiresAt = new Date(Date.now() + def.expiresDays * 24 * 60 * 60 * 1000);
      }

      // Cooldown check for premium pass
      if (def.cooldownDays) {
        const userR = await db.select().from(rewardLedger).where(
          and(eq(rewardLedger.userId, userId), eq(rewardLedger.eventType, "REDEEM_PREMIUM_PASS"), gte(rewardLedger.createdAt, new Date(Date.now() - def.cooldownDays * 24 * 60 * 60 * 1000)))
        ).limit(1);
        if (userR.length) return res.status(400).json({ message: "Premium Pass can only be redeemed once every 30 days" });
      }

      const result = await spendPoints({ userId, rewardType: rewardType, costPoints: def.cost, meta: rewardType === "BOOST_LISTING_48H" ? { toyId } : undefined, expiresAt });
      if (!result.ok) return res.status(400).json({ message: "Insufficient points", balance: result.balance });

      // Apply boost listing
      if (rewardType === "BOOST_LISTING_48H" && toyId) {
        await db.update(toys).set({ boostedUntil: new Date(Date.now() + 48 * 60 * 60 * 1000) }).where(eq(toys.id, toyId));
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
      const { planType } = req.body;
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
          metadata: { userId },
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
      const updatedUser = await storage.setUserSubscriptionByUserId(userId, updateData);
      res.json({ ok: true, user: updatedUser });
    } catch (error: any) {
      console.error("Error verifying Paystack transaction:", error);
      res.status(500).json({ message: error.message || "Verification failed" });
    }
  });

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

  return httpServer;
}
