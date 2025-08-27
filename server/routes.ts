import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertToySchema, insertExchangeSchema, insertMessageSchema, insertFavoriteSchema, insertReviewSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User profile routes
  app.get('/api/users/:id', async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
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
      console.error("Error fetching user toys:", error);
      res.status(500).json({ message: "Failed to fetch user toys" });
    }
  });

  app.get('/api/users/:id/reviews', async (req, res) => {
    try {
      const reviews = await storage.getReviews(req.params.id);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      res.status(500).json({ message: "Failed to fetch user reviews" });
    }
  });

  app.get('/api/users/:id/rating', async (req, res) => {
    try {
      const rating = await storage.getUserAverageRating(req.params.id);
      res.json({ rating });
    } catch (error) {
      console.error("Error fetching user rating:", error);
      res.status(500).json({ message: "Failed to fetch user rating" });
    }
  });

  // Update user profile
  app.patch('/api/users/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updateData = req.body;
      
      // Update user profile in storage
      const updatedUser = await storage.updateUser(userId, updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Toy routes
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
      
      // Add favorite status for authenticated users
      if (req.user?.claims?.sub) {
        const userId = req.user.claims.sub;
        for (const toy of toys) {
          toy.isFavorited = await storage.isFavorite(userId, toy.id);
        }
      } else {
        // Set default favorite status for unauthenticated users
        for (const toy of toys) {
          toy.isFavorited = false;
        }
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
      const toyData = insertToySchema.parse({ ...req.body, ownerId: userId });
      const toy = await storage.createToy(toyData);
      res.status(201).json(toy);
    } catch (error) {
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
