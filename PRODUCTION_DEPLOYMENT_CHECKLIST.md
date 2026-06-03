# ToyX — Production Deployment Checklist

> **Branch**: `main` (production)
> **Source**: `release-candidate-1` → merge to `main`
> **Goal**: Deploy and verify production candidate

---

## Phase 1 — Pre-Deployment

### 1.1 Code Freeze
- [ ] All feature branches merged to `release-candidate-1`
- [ ] No pending PRs or unmerged changes
- [ ] `release-candidate-1` commit hash recorded: _________

### 1.2 Build Verification
- [ ] `npm run build` succeeds (client + server)
- [ ] Vite build produces `dist/public/` with no errors
- [ ] esbuild produces `dist/index.js` and `dist/instrument.js`
- [ ] Bundle size noted (JS: ______ KB, CSS: ______ KB)

### 1.3 Environment Variables
**Copy `.env.example` to production environment and fill:**

| # | Variable | Value | Verified |
|---|----------|-------|----------|
| 1 | `DATABASE_URL` | Production PostgreSQL URL | [ ] |
| 2 | `SESSION_SECRET` | `openssl rand -hex 32` | [ ] |
| 3 | `APP_BASE_URL` | `https://toyxchange.online` | [ ] |
| 4 | `RESEND_API_KEY` | `re_...` | [ ] |
| 5 | `FROM_EMAIL` | `"ToyX <hello@toyxchange.online>"` | [ ] |
| 6 | `R2_ACCOUNT_ID` | Cloudflare R2 account ID | [ ] |
| 7 | `R2_ACCESS_KEY_ID` | R2 access key | [ ] |
| 8 | `R2_SECRET_ACCESS_KEY` | R2 secret key | [ ] |
| 9 | `R2_BUCKET_NAME` | `toyx-images` | [ ] |
| 10 | `R2_PUBLIC_URL` | `https://images.toyxchange.online` | [ ] |
| 11 | `GOOGLE_CLIENT_ID` | Google OAuth client ID | [ ] |
| 12 | `GOOGLE_CLIENT_SECRET` | Google OAuth secret | [ ] |
| 13 | `ENABLE_FACEBOOK_AUTH` | `true` / `false` | [ ] |
| 14 | `FACEBOOK_APP_ID` | (if enabled) | [ ] |
| 15 | `FACEBOOK_APP_SECRET` | (if enabled) | [ ] |
| 16 | `GOOGLE_MAPS_API_KEY` | Google Places API key | [ ] |
| 17 | `PAYSTACK_SECRET_KEY` | Paystack **live** secret key | [ ] |
| 18 | `PAYSTACK_MONTHLY_PLAN_CODE` | Paystack monthly plan ID | [ ] |
| 19 | `PAYSTACK_YEARLY_PLAN_CODE` | Paystack yearly plan ID | [ ] |
| 20 | `PAYSTACK_MONTHLY_AMOUNT` | Amount in kobo (e.g. `8900`) | [ ] |
| 21 | `PAYSTACK_YEARLY_AMOUNT` | Amount in kobo (e.g. `49900`) | [ ] |
| 22 | `SENTRY_DSN` | Server Sentry DSN | [ ] |
| 23 | `SENTRY_ENVIRONMENT` | `production` | [ ] |
| 24 | `VITE_SENTRY_DSN` | Client Sentry DSN | [ ] |
| 25 | `VITE_SENTRY_ENVIRONMENT` | `production` | [ ] |
| 26 | `VITE_ENABLE_SENTRY_DEBUG` | `false` | [ ] |
| 27 | `PORT` | `5000` | [ ] |

### 1.4 Database
- [ ] Production database created and accessible
- [ ] Connection string `DATABASE_URL` verified
- [ ] Schema up to date (run DB migration if applicable)
- [ ] Pre-deployment backup taken:

  ```bash
  pg_dump "$DATABASE_URL" > /backups/toyx-pre-prod-$(date +%Y%m%d-%H%M).sql
  ```

