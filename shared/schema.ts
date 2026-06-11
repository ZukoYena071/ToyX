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
  hasPassword: boolean("has_password").default(false),
  googleConnected: boolean("google_connected").default(false),
  facebookConnected: boolean("facebook_connected").default(false),
  latitude: real("latitude"),
  longitude: real("longitude"),
  locationEnabled: boolean("location_enabled").default(false),
  locationUpdatedAt: timestamp("location_updated_at"),
  accessStatus: varchar("access_status", { length: 32 }).notNull().default("waitlist"),
  isAdmin: boolean("is_admin").default(false),
  accountType: varchar("account_type", { length: 32 }).notNull().default("standard"),
  suspendedUntil: timestamp("suspended_until"),
  suspensionReason: text("suspension_reason"),
  bannedAt: timestamp("banned_at"),
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
  boostedUntil: timestamp("boosted_until"),
  deletedAt: timestamp("deleted_at"),
  lookingForCategories: text("looking_for_categories").array(),
  lookingForDetails: text("looking_for_details"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const exchanges = pgTable("exchanges", {
  id: serial("id").primaryKey(),
  requesterId: varchar("requester_id").notNull().references(() => users.id),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  toyId: integer("toy_id").notNull().references(() => toys.id),
  offeredToyId: integer("offered_toy_id").references(() => toys.id),
  status: varchar("status", { length: 50 }).default("pending"),
  requestMessage: text("request_message"),
  requesterConfirmed: boolean("requester_confirmed").default(false),
  ownerConfirmed: boolean("owner_confirmed").default(false),
  requesterLastReadAt: timestamp("requester_last_read_at", { withTimezone: true }),
  ownerLastReadAt: timestamp("owner_last_read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  exchangeId: integer("exchange_id").notNull().references(() => exchanges.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: varchar("message_type", { length: 50 }).default("text"),
  reactions: jsonb("reactions").default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
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

// Toy interactions for personalization
export const toyInteractions = pgTable("toy_interactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  toyId: integer("toy_id").notNull().references(() => toys.id),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_interactions_user").on(table.userId, table.createdAt),
  index("idx_interactions_user_event").on(table.userId, table.eventType, table.createdAt),
  index("idx_interactions_toy_event").on(table.toyId, table.eventType),
]);

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

// Blocked users
export const blocks = pgTable("blocks", {
  id: serial("id").primaryKey(),
  blockerId: varchar("blocker_id").notNull().references(() => users.id),
  blockedId: varchar("blocked_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// User reports
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reporterId: varchar("reporter_id").notNull().references(() => users.id),
  reportedId: varchar("reported_id").notNull().references(() => users.id),
  reason: varchar("reason", { length: 64 }).notNull(),
  details: text("details"),
  contextType: varchar("context_type", { length: 32 }).notNull(),
  contextId: varchar("context_id", { length: 64 }),
  messageSnapshot: jsonb("message_snapshot"),
  status: varchar("status", { length: 32 }).notNull().default("open"),
  resolutionNote: text("resolution_note"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_reports_status").on(table.status, table.createdAt),
  index("idx_reports_reporter").on(table.reporterId, table.createdAt),
  index("idx_reports_reported").on(table.reportedId),
]);

// Moderation actions (audit log)
export const moderationActions = pgTable("moderation_actions", {
  id: serial("id").primaryKey(),
  adminUserId: varchar("admin_user_id").notNull().references(() => users.id),
  targetUserId: varchar("target_user_id").notNull().references(() => users.id),
  reportId: integer("report_id").references(() => reports.id),
  actionType: varchar("action_type", { length: 32 }).notNull(),
  message: text("message"),
  durationDays: integer("duration_days"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
}, (table) => [index("idx_mod_actions_target").on(table.targetUserId, table.createdAt)]);

// Moderation messages (from admin to user)
export const moderationMessages = pgTable("moderation_messages", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  adminUserId: varchar("admin_user_id").notNull().references(() => users.id),
  reportId: integer("report_id").references(() => reports.id),
  subject: varchar("subject", { length: 255 }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
}, (table) => [index("idx_mod_msgs_user").on(table.userId, table.readAt, table.createdAt)]);

// Rewards tables
export const userRewards = pgTable("user_rewards", {
  userId: varchar("user_id").primaryKey().notNull().references(() => users.id),
  pointsBalance: integer("points_balance").notNull().default(0),
  pointsLifetime: integer("points_lifetime").notNull().default(0),
  badges: jsonb("badges").notNull().default([]),
  lastPremiumRedeemAt: timestamp("last_premium_redeem_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const rewardLedger = pgTable("reward_ledger", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  eventType: varchar("event_type", { length: 64 }).notNull(),
  points: integer("points").notNull(),
  referenceType: varchar("reference_type", { length: 32 }).notNull(),
  referenceId: varchar("reference_id", { length: 64 }).notNull(),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("idx_ledger_unique").on(table.userId, table.eventType, table.referenceId)]);

export const rewardRedemptions = pgTable("reward_redemptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  rewardType: varchar("reward_type", { length: 64 }).notNull(),
  costPoints: integer("cost_points").notNull(),
  meta: jsonb("meta"),
  startsAt: timestamp("starts_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: varchar("referrer_id").notNull().references(() => users.id),
  refereeId: varchar("referee_id").references(() => users.id),
  refereeEmail: varchar("referee_email"),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  qualifiedAt: timestamp("qualified_at"),
});

// Marketing subscribers
export const marketingSubscribers = pgTable("marketing_subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email").unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMarketingSubscriberSchema = createInsertSchema(marketingSubscribers).pick({ email: true }).extend({
  email: z.string().email("Invalid email address"),
});

// Support requests
export const supportRequests = pgTable("support_requests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id"),
  email: varchar("email"),
  category: varchar("category", { length: 64 }).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 32 }).notNull().default("open"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSupportRequestSchema = createInsertSchema(supportRequests).pick({
  email: true,
  category: true,
  subject: true,
  message: true,
}).extend({
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  category: z.enum(["account-issue", "moderation-review", "safety-concern", "billing", "general-support"]),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(255),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000),
});

// Insert schemas
export const insertToySchema = createInsertSchema(toys, {
  imageUrls: z.array(z.string().min(1)).min(1, "At least 1 image is required"),
}).omit({
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

// Founding Members
export const foundingMembers = pgTable("founding_members", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  email: text("email").notNull().unique(),
  city: text("city").notNull(),
  phone: text("phone"),
  status: text("status").notNull().default("WAITLIST"),
  signupSource: text("signup_source").default("unknown"),
  memberNumber: integer("member_number").unique(),
  joinedAt: timestamp("joined_at").defaultNow(),
  invitedAt: timestamp("invited_at"),
  activatedAt: timestamp("activated_at"),
  bonusPointsAwarded: boolean("bonus_points_awarded").notNull().default(false),
  badgeAwarded: boolean("badge_awarded").notNull().default(false),
});

export const insertFoundingMemberSchema = createInsertSchema(foundingMembers).pick({
  firstName: true,
  email: true,
  city: true,
  phone: true,
  signupSource: true,
}).extend({
  firstName: z.string().min(1, "First name is required").trim(),
  email: z.string().email("Invalid email address").transform((e) => e.toLowerCase().trim()),
  city: z.string().min(1, "City is required").trim(),
  phone: z.string().optional().nullable(),
  signupSource: z.enum(["facebook", "instagram", "linkedin", "direct", "organic", "unknown"]).optional().default("unknown"),
});

// Launch settings (single-row table for launch control configuration)
export const launchSettings = pgTable("launch_settings", {
  id: integer("id").primaryKey().default(1),
  launchDate: timestamp("launch_date", { withTimezone: true }).notNull(),
  familiesTarget: integer("families_target").notNull().default(100),
  listingsTarget: integer("listings_target").notNull().default(500),
  betaTarget: integer("beta_target").notNull().default(50),
  betaThreshold: integer("beta_threshold").notNull().default(4),
  liveThreshold: integer("live_threshold").notNull().default(7),
  updatedBy: varchar("updated_by").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Audit log for admin actions on founding members
export const foundingConsoleActions = pgTable("founding_console_actions", {
  id: serial("id").primaryKey(),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  actionType: varchar("action_type", { length: 32 }).notNull(),
  targetEmail: varchar("target_email"),
  targetMemberId: integer("target_member_id").references(() => foundingMembers.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertToy = z.infer<typeof insertToySchema>;
export type Toy = typeof toys.$inferSelect;
export type ToyWithOwner = Toy & { owner: User; isFavorited?: boolean; ownerRating?: number; distanceKm?: number; inExchange?: boolean };
export type InsertExchange = z.infer<typeof insertExchangeSchema>;
export type Exchange = typeof exchanges.$inferSelect;
export type ExchangeWithDetails = Exchange & { 
  requester: User; 
  owner: User; 
  toy: Toy;
  offeredToy?: Toy | null;
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
export type Interaction = typeof toyInteractions.$inferSelect;
export type InsertInteraction = typeof toyInteractions.$inferInsert;

export type ConnectedProvider = "password" | "google" | "facebook";

export function getConnectedProviders(user: Pick<User, "hasPassword" | "googleConnected" | "facebookConnected">): ConnectedProvider[] {
  const providers: ConnectedProvider[] = [];
  if (user.hasPassword) providers.push("password");
  if (user.googleConnected) providers.push("google");
  if (user.facebookConnected) providers.push("facebook");
  return providers;
}
