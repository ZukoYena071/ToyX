var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import "dotenv/config";
import express2 from "express";

// server/routes.ts
import crypto from "crypto";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { eq as eq3, and as and3, or as or2, gte as gte3, inArray as inArray3 } from "drizzle-orm";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  exchanges: () => exchanges,
  exchangesRelations: () => exchangesRelations,
  favorites: () => favorites,
  favoritesRelations: () => favoritesRelations,
  insertExchangeSchema: () => insertExchangeSchema,
  insertFavoriteSchema: () => insertFavoriteSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertReviewSchema: () => insertReviewSchema,
  insertToySchema: () => insertToySchema,
  messages: () => messages,
  messagesRelations: () => messagesRelations,
  referrals: () => referrals,
  reviews: () => reviews,
  reviewsRelations: () => reviewsRelations,
  rewardLedger: () => rewardLedger,
  rewardRedemptions: () => rewardRedemptions,
  sessions: () => sessions,
  toyInteractions: () => toyInteractions,
  toys: () => toys,
  toysRelations: () => toysRelations,
  userRewards: () => userRewards,
  users: () => users,
  usersRelations: () => usersRelations
});
import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  real
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  bio: text("bio"),
  location: varchar("location", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  plan: varchar("plan", { length: 50 }).notNull().default("free"),
  subscriptionStatus: varchar("subscription_status", { length: 50 }).notNull().default("inactive"),
  currentPeriodEnd: timestamp("current_period_end"),
  paystackCustomerCode: varchar("paystack_customer_code", { length: 255 }),
  paystackSubscriptionCode: varchar("paystack_subscription_code", { length: 255 }),
  paystackEmailToken: varchar("paystack_email_token", { length: 255 }),
  premiumPassUntil: timestamp("premium_pass_until"),
  referralCode: varchar("referral_code", { length: 32 }),
  showLocation: boolean("show_location").default(true),
  showEmail: boolean("show_email").default(true),
  showPhone: boolean("show_phone").default(false),
  messagePrivacy: varchar("message_privacy", { length: 20 }).default("everyone"),
  onboardingVersion: integer("onboarding_version").default(0),
  latitude: real("latitude"),
  longitude: real("longitude"),
  locationEnabled: boolean("location_enabled").default(false),
  locationUpdatedAt: timestamp("location_updated_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var toys = pgTable("toys", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  ageGroup: varchar("age_group", { length: 50 }).notNull(),
  condition: varchar("condition", { length: 50 }).notNull(),
  imageUrls: text("image_urls").array(),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  isAvailable: boolean("is_available").default(true),
  location: varchar("location", { length: 255 }),
  latitude: real("latitude"),
  longitude: real("longitude"),
  boostedUntil: timestamp("boosted_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var exchanges = pgTable("exchanges", {
  id: serial("id").primaryKey(),
  requesterId: varchar("requester_id").notNull().references(() => users.id),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  toyId: integer("toy_id").notNull().references(() => toys.id),
  offeredToyId: integer("offered_toy_id").references(() => toys.id),
  status: varchar("status", { length: 50 }).default("pending"),
  requestMessage: text("request_message"),
  requesterConfirmed: boolean("requester_confirmed").default(false),
  ownerConfirmed: boolean("owner_confirmed").default(false),
  requesterLastReadAt: timestamp("requester_last_read_at"),
  ownerLastReadAt: timestamp("owner_last_read_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  exchangeId: integer("exchange_id").notNull().references(() => exchanges.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 50 }).default("text"),
  reactions: jsonb("reactions").default([]),
  createdAt: timestamp("created_at").defaultNow()
});
var favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  toyId: integer("toy_id").notNull().references(() => toys.id),
  createdAt: timestamp("created_at").defaultNow()
});
var usersRelations = relations(users, ({ many }) => ({
  toys: many(toys),
  sentExchanges: many(exchanges, { relationName: "requester" }),
  receivedExchanges: many(exchanges, { relationName: "owner" }),
  messages: many(messages),
  favorites: many(favorites),
  givenReviews: many(reviews, { relationName: "reviewReviewer" }),
  receivedReviews: many(reviews, { relationName: "reviewReviewee" })
}));
var toysRelations = relations(toys, ({ one, many }) => ({
  owner: one(users, {
    fields: [toys.ownerId],
    references: [users.id]
  }),
  exchanges: many(exchanges),
  favorites: many(favorites)
}));
var exchangesRelations = relations(exchanges, ({ one, many }) => ({
  requester: one(users, {
    fields: [exchanges.requesterId],
    references: [users.id],
    relationName: "requester"
  }),
  owner: one(users, {
    fields: [exchanges.ownerId],
    references: [users.id],
    relationName: "owner"
  }),
  toy: one(toys, {
    fields: [exchanges.toyId],
    references: [toys.id]
  }),
  messages: many(messages),
  reviews: many(reviews)
}));
var messagesRelations = relations(messages, ({ one }) => ({
  exchange: one(exchanges, {
    fields: [messages.exchangeId],
    references: [exchanges.id]
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id]
  })
}));
var favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id]
  }),
  toy: one(toys, {
    fields: [favorites.toyId],
    references: [toys.id]
  })
}));
var toyInteractions = pgTable("toy_interactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  toyId: integer("toy_id").notNull().references(() => toys.id),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => [
  index("idx_interactions_user").on(table.userId, table.createdAt),
  index("idx_interactions_user_event").on(table.userId, table.eventType, table.createdAt),
  index("idx_interactions_toy_event").on(table.toyId, table.eventType)
]);
var reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  exchangeId: integer("exchange_id").notNull().references(() => exchanges.id),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id),
  revieweeId: varchar("reviewee_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(),
  // 1-5 stars
  comment: text("comment"),
  isAnonymous: boolean("is_anonymous").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var reviewsRelations = relations(reviews, ({ one }) => ({
  exchange: one(exchanges, {
    fields: [reviews.exchangeId],
    references: [exchanges.id]
  }),
  reviewer: one(users, {
    fields: [reviews.reviewerId],
    references: [users.id],
    relationName: "reviewReviewer"
  }),
  reviewee: one(users, {
    fields: [reviews.revieweeId],
    references: [users.id],
    relationName: "reviewReviewee"
  })
}));
var userRewards = pgTable("user_rewards", {
  userId: varchar("user_id").primaryKey().notNull().references(() => users.id),
  pointsBalance: integer("points_balance").notNull().default(0),
  pointsLifetime: integer("points_lifetime").notNull().default(0),
  badges: jsonb("badges").notNull().default([]),
  lastPremiumRedeemAt: timestamp("last_premium_redeem_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var rewardLedger = pgTable("reward_ledger", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  points: integer("points").notNull(),
  referenceType: varchar("reference_type", { length: 32 }).notNull(),
  referenceId: varchar("reference_id", { length: 64 }).notNull(),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => [index("idx_ledger_unique").on(table.userId, table.eventType, table.referenceId)]);
var rewardRedemptions = pgTable("reward_redemptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  rewardType: varchar("reward_type", { length: 64 }).notNull(),
  costPoints: integer("cost_points").notNull(),
  meta: jsonb("meta"),
  startsAt: timestamp("starts_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow()
});
var referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: varchar("referrer_id").notNull().references(() => users.id),
  refereeId: varchar("referee_id").references(() => users.id),
  refereeEmail: varchar("referee_email"),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  qualifiedAt: timestamp("qualified_at")
});
var insertToySchema = createInsertSchema(toys, {
  imageUrls: z.array(z.string().min(1)).min(1, "At least 1 image is required")
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertExchangeSchema = createInsertSchema(exchanges).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true
});
var insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true
});
var insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true
});

