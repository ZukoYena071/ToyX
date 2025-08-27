var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

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
  reviews: () => reviews,
  reviewsRelations: () => reviewsRelations,
  sessions: () => sessions,
  toys: () => toys,
  toysRelations: () => toysRelations,
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var exchanges = pgTable("exchanges", {
  id: serial("id").primaryKey(),
  requesterId: varchar("requester_id").notNull().references(() => users.id),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  toyId: integer("toy_id").notNull().references(() => toys.id),
  status: varchar("status", { length: 50 }).default("pending"),
  requestMessage: text("request_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  exchangeId: integer("exchange_id").notNull().references(() => exchanges.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 50 }).default("text"),
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
var insertToySchema = createInsertSchema(toys).omit({
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
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, and, or, ilike, sql } from "drizzle-orm";
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
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
    return await db.select().from(toys).where(eq(toys.ownerId, userId)).orderBy(desc(toys.createdAt));
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
    const [newExchange] = await db.insert(exchanges).values(exchange).returning();
    return newExchange;
  }
  async updateExchangeStatus(id, status) {
    const [updatedExchange] = await db.update(exchanges).set({ status, updatedAt: /* @__PURE__ */ new Date() }).where(eq(exchanges.id, id)).returning();
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
    const result = await db.select({
      avgRating: sql`COALESCE(AVG(${reviews.rating}), 0)`
    }).from(reviews).where(eq(reviews.revieweeId, userId));
    return Number(result[0]?.avgRating || 0);
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
};
var storage = new DatabaseStorage();

// server/replitAuth.ts
import * as client from "openid-client";
import { Strategy } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}
var getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID
    );
  },
  { maxAge: 3600 * 1e3 }
);
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl
    }
  });
}
function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}
async function upsertUser(claims) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"]
  });
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  const config = await getOidcConfig();
  const verify = async (tokens, verified) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };
  for (const domain of process.env.REPLIT_DOMAINS.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`
      },
      verify
    );
    passport.use(strategy);
  }
  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));
  app2.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"]
    })(req, res, next);
  });
  app2.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login"
    })(req, res, next);
  });
  app2.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`
        }).href
      );
    });
  });
}
var isAuthenticated = async (req, res, next) => {
  const user = req.user;
  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const now = Math.floor(Date.now() / 1e3);
  if (now <= user.expires_at) {
    return next();
  }
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// server/routes.ts
async function registerRoutes(app2) {
  await setupAuth(app2);
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.get("/api/toys", async (req, res) => {
    try {
      const { search, category } = req.query;
      let toys2;
      if (search) {
        toys2 = await storage.searchToys(search);
      } else if (category) {
        toys2 = await storage.getToysByCategory(category);
      } else {
        toys2 = await storage.getToys();
      }
      res.json(toys2);
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
      const toyData = insertToySchema.parse({ ...req.body, ownerId: userId });
      const toy = await storage.createToy(toyData);
      res.status(201).json(toy);
    } catch (error) {
      console.error("Error creating toy:", error);
      res.status(500).json({ message: "Failed to create toy" });
    }
  });
  app2.get("/api/users/:userId/toys", isAuthenticated, async (req, res) => {
    try {
      const userId = req.params.userId;
      const toys2 = await storage.getToysByUser(userId);
      res.json(toys2);
    } catch (error) {
      console.error("Error fetching user toys:", error);
      res.status(500).json({ message: "Failed to fetch user toys" });
    }
  });
  app2.get("/api/exchanges", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const exchanges2 = await storage.getExchanges(userId);
      res.json(exchanges2);
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
      const exchangeData = insertExchangeSchema.parse({
        ...req.body,
        requesterId: userId
      });
      const exchange = await storage.createExchange(exchangeData);
      res.status(201).json(exchange);
    } catch (error) {
      console.error("Error creating exchange:", error);
      res.status(500).json({ message: "Failed to create exchange" });
    }
  });
  app2.patch("/api/exchanges/:id/status", isAuthenticated, async (req, res) => {
    try {
      const exchangeId = parseInt(req.params.id);
      const { status } = req.body;
      const exchange = await storage.updateExchangeStatus(exchangeId, status);
      res.json(exchange);
    } catch (error) {
      console.error("Error updating exchange status:", error);
      res.status(500).json({ message: "Failed to update exchange status" });
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
      wss.clients.forEach((client2) => {
        if (client2.readyState === WebSocket.OPEN) {
          client2.send(JSON.stringify({
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
      const reviews2 = await storage.getReviews(userId);
      res.json(reviews2);
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
      const reviewData = insertReviewSchema.parse(req.body);
      const userId = req.user.claims.sub;
      const canReview = await storage.canUserReview(reviewData.exchangeId, userId);
      if (!canReview) {
        return res.status(400).json({ message: "Cannot review this exchange" });
      }
      const review = await storage.createReview({
        ...reviewData,
        reviewerId: userId
      });
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
      const canReview = await storage.canUserReview(parseInt(exchangeId), userId);
      res.json({ canReview });
    } catch (error) {
      console.error("Error checking review eligibility:", error);
      res.status(500).json({ message: "Failed to check review eligibility" });
    }
  });
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (ws2) => {
    console.log("WebSocket client connected");
    ws2.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log("Received WebSocket message:", data);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    });
    ws2.on("close", () => {
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
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
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
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
