# ToyX Production Deployment Runbook

## Pre-flight Checklist

- [ ] `release-candidate-1` merged to `main` (PR approved)
- [ ] All CI checks pass (TypeScript, Build, API tests, E2E tests)
- [ ] Production database credentials configured in Render dashboard
- [ ] `SESSION_SECRET` set in production environment
- [ ] `APP_BASE_URL` set to `https://app.toyxchange.online`
- [ ] `NODE_ENV=production` set
- [ ] Google OAuth credentials configured (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
- [ ] Facebook OAuth credentials configured (if enabled)
- [ ] Paystack keys configured (production keys, not test keys)
- [ ] Cloudflare R2 configured (image upload)
- [ ] Resend API key configured (emails)
- [ ] Sentry DSN configured (error monitoring)

---

## Step 1 — Backup Production Database

```bash
# Render Dashboard → your PostgreSQL service → Manual Backup
# Or via pg_dump:
pg_dump "$DATABASE_URL" --no-owner --no-acl > toyx-production-backup-$(date +%Y%m%d-%H%M%S).sql
```

Verify the backup file exists and has content:
```bash
ls -lh toyx-production-backup-*.sql
wc -l toyx-production-backup-*.sql
```

Store the backup in a secure location (S3, GCS, or download locally).

---

## Step 2 — Merge RC1 to Main

```bash
git checkout main
git pull origin main
git merge release-candidate-1
git push origin main
```

Verify the merge commit:
```bash
git log --oneline -5
# Expected: latest commit is the merge of release-candidate-1 into main
```

---

## Step 3 — Deploy Production

Render Dashboard → production service:

1. **Branch**: set to `main`
2. **Manual Deploy** → **Clear Build Cache & Deploy**

Monitor the build log:

```
✓ built in ~30s
⚡ Done
serving on port 5000
```

Verify the build output includes assets:
```
dist/public/assets/official/space-explorer-1.png
dist/public/assets/official/montessori-puzzle-1.png
dist/public/assets/official/family-games-1.png
dist/public/assets/badges/toyx-official-light.png
```

---

## Step 4 — Run Cleanup Script

```sql
-- Open production database console (Render Dashboard or psql)
-- Paste and execute: server/production-cleanup.sql
BEGIN;
DELETE FROM messages WHERE sender_id != 'official_toyx' ...;
DELETE FROM reviews WHERE reviewer_id != 'official_toyx' ...;
...
COMMIT;
```

Verify:
```sql
SELECT COUNT(*) FROM users;        -- Expect: 1 (official_toyx only)
SELECT COUNT(*) FROM toys;         -- Expect: 3 (official listings only)
SELECT COUNT(*) FROM exchanges;    -- Expect: 0
```

---

## Step 5 — Run Seed Script

```sql
-- Paste and execute: server/production-launch-seed.sql
BEGIN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type ...;
INSERT INTO users ... ON CONFLICT ...;
INSERT INTO toys ...;
COMMIT;
```

---

## Step 6 — Run Verification Script

```sql
-- Paste and execute: server/production-verification.sql
```

Expected results:

| Section | Check | Expected |
|---|---|---|
| 1.1 | Official account exists | 1 row: official_toyx |
| 1.2 | Total users | 1 |
| 1.3 | Non-official users | 0 |
| 1.4 | Account type | `official` |
| 1.5 | Access status | `live` |
| 2.1 | Official listings | 3 |
| 2.2 | Each listing has images | 3 rows, 2 images each |
| 2.3 | No missing images | 0 rows |
| 2.4 | Non-official listings | 0 |
| 3.1–3.12 | All other tables | 0 |

---

## Step 7 — Verify Official Account in Browser

Navigate to `https://app.toyxchange.online/users/official_toyx`:

- [ ] Avatar shows ToyX logo
- [ ] Display name: "ToyX Official"
- [ ] Badge: "ToyX Official" shield icon
- [ ] Subtitle: "Official ToyX Account"
- [ ] Banner: 📚 Community Guide with educational text
- [ ] Stats hidden (no rating, no review count)
- [ ] Tabs: "Example Listings (3)" | "Community Review Examples (3)"
- [ ] Example reviews (Sarah M., Thabo K., Priya D.) visible in reviews tab

Verify listings in marketplace/search:

- [ ] All 3 listings visible
- [ ] Listing cards show ⭐ "ToyX Example" badge
- [ ] No heart/favorite icon on listing cards
- [ ] Click listing → detail page shows ⭐ banner
- [ ] Action bar shows Share only + info panel
- [ ] Owner card shows "ToyX Official [Badge] — Official ToyX Account"
- [ ] No blue verification tick

Verify API restrictions:

```bash
# Exchange request should fail
curl -X POST https://app.toyxchange.online/api/exchanges \
  -H "Content-Type: application/json" \
  -d '{"toyId":<OFFICIAL_TOY_ID>,"requestMessage":"test"}' \
  --cookie "connect.sid=..."
# → 403 "ToyX Official listings are example listings and are not available for exchange."
```

---

## Step 8 — Login as toyxchange2026@gmail.com

1. Open `https://app.toyxchange.online` in an incognito/private window
2. Click "Sign In" or "Log In"
3. Click "Continue with Google"
4. Select `toyxchange2026@gmail.com`
5. Approve OAuth permissions
6. Complete onboarding if prompted

---

## Step 9 — Promote to Admin

```sql
UPDATE users SET is_admin = true, access_status = 'live' WHERE email = 'toyxchange2026@gmail.com';
```

Verify:
```sql
SELECT id, email, is_admin, access_status FROM users WHERE email = 'toyxchange2026@gmail.com';
-- Expect: is_admin = true, access_status = 'live'
```

---

## Step 10 — Create Founding Member #1

```sql
INSERT INTO founding_members (first_name, email, city, status, member_number, badge_awarded, signup_source)
VALUES ('Admin Name', 'toyxchange2026@gmail.com', 'Johannesburg', 'ACTIVATED', 1, true, 'direct');
```

Verify:
```sql
SELECT * FROM founding_members WHERE email = 'toyxchange2026@gmail.com';
```

---

## Step 11 — Login as zukoyena22@gmail.com

Same process as Step 8, using `zukoyena22@gmail.com`.

---

## Step 12 — Promote to Admin

```sql
UPDATE users SET is_admin = true, access_status = 'live' WHERE email = 'zukoyena22@gmail.com';
```

Verify:
```sql
SELECT id, email, is_admin, access_status FROM users WHERE email = 'zukoyena22@gmail.com';
-- Expect: is_admin = true, access_status = 'live'
```

---

## Step 13 — Final Verification

### Users table
```sql
SELECT id, email, is_admin, account_type, access_status FROM users;
```

Expected:

| id | email | is_admin | account_type | access_status |
|---|---|---|---|---|
| `official_toyx` | `official@toyxchange.online` | `false` | `official` | `live` |
| `google_xxx` | `toyxchange2026@gmail.com` | `true` | `standard` | `live` |
| `google_yyy` | `zukoyena22@gmail.com` | `true` | `standard` | `live` |

### Admin access
- [ ] `/admin` loads for both admin users
- [ ] `/admin/founding` shows Founding Member #1
- [ ] `/admin/moderation` loads
- [ ] `/admin/launch-control` loads
- [ ] `/admin/founding-members` loads

### Authentication
- [ ] `POST /api/login` returns 401 "Please sign in with Google."
- [ ] Google OAuth works for both admin accounts
- [ ] Non-admin OAuth signup creates user with `accessStatus: "waitlist"`

### Official account
- [ ] `GET /api/users/official_toyx/rating` → `{ averageRating: 5.0 }`
- [ ] `GET /api/users/official_toyx/reviews` → 3 example reviews
- [ ] `email` field is `undefined` in API response for official account

### Build info
- [ ] `GET /api/build-info` returns commit hash matching `main`