### 1.5 External Services — Configuration

#### Paystack (Live)
- [ ] Webhook URL: `https://toyxchange.online/api/billing/paystack/webhook`
- [ ] Webhook events enabled: `subscription.create`, `subscription.enable`, `subscription.disable`, `subscription.expire`
- [ ] Live secret key set in environment
- [ ] Live plan codes match environment

#### Google OAuth
- [ ] Authorized redirect URI: `https://toyxchange.online/api/auth/google/callback`
- [ ] Authorized JavaScript origins: `https://toyxchange.online`
- [ ] Client ID and secret set in environment

#### Facebook OAuth (if enabled)
- [ ] Valid OAuth redirect URI: `https://toyxchange.online/api/auth/facebook/callback`
- [ ] App ID and secret set in environment

#### Resend
- [ ] Domain `toyxchange.online` verified in Resend dashboard
- [ ] DKIM/SPF DNS records added to Cloudflare
- [ ] API key (`re_...`) set in environment
- [ ] Sender identity verified

#### Cloudflare R2
- [ ] Bucket `toyx-images` created
- [ ] R2 public URL set: `https://images.toyxchange.online`
- [ ] CORS configuration allows `toyxchange.online`
- [ ] API credentials set in environment

#### Cloudflare DNS
- [ ] A record: `toyxchange.online` → server IP (proxied)
- [ ] CNAME: `images.toyxchange.online` → R2 bucket (proxied)

#### Sentry
- [ ] Project created for ToyX
- [ ] DSNs set for server and client
- [ ] Environment set to `production`

---

## Phase 2 — Deployment

### 2.1 Deploy Code
- [ ] `git checkout main && git pull`
- [ ] `git merge release-candidate-1`
- [ ] `npm ci --omit=dev` (clean install production deps)
- [ ] `npm run build`
- [ ] Server process started:

  ```bash
  NODE_ENV=production node --import ./dist/instrument.js dist/index.js
  ```

### 2.2 Verify Process
- [ ] Server process is running: `ps aux | grep node`
- [ ] Listening on expected port: `lsof -i :5000`
- [ ] No startup errors in logs
- [ ] Process restarts automatically (PM2/systemd configured)

---

## Phase 3 — Post-Deployment Smoke Test

See [PRODUCTION_SMOKE_TEST.md](./PRODUCTION_SMOKE_TEST.md) for full test sequence.

- [ ] Health check passes
- [ ] Login works (email/password)
- [ ] Home page loads with toys
- [ ] Images display correctly
- [ ] OAuth login works (Google, Facebook if enabled)
- [ ] Search returns results
- [ ] Toy detail renders
- [ ] Exchange flow works
- [ ] Chat loads
- [ ] Profile displays
- [ ] Referral link generates
- [ ] Premium Pass displays (if granted)
- [ ] Paystack subscription flow works
- [ ] Email received on signup

### 2.3 Monitoring
- [ ] Sentry dashboard shows no errors after 15 minutes
- [ ] Server logs show no unhandled errors
- [ ] Database connections stable

---

## Phase 4 — Rollback Plan

**If critical issues are found within 30 minutes of deployment:**

### Immediate Rollback
```bash
# Option A — Revert code
git revert HEAD --no-edit   # Revert merge commit
npm run build
pm2 restart toyx

# Option B — Restore previous version
git checkout HEAD~1
npm run build
pm2 restart toyx

# Database rollback (if migration was applied)
psql "$DATABASE_URL" < /backups/toyx-pre-prod-*.sql
```

### Rollback Criteria (automatically roll back if any of these occur)
- [ ] 500 errors > 1% of requests
- [ ] Login broken for any auth method
- [ ] API returns incorrect data for listings
- [ ] Payments failing consistently
- [ ] Database connection errors

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Deployer | | | |
| QA | | | |
| Product | | | |