// server/db.ts
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
var { Pool } = pg;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, and, or, ilike, sql, gte } from "drizzle-orm";
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async searchUsersByEmail(email) {
    return await db.select().from(users).where(eq(users.email, email));
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  async updateUser(id, userData) {
    const [user] = await db.update(users).set({ ...userData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return user;
  }
  async setUserSubscriptionByUserId(userId, data) {
    const [user] = await db.update(users).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, userId)).returning();
    return user;
  }
  async setUserSubscriptionByCustomerCode(customerCode, data) {
    const [user] = await db.update(users).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.paystackCustomerCode, customerCode)).returning();
    return user;
  }
  async countActiveListings(userId) {
    const [result] = await db.select({ count: sql`count(*)` }).from(toys).where(and(eq(toys.ownerId, userId), eq(toys.isAvailable, true)));
    return Number(result?.count || 0);
  }
  async countOutgoingExchangeRequestsThisMonth(userId) {
    const now = /* @__PURE__ */ new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [result] = await db.select({ count: sql`count(*)` }).from(exchanges).where(
      and(
        eq(exchanges.requesterId, userId),
        sql`${exchanges.createdAt} >= ${startOfMonth}`
      )
    );
    return Number(result?.count || 0);
  }
  async countActiveOutgoingExchanges(userId) {
    const [result] = await db.select({ count: sql`count(*)` }).from(exchanges).where(
      and(
        eq(exchanges.requesterId, userId),
        sql`${exchanges.status} IN ('pending', 'accepted')`
      )
    );
    return Number(result?.count || 0);
  }
  // Toy operations
  async getToys() {
    return await db.select().from(toys).leftJoin(users, eq(toys.ownerId, users.id)).where(eq(toys.isAvailable, true)).orderBy(desc(toys.createdAt)).then(
      (rows) => rows.map((row) => ({
        ...row.toys,
        owner: row.users
      }))
    );
  }
  async getToy(id) {
    const [result] = await db.select().from(toys).leftJoin(users, eq(toys.ownerId, users.id)).where(eq(toys.id, id));
    if (!result) return void 0;
    return {
      ...result.toys,
      owner: result.users
    };
  }
  async getToysByUser(userId) {
    return await db.select().from(toys).leftJoin(users, eq(toys.ownerId, users.id)).where(eq(toys.ownerId, userId)).orderBy(desc(toys.createdAt)).then(
      (rows) => rows.map((row) => ({
        ...row.toys,
        owner: row.users
      }))
    );
  }
  async createToy(toy) {
    const [newToy] = await db.insert(toys).values(toy).returning();
    return newToy;
  }
  async updateToy(id, toy) {
    const [updatedToy] = await db.update(toys).set({ ...toy, updatedAt: /* @__PURE__ */ new Date() }).where(eq(toys.id, id)).returning();
    return updatedToy;
  }
  async deleteToy(id) {
    await db.delete(toys).where(eq(toys.id, id));
  }
  async searchToys(query) {
    return await db.select().from(toys).leftJoin(users, eq(toys.ownerId, users.id)).where(
      and(
        eq(toys.isAvailable, true),
        or(
          ilike(toys.name, `%${query}%`),
          ilike(toys.description, `%${query}%`),
          ilike(toys.category, `%${query}%`)
        )
      )
    ).orderBy(desc(toys.createdAt)).then(
      (rows) => rows.map((row) => ({
        ...row.toys,
        owner: row.users
      }))
    );
  }
  async getToysByCategory(category) {
    return await db.select().from(toys).leftJoin(users, eq(toys.ownerId, users.id)).where(
      and(
        eq(toys.isAvailable, true),
        eq(toys.category, category)
      )
    ).orderBy(desc(toys.createdAt)).then(
      (rows) => rows.map((row) => ({
        ...row.toys,
        owner: row.users
      }))
    );
  }
  // Exchange operations
  async getExchanges(userId) {
    return await db.select().from(exchanges).leftJoin(users, eq(exchanges.requesterId, users.id)).leftJoin(toys, eq(exchanges.toyId, toys.id)).where(
      or(
        eq(exchanges.requesterId, userId),
        eq(exchanges.ownerId, userId)
      )
    ).orderBy(desc(exchanges.createdAt)).then(async (rows) => {
      const exchangeDetails = await Promise.all(rows.map(async (row) => {
        const requester = await this.getUser(row.exchanges.requesterId);
        const owner = await this.getUser(row.exchanges.ownerId);
        const exchangeMessages = await this.getMessages(row.exchanges.id);
        return {
          ...row.exchanges,
          requester,
          owner,
          toy: row.toys,
          messages: exchangeMessages
        };
      }));
      return exchangeDetails;
    });
  }
  async getExchange(id) {
    const [result] = await db.select().from(exchanges).leftJoin(toys, eq(exchanges.toyId, toys.id)).where(eq(exchanges.id, id));
    if (!result) return void 0;
    const requester = await this.getUser(result.exchanges.requesterId);
    const owner = await this.getUser(result.exchanges.ownerId);
    const exchangeMessages = await this.getMessages(id);
    return {
      ...result.exchanges,
      requester,
      owner,
      toy: result.toys,
      messages: exchangeMessages
    };
  }
  async createExchange(exchange) {
    console.log("Storage: creating exchange with data:", exchange);
    try {
      const [newExchange] = await db.insert(exchanges).values(exchange).returning();
      console.log("Storage: exchange created successfully:", newExchange);
      return newExchange;
    } catch (error) {
      console.error("Storage: error creating exchange:", error);
      throw error;
    }
  }
  async updateExchangeStatus(id, status) {
    const [updatedExchange] = await db.update(exchanges).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(exchanges.id, id)).returning();
    return updatedExchange;
  }
  async markExchangeRead(exchangeId, userId) {
    const [ex] = await db.select().from(exchanges).where(eq(exchanges.id, exchangeId)).limit(1);
    if (!ex) throw new Error("Exchange not found");
    if (ex.requesterId === userId) {
      const [updated] = await db.update(exchanges).set({ requesterLastReadAt: /* @__PURE__ */ new Date() }).where(eq(exchanges.id, exchangeId)).returning();
      return updated;
    } else if (ex.ownerId === userId) {
      const [updated] = await db.update(exchanges).set({ ownerLastReadAt: /* @__PURE__ */ new Date() }).where(eq(exchanges.id, exchangeId)).returning();
      return updated;
    }
    throw new Error("User not part of this exchange");
  }
  async confirmExchangeCompletion(exchangeId, userId) {
    const [currentExchange] = await db.select().from(exchanges).where(eq(exchanges.id, exchangeId));
    if (!currentExchange) {
      throw new Error("Exchange not found");
    }
    if (currentExchange.requesterId !== userId && currentExchange.ownerId !== userId) {
      throw new Error("User not authorized for this exchange");
    }
    const isRequester = currentExchange.requesterId === userId;
    const updateData = isRequester ? { requesterConfirmed: true } : { ownerConfirmed: true };
    const [updatedExchange] = await db.update(exchanges).set({ ...updateData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(exchanges.id, exchangeId)).returning();
    const bothConfirmed = isRequester ? updatedExchange.ownerConfirmed && true : updatedExchange.requesterConfirmed && true;
    if (bothConfirmed) {
      const [finalExchange] = await db.update(exchanges).set({ status: "completed", updatedAt: /* @__PURE__ */ new Date() }).where(eq(exchanges.id, exchangeId)).returning();
      return finalExchange;
    }
    return updatedExchange;
  }
  // Message operations
  async getMessages(exchangeId) {
    return await db.select().from(messages).leftJoin(users, eq(messages.senderId, users.id)).where(eq(messages.exchangeId, exchangeId)).orderBy(messages.createdAt).then(
      (rows) => rows.map((row) => ({
        ...row.messages,
        sender: row.users
      }))
    );
  }
  async createMessage(message) {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }
  // Favorite operations
  async getFavorites(userId) {
    return await db.select().from(favorites).leftJoin(toys, eq(favorites.toyId, toys.id)).leftJoin(users, eq(toys.ownerId, users.id)).where(eq(favorites.userId, userId)).orderBy(desc(favorites.createdAt)).then(
      (rows) => rows.map((row) => ({
        ...row.toys,
        owner: row.users
      }))
    );
  }
  async addFavorite(favorite) {
    const [newFavorite] = await db.insert(favorites).values(favorite).returning();
    return newFavorite;
  }
  async removeFavorite(userId, toyId) {
    await db.delete(favorites).where(
      and(
        eq(favorites.userId, userId),
        eq(favorites.toyId, toyId)
      )
    );
  }
  async isFavorite(userId, toyId) {
    const [result] = await db.select().from(favorites).where(
      and(
        eq(favorites.userId, userId),
        eq(favorites.toyId, toyId)
      )
    );
    return !!result;
  }
  // Review operations
  async getReviews(userId) {
    return await db.select().from(reviews).leftJoin(users, eq(reviews.reviewerId, users.id)).where(eq(reviews.revieweeId, userId)).orderBy(desc(reviews.createdAt)).then(
      (rows) => rows.map((row) => ({
        ...row.reviews,
        reviewer: row.users,
        reviewee: { id: userId }
      }))
    );
  }
  async getUserAverageRating(userId) {
    try {
      const result = await db.select({
        avgRating: sql`COALESCE(AVG(${reviews.rating}), 0)`
      }).from(reviews).where(eq(reviews.revieweeId, userId));
      return Number(result[0]?.avgRating || 0);
    } catch (error) {
      console.error("Error getting user average rating:", error);
      return 0;
    }
  }
  async createReview(review) {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }
  async canUserReview(exchangeId, reviewerId) {
    const [exchange] = await db.select().from(exchanges).where(eq(exchanges.id, exchangeId));
    if (!exchange || exchange.status !== "completed") {
      return false;
    }
    const isParticipant = exchange.requesterId === reviewerId || exchange.ownerId === reviewerId;
    if (!isParticipant) {
      return false;
    }
    const [existingReview] = await db.select().from(reviews).where(
      and(
        eq(reviews.exchangeId, exchangeId),
        eq(reviews.reviewerId, reviewerId)
      )
    );
    return !existingReview;
  }
  // ---- Personalization methods ----
  async logToyInteraction(userId, toyId, eventType) {
    await db.insert(toyInteractions).values({ userId, toyId, eventType, createdAt: /* @__PURE__ */ new Date() });
  }
  async updateUserLocation(userId, payload) {
    const updateData = { locationEnabled: payload.enabled, locationUpdatedAt: /* @__PURE__ */ new Date() };
    if (payload.enabled && payload.latitude != null && payload.longitude != null) {
      updateData.latitude = Number(payload.latitude.toFixed(3));
      updateData.longitude = Number(payload.longitude.toFixed(3));
      if (payload.location !== void 0) updateData.location = payload.location;
    } else if (!payload.enabled) {
      updateData.latitude = null;
      updateData.longitude = null;
    }
    const [user] = await db.update(users).set(updateData).where(eq(users.id, userId)).returning();
    return user;
  }
  async getUserTasteProfile(userId) {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1e3);
    const weights = { TOY_VIEW: 1, TOY_FAVORITE: 5, TOY_UNFAVORITE: -3, EXCHANGE_REQUEST_CREATED: 10, EXCHANGE_COMPLETED: 20 };
    const rows = await db.select({ eventType: toyInteractions.eventType, category: toys.category, ageGroup: toys.ageGroup }).from(toyInteractions).innerJoin(toys, eq(toyInteractions.toyId, toys.id)).where(and(eq(toyInteractions.userId, userId), gte(toyInteractions.createdAt, cutoff)));
    const catScores = {};
    const ageScores = {};
    for (const r of rows) {
      const w = weights[r.eventType] || 1;
      if (r.category) {
        for (const c of r.category.split(/[,|/;]/).map((s) => s.trim()).filter(Boolean)) {
          catScores[c] = (catScores[c] || 0) + w;
        }
      }
      if (r.ageGroup) {
        for (const a of r.ageGroup.split(/[,|/;]/).map((s) => s.trim()).filter(Boolean)) {
          ageScores[a] = (ageScores[a] || 0) + w;
        }
      }
    }
    return {
      topCategories: Object.entries(catScores).sort((a, b) => b[1] - a[1]).slice(0, 3).map((e) => e[0]),
      topAges: Object.entries(ageScores).sort((a, b) => b[1] - a[1]).slice(0, 3).map((e) => e[0])
    };
  }
  async getToysWithOwners(whereClause, limitVal) {
    let query = db.select().from(toys).leftJoin(users, eq(toys.ownerId, users.id));
    if (whereClause) query = query.where(whereClause);
    if (limitVal) query = query.limit(limitVal);
    return (await query.orderBy(desc(toys.createdAt))).map((r) => ({ ...r.toys, owner: r.users }));
  }
  async getCandidateToysNearUser(userId, lat, lng, radiusKm = 20) {
    const rows = await db.execute(sql`
      SELECT t.*, row_to_json(u.*) as owner,
        (6371 * acos(cos(radians(${lat})) * cos(radians(t.latitude)) * cos(radians(t.longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(t.latitude)))) AS distance_km
      FROM toys t
      LEFT JOIN users u ON u.id = t.owner_id
      WHERE t.is_available = true AND t.latitude IS NOT NULL AND t.longitude IS NOT NULL
        AND (6371 * acos(cos(radians(${lat})) * cos(radians(t.latitude)) * cos(radians(t.longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(t.latitude)))) <= ${radiusKm}
      ORDER BY distance_km ASC, t.created_at DESC
      LIMIT 200
    `);
    return rows.map((r) => ({ ...r, owner: r.owner, distanceKm: Number(r.distance_km) }));
  }
};
var storage = new DatabaseStorage();

