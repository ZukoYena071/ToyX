import {
  users,
  toys,
  exchanges,
  messages,
  favorites,
  reviews,
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
import { eq, desc, and, or, ilike, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, userData: Partial<User>): Promise<User>;
  
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
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

  // Toy operations
  async getToys(): Promise<ToyWithOwner[]> {
    return await db
      .select()
      .from(toys)
      .leftJoin(users, eq(toys.ownerId, users.id))
      .where(eq(toys.isAvailable, true))
      .orderBy(desc(toys.createdAt))
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
      .where(eq(toys.ownerId, userId))
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
          or(
            ilike(toys.name, `%${query}%`),
            ilike(toys.description, `%${query}%`),
            ilike(toys.category, `%${query}%`)
          )
        )
      )
      .orderBy(desc(toys.createdAt))
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
          eq(toys.category, category)
        )
      )
      .orderBy(desc(toys.createdAt))
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
}

export const storage = new DatabaseStorage();
