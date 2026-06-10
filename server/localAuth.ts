import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memorystore from "memorystore";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { awardFoundingMemberBadge } from "./rewards";

const MemoryStore = memorystore(session);

// Fail fast in production if SESSION_SECRET is missing — prevents insecure session forgery
if (!process.env.SESSION_SECRET) {
  if (process.env.NODE_ENV === "production") {
    console.error("FATAL: SESSION_SECRET must be set in production");
    process.exit(1);
  }
  console.warn("SESSION_SECRET not set — using insecure default (dev only)");
}

export function getSession() {
  return session({
    secret: process.env.SESSION_SECRET || "local-dev-secret",
    store: new MemoryStore({ checkPeriod: 86400000 }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Local email/password login is disabled for security.
  // All authentication must use Google or Facebook OAuth.
  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      async (_email, _password, done) => {
        return done(null, false, { message: "Please sign in with Google." });
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

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { code: "RATE_LIMITED", message: "Too many attempts. Try again in 15 minutes." },
  });

  app.post("/api/login", loginLimiter, (req, res, next) => {
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

  // Google OAuth — only if credentials are configured
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
  const APP_BASE_URL = process.env.APP_BASE_URL || "";

  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && APP_BASE_URL) {
    passport.use(new GoogleStrategy({
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${APP_BASE_URL}/api/auth/google/callback`,
    }, async (_accessToken: string, _refreshToken: string, profile: any, done: (error: any, user?: any) => void) => {
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
            profileImageUrl: profile.photos?.[0]?.value?.replace(/^http:/, "https:") || null,
            googleConnected: true,
          });
          user = (await storage.getUser(userId))!;
          awardFoundingMemberBadge(userId).catch(() => {});
        } else {
          await storage.updateUser(user.id, { googleConnected: true });
        }
        if (user) {
          done(null, { id: user.id, sub: user.id, claims: { sub: user.id }, expires_at: Math.floor(Date.now() / 1000) + 86400, access_token: _accessToken, refresh_token: _refreshToken });
        } else {
          done(null, false);
        }
      } catch (err) {
        done(err as Error);
      }
    }));
    console.log("Google OAuth configured");
  }

  // Always register routes so they don't 404 in production — handler checks config at runtime
  const oauthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { code: "RATE_LIMITED", message: "Too many sign-in attempts. Try again in 15 minutes." },
  });

  app.get("/api/auth/google", oauthLimiter, (req, res, next) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !APP_BASE_URL) {
      return res.status(503).json({ code: "GOOGLE_AUTH_NOT_CONFIGURED", message: "Google OAuth is not configured on this server." });
    }
    passport.authenticate("google", { scope: ["profile", "email"], prompt: "select_account", session: true })(req, res, next);
  });
  app.get("/api/auth/google/callback", (req, res, next) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !APP_BASE_URL) {
      return res.status(503).json({ code: "GOOGLE_AUTH_NOT_CONFIGURED", message: "Google OAuth is not configured on this server." });
    }
    passport.authenticate("google", { successReturnToOrRedirect: "/", failureRedirect: "/login" })(req, res, next);
  });

  // Facebook OAuth — only if credentials are configured AND feature flag is enabled
  const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || "";
  const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || "";
  const ENABLE_FACEBOOK_AUTH = process.env.ENABLE_FACEBOOK_AUTH === "true";

  if (FACEBOOK_APP_ID && FACEBOOK_APP_SECRET && APP_BASE_URL && ENABLE_FACEBOOK_AUTH) {
    passport.use(new FacebookStrategy({
      clientID: FACEBOOK_APP_ID,
      clientSecret: FACEBOOK_APP_SECRET,
      callbackURL: `${APP_BASE_URL}/api/auth/facebook/callback`,
      profileFields: ["id", "displayName", "email", "photos"],
    }, async (_accessToken: string, _refreshToken: string, profile: any, done: (error: any, user?: any) => void) => {
      try {
        const email = profile.emails?.[0]?.value;
        const name = profile.displayName?.split(" ") || [];
        const existing = email ? await storage.searchUsersByEmail(email) : [];
        let user = existing[0];
        if (!user) {
          const userId = `facebook_${profile.id}`;
          await storage.upsertUser({
            id: userId,
            email: email || `facebook_${profile.id}@placeholder.com`,
            firstName: name[0] || profile.displayName || "Facebook",
            lastName: name.slice(1).join(" ") || "",
            profileImageUrl: profile.photos?.[0]?.value?.replace(/^http:/, "https:") || null,
            facebookConnected: true,
          });
          user = (await storage.getUser(userId))!;
          awardFoundingMemberBadge(userId).catch(() => {});
        } else {
          await storage.updateUser(user.id, { facebookConnected: true });
        }
        if (user) {
          done(null, { id: user.id, sub: user.id, claims: { sub: user.id }, expires_at: Math.floor(Date.now() / 1000) + 86400, access_token: _accessToken, refresh_token: _refreshToken });
        } else {
          done(null, false);
        }
      } catch (err) {
        console.error("Facebook OAuth verify error:", err);
        done(err as Error);
      }
    }));
    console.log("Facebook OAuth configured");
  } else if (ENABLE_FACEBOOK_AUTH) {
    console.warn("FACEBOOK_AUTH_MISCONFIGURED: ENABLE_FACEBOOK_AUTH=true but FACEBOOK_APP_ID or FACEBOOK_APP_SECRET missing");
    import("@sentry/node").then(Sentry => {
      Sentry.captureMessage("FACEBOOK_AUTH_MISCONFIGURED: feature flag enabled but credentials missing", "warning");
    }).catch(() => {});
  } else {
    import("@sentry/node").then(Sentry => {
      Sentry.captureMessage("FACEBOOK_AUTH_DISABLED: ENABLE_FACEBOOK_AUTH not true", "info");
    }).catch(() => {});
  }

  // Always register routes so they don't 404 in production — handler checks config at runtime
  app.get("/api/auth/facebook", oauthLimiter, (req, res, next) => {
    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET || !APP_BASE_URL || !ENABLE_FACEBOOK_AUTH) {
      return res.status(503).json({ code: "FACEBOOK_AUTH_NOT_CONFIGURED", message: "Facebook OAuth is not configured on this server." });
    }
    passport.authenticate("facebook", { scope: ["public_profile", "email"], session: true })(req, res, next);
  });
  app.get("/api/auth/facebook/callback", (req, res, next) => {
    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET || !APP_BASE_URL || !ENABLE_FACEBOOK_AUTH) {
      return res.status(503).json({ code: "FACEBOOK_AUTH_NOT_CONFIGURED", message: "Facebook OAuth is not configured on this server." });
    }
    passport.authenticate("facebook", { successReturnToOrRedirect: "/", failureRedirect: "/login" })(req, res, next);
  });

  // Demo users no longer auto-created per cleanup policy

  // Provider availability endpoint — lets the frontend hide unavailable auth buttons
  const facebookAvailable = !!(FACEBOOK_APP_ID && FACEBOOK_APP_SECRET && APP_BASE_URL && ENABLE_FACEBOOK_AUTH);
  const googleAvailable = !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && APP_BASE_URL);

  app.get("/api/auth/providers", (req, res) => {
    res.json({ google: googleAvailable, facebook: facebookAvailable });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}
