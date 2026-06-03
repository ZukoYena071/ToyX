# ToyX — Production Deployment Guide

## Prerequisites

- Node.js 22+
- PostgreSQL 15+
- Cloudflare account (for R2 + DNS)
- Paystack account (for payments)
- Resend account (for email)
- Google Cloud Console project (for OAuth + Maps)
- Facebook Developer account (for OAuth, optional)

---

## 1. Environment Variables

Copy `.env.example` to `.env` and fill all values. See `.env.example` for descriptions.

**Critical startup guards:**
- `DATABASE_URL` — process throws if missing
- `SESSION_SECRET` — `process.exit(1)` in production if missing

**Silent degradation (no crash but features break):**
- `RESEND_API_KEY` — emails silently fail
- `PAYSTACK_SECRET_KEY` — payments silently fail
- `R2_*` — images stored as base64 in DB (payload bloat)

---

## 2. Build

```bash
npm run build
```

This produces:
- `dist/public/` — Vite client bundle
- `dist/index.js` — Compiled server entry
- `dist/instrument.js` — Sentry ESM preload

---

## 3. Database

Run migrations (if applicable) before starting:

```bash
# Drizzle push (dev) or generated migrations
npm run db:push
```

---

## 4. Start

```bash
npm start
# Equivalent to:
# NODE_ENV=production node --import ./dist/instrument.js dist/index.js
```

The `--import ./dist/instrument.js` flag preloads Sentry instrumentation
before any other code runs, ensuring errors are captured from startup.

---

## 5. DNS Configuration

| Record | Type | Value |
|---|---|---|
| `toyxchange.online` | A | (Your server IP) |
| `images.toyxchange.online` | CNAME | Cloudflare R2 bucket |

Both should be proxied through Cloudflare for SSL termination,
DDoS protection, and caching.

---

## 6. Paystack Webhook

Configure in Paystack Dashboard → Settings → Webhooks:

- **URL**: `https://toyxchange.online/api/billing/paystack/webhook`
- **Events**: `subscription.create`, `subscription.enable`,
  `subscription.disable`, `subscription.expire`
- **Verification**: HMAC-SHA512 with your `PAYSTACK_SECRET_KEY`

---

## 7. OAuth Callback URLs

### Google OAuth
Configure in Google Cloud Console → APIs & Services → Credentials:

- **Authorized redirect URIs**:
  - `https://toyxchange.online/api/auth/google/callback`

### Facebook OAuth
Configure in Facebook Developers → App → Facebook Login:

- **Valid OAuth Redirect URIs**:
  - `https://toyxchange.online/api/auth/facebook/callback`

---

## 8. Resend (Email)

Verify `RESEND_API_KEY` is set in environment.
Test with a welcome email trigger after first deployment.

---

## 9. Backup Strategy

### Database
```bash
# Daily automated backup
pg_dump "$DATABASE_URL" > /backups/toyx-$(date +%Y%m%d).sql

# Before any migration
pg_dump "$DATABASE_URL" > /backups/toyx-pre-migration-$(date +%Y%m%d-%H%M).sql
```

### Images (R2)
R2 images are stored in Cloudflare's infrastructure.
Enable R2 Object Versioning in the Cloudflare Dashboard
to protect against accidental deletion.

### Environment
Store a copy of the current `.env` in a password manager
(1Password/Bitwarden) or encrypted storage. Never commit `.env` to git.

---

## 10. Health Check

After deployment, verify:

- `GET /api/health` returns 200 (if implemented)
- Login works via email/password and OAuth
- Toys load on home page with images
- Exchange flow works end-to-end
- Email is delivered on signup
- Paystack payment completes
- Sentry errors are visible in dashboard
