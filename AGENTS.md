# ToyX — AI Agent Onboarding Guide

## What Is ToyX?

ToyX is a South African community toy exchange platform. Families list toys their children have outgrown and swap them with other families instead of buying new. The platform handles discovery, messaging, exchange coordination, rewards, and community safety.

**Tagline**: Share toys, spread joy.  
**Tone**: Warm, calm, family-friendly, community-oriented.  
**Status**: Pre-launch / RC2 production candidate.

## Target Audience

- South African parents and guardians
- Families with children aged 0-12
- Environmentally conscious households
- Community-oriented users looking to reduce waste and save money

## High-Level Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Marketing    │     │  ToyX App    │     │  API Server  │
│  Site         │     │  (SPA)       │     │  (Express)   │
│  Cloudflare   │     │  React/Vite  │     │  Node 22     │
│  Pages        │     │  TypeScript  │     │  ESM         │
└──────────────┘     └──────┬───────┘     └──────┬────────┘
                            │ HTTP/JSON           │
                            ▼                     ▼
                     ┌──────────────┐     ┌──────────────┐
                     │  PostgreSQL  │     │  Cloudflare  │
                     │  (Drizzle)   │     │  R2 (images) │
                     └──────────────┘     └──────────────┘
```

## Branch Strategy

| Branch | Environment | URL | Purpose |
|---|---|---|---|
| `develop` | None | — | Active feature development. Feature branches created from here. |
| `release-candidate-1` | Staging | `staging.toyxchange.online` | QA, testing, validation. Auto-deployed. |
| `main` | Production | `app.toyxchange.online` | Live customer environment. PR-only merges from RC1. |

**Workflow**: `develop` → `release-candidate-1` (staging) → `main` (production).  
No direct commits to `main`. No shortcuts. Staging validation required before production.

## Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build**: Vite 5
- **Routing**: wouter (lightweight, no React Router)
- **Styling**: Tailwind CSS v3
- **State**: React Query (TanStack Query v5)
- **Icons**: lucide-react
- **Auth**: Custom `useAuth` hook backed by session cookies
- **Bundled size**: ~856KB JS (236KB gzipped), ~131KB CSS

### Backend
- **Runtime**: Node.js 22, ESM modules
- **Framework**: Express
- **ORM**: Drizzle ORM (schema-first, no raw SQL)
- **Database**: PostgreSQL 15+
- **Auth**: Passport.js (email/password, Google OAuth, Facebook OAuth)
- **Session**: Express session with in-memory store (production should use a real store)
- **Email**: Resend.com API (transactional emails)
- **File upload**: multer

### Infrastructure
- **Image storage**: Cloudflare R2
- **Error monitoring**: Sentry (server + client)
- **Payments**: Paystack (South African payment processor)
- **Email**: Resend
- **OAuth**: Google, Facebook
- **Location**: Google Places API
- **CI**: GitHub Actions (3 jobs: quality, api-tests, e2e-tests)
- **Hosting**: Render (or similar Node hosting)

## Database Schema (Key Tables)

| Table | Purpose |
|---|---|
| `users` | User accounts. Fields: `premiumPassUntil`, `plan`, `subscriptionStatus`, `referralCode`, `isAdmin` |
| `toys` | Toy listings. Fields: `isAvailable`, `deletedAt`, `boostedUntil`, `ownerId` |
| `exchanges` | Exchange requests between users. Status: `pending`, `accepted`, `completed`, `canceled` |
| `messages` | Chat messages within exchanges. Supports emoji reactions (JSONB) |
| `favorites` | User favorited toys |
| `reviews` | Post-exchange reviews with ratings |
| `blocks` | User-to-user blocks (bidirectional filtering) |
| `reports` | User/message reports for moderation |
| `referrals` | Referral tracking. Status: `pending`, `qualified` |
| `userRewards` | Points balance, badges |
| `rewardLedger` | Points transaction history |
| `founding_members` | Founding member program signups. Columns: `memberNumber`, `signupSource` |
| `support_requests` | Customer support tickets |

## Key Features Implemented

### Authentication
- Email/password signup and login
- Google OAuth (configurable via `GOOGLE_CLIENT_ID`)
- Facebook OAuth (configurable via `ENABLE_FACEBOOK_AUTH`)
- Session-based auth with `sameSite: "lax"` cookies
- `SESSION_SECRET` required in production (process.exit guard)

### Toy Listings
- Create, edit, delete toys with up to 6 images
- Categories, age groups, condition, location
- Boosted listings (paid via Paystack or points)
- Search by text, filter by category
- Blocked user filtering (can't see each other's toys)

### Exchanges
- Request exchange with message + offered toy selection
- Accept/decline by toy owner
- Both parties confirm completion
- Automatic toy unlisting on completion
- Role-aware UI: "You want" / "You offer" vs "They want" / "They offer"

### Chat & Messaging
- Real-time via WebSocket (server at `/ws`)
- Emoji reactions (👍❤️😂😮😢🙏)
- System thread for moderation/safety messages
- Unread indicators, read tracking

### Payments (Paystack)
- Monthly/yearly subscription plans
- One-time toy boosts
- Webhook-based subscription lifecycle
- HMAC-SHA512 signature verification
- **Note**: Only test keys have been used. Production keys need configuration.

### Referral Program
- Shareable referral link (`/welcome?ref=CODE`)
- Attribution via localStorage + claim on signup/OAuth
- Rewards: 200 pts + 7d Premium (referrer), 100 pts + 7d Premium (referee)
- Abuse prevention: referee dedup, monthly cap (5/month)

### Founding Member Program
- Registration via marketing site (`POST /api/founding-members`)
- Sequential member numbers
- Welcome email sent on registration
- Admin dashboard at `/admin/founding-members`
- CSV export for campaigns

### Premium / Subscription
- Paystack paid plans (`premium_monthly`, `premium_yearly`)
- Premium Pass via referral rewards (`premiumPassUntil` column)
- Premium Pass via points redemption (1200 points for 7 days)
- The UI shows `✨ Premium Pass` when active, even if `plan = "free"`
- Free tier limits: 5 active listings, 3 monthly requests, 2 active exchanges

### Safety & Moderation
- User blocking (bidirectional)
- User reporting (rate-limited to 5/day)
- Admin moderation: suspend, ban, message users
- Moderation messages appear in system chat thread

### Email (Resend)
- Welcome email on signup
- Exchange request notification (to owner)
- Exchange accepted notification (to requester)
- Account suspension/ban notifications
- Founding Member welcome email
- Support request confirmation

### CI Pipeline (GitHub Actions)
- **Job 1 — TypeScript + Build**: `tsc` check + production build
- **Job 2 — API Tests**: PostgreSQL service → drizzle push → seed → start server → vitest
- **Job 3 — E2E + Visual Tests**: PostgreSQL → seed → Playwright E2E + visual snapshots

## Environment Variables (27 total)

Critical (app crashes if missing): `DATABASE_URL`, `SESSION_SECRET`  
Required for core features: `APP_BASE_URL`, `RESEND_API_KEY`, `PAYSTACK_SECRET_KEY`  
Required per feature: `R2_*`, `GOOGLE_CLIENT_*`, `FACEBOOK_APP_*`, `GOOGLE_MAPS_API_KEY`  
Optional monitoring: `SENTRY_DSN` (server), `VITE_SENTRY_DSN` (client)

Full documentation in `.env.example`.

## Release Gates (Mandatory)

Before any `release-candidate-1` → `main` merge, these P0 journeys must be validated:

- Authentication (signup, login, logout, Google OAuth, Facebook OAuth)
- Toy Exchange Flow (create → browse → search → view → request → accept → complete)
- Messaging (send, receive, conversation history)
- Payments (subscribe → activate → renew → cancel)
- Referral Program (link → signup → qualify → rewards)
- Founding Member Program (register → email → dashboard → member number)

## Project State

**Phase**: RC2 Production Candidate — validation in progress.  
**Not yet launched**. Pre-launch.

### Known Pre-Launch Gaps
1. Paystack has never been run end-to-end with live keys (test keys work)
2. Some P0 journeys have zero automated test coverage
3. Database indexes missing on key query columns (toys.is_available, favorites.user_id, etc.)
4. No automated performance/load testing
5. WebSocket occasionally disconnects behind Cloudflare Access
6. Production build succeeds but hasn't been deployed to production environment

## Common Commands

```bash
npm run dev              # Development on :3001
npm run dev:test          # Dev with DEV_AUTH_BYPASS on :3001
npm run build             # Production build
npm start                 # Production start (after build)
npm run check             # TypeScript check
npm run test:api          # API integration tests
npm run test:e2e          # Playwright E2E tests
npm run test:visual       # Visual regression tests
npm run qa                # Full QA pipeline (db:push → seed → test:api → test:e2e → test:visual)
npm run db:push           # Push Drizzle schema to database
npm run db:seed:test      # Seed test users (seed_user_1, seed_user_2, seed_user_3)
npm run db:migrate:founding  # Create founding_members table + backfill
```

## Key Files

| File | Purpose |
|---|---|
| `server/routes.ts` | All API routes (~2400 lines) |
| `server/storage.ts` | Database query methods |
| `server/rewards.ts` | Points, entitlements, referral qualification |
| `server/localAuth.ts` | Passport strategies, session config |
| `server/email/` | Email service + templates |
| `server/r2.ts` | Cloudflare R2 image upload |
| `shared/schema.ts` | Drizzle table definitions + Zod validation schemas |
| `client/src/App.tsx` | Root component, routing, loading flow |
| `.github/workflows/ci.yml` | CI pipeline |
| `DEPLOYMENT_CHECKLIST.md` | Production deployment checklist |
| `PRODUCTION_SMOKE_TEST.md` | 68-test smoke test suite |
| `RELEASE_GATES.md` | Mandatory pre-release validation gates |
| `PRODUCTION_DEPLOYMENT_CHECKLIST.md` | Full deployment plan |
