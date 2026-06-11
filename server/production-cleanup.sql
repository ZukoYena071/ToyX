-- ============================================================
-- ToyX Production Launch — Cleanup Script
-- Removes all staging/test data, preserves official account
-- ============================================================
-- WARNING: This DELETES data. Run only against a fresh
-- production database or after taking a backup.
-- Preserves: official_toyx user + official listings
-- ============================================================

BEGIN;

-- ── Step 1: Delete data from child tables first (respect FK order) ──

-- Messages (depends on exchanges, references senderId)
DELETE FROM messages
WHERE sender_id != 'official_toyx'
  AND exchange_id IN (
    SELECT id FROM exchanges
    WHERE requester_id != 'official_toyx'
      AND owner_id != 'official_toyx'
  );

-- Reviews (depends on exchanges, references reviewerId, revieweeId)
DELETE FROM reviews
WHERE reviewer_id != 'official_toyx'
  AND reviewee_id != 'official_toyx';

-- Exchanges (depends on toys, references requesterId, ownerId)
DELETE FROM exchanges
WHERE requester_id != 'official_toyx'
  AND owner_id != 'official_toyx';

-- Toy interactions (depends on toys, references userId)
DELETE FROM toy_interactions
WHERE user_id != 'official_toyx';

-- Favorites (depends on toys, references userId)
DELETE FROM favorites
WHERE user_id != 'official_toyx';

-- Blocks (depends on users)
DELETE FROM blocks
WHERE blocker_id != 'official_toyx'
  AND blocked_id != 'official_toyx';

-- Reports (depends on users)
DELETE FROM reports
WHERE reporter_id != 'official_toyx'
  AND reported_id != 'official_toyx';

-- Moderation messages (depends on users, reports)
DELETE FROM moderation_messages
WHERE user_id != 'official_toyx'
  AND admin_user_id != 'official_toyx';

-- Moderation actions (depends on users, reports)
DELETE FROM moderation_actions
WHERE admin_user_id != 'official_toyx'
  AND target_user_id != 'official_toyx';

-- Referrals (depends on users)
DELETE FROM referrals
WHERE referrer_id != 'official_toyx'
  AND (referee_id IS NULL OR referee_id != 'official_toyx');

-- Reward ledger (depends on users)
DELETE FROM reward_ledger
WHERE user_id != 'official_toyx';

-- Reward redemptions (depends on users)
DELETE FROM reward_redemptions
WHERE user_id != 'official_toyx';

-- User rewards (depends on users)
DELETE FROM user_rewards
WHERE user_id != 'official_toyx';

-- Founding console actions (depends on users, founding_members)
DELETE FROM founding_console_actions;

-- Support requests (references userId — implicit FK, no constraint)
DELETE FROM support_requests
WHERE user_id != 'official_toyx';

-- ── Step 2: Delete non-official toys (official listings preserved) ──
DELETE FROM toys
WHERE owner_id != 'official_toyx';

-- ── Step 3: Delete non-official users ──
DELETE FROM users
WHERE id != 'official_toyx';

-- ── Step 4: Clean up non-user tables ──

-- Founding members (no FK to users, but legacy/test data)
DELETE FROM founding_members;

-- Launch settings (test configuration)
DELETE FROM launch_settings;

-- Marketing subscribers (test signups)
DELETE FROM marketing_subscribers;

-- Sessions (clean slate)
DELETE FROM sessions;

COMMIT;
