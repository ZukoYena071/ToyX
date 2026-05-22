import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "./db";
import { toys } from "@shared/schema";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

const app = express();

// ══════════════════════════════════════════════════════════════════
// Social media bot detection — MUST be the very first middleware so
// crawlers never hit express.static or the SPA catch-all.
// ══════════════════════════════════════════════════════════════════
const BOT_UA = /facebookexternalhit|WhatsApp|Twitterbot|LinkedInBot|Slack|Discord|Telegram|Pinterest/i;
app.use(async (req, res, next) => {
  const ua = req.headers["user-agent"] || "";
  if (BOT_UA.test(ua)) {
    console.log("SOCIAL_BOT_PATH:", req.path);
    const match = req.path.match(/^\/toy\/(\d+)$/);
    if (match) {
      try {
        const [toy] = await db.select().from(toys).where(eq(toys.id, parseInt(match[1]))).limit(1);
        if (toy) {
          const baseUrl = process.env.APP_BASE_URL || "https://app.toyxchange.online";
          const imageUrl = `${baseUrl}/api/listings/${toy.id}/image?f=.jpg`;
          const desc = (toy.description || "").slice(0, 200);
          const location = toy.location ? ` in ${toy.location}` : "";
          res.setHeader("X-ToyX-Bot-Detected", "true");
          return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${toy.name}${location} | ToyX</title>
  <meta property="og:title" content="${toy.name}${location} | ToyX" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:alt" content="Photo of ${toy.name} on ToyX" />
  <meta property="og:url" content="${baseUrl}/toy/${toy.id}" />
  <meta property="og:type" content="article" />
  <meta name="twitter:card" content="summary_large_image" />
</head>
<body>
  <h1>${toy.name}</h1>
  <p>${desc}</p>
</body>
</html>`);
        }
      } catch (e) {
        log(`OG error: ${e}`);
      }
    }
  }
  next();
});

// Raw body for Paystack webhook (must run before express.json)
app.use((req, res, next) => {
  if (req.path === '/api/billing/paystack/webhook') {
    express.raw({ type: '*/*' })(req, res, (err) => {
      if (err) return next(err);
      req.rawBody = req.body as Buffer;
      try {
        req.body = JSON.parse((req.body as Buffer).toString());
      } catch {
        req.body = {};
      }
      next();
    });
  } else {
    next();
  }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Ensure marketing_subscribers table exists
  try {
    await db.execute(`CREATE TABLE IF NOT EXISTS marketing_subscribers (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    await db.execute("SELECT COUNT(*) FROM marketing_subscribers");
    log("Marketing table verified");
  } catch (e: any) {
    log(`Marketing table error: ${e.message}`);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`serving on port ${port}`);
  });
})();
