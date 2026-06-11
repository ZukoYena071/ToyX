-- =============================================================
-- ToyX: Complete User Deletion Script
-- Target: "Liesel" — finds by email, deletes all dependent data
-- =============================================================
-- Run this in the staging database console.
-- All deletions wrapped in a single transaction.
-- =============================================================

BEGIN;

-- ── Step 0: Identify the user ──
-- First find Liesel. Adjust the WHERE condition if needed.
DO $$
DECLARE
  target_id VARCHAR;
BEGIN
  -- Try to find by email pattern or first name
  SELECT id INTO target_id FROM users
  WHERE first_name ILIKE '%liesel%' OR email ILIKE '%liesel%'
  LIMIT 1;

  IF target_id IS NULL THEN
    RAISE EXCEPTION 'User Liesel not found. Check the WHERE clause above.';
  END IF;

  RAISE NOTICE 'Deleting user: %', target_id;

  -- ── Step 1: founding_console_actions (adminId FK → users.id) ──
  DELETE FROM founding_console_actions WHERE admin_id = target_id;

  -- ── Step 2: moderation_messages (userId, adminUserId FK → users.id) ──
  DELETE FROM moderation_messages WHERE user_id = target_id OR admin_user_id = target_id;

  -- ── Step 3: moderation_actions (adminUserId, targetUserId FK → users.id) ──
  DELETE FROM moderation_actions WHERE admin_user_id = target_id OR target_user_id = target_id;

  -- ── Step 4: reports (reporterId, reportedId FK → users.id) ──
  DELETE FROM reports WHERE reporter_id = target_id OR reported_id = target_id;

  -- ── Step 5: reviews (reviewerId, revieweeId FK → users.id, also FK → exchanges.id) ──
  -- Delete reviews where the user is reviewer or reviewee
  DELETE FROM reviews WHERE reviewer_id = target_id OR reviewee_id = target_id;

  -- ── Step 6: messages (senderId FK → users.id, also FK → exchanges.id) ──
  DELETE FROM messages WHERE sender_id = target_id;

  -- ── Step 7: exchanges (requesterId, ownerId FK → users.id) ──
  -- Messages and reviews referencing these exchanges are already deleted above
  DELETE FROM exchanges WHERE requester_id = target_id OR owner_id = target_id;

  -- ── Step 8: toy_interactions (userId FK → users.id) ──
  DELETE FROM toy_interactions WHERE user_id = target_id;

  -- ── Step 9: favorites (userId FK → users.id) ──
  DELETE FROM favorites WHERE user_id = target_id;

  -- ── Step 10: blocks (blockerId, blockedId FK → users.id) ──
  DELETE FROM blocks WHERE blocker_id = target_id OR blocked_id = target_id;

  -- ── Step 11: referrals (referrerId, refereeId FK → users.id) ──
  DELETE FROM referrals WHERE referrer_id = target_id OR referee_id = target_id;

  -- ── Step 12: toys (ownerId FK → users.id) ──
  DELETE FROM toys WHERE owner_id = target_id;

  -- ── Step 13: reward_redemptions (userId FK → users.id) ──
  DELETE FROM reward_redemptions WHERE user_id = target_id;

  -- ── Step 14: reward_ledger (userId FK → users.id) ──
  DELETE FROM reward_ledger WHERE user_id = target_id;

  -- ── Step 15: user_rewards (userId FK → users.id, PK) ──
  DELETE FROM user_rewards WHERE user_id = target_id;

  -- ── Step 16: support_requests (userId — implicit, no FK constraint) ──
  DELETE FROM support_requests WHERE user_id = target_id;

  -- ── Step 17: launch_settings (updatedBy — implicit, no FK constraint) ──
  DELETE FROM launch_settings WHERE updated_by = target_id;

  -- ── Step 18: The user record itself ──
  DELETE FROM users WHERE id = target_id;

  RAISE NOTICE 'User % deleted successfully.', target_id;
END $$;

COMMIT;

-- =============================================================
-- Verification queries
-- =============================================================

-- Confirm user is gone
SELECT 'users' AS table_name, COUNT(*) AS remaining
FROM users WHERE first_name ILIKE '%liesel%' OR email ILIKE '%liesel%';

-- Confirm no orphaned data remains (all should return 0)
SELECT 'toys' AS table_name, COUNT(*) FROM toys WHERE owner_id IN (SELECT id FROM users WHERE first_name ILIKE '%liesel%' OR email ILIKE '%liesel%')
UNION ALL
SELECT 'exchanges', COUNT(*) FROM exchanges WHERE requester_id IN (SELECT id FROM users WHERE first_name ILIKE '%liesel%' OR email ILIKE '%liesel%')
UNION ALL
SELECT 'favorites', COUNT(*) FROM favorites WHERE user_id IN (SELECT id FROM users WHERE first_name ILIKE '%liesel%' OR email ILIKE '%liesel%')
UNION ALL
SELECT 'user_rewards', COUNT(*) FROM user_rewards WHERE user_id IN (SELECT id FROM users WHERE first_name ILIKE '%liesel%' OR email ILIKE '%liesel%');
