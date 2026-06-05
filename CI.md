# ToyX CI Pipeline

## Overview

ToyX uses GitHub Actions for continuous integration. The CI pipeline automatically validates every push and pull request against protected branches.

## Workflow Triggers

| Event | Branches |
|---|---|
| Push | `develop`, `release-candidate-1` |
| Pull Request | `release-candidate-1`, `main` |

## Pipeline Jobs

### 1. `quality` — TypeScript + Build

Runs on every trigger. Does not require a database.

- `npm run check` — TypeScript compilation check
- `npm run build` — Production build (Vite + esbuild)

**Failure = broken TypeScript or broken build.** This blocks all further progress.

### 2. `api-tests` — API Integration Tests

Requires a PostgreSQL database (provided by GitHub Actions service container).

- Creates schema via `drizzle-kit push`
- Seeds test data via `server/seedTest.ts`
- Starts the Express server
- Runs `vitest` against `tests/api/**/*.test.ts`

**Failure = server-side logic regression.**

### 3. `e2e-tests` — E2E + Visual Tests

Requires PostgreSQL + Chromium browser.

- Same DB setup as API tests
- Installs Playwright with Chromium
- Runs Playwright E2E tests (`tests/e2e/`)
- Updates visual snapshots (`tests/visual/`) with `--update-snapshots`

**Failure = critical user flow broken.**

## Required Repository Configuration

### Branch Protection Rules

Configure these in GitHub → Settings → Branches:

**`main`:**
- [ ] Require pull request before merging
- [ ] Require status checks: `quality`, `api-tests`, `e2e-tests`
- [ ] Require branches to be up to date
- [ ] Include administrators

**`release-candidate-1`:**
- [ ] Require status checks: `quality`, `api-tests`, `e2e-tests`

## How CI Works

```
Developer pushes to develop
  → CI triggers quality + api-tests + e2e-tests
  → Status checks reported on PR

PR created against release-candidate-1
  → CI runs all checks
  → PR cannot merge if any check fails

release-candidate-1 receives push
  → CI runs all checks
  → If green, staging deployment may proceed

PR created against main
  → CI runs all checks
  → PR cannot merge if any check fails
```

## Handling Failures

**TypeScript error:** Fix the type error and push again. CI will re-run automatically.

**Build failure:** Check the build output in the CI logs. Common issues:
- Missing dependency (`npm ci` vs `npm install`)
- Import path error (alias not resolved)
- External package incompatibility

**API test failure:**
- Check which test failed in the CI logs
- Reproduce locally: `npm run test:api` with dev server running on `:3001`
- If the test is flaky (passes locally, fails in CI), mark it with `.retry(2)` or investigate timing

**E2E test failure:**
- Playwright artifacts are uploaded on failure (check the CI run → Artifacts)
- Reproduce locally with `npx playwright test tests/e2e/`
- Common causes: test data mismatch, timing, missing seed data

**Visual snapshot mismatch:**
- Snapshots are generated fresh in CI using `--update-snapshots`
- If a snapshot comparison fails intentionally (UI change), commit the new snapshots
- Run locally: `npm run test:visual:update` then commit the changed PNGs

## Environment Variables Required by CI

| Variable | Source | Required By |
|---|---|---|
| `DATABASE_URL` | GitHub Actions PostgreSQL service | Server + Drizzle |
| `NODE_ENV=development` | Workflow default | Dev auth bypass |
| `DEV_AUTH_BYPASS=true` | Workflow default | Test login endpoints |
| `SESSION_SECRET` | Workflow default (any value) | Session middleware |
| `APP_BASE_URL` | Workflow default | Route generation |

All are configured in `.github/workflows/ci.yml`. No secrets needed for CI since test data is isolated.

## Test Audit Summary

### Current Test Coverage

| Test Suite | Tests | Coverage | CI Ready? |
|---|---|---|---|
| `tests/api/` | ~18 | Server endpoints (exchange, block, boost, tier limits, etc.) | ✅ Yes |
| `tests/e2e/` | 5 | Pricing, browse, Paystack mocked, location CTA | ✅ Yes |
| `tests/visual/` | 8 | Home, Profile, Search, Pricing (light + dark) | ✅ Yes |

### Critical Coverage Gaps (P0)

These journeys have NO automated test coverage and require manual validation before production release:

- **Authentication**: Email signup, login, logout, Google OAuth, Facebook OAuth
- **Complete exchange flow**: Create → browse → submit → accept → complete
- **Messaging**: Send, receive (WebSocket), conversation history
- **Real Paystack flow**: Initialize → callback → webhook → subscription activation
- **Referral program**: Link → signup → claim → qualify → rewards
- **Founding Member**: Registration → welcome email → dashboard → member number
- **Toy Detail**: Image gallery, share, back-navigation, exchange request modal

### Flaky Test Assessment

No tests were observed to be flaky during this audit. API tests use `supertest` with explicit `beforeAll` cleanup, which is reliable. Visual tests run with `animations: "disabled"` which reduces flakiness. E2E tests use `waitForTimeout` on browse (2s) which could be flaky on slow CI runners — a `waitForSelector` or `waitForLoadState("networkidle")` would be more robust.