// server/localAuth.ts
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import memorystore from "memorystore";
var MemoryStore = memorystore(session);
function getSession() {
  return session({
    secret: process.env.SESSION_SECRET || "local-dev-secret",
    store: new MemoryStore({ checkPeriod: 864e5 }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1e3
    }
  });
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, _password, done) => {
        try {
          const users2 = await storage.searchUsersByEmail(email);
          const user = users2.length > 0 ? users2[0] : void 0;
          if (!user) {
            return done(null, false, { message: "User not found" });
          }
          return done(null, { id: user.id, sub: user.id });
        } catch (err) {
          return done(err);
        }
      }
    )
  );
  passport.serializeUser((user, cb) => cb(null, user.id));
  passport.deserializeUser(async (id, cb) => {
    try {
      const user = await storage.getUser(id);
      if (user) {
        cb(null, { id: user.id, sub: user.id, claims: { sub: user.id } });
      } else {
        cb(null, false);
      }
    } catch (err) {
      cb(err);
    }
  });
  app2.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Login failed" });
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        res.json({ message: "Logged in", user });
      });
    })(req, res, next);
  });
  app2.get("/api/logout", (req, res, next) => {
    req.logout(() => {
      res.redirect("/login");
    });
  });
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
  const APP_BASE_URL = process.env.APP_BASE_URL || "";
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && APP_BASE_URL) {
    passport.use(new GoogleStrategy({
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${APP_BASE_URL}/api/auth/google/callback`
    }, async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName?.split(" ") || [];
        const existing = email ? await storage.searchUsersByEmail(email) : [];
        let user = existing[0];
        if (!user) {
          const userId = `google_${profile.id}`;
          await storage.upsertUser({
            id: userId,
            email: email || `google_${profile.id}@placeholder.com`,
            firstName: name[0] || profile.displayName || "Google",
            lastName: name.slice(1).join(" ") || "",
            profileImageUrl: profile.photos?.[0]?.value?.replace(/^http:/, "https:") || null
          });
          user = await storage.getUser(userId);
        }
        if (user) {
          done(null, { id: user.id, sub: user.id, claims: { sub: user.id }, expires_at: Math.floor(Date.now() / 1e3) + 86400, access_token: _accessToken, refresh_token: _refreshToken });
        } else {
          done(null, false);
        }
      } catch (err) {
        done(err);
      }
    }));
    app2.get("/api/auth/google", passport.authenticate("google", { scope: ["profile", "email"], session: true }));
    app2.get("/api/auth/google/callback", passport.authenticate("google", { successReturnToOrRedirect: "/", failureRedirect: "/login" }));
    console.log("Google OAuth configured");
  }
  try {
    const demoUser = await storage.getUser("demo-user-1");
    if (!demoUser) {
      await storage.upsertUser({
        id: "demo-user-1",
        email: "demo@gmail.com",
        firstName: "Demo",
        lastName: "User",
        profileImageUrl: null
      });
      await storage.upsertUser({
        id: "demo-user-2",
        email: "parent@gmail.com",
        firstName: "Parent",
        lastName: "Test",
        profileImageUrl: null
      });
      console.log("Demo users created");
    }
  } catch (e) {
    console.log("Note: demo users not yet created (tables may not exist yet)");
  }
}
var isAuthenticated = async (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// server/rewards.ts
import { eq as eq2, and as and2, sql as sql2, gte as gte2, desc as desc2 } from "drizzle-orm";
var BASE_FREE_LISTINGS = 5;
var BASE_FREE_REQUESTS = 3;
var BASE_FREE_EXCHANGES = 2;
async function ensureUserRewards(userId) {
  const existing = await db.select().from(userRewards).where(eq2(userRewards.userId, userId)).limit(1);
  if (existing.length === 0) {
    await db.insert(userRewards).values({ userId, pointsBalance: 0, pointsLifetime: 0, badges: [] });
  }
}
async function awardPoints(opts) {
  await ensureUserRewards(opts.userId);
  try {
    await db.insert(rewardLedger).values({
      userId: opts.userId,
      eventType: opts.eventType,
      points: opts.points,
      referenceType: opts.referenceType,
      referenceId: opts.referenceId,
      meta: opts.meta || null
    });
    await db.update(userRewards).set({
      pointsBalance: sql2`${userRewards.pointsBalance} + ${opts.points}`,
      pointsLifetime: sql2`${userRewards.pointsLifetime} + ${opts.points}`,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq2(userRewards.userId, opts.userId));
    return { awarded: true };
  } catch (e) {
    if (e.code === "23505") return { awarded: false };
    throw e;
  }
}
async function spendPoints(opts) {
  await ensureUserRewards(opts.userId);
  const reward = await db.select().from(userRewards).where(eq2(userRewards.userId, opts.userId)).limit(1);
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
    meta: { rewardType: opts.rewardType, ...opts.meta }
  });
  await db.update(userRewards).set({
    pointsBalance: sql2`${userRewards.pointsBalance} - ${opts.costPoints}`,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq2(userRewards.userId, opts.userId));
  await db.insert(rewardRedemptions).values({
    userId: opts.userId,
    rewardType: opts.rewardType,
    costPoints: opts.costPoints,
    meta: opts.meta || null,
    expiresAt: opts.expiresAt || null
  });
  const updated = await db.select().from(userRewards).where(eq2(userRewards.userId, opts.userId)).limit(1);
  return { ok: true, balance: updated[0]?.pointsBalance || 0 };
}
async function computeEntitlements(userId) {
  const user = await db.select().from(users).where(eq2(users.id, userId)).limit(1);
  if (!user.length) {
    return { isPremium: false, hasPremiumPass: false, maxActiveListings: BASE_FREE_LISTINGS, maxMonthlyRequests: BASE_FREE_REQUESTS, maxActiveOutgoingExchanges: BASE_FREE_EXCHANGES };
  }
  const u = user[0];
  const now = /* @__PURE__ */ new Date();
  const isPaystackPremium = u.plan?.startsWith("premium_") && u.subscriptionStatus === "active" && (!u.currentPeriodEnd || u.currentPeriodEnd > now);
  const hasPremiumPass = !!u.premiumPassUntil && u.premiumPassUntil > now;
  const isPremium = isPaystackPremium || hasPremiumPass;
  const activeBoosts = await db.select().from(rewardRedemptions).where(
    and2(eq2(rewardRedemptions.userId, userId), gte2(rewardRedemptions.expiresAt || now, now))
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
    maxActiveOutgoingExchanges: isPremium ? 9999 : BASE_FREE_EXCHANGES
  };
}
async function getRewardsProfile(userId) {
  await ensureUserRewards(userId);
  const reward = await db.select().from(userRewards).where(eq2(userRewards.userId, userId)).limit(1);
  const ledger = await db.select().from(rewardLedger).where(eq2(rewardLedger.userId, userId)).orderBy(desc2(rewardLedger.createdAt)).limit(20);
  const entitlements = await computeEntitlements(userId);
  const redemptions = await db.select().from(rewardRedemptions).where(eq2(rewardRedemptions.userId, userId)).orderBy(desc2(rewardRedemptions.createdAt)).limit(10);
  return {
    pointsBalance: reward[0]?.pointsBalance || 0,
    pointsLifetime: reward[0]?.pointsLifetime || 0,
    badges: reward[0]?.badges || [],
    lastPremiumRedeemAt: reward[0]?.lastPremiumRedeemAt || null,
    recentLedger: ledger,
    recentRedemptions: redemptions,
    entitlements
  };
}
async function checkDailyCap(userId, eventType, maxPerDay) {
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [result] = await db.select({ count: sql2`count(*)` }).from(rewardLedger).where(
    and2(eq2(rewardLedger.userId, userId), eq2(rewardLedger.eventType, eventType), gte2(rewardLedger.createdAt, today))
  );
  return (result?.count || 0) < maxPerDay;
}
async function qualifyReferral(refereeId) {
  const refs = await db.select().from(referrals).where(
    and2(eq2(referrals.refereeId, refereeId), eq2(referrals.status, "pending"))
  ).limit(1);
  if (!refs.length) return;
  const ref = refs[0];
  await db.update(referrals).set({ status: "qualified", qualifiedAt: /* @__PURE__ */ new Date() }).where(eq2(referrals.id, ref.id));
  await awardPoints({ userId: ref.referrerId, eventType: "REFERRAL_QUALIFIED", referenceType: "referral", referenceId: `ref_${ref.id}_referrer`, points: 200, meta: { refereeId } });
  const referrer = await db.select().from(users).where(eq2(users.id, ref.referrerId)).limit(1);
  if (referrer.length) {
    const existingPass = referrer[0].premiumPassUntil || /* @__PURE__ */ new Date();
    const newPass = new Date(Math.max(existingPass.getTime(), Date.now()) + 7 * 24 * 60 * 60 * 1e3);
    await db.update(users).set({ premiumPassUntil: newPass }).where(eq2(users.id, ref.referrerId));
  }
  await awardPoints({ userId: refereeId, eventType: "REFERRAL_QUALIFIED_REFEREE", referenceType: "referral", referenceId: `ref_${ref.id}_referee`, points: 100, meta: { referrerId: ref.referrerId } });
  const referee = await db.select().from(users).where(eq2(users.id, refereeId)).limit(1);
  if (referee.length) {
    const existingPass = referee[0].premiumPassUntil || /* @__PURE__ */ new Date();
    const newPass = new Date(Math.max(existingPass.getTime(), Date.now()) + 7 * 24 * 60 * 60 * 1e3);
    await db.update(users).set({ premiumPassUntil: newPass }).where(eq2(users.id, refereeId));
  }
}

// server/routes.ts
async function registerRoutes(app2) {
  await setupAuth(app2);
  if (process.env.DEV_AUTH_BYPASS === "true" && process.env.NODE_ENV !== "production") {
    app2.get("/api/dev/login/:userId", async (req, res, next) => {
      try {
        const user = await storage.getUser(req.params.userId);
        if (!user) return res.status(404).json({ message: "User not found" });
        req.login({ id: user.id, sub: user.id, claims: { sub: user.id }, expires_at: Math.floor(Date.now() / 1e3) + 86400, access_token: "dev", refresh_token: "dev" }, (err) => {
          if (err) return next(err);
          res.json({ message: "Dev login ok", user });
        });
      } catch (e) {
        res.status(500).json({ message: e.message });
      }
    });
    app2.post("/api/dev/set-plan", async (req, res) => {
      try {
        const { userId, plan } = req.body;
        if (!userId || !plan) return res.status(400).json({ message: "userId and plan required" });
        const user = await storage.getUser(userId);
        if (!user) return res.status(404).json({ message: "User not found" });
        const now = /* @__PURE__ */ new Date();
        const currentPeriodEnd = plan !== "free" ? new Date(now.getTime() + 31 * 24 * 60 * 60 * 1e3) : null;
        await storage.updateUser(userId, { plan, subscriptionStatus: plan !== "free" ? "active" : "inactive", currentPeriodEnd });
        res.json({ message: "Plan updated", plan, subscriptionStatus: plan !== "free" ? "active" : "inactive" });
      } catch (e) {
        res.status(500).json({ message: e.message });
      }
    });
    app2.post("/api/dev/reset-onboarding", isAuthenticated, async (req, res) => {
      try {
        const userId = req.user.claims.sub;
        await storage.updateUser(userId, { onboardingVersion: 0 });
        res.json({ ok: true });
      } catch (e) {
        res.status(500).json({ message: e.message });
      }
    });
    console.log("DEV_AUTH_BYPASS endpoints registered");
  }
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
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
  app2.post("/api/signup", async (req, res, next) => {
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
        firstName: firstName || email.split("@")[0],
        lastName: "",
        profileImageUrl: null
      });
      req.logIn({ id: userId, sub: userId, claims: { sub: userId } }, (err) => {
        if (err) return next(err);
        res.json({ message: "Account created", user: { id: userId, email, firstName: firstName || email.split("@")[0] } });
      });
    } catch (error) {
      console.error("Error in signup:", error);
      res.status(500).json({ message: "Signup failed" });
    }
  });
  app2.post("/api/dev-login", async (req, res, next) => {
    try {
      const { userId } = req.body;
      const user = await storage.getUser(userId || "demo-user-1");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      req.logIn({ id: user.id, sub: user.id, claims: { sub: user.id } }, (err) => {
        if (err) return next(err);
        res.json({ message: "Logged in", user });
      });
    } catch (error) {
      console.error("Error in dev login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });
  app2.get("/api/users/privacy", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({
        showLocation: user.showLocation,
        showEmail: user.showEmail,
        showPhone: user.showPhone,
        messagePrivacy: user.messagePrivacy
      });
    } catch (error) {
      console.error("Error fetching privacy settings:", error);
      res.status(500).json({ message: "Failed to fetch privacy settings" });
    }
  });
  app2.patch("/api/users/privacy", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { showLocation, showEmail, showPhone, messagePrivacy } = req.body;
      const updatedUser = await storage.updateUser(userId, {
        showLocation,
        showEmail,
        showPhone,
        messagePrivacy
      });
      res.json({
        showLocation: updatedUser.showLocation,
        showEmail: updatedUser.showEmail,
        showPhone: updatedUser.showPhone,
        messagePrivacy: updatedUser.messagePrivacy
      });
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      res.status(500).json({ message: "Failed to update privacy settings" });
    }
  });
  app2.patch("/api/users/profile", isAuthenticated, async (req, res) => {
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
  app2.get("/api/users/:id", async (req, res) => {
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
  app2.get("/api/users/:id/toys", async (req, res) => {
    try {
      const toys3 = await storage.getToysByUser(req.params.id);
      res.json(toys3);
    } catch (error) {
      console.error("Error fetching toys:", error);
      res.status(500).json({ message: "Failed to fetch toys" });
    }
  });
  app2.post("/api/users/location", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.updateUserLocation(userId, req.body);
      res.json(user);
    } catch (error) {
      console.error("Error updating location:", error);
      res.status(500).json({ message: "Failed to update location" });
    }
  });
  app2.post("/api/interactions", isAuthenticated, async (req, res) => {
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
  app2.get("/api/recommendations/home", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const usedLocation = !!(user.locationEnabled && user.latitude && user.longitude);
      const taste = await storage.getUserTasteProfile(userId);
      let recentlyAdded = await storage.getToysWithOwners(eq3(toys.isAvailable, true), 10);
      let nearYou = [];
      let forYou = [];
      if (usedLocation) {
        nearYou = await storage.getCandidateToysNearUser(userId, user.latitude, user.longitude, 20);
        const threeDaysAgo = Date.now() - 3 * 864e5;
        const sevenDaysAgo = Date.now() - 7 * 864e5;
        const scored = nearYou.map((t) => {
          let score = 0;
          score += Math.max(0, 20 - t.distanceKm);
          if (taste.topCategories.some((c) => t.category?.includes(c))) score += 20;
          if (taste.topAges.some((a) => t.ageGroup?.includes(a))) score += 15;
          const created = new Date(t.createdAt).getTime();
          if (created > threeDaysAgo) score += 10;
          else if (created > sevenDaysAgo) score += 5;
          return { ...t, _score: score };
        });
        scored.sort((a, b) => b._score - a._score);
        forYou = scored.slice(0, 10);
      } else {
        const allToys = await storage.getToysWithOwners(eq3(toys.isAvailable, true));
        const scored = allToys.map((t) => {
          let score = 0;
          if (taste.topCategories.some((c) => t.category?.includes(c))) score += 20;
          if (taste.topAges.some((a) => t.ageGroup?.includes(a))) score += 15;
          const created = new Date(t.createdAt).getTime();
          if (created > Date.now() - 3 * 864e5) score += 10;
          else if (created > Date.now() - 7 * 864e5) score += 5;
          return { ...t, _score: score };
        });
        scored.sort((a, b) => b._score - a._score);
        forYou = scored.slice(0, 10);
        nearYou = recentlyAdded;
      }
      const addFav = async (toy) => {
        toy.isFavorited = await storage.isFavorite(userId, toy.id);
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
  app2.get("/api/toys", async (req, res) => {
    try {
      const { search, category } = req.query;
      let toys3;
      if (search) {
        toys3 = await storage.searchToys(search);
      } else if (category) {
        toys3 = await storage.getToysByCategory(category);
      } else {
        toys3 = await storage.getToys();
      }
      const uid = req.user?.claims?.sub;
      for (const toy of toys3) {
        toy.isFavorited = uid ? await storage.isFavorite(uid, toy.id) : false;
        toy.ownerRating = await storage.getUserAverageRating(toy.ownerId);
        const activeEx = await db.select({ id: exchanges.id }).from(exchanges).where(
          and3(
            or2(eq3(exchanges.toyId, toy.id), eq3(exchanges.offeredToyId, toy.id)),
            inArray3(exchanges.status, ["pending", "accepted"])
          )
        ).limit(1);
        toy.inExchange = activeEx.length > 0;
      }
      res.json(toys3);
    } catch (error) {
      console.error("Error fetching toys:", error);
      res.status(500).json({ message: "Failed to fetch toys" });
    }
  });
  app2.get("/api/toys/:id", async (req, res) => {
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
  app2.post("/api/toys", isAuthenticated, async (req, res) => {
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
            upgradeUrl: "/pricing"
          });
        }
      }
      const body = req.body;
      const imgs = Array.isArray(body.imageUrls) ? body.imageUrls : [];
      if (imgs.length > 6) {
        return res.status(400).json({ code: "TOO_MANY_IMAGES", message: "Maximum 6 photos allowed." });
      }
      for (const url of imgs) {
        if (typeof url !== "string" || !url.startsWith("data:image/")) {
          return res.status(400).json({ code: "INVALID_IMAGE", message: "Invalid image format." });
        }
        if (url.length > 12e5) {
          return res.status(400).json({ code: "IMAGE_TOO_LARGE", message: "One or more photos exceed the size limit." });
        }
      }
      const totalChars = imgs.reduce((s, u) => s + u.length, 0);
      if (totalChars > 8e6) {
        return res.status(400).json({ code: "IMAGE_TOO_LARGE", message: "Photos are too large. Please upload fewer or smaller photos." });
      }
      const toyData = insertToySchema.parse({ ...req.body, ownerId: userId });
      const toy = await storage.createToy(toyData);
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
        reward: { awarded, points: awarded ? 5 : 0, criteria: { minImagesForReward: 2, minDescriptionChars: 30 } }
      });
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ code: "VALIDATION_ERROR", message: "Please add at least 1 photo before listing." });
      }
      console.error("Error creating toy:", error);
      res.status(500).json({ message: "Failed to create toy" });
    }
  });
  app2.get("/api/users/:userId/toys", isAuthenticated, async (req, res) => {
    try {
      const userId = req.params.userId;
      const toys3 = await storage.getToysByUser(userId);
      res.json(toys3);
    } catch (error) {
      console.error("Error fetching user toys:", error);
      res.status(500).json({ message: "Failed to fetch user toys" });
    }
  });
  app2.patch("/api/toys/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const toyId = parseInt(req.params.id);
      const toy = await storage.getToy(toyId);
      if (!toy) return res.status(404).json({ message: "Toy not found" });
      if (toy.ownerId !== userId) return res.status(403).json({ message: "Not your toy" });
      const updated = await storage.updateToy(toyId, req.body);
      const body = req.body;
      const imgCount = body.imageUrls?.length || updated.imageUrls?.length || 0;
      const descLen = (body.description || updated.description || "").length;
      if (imgCount >= 2 && descLen >= 30 && await checkDailyCap(userId, "TOY_LISTED", 5)) {
        await awardPoints({ userId, eventType: "TOY_LISTED", referenceType: "toy", referenceId: String(toyId), points: 5 });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: error.message || "Failed to update toy" });
    }
  });
  app2.delete("/api/toys/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const toyId = parseInt(req.params.id);
      const toy = await storage.getToy(toyId);
      if (!toy) return res.status(404).json({ message: "Toy not found" });
      if (toy.ownerId !== userId) return res.status(403).json({ message: "Not your toy" });
      await storage.deleteToy(toyId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error.message || "Failed to delete toy" });
    }
  });
  app2.get("/api/exchanges", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const exchanges2 = await storage.getExchanges(userId);
      const withUnread = exchanges2.map((ex) => {
        const lastRead = ex.requesterId === userId ? ex.requesterLastReadAt : ex.ownerLastReadAt;
        const lastMsg = ex.messages?.[ex.messages.length - 1];
        const hasUnread = lastMsg && lastMsg.senderId !== userId && (!lastRead || new Date(lastMsg.createdAt) > new Date(lastRead));
        return { ...ex, hasUnread: !!hasUnread };
      });
      res.json(withUnread);
    } catch (error) {
      console.error("Error fetching exchanges:", error);
      res.status(500).json({ message: "Failed to fetch exchanges" });
    }
  });
  app2.get("/api/exchanges/:id", isAuthenticated, async (req, res) => {
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
  app2.post("/api/exchanges", isAuthenticated, async (req, res) => {
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
            upgradeUrl: "/pricing"
          });
        }
        const activeExchanges = await storage.countActiveOutgoingExchanges(userId);
        if (activeExchanges >= 2) {
          return res.status(403).json({
            code: "LIMIT_ACTIVE_EXCHANGES",
            message: "Free tier allows up to 2 active outgoing exchanges. Upgrade to Premium for more.",
            upgradeUrl: "/pricing"
          });
        }
      }
      console.log("Creating exchange request:", {
        body: req.body,
        userId
      });
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
      await storage.logToyInteraction(userId, exchangeData.toyId, "EXCHANGE_REQUEST_CREATED").catch(() => {
      });
      if (exchangeData.requestMessage && exchangeData.requestMessage.trim()) {
        try {
          const messageData = insertMessageSchema.parse({
            exchangeId: exchange.id,
            senderId: userId,
            content: exchangeData.requestMessage.trim(),
            messageType: "text"
          });
          const message = await storage.createMessage(messageData);
          await storage.markExchangeRead(exchange.id, userId).catch(() => {
          });
          console.log("Initial message created:", message);
        } catch (messageError) {
          console.error("Failed to create initial message:", messageError);
        }
      }
      res.status(201).json(exchange);
    } catch (error) {
      console.error("Error creating exchange:", error);
      res.status(500).json({ message: error.message || "Failed to create exchange" });
    }
  });
  app2.patch("/api/exchanges/:id/status", isAuthenticated, async (req, res) => {
    try {
      const exchangeId = parseInt(req.params.id);
      const { status } = req.body;
      const exchange = await storage.updateExchangeStatus(exchangeId, status);
      if (status === "completed") {
        const exch = await db.select({ toyId: exchanges.toyId, offeredToyId: exchanges.offeredToyId }).from(exchanges).where(eq3(exchanges.id, exchangeId)).limit(1);
        if (exch.length) {
          await db.update(toys).set({ isAvailable: false }).where(eq3(toys.id, exch[0].toyId));
          if (exch[0].offeredToyId) {
            await db.update(toys).set({ isAvailable: false }).where(eq3(toys.id, exch[0].offeredToyId));
          }
        }
      }
      res.json(exchange);
    } catch (error) {
      console.error("Error updating exchange status:", error);
      res.status(500).json({ message: "Failed to update exchange status" });
    }
  });
  app2.post("/api/exchanges/:id/confirm", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const exchangeId = parseInt(req.params.id);
      const exchange = await storage.confirmExchangeCompletion(exchangeId, userId);
      if (exchange.status === "completed") {
        await db.update(toys).set({ isAvailable: false }).where(eq3(toys.id, exchange.toyId));
        if (exchange.offeredToyId) {
          await db.update(toys).set({ isAvailable: false }).where(eq3(toys.id, exchange.offeredToyId));
        }
        await awardPoints({ userId: exchange.requesterId, eventType: "EXCHANGE_COMPLETED", referenceType: "exchange", referenceId: `${exchange.id}:requester`, points: 50 });
        await awardPoints({ userId: exchange.ownerId, eventType: "EXCHANGE_COMPLETED", referenceType: "exchange", referenceId: `${exchange.id}:owner`, points: 50 });
        await storage.logToyInteraction(exchange.requesterId, exchange.toyId, "EXCHANGE_COMPLETED").catch(() => {
        });
        await storage.logToyInteraction(exchange.ownerId, exchange.toyId, "EXCHANGE_COMPLETED").catch(() => {
        });
        await qualifyReferral(exchange.requesterId);
        await qualifyReferral(exchange.ownerId);
      }
      res.json(exchange);
    } catch (error) {
      console.error("Error confirming exchange completion:", error);
      res.status(400).json({ message: error.message || "Failed to confirm exchange completion" });
    }
  });
  app2.get("/api/exchanges/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const exchangeId = parseInt(req.params.id);
      const messages2 = await storage.getMessages(exchangeId);
      res.json(messages2);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  app2.post("/api/exchanges/:id/read", isAuthenticated, async (req, res) => {
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
  app2.post("/api/exchanges/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const exchangeId = parseInt(req.params.id);
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
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: "new_message",
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
  app2.post("/api/exchanges/:id/messages/:messageId/react", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const messageId = parseInt(req.params.messageId);
      const { emoji } = req.body;
      if (!emoji) return res.status(400).json({ message: "emoji required" });
      const [message] = await db.select().from(messages).where(eq3(messages.id, messageId));
      if (!message) return res.status(404).json({ message: "Message not found" });
      const currentReactions = Array.isArray(message.reactions) ? message.reactions : [];
      const existing = currentReactions.findIndex((r) => r.userId === userId && r.emoji === emoji);
      if (existing >= 0) {
        currentReactions.splice(existing, 1);
      } else {
        currentReactions.push({ userId, emoji });
      }
      const [updated] = await db.update(messages).set({ reactions: currentReactions }).where(eq3(messages.id, messageId)).returning();
      res.json(updated);
    } catch (error) {
      console.error("Error toggling reaction:", error);
      res.status(500).json({ message: error.message || "Failed to toggle reaction" });
    }
  });
  app2.get("/api/favorites", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const favorites2 = await storage.getFavorites(userId);
      res.json(favorites2);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });
  app2.post("/api/favorites", isAuthenticated, async (req, res) => {
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
  app2.delete("/api/favorites/:toyId", isAuthenticated, async (req, res) => {
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
  app2.get("/api/favorites/:toyId/status", isAuthenticated, async (req, res) => {
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
  app2.get("/api/users/:userId/reviews", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const reviews3 = await storage.getReviews(userId);
      res.json(reviews3);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ message: "Failed to fetch reviews" });
    }
  });
  app2.get("/api/users/:userId/rating", isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const averageRating = await storage.getUserAverageRating(userId);
      res.json({ averageRating });
    } catch (error) {
      console.error("Error fetching user rating:", error);
      res.status(500).json({ message: "Failed to fetch user rating" });
    }
  });
  app2.post("/api/reviews", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const reviewData = insertReviewSchema.parse({
        ...req.body,
        reviewerId: userId
      });
      const canReview = await storage.canUserReview(reviewData.exchangeId, userId);
      if (!canReview) {
        return res.status(400).json({ message: "Cannot review this exchange" });
      }
      const review = await storage.createReview(reviewData);
      if (await checkDailyCap(reviewData.reviewerId, "REVIEW_LEFT", 3)) {
        await awardPoints({ userId: reviewData.reviewerId, eventType: "REVIEW_LEFT", referenceType: "review", referenceId: String(review.id), points: 10 });
      }
      if (reviewData.rating === 5) {
        await awardPoints({ userId: reviewData.revieweeId, eventType: "REVIEW_RECEIVED_5STAR", referenceType: "review", referenceId: String(review.id), points: 10 });
      }
      res.json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ message: "Failed to create review" });
    }
  });
  app2.get("/api/exchanges/:exchangeId/can-review", isAuthenticated, async (req, res) => {
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
  app2.get("/api/rewards/me", isAuthenticated, async (req, res) => {
    try {
      const profile = await getRewardsProfile(req.user.claims.sub);
      res.json(profile);
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.post("/api/rewards/redeem", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { rewardType, toyId } = req.body;
      if (!rewardType) return res.status(400).json({ message: "rewardType required" });
      const rewards = {
        BOOST_LISTING_48H: { cost: 300 },
        ADD_REQUESTS_5_30D: { cost: 200, expiresDays: 30 },
        ADD_LISTINGS_5_30D: { cost: 250, expiresDays: 30 },
        PREMIUM_PASS_7D: { cost: 1200, cooldownDays: 30 }
      };
      const def = rewards[rewardType];
      if (!def) return res.status(400).json({ message: "Unknown reward type" });
      let expiresAt;
      if (def.expiresDays) {
        expiresAt = new Date(Date.now() + def.expiresDays * 24 * 60 * 60 * 1e3);
      }
      if (def.cooldownDays) {
        const userR = await db.select().from(rewardLedger).where(
          and3(eq3(rewardLedger.userId, userId), eq3(rewardLedger.eventType, "REDEEM_PREMIUM_PASS"), gte3(rewardLedger.createdAt, new Date(Date.now() - def.cooldownDays * 24 * 60 * 60 * 1e3)))
        ).limit(1);
        if (userR.length) return res.status(400).json({ message: "Premium Pass can only be redeemed once every 30 days" });
      }
      const result = await spendPoints({ userId, rewardType, costPoints: def.cost, meta: rewardType === "BOOST_LISTING_48H" ? { toyId } : void 0, expiresAt });
      if (!result.ok) return res.status(400).json({ message: "Insufficient points", balance: result.balance });
      if (rewardType === "BOOST_LISTING_48H" && toyId) {
        await db.update(toys).set({ boostedUntil: new Date(Date.now() + 48 * 60 * 60 * 1e3) }).where(eq3(toys.id, toyId));
      }
      if (rewardType === "PREMIUM_PASS_7D") {
        const existingPass = await db.select({ premiumPassUntil: users.premiumPassUntil }).from(users).where(eq3(users.id, userId)).limit(1);
        const currentEnd = existingPass[0]?.premiumPassUntil || /* @__PURE__ */ new Date();
        const newEnd = new Date(Math.max(currentEnd.getTime(), Date.now()) + 7 * 24 * 60 * 60 * 1e3);
        await db.update(users).set({ premiumPassUntil: newEnd }).where(eq3(users.id, userId));
      }
      res.json({ ok: true, balance: result.balance });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.get("/api/referrals/me", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      let code = user?.referralCode;
      if (!code) {
        code = (user?.firstName || user?.email || "user").substring(0, 4).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
        await db.update(users).set({ referralCode: code }).where(eq3(users.id, userId));
      }
      const myRefs = await db.select().from(referrals).where(eq3(referrals.referrerId, userId)).orderBy(referrals.createdAt).limit(20);
      res.json({ referralCode: code, inviteLink: `/welcome?ref=${code}`, referrals: myRefs });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  app2.post("/api/referrals/claim", async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ message: "Referral code required" });
      const referrers = await db.select().from(users).where(eq3(users.referralCode, code)).limit(1);
      if (!referrers.length) return res.status(404).json({ message: "Invalid referral code" });
      const referrer = referrers[0];
      if (req.user && req.user.claims?.sub === referrer.id) {
        return res.status(400).json({ message: "Cannot refer yourself" });
      }
      if (req.user) {
        const userId = req.user.claims?.sub;
        const existing = await db.select().from(referrals).where(
          and3(eq3(referrals.referrerId, referrer.id), eq3(referrals.refereeId, userId))
        ).limit(1);
        if (existing.length) return res.status(400).json({ message: "Already referred" });
        await db.insert(referrals).values({ referrerId: referrer.id, refereeId: userId, status: "pending" });
      }
      res.json({ ok: true });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  });
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
  const PAYSTACK_MONTHLY_PLAN_CODE = process.env.PAYSTACK_MONTHLY_PLAN_CODE || "PLN_qa2hymptm1v3pks";
  const PAYSTACK_YEARLY_PLAN_CODE = process.env.PAYSTACK_YEARLY_PLAN_CODE || "PLN_6r1rrbz34iv7ct4";
  const PAYSTACK_MONTHLY_AMOUNT = parseInt(process.env.PAYSTACK_MONTHLY_AMOUNT || "8900");
  const PAYSTACK_YEARLY_AMOUNT = parseInt(process.env.PAYSTACK_YEARLY_AMOUNT || "44900");
  const APP_BASE_URL = process.env.APP_BASE_URL || "";
  async function paystackFetch(path3, options = {}) {
    const res = await fetch(`https://api.paystack.co${path3}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        ...options.headers
      }
    });
    return res.json();
  }
  app2.post("/api/billing/paystack/initialize", isAuthenticated, async (req, res) => {
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
          metadata: { userId }
        })
      });
      if (!result.status) {
        return res.status(400).json({ message: result.message || "Paystack initialization failed" });
      }
      res.json({ authorizationUrl: result.data.authorization_url });
    } catch (error) {
      console.error("Error initializing Paystack:", error);
      res.status(500).json({ message: error.message || "Failed to initialize payment" });
    }
  });
  app2.get("/api/billing/paystack/verify", isAuthenticated, async (req, res) => {
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
      const now = /* @__PURE__ */ new Date();
      let plan = "premium_monthly";
      let currentPeriodEnd;
      if (data.plan?.plan_code === PAYSTACK_YEARLY_PLAN_CODE) {
        plan = "premium_yearly";
        currentPeriodEnd = new Date(now.getTime() + 366 * 24 * 60 * 60 * 1e3);
      } else {
        currentPeriodEnd = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1e3);
      }
      const updateData = {
        plan,
        subscriptionStatus: "active",
        currentPeriodEnd
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
    } catch (error) {
      console.error("Error verifying Paystack transaction:", error);
      res.status(500).json({ message: error.message || "Verification failed" });
    }
  });
  app2.post("/api/billing/paystack/webhook", async (req, res) => {
    const signature = req.headers["x-paystack-signature"];
    if (!signature) {
      return res.status(401).json({ message: "Missing signature" });
    }
    const hash = crypto.createHmac("sha512", PAYSTACK_SECRET_KEY).update(req.rawBody).digest("hex");
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
            const usersByCode = await db.select().from(users).where(eq3(users.paystackCustomerCode, customerCode)).limit(1);
            userId = usersByCode[0]?.id;
          }
          if (!userId && email) {
            const usersByEmail = await storage.searchUsersByEmail(email);
            userId = usersByEmail[0]?.id;
          }
          if (userId) {
            const planCode = data.plan?.plan_code || data.plan_code;
            const plan = planCode === PAYSTACK_YEARLY_PLAN_CODE ? "premium_yearly" : "premium_monthly";
            const now = /* @__PURE__ */ new Date();
            const nextPaymentDate = data.next_payment_date ? new Date(data.next_payment_date) : null;
            const updateData = {
              plan,
              subscriptionStatus: "active",
              paystackSubscriptionCode: data.subscription_code || data.subscription?.subscription_code,
              paystackEmailToken: data.email_token || data.subscription?.email_token
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
            const usersBySub = await db.select().from(users).where(eq3(users.paystackSubscriptionCode, subCode)).limit(1);
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
  app2.post("/api/billing/paystack/cancel", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (user?.paystackSubscriptionCode && user?.paystackEmailToken) {
        try {
          await paystackFetch("/subscription/disable", {
            method: "POST",
            body: JSON.stringify({
              code: user.paystackSubscriptionCode,
              token: user.paystackEmailToken
            })
          });
        } catch (paystackErr) {
          console.warn("Paystack cancel API failed, canceling locally:", paystackErr);
        }
      }
      await storage.setUserSubscriptionByUserId(userId, {
        plan: "free",
        subscriptionStatus: "canceled",
        paystackSubscriptionCode: null,
        paystackEmailToken: null
      });
      res.json({ ok: true });
    } catch (error) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ message: error.message || "Failed to cancel subscription" });
    }
  });
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log("Received WebSocket message:", data);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    });
    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use((req, res, next) => {
  if (req.path === "/api/billing/paystack/webhook") {
    express2.raw({ type: "*/*" })(req, res, (err) => {
      if (err) return next(err);
      req.rawBody = req.body;
      try {
        req.body = JSON.parse(req.body.toString());
      } catch {
        req.body = {};
      }
      next();
    });
  } else {
    next();
  }
});
app.use(express2.json({ limit: "10mb" }));
app.use(express2.urlencoded({ extended: false, limit: "10mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0"
  }, () => {
    log(`serving on port ${port}`);
  });
})();
