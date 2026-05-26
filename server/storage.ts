import {
  users,
  toys,
  exchanges,
  messages,
  favorites,
  reviews,
  toyInteractions,
  blocks,
  reports,
  type User,
  type UpsertUser,
  type Toy,
  type ToyWithOwner,
  type InsertToy,
  type Exchange,
  type ExchangeWithDetails,
  type InsertExchange,
  type Message,
  type MessageWithSender,
  type InsertMessage,
  type Favorite,
  type InsertFavorite,
  type Review,
  type InsertReview,
  type ReviewWithUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, sql, inArray, lte, gte, count, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  searchUsersByEmail(email: string): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<User>): Promise<User>;
  setUserSubscriptionByUserId(userId: string, data: Partial<User>): Promise<User>;
  setUserSubscriptionByCustomerCode(customerCode: string, data: Partial<User>): Promise<User>;
  countActiveListings(userId: string): Promise<number>;
  countOutgoingExchangeRequestsThisMonth(userId: string): Promise<number>;
  countActiveOutgoingExchanges(userId: string): Promise<number>;
  
  // Toy operations
  getToys(): Promise<ToyWithOwner[]>;
  getToy(id: number): Promise<ToyWithOwner | undefined>;
  getToysByUser(userId: string): Promise<Toy[]>;
  createToy(toy: InsertToy): Promise<Toy>;
  updateToy(id: number, toy: Partial<InsertToy>): Promise<Toy>;
  deleteToy(id: number): Promise<void>;
  searchToys(query: string): Promise<ToyWithOwner[]>;
  getToysByCategory(category: string): Promise<ToyWithOwner[]>;
  
  // Exchange operations
  getExchanges(userId: string): Promise<ExchangeWithDetails[]>;
  getExchange(id: number): Promise<ExchangeWithDetails | undefined>;
  createExchange(exchange: InsertExchange): Promise<Exchange>;
  updateExchangeStatus(id: number, status: string): Promise<Exchange>;
  confirmExchangeCompletion(exchangeId: number, userId: string): Promise<Exchange>;
  
  // Message operations
  getMessages(exchangeId: number): Promise<MessageWithSender[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Favorite operations
  getFavorites(userId: string): Promise<ToyWithOwner[]>;
  addFavorite(favorite: InsertFavorite): Promise<Favorite>;
  removeFavorite(userId: string, toyId: number): Promise<void>;
  isFavorite(userId: string, toyId: number): Promise<boolean>;
  
  // Review operations
  getReviews(userId: string): Promise<ReviewWithUser[]>;
  getUserAverageRating(userId: string): Promise<number>;
  createReview(review: InsertReview): Promise<Review>;
  canUserReview(exchangeId: number, reviewerId: string): Promise<boolean>;
  // Block / report operations
  blockUser(blockerId: string, blockedId: string): Promise<void>;
  unblockUser(blockerId: string, blockedId: string): Promise<void>;
  isBlocked(blockerId: string, blockedId: string): Promise<boolean>;
  getBlockedUserIds(userId: string): Promise<string[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async searchUsersByEmail(email: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.email, email));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async setUserSubscriptionByUserId(userId: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async setUserSubscriptionByCustomerCode(customerCode: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.paystackCustomerCode, customerCode))
      .returning();
    return user;
  }

  async countActiveListings(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(toys)
      .where(and(eq(toys.ownerId, userId), eq(toys.isAvailable, true)));
    return Number(result?.count || 0);
  }

  async countOutgoingExchangeRequestsThisMonth(userId: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(exchanges)
      .where(
        and(
          eq(exchanges.requesterId, userId),
          sql`${exchanges.createdAt} >= ${startOfMonth}`
        )
      );
    return Number(result?.count || 0);
  }

  async countActiveOutgoingExchanges(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(exchanges)
      .where(
        and(
          eq(exchanges.requesterId, userId),
          sql`${exchanges.status} IN ('pending', 'accepted')`
        )
      );
    return Number(result?.count || 0);
  }

  // Toy operations
  async getToys(): Promise<ToyWithOwner[]> {
    return await db
      .select()
      .from(toys)
      .leftJoin(users, eq(toys.ownerId, users.id))
      .where(and(eq(toys.isAvailable, true), isNull(toys.deletedAt)))
      .orderBy(desc(toys.id))
      .then(rows => 
        rows.map(row => ({
          ...row.toys,
          owner: row.users!
        }))
      );
  }

  async getToy(id: number): Promise<ToyWithOwner | undefined> {
    const [result] = await db
      .select()
      .from(toys)
      .leftJoin(users, eq(toys.ownerId, users.id))
      .where(eq(toys.id, id));
    
    if (!result) return undefined;
    
    return {
      ...result.toys,
      owner: result.users!
    };
  }

  async getToysByUser(userId: string): Promise<ToyWithOwner[]> {
    return await db
      .select()
      .from(toys)
      .leftJoin(users, eq(toys.ownerId, users.id))
      .where(and(eq(toys.ownerId, userId), isNull(toys.deletedAt)))
      .orderBy(desc(toys.createdAt))
      .then(rows => 
        rows.map(row => ({
          ...row.toys,
          owner: row.users!
        }))
      );
  }

  async createToy(toy: InsertToy): Promise<Toy> {
    const [newToy] = await db.insert(toys).values(toy).returning();
    return newToy;
  }

  async updateToy(id: number, toy: Partial<InsertToy>): Promise<Toy> {
    const [updatedToy] = await db
      .update(toys)
      .set({ ...toy, updatedAt: new Date() })
      .where(eq(toys.id, id))
      .returning();
    return updatedToy;
  }

  async deleteToy(id: number): Promise<void> {
    await db.delete(toys).where(eq(toys.id, id));
  }

  async searchToys(query: string): Promise<ToyWithOwner[]> {
    return await db
      .select()
      .from(toys)
      .leftJoin(users, eq(toys.ownerId, users.id))
      .where(
        and(
          eq(toys.isAvailable, true),
          isNull(toys.deletedAt),
          or(
            ilike(toys.name, `%${query}%`),
            ilike(toys.description, `%${query}%`),
            ilike(toys.category, `%${query}%`)
          )
        )
      )
      .orderBy(desc(toys.id))
      .then(rows => 
        rows.map(row => ({
          ...row.toys,
          owner: row.users!
        }))
      );
  }

  async getToysByCategory(category: string): Promise<ToyWithOwner[]> {
    return await db
      .select()
      .from(toys)
      .leftJoin(users, eq(toys.ownerId, users.id))
      .where(
        and(
          eq(toys.isAvailable, true),
          isNull(toys.deletedAt),
          eq(toys.category, category)
        )
      )
      .orderBy(desc(toys.id))
      .then(rows => 
        rows.map(row => ({
          ...row.toys,
          owner: row.users!
        }))
      );
  }

  // Exchange operations
  async getExchanges(userId: string): Promise<ExchangeWithDetails[]> {
    return await db
      .select()
      .from(exchanges)
      .leftJoin(users, eq(exchanges.requesterId, users.id))
      .leftJoin(toys, eq(exchanges.toyId, toys.id))
      .where(
        or(
          eq(exchanges.requesterId, userId),
          eq(exchanges.ownerId, userId)
        )
      )
      .orderBy(desc(exchanges.createdAt))
      .then(async (rows) => {
        const exchangeDetails = await Promise.all(rows.map(async (row) => {
          const requester = await this.getUser(row.exchanges.requesterId);
          const owner = await this.getUser(row.exchanges.ownerId);
          const exchangeMessages = await this.getMessages(row.exchanges.id);
          
          return {
            ...row.exchanges,
            requester: requester!,
            owner: owner!,
            toy: row.toys!,
            messages: exchangeMessages
          };
        }));
        
        return exchangeDetails;
      });
  }

  async getExchange(id: number): Promise<ExchangeWithDetails | undefined> {
    const [result] = await db
      .select()
      .from(exchanges)
      .leftJoin(toys, eq(exchanges.toyId, toys.id))
      .where(eq(exchanges.id, id));
    
    if (!result) return undefined;
    
    const requester = await this.getUser(result.exchanges.requesterId);
    const owner = await this.getUser(result.exchanges.ownerId);
    const exchangeMessages = await this.getMessages(id);
    
    return {
      ...result.exchanges,
      requester: requester!,
      owner: owner!,
      toy: result.toys!,
      messages: exchangeMessages
    };
  }

  async createExchange(exchange: InsertExchange): Promise<Exchange> {
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

  async updateExchangeStatus(id: number, status: string): Promise<Exchange> {
    const [updatedExchange] = await db
      .update(exchanges)
      .set({ status, updatedAt: new Date() })
      .where(eq(exchanges.id, id))
      .returning();
    return updatedExchange;
  }

  async markExchangeRead(exchangeId: number, userId: string): Promise<Exchange> {
    const [ex] = await db.select().from(exchanges).where(eq(exchanges.id, exchangeId)).limit(1);
    if (!ex) throw new Error("Exchange not found");
    if (ex.requesterId === userId) {
      const [updated] = await db.update(exchanges).set({ requesterLastReadAt: new Date() }).where(eq(exchanges.id, exchangeId)).returning();
      return updated;
    } else if (ex.ownerId === userId) {
      const [updated] = await db.update(exchanges).set({ ownerLastReadAt: new Date() }).where(eq(exchanges.id, exchangeId)).returning();
      return updated;
    }
    throw new Error("User not part of this exchange");
  }

  async confirmExchangeCompletion(exchangeId: number, userId: string): Promise<Exchange> {
    // Get current exchange
    const [currentExchange] = await db
      .select()
      .from(exchanges)
      .where(eq(exchanges.id, exchangeId));
    
    if (!currentExchange) {
      throw new Error("Exchange not found");
    }

    // Check if user is part of this exchange
    if (currentExchange.requesterId !== userId && currentExchange.ownerId !== userId) {
      throw new Error("User not authorized for this exchange");
    }

    // Determine which confirmation field to update
    const isRequester = currentExchange.requesterId === userId;
    const updateData = isRequester 
      ? { requesterConfirmed: true }
      : { ownerConfirmed: true };

    // Update the confirmation
    const [updatedExchange] = await db
      .update(exchanges)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(exchanges.id, exchangeId))
      .returning();

    // Check if both parties have confirmed and update status to completed
    const bothConfirmed = isRequester 
      ? updatedExchange.ownerConfirmed && true  // requester just confirmed
      : updatedExchange.requesterConfirmed && true;  // owner just confirmed

    if (bothConfirmed) {
      const [finalExchange] = await db
        .update(exchanges)
        .set({ status: "completed", updatedAt: new Date() })
        .where(eq(exchanges.id, exchangeId))
        .returning();
      return finalExchange;
    }

    return updatedExchange;
  }

  // Message operations
  async getMessages(exchangeId: number): Promise<MessageWithSender[]> {
    return await db
      .select()
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.exchangeId, exchangeId))
      .orderBy(messages.createdAt)
      .then(rows => 
        rows.map(row => ({
          ...row.messages,
          sender: row.users!
        }))
      );
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  // Favorite operations
  async getFavorites(userId: string): Promise<ToyWithOwner[]> {
    return await db
      .select()
      .from(favorites)
      .leftJoin(toys, eq(favorites.toyId, toys.id))
      .leftJoin(users, eq(toys.ownerId, users.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt))
      .then(rows => 
        rows.map(row => ({
          ...row.toys!,
          owner: row.users!
        }))
      );
  }

  async addFavorite(favorite: InsertFavorite): Promise<Favorite> {
    const [newFavorite] = await db.insert(favorites).values(favorite).returning();
    return newFavorite;
  }

  async removeFavorite(userId: string, toyId: number): Promise<void> {
    await db.delete(favorites).where(
      and(
        eq(favorites.userId, userId),
        eq(favorites.toyId, toyId)
      )
    );
  }

  async isFavorite(userId: string, toyId: number): Promise<boolean> {
    const [result] = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.toyId, toyId)
        )
      );
    return !!result;
  }

  // Review operations
  async getReviews(userId: string): Promise<ReviewWithUser[]> {
    return await db
      .select()
      .from(reviews)
      .leftJoin(users, eq(reviews.reviewerId, users.id))
      .where(eq(reviews.revieweeId, userId))
      .orderBy(desc(reviews.createdAt))
      .then(rows => 
        rows.map(row => ({
          ...row.reviews,
          reviewer: row.users!,
          reviewee: { id: userId } as User
        }))
      );
  }

  async getUserAverageRating(userId: string): Promise<number> {
    try {
      const result = await db
        .select({
          avgRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`
        })
        .from(reviews)
        .where(eq(reviews.revieweeId, userId));
      
      return Number(result[0]?.avgRating || 0);
    } catch (error) {
      console.error("Error getting user average rating:", error);
      return 0;
    }
  }

  async createReview(review: InsertReview): Promise<Review> {
    const [newReview] = await db.insert(reviews).values(review).returning();
    return newReview;
  }

  async canUserReview(exchangeId: number, reviewerId: string): Promise<boolean> {
    // Check if exchange exists and is completed
    const [exchange] = await db
      .select()
      .from(exchanges)
      .where(eq(exchanges.id, exchangeId));
    
    if (!exchange || exchange.status !== "completed") {
      return false;
    }
    
    // Check if user was part of the exchange
    const isParticipant = exchange.requesterId === reviewerId || exchange.ownerId === reviewerId;
    if (!isParticipant) {
      return false;
    }
    
    // Check if user has already reviewed this exchange
    const [existingReview] = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.exchangeId, exchangeId),
          eq(reviews.reviewerId, reviewerId)
        )
      );
    
    return !existingReview;
  }

  // ---- Block / Report operations ----

  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    const existing = await db.select().from(blocks).where(and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId))).limit(1);
    if (!existing.length) {
      await db.insert(blocks).values({ blockerId, blockedId, createdAt: new Date() });
    }
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    await db.delete(blocks).where(and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId)));
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const [row] = await db.select().from(blocks).where(and(eq(blocks.blockerId, blockerId), eq(blocks.blockedId, blockedId))).limit(1);
    return !!row;
  }

  async getBlockedUserIds(userId: string): Promise<string[]> {
    const rows = await db.select({ blockedId: blocks.blockedId }).from(blocks).where(eq(blocks.blockerId, userId));
    return rows.map(r => r.blockedId);
  }

  // ---- Personalization methods ----

  async logToyInteraction(userId: string, toyId: number, eventType: string): Promise<void> {
    await db.insert(toyInteractions).values({ userId, toyId, eventType, createdAt: new Date() });
  }

  async updateUserLocation(userId: string, payload: { enabled: boolean; latitude?: number | null; longitude?: number | null; location?: string | null }): Promise<User> {
    const updateData: any = { locationEnabled: payload.enabled, locationUpdatedAt: new Date() };
    if (payload.enabled && payload.latitude != null && payload.longitude != null) {
      updateData.latitude = Number(payload.latitude.toFixed(3));
      updateData.longitude = Number(payload.longitude.toFixed(3));
      if (payload.location !== undefined) updateData.location = payload.location;
    } else if (!payload.enabled) {
      updateData.latitude = null;
      updateData.longitude = null;
    }
    const [user] = await db.update(users).set(updateData).where(eq(users.id, userId)).returning();
    return user;
  }

  async getUserTasteProfile(userId: string): Promise<{ topAges: string[]; topCategories: string[] }> {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const weights: Record<string, number> = { TOY_VIEW: 1, TOY_FAVORITE: 5, TOY_UNFAVORITE: -3, EXCHANGE_REQUEST_CREATED: 10, EXCHANGE_COMPLETED: 20 };
    const rows = await db
      .select({ eventType: toyInteractions.eventType, category: toys.category, ageGroup: toys.ageGroup })
      .from(toyInteractions)
      .innerJoin(toys, eq(toyInteractions.toyId, toys.id))
      .where(and(eq(toyInteractions.userId, userId), gte(toyInteractions.createdAt, cutoff)));
    const catScores: Record<string, number> = {};
    const ageScores: Record<string, number> = {};
    for (const r of rows) {
      const w = weights[r.eventType] || 1;
      if (r.category) {
        for (const c of r.category.split(/[,|/;]/).map(s => s.trim()).filter(Boolean)) { catScores[c] = (catScores[c] || 0) + w; }
      }
      if (r.ageGroup) {
        for (const a of r.ageGroup.split(/[,|/;]/).map(s => s.trim()).filter(Boolean)) { ageScores[a] = (ageScores[a] || 0) + w; }
      }
    }
    return {
      topCategories: Object.entries(catScores).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]),
      topAges: Object.entries(ageScores).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]),
    };
  }

  async getToysWithOwners(whereClause?: any, limitVal?: number): Promise<ToyWithOwner[]> {
    let query = db.select().from(toys).leftJoin(users, eq(toys.ownerId, users.id));
    if (whereClause) query = (query as any).where(whereClause);
    if (limitVal) query = (query as any).limit(limitVal);
    return (await query.orderBy(desc(toys.createdAt))).map((r: any) => ({ ...r.toys, owner: r.users! }));
  }

  async getCandidateToysNearUser(userId: string, lat: number, lng: number, radiusKm = 20): Promise<(ToyWithOwner & { distanceKm: number })[]> {
    const rows = await db.execute(sql`
      SELECT t.*, row_to_json(u.*) as owner,
        (6371 * acos(cos(radians(${lat})) * cos(radians(t.latitude)) * cos(radians(t.longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(t.latitude)))) AS distance_km,
        CASE WHEN t.boosted_until > NOW() THEN 0 ELSE 1 END AS sort_order
      FROM toys t
      LEFT JOIN users u ON u.id = t.owner_id
      WHERE t.is_available = true AND t.deleted_at IS NULL AND t.latitude IS NOT NULL AND t.longitude IS NOT NULL
        AND (6371 * acos(cos(radians(${lat})) * cos(radians(t.latitude)) * cos(radians(t.longitude) - radians(${lng})) + sin(radians(${lat})) * sin(radians(t.latitude)))) <= ${radiusKm}
      ORDER BY sort_order ASC, distance_km ASC, t.created_at DESC
      LIMIT 200
    `);
    return (rows as any).rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      category: r.category,
      ageGroup: r.age_group,
      condition: r.condition,
      imageUrls: r.image_urls,
      ownerId: r.owner_id,
      isAvailable: r.is_available,
      location: r.location,
      latitude: r.latitude,
      longitude: r.longitude,
      boostedUntil: r.boosted_until,
      deletedAt: r.deleted_at,
      lookingForCategories: r.looking_for_categories,
      lookingForDetails: r.looking_for_details,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      owner: r.owner,
      distanceKm: Number(r.distance_km),
    }));
  }
}

export const storage = new DatabaseStorage();
