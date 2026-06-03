# RC2 Production Candidate — Deployment Checklist

## 1. Pre-Deployment

- [ ] `release-candidate-1` branch locked (no further feature commits)
- [ ] `.env` file populated from `.env.example` with production values
- [ ] `npm run build` succeeds (verified: compiles to 856KB JS + 131KB CSS + 169KB server)
- [ ] Database migration tested on staging
- [ ] Backup of production database taken (pg_dump)

---

## 2. Environment Variables

### Critical (app crashes if missing)
- [ ] `DATABASE_URL` — Production PostgreSQL connection string
- [ ] `SESSION_SECRET` — Random 64-char hex (`openssl rand -hex 32`)

### Required (features break if missing)
- [ ] `APP_BASE_URL` — `https://toyxchange.online`
- [ ] `RESEND_API_KEY` — Resend API key (email delivery)
- [ ] `PAYSTACK_SECRET_KEY` — Paystack secret key

### Image Storage (R2)
- [ ] `R2_ACCOUNT_ID` — Cloudflare R2 account
- [ ] `R2_ACCESS_KEY_ID` — R2 access key
- [ ] `R2_SECRET_ACCESS_KEY` — R2 secret key
- [ ] `R2_BUCKET_NAME` — `toyx-images`
- [ ] `R2_PUBLIC_URL` — `https://images.toyxchange.online`

### Google OAuth
- [ ] `GOOGLE_CLIENT_ID` — From Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` — From Google Cloud Console

### Facebook OAuth (optional)
- [ ] `ENABLE_FACEBOOK_AUTH=true`
- [ ] `FACEBOOK_APP_ID`
- [ ] `FACEBOOK_APP_SECRET`

### Location (optional)
- [ ] `GOOGLE_MAPS_API_KEY` — Google Places API

### Paystack Plans
- [ ] `PAYSTACK_MONTHLY_PLAN_CODE` — Monthly plan ID
- [ ] `PAYSTACK_YEARLY_PLAN_CODE` — Yearly plan ID
- [ ] `PAYSTACK_MONTHLY_AMOUNT` — In kobo (default 8900)
- [ ] `PAYSTACK_YEARLY_AMOUNT` — In kobo (default 44900)

### Sentry (optional)
- [ ] `SENTRY_DSN` — Server-side DSN
- [ ] `SENTRY_ENVIRONMENT=production`
- [ ] `VITE_SENTRY_DSN` — Client-side DSN (build-time)
- [ ] `VITE_SENTRY_ENVIRONMENT=production`
- [ ] `VITE_ENABLE_SENTRY_DEBUG=false`

---

## 3. OAuth Callbacks

### Google
- [ ] Authorized redirect: `https://toyxchange.online/api/auth/google/callback`

### Facebook
- [ ] Valid OAuth redirect: `https://toyxchange.online/api/auth/facebook/callback`

---

## 4. Paystack

- [ ] Paystack webhook configured at `https://toyxchange.online/api/billing/paystack/webhook`
- [ ] Webhook events enabled: subscription.create, subscription.enable, subscription.disable, subscription.expire
- [ ] Webhook signature verification using `PAYSTACK_SECRET_KEY`
- [ ] Test payment completes end-to-end on production candidate

---

## 5. Resend (Email)

- [ ] `RESEND_API_KEY` verified (Run: `curl -X GET https://api.resend.com/audiences -H "Authorization: Bearer $RESEND_API_KEY"`)
- [ ] `FROM_EMAIL` domain verified in Resend
- [ ] Welcome email sends on signup
- [ ] Exchange notification emails send

---

## 6. DNS & Domain

- [ ] `toyxchange.online` resolves to server IP
- [ ] `images.toyxchange.online` CNAME to Cloudflare R2
- [ ] SSL certificates active (Cloudflare)
- [ ] PWA manifest served at `https://toyxchange.online/manifest.webmanifest`

---

## 7. Backup Strategy

- [ ] Automated daily pg_dump configured
- [ ] Pre-migration backup process documented
- [ ] `.env` stored in password manager (not in git)
- [ ] R2 Object Versioning enabled

---

## 8. Post-Deployment

- [ ] `npm run build` run on production server
- [ ] `npm start` launches without errors
- [ ] Sentry errors visible in dashboard (test with intentional error)
- [ ] Home page loads with toy data and images
- [ ] Login works (email + Google + Facebook)
- [ ] Referral flow: link → signup → exchange → Premium activated
- [ ] Subscription purchase completes
- [ ] Email delivered on signup
- [ ] Images upload and display from R2
- [ ] Exchange creation → acceptance → completion flows work
