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
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  bio: text("bio"),
  location: varchar("location", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const toys = pgTable("toys", {
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
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const exchanges = pgTable("exchanges", {
  id: serial("id").primaryKey(),
  requesterId: varchar("requester_id").notNull().references(() => users.id),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  toyId: integer("toy_id").notNull().references(() => toys.id),
  status: varchar("status", { length: 50 }).default("pending"),
  requestMessage: text("request_message"),
  requesterConfirmed: boolean("requester_confirmed").default(false),
  ownerConfirmed: boolean("owner_confirmed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  exchangeId: integer("exchange_id").notNull().references(() => exchanges.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 50 }).default("text"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  toyId: integer("toy_id").notNull().references(() => toys.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  toys: many(toys),
  sentExchanges: many(exchanges, { relationName: "requester" }),
  receivedExchanges: many(exchanges, { relationName: "owner" }),
  messages: many(messages),
  favorites: many(favorites),
  givenReviews: many(reviews, { relationName: "reviewReviewer" }),
  receivedReviews: many(reviews, { relationName: "reviewReviewee" }),
}));

export const toysRelations = relations(toys, ({ one, many }) => ({
  owner: one(users, {
    fields: [toys.ownerId],
    references: [users.id],
  }),
  exchanges: many(exchanges),
  favorites: many(favorites),
}));

export const exchangesRelations = relations(exchanges, ({ one, many }) => ({
  requester: one(users, {
    fields: [exchanges.requesterId],
    references: [users.id],
    relationName: "requester",
  }),
  owner: one(users, {
    fields: [exchanges.ownerId],
    references: [users.id],
    relationName: "owner",
  }),
  toy: one(toys, {
    fields: [exchanges.toyId],
    references: [toys.id],
  }),
  messages: many(messages),
  reviews: many(reviews),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  exchange: one(exchanges, {
    fields: [messages.exchangeId],
    references: [exchanges.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  toy: one(toys, {
    fields: [favorites.toyId],
    references: [toys.id],
  }),
}));

// User reviews and ratings system
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  exchangeId: integer("exchange_id").notNull().references(() => exchanges.id),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id),
  revieweeId: varchar("reviewee_id").notNull().references(() => users.id),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  isAnonymous: boolean("is_anonymous").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reviewsRelations = relations(reviews, ({ one }) => ({
  exchange: one(exchanges, {
    fields: [reviews.exchangeId],
    references: [exchanges.id],
  }),
  reviewer: one(users, {
    fields: [reviews.reviewerId],
    references: [users.id],
    relationName: "reviewReviewer",
  }),
  reviewee: one(users, {
    fields: [reviews.revieweeId],
    references: [users.id],
    relationName: "reviewReviewee",
  }),
}));

// Insert schemas
export const insertToySchema = createInsertSchema(toys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExchangeSchema = createInsertSchema(exchanges).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertToy = z.infer<typeof insertToySchema>;
export type Toy = typeof toys.$inferSelect;
export type ToyWithOwner = Toy & { owner: User; isFavorited?: boolean };
export type InsertExchange = z.infer<typeof insertExchangeSchema>;
export type Exchange = typeof exchanges.$inferSelect;
export type ExchangeWithDetails = Exchange & { 
  requester: User; 
  owner: User; 
  toy: Toy;
  messages: Message[];
};
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type MessageWithSender = Message & { sender: User };
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviews.$inferSelect;
export type ReviewWithUser = Review & {
  reviewer: User;
  reviewee: User;
};
