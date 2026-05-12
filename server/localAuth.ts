import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memorystore from "memorystore";
import { storage } from "./storage";

const MemoryStore = memorystore(session);

export function getSession() {
  return session({
    secret: process.env.SESSION_SECRET || "local-dev-secret",
    store: new MemoryStore({ checkPeriod: 86400000 }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (email, _password, done) => {
        try {
          const users = await storage.searchUsersByEmail(email);
          const user = users.length > 0 ? users[0] : undefined;
          if (!user) {
            return done(null, false, { message: "User not found" });
          }
          return done(null, { id: user.id, sub: user.id });
        } catch (err) {
          return done(err);
        }
      },
    ),
  );

  passport.serializeUser((user: any, cb) => cb(null, user.id));
  passport.deserializeUser(async (id: string, cb) => {
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

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
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

  app.get("/api/logout", (req, res, next) => {
    req.logout(() => {
      res.redirect("/login");
    });
  });

  // Auto-create a demo user on startup
  try {
    const demoUser = await storage.getUser("demo-user-1");
    if (!demoUser) {
      await storage.upsertUser({
        id: "demo-user-1",
        email: "demo@gmail.com",
        firstName: "Demo",
        lastName: "User",
        profileImageUrl: null,
      });
      await storage.upsertUser({
        id: "demo-user-2",
        email: "parent@gmail.com",
        firstName: "Parent",
        lastName: "Test",
        profileImageUrl: null,
      });
      console.log("Demo users created");
    }
  } catch (e) {
    console.log("Note: demo users not yet created (tables may not exist yet)");
  }
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}
