# ToyX Production Rollback Plan

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Seed script fails on existing data | Low | Low — idempotent by design | `ON CONFLICT` + `WHERE NOT EXISTS` guards |
| Cleanup script deletes wrong data | Low | **High** — data loss | Backup required before running |
| New build has runtime error | Medium | Medium — app unavailable | Previous build still cached on Render |
| Asset paths incorrect in production | Low | Medium — broken images | Verification script checks all paths |
| Session invalidation after deploy | High | Low — users re-authenticate via OAuth | Stateless sessions; OAuth handles re-login |
| Database migration conflict | Low | Medium | All migrations use `IF NOT EXISTS` |

---

## Rollback Procedure

### Level 1 — Application Rollback (fastest)

If the deployed build has a bug but database is correct:

```bash
# 1. Revert the main branch to the previous production commit
git checkout main
git reset --hard <PREVIOUS_PRODUCTION_COMMIT>
git push --force origin main
```

```bash
# 2. Render Dashboard → Manual Deploy → Deploy previous commit
#    (Render caches previous builds — select the last working build)
```

Verify:
- [ ] Application loads at `https://app.toyxchange.online`
- [ ] API responds at `https://app.toyxchange.online/api/build-info`
- [ ] Google OAuth works

---

### Level 2 — Database Rollback

If the cleanup or seed script corrupted the database:

#### Option A — Restore from backup (recommended)

```bash
# 1. Locate the pre-launch backup
ls -la toyx-production-backup-*.sql

# 2. Restore to production database
#    (Render Dashboard → Production DB → Reset → Upload backup SQL)
#    OR via psql:
psql "$DATABASE_URL" < toyx-production-backup-YYYYMMDD-HHMMSS.sql
```

#### Option B — Manual rollback (if no backup available)

```sql
-- Reverse the seed script: remove official account and listings
BEGIN;
DELETE FROM toys WHERE owner_id = 'official_toyx';
DELETE FROM users WHERE id = 'official_toyx';
COMMIT;
```

```sql
-- Reverse the cleanup script: this is NOT POSSIBLE without backup
-- because the cleanup deletes all non-official data.
-- A backup is required to restore users and their data.
```

---

### Level 3 — Full Git Rollback

If the merge to `main` needs to be reverted:

```bash
# 1. Revert the merge commit
git checkout main
git revert --no-commit <MERGE_COMMIT_HASH>
git commit -m "Revert: production launch merge"
git push origin main
```

```bash
# 2. Deploy the reverted build
#    Render Dashboard → Manual Deploy → Clear Build Cache & Deploy
```

```bash
# 3. Restore database from backup (see Level 2)
```

---

## Database Restore Procedure (Render)

1. **Render Dashboard** → your PostgreSQL service
2. **Backups** tab → locate the pre-launch backup
3. Click **Restore** → confirm
4. Wait for restore to complete (1-5 minutes depending on size)
5. Verify database state:
   ```sql
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM toys;
   ```

---

## Post-Rollback Verification

After any rollback:

- [ ] `https://app.toyxchange.online` loads without errors
- [ ] `GET /api/build-info` returns expected commit hash
- [ ] Google OAuth login works
- [ ] Marketplace loads with toys
- [ ] No 500 errors in Sentry

---

## When NOT to rollback

| Scenario | Action |
|---|---|
| Individual listing image broken | File a bug, deploy fix — no rollback needed |
| Admin console layout issue | File a bug, deploy fix — no rollback needed |
| Minor text/UX issue | File a bug, deploy fix — no rollback needed |
| Rate limiting too aggressive | Adjust config, deploy fix — no rollback needed |
| OAuth not working for one provider | Check credentials, deploy fix — no rollback needed |

## When to rollback immediately

| Scenario | Action |
|---|---|
| All users get 500 errors | Rollback Level 1 |
| Data loss after cleanup script | Rollback Level 2 (restore from backup) |
| Security vulnerability discovered | Rollback Level 1, then patch |
| Authentication completely broken | Rollback Level 1 |
| Payment processing broken | Rollback Level 1 |
