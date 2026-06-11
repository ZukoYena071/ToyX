-- ============================================================
-- ToyX Production Launch — Verification Script
-- Run AFTER production-cleanup.sql AND production-launch-seed.sql
-- All counts should match the expected values
-- ============================================================

BEGIN;

-- ════════════════════════════════════════════════════════════
-- SECTION 1: Users
-- ════════════════════════════════════════════════════════════

SELECT '1.1 — Official account exists' AS check_name;
SELECT id, first_name, email, account_type, access_status
FROM users
WHERE id = 'official_toyx';

SELECT '1.2 — Only official account exists' AS check_name;
SELECT COUNT(*) AS total_users FROM users;

SELECT '1.3 — No non-official users remain' AS check_name;
SELECT COUNT(*) AS non_official_users FROM users WHERE id != 'official_toyx';

SELECT '1.4 — Account type is official' AS check_name;
SELECT account_type FROM users WHERE id = 'official_toyx';

SELECT '1.5 — Access status is live' AS check_name;
SELECT access_status FROM users WHERE id = 'official_toyx';

-- ════════════════════════════════════════════════════════════
-- SECTION 2: Official Listings
-- ════════════════════════════════════════════════════════════

SELECT '2.1 — Total official listings count' AS check_name;
SELECT COUNT(*) AS listing_count FROM toys WHERE owner_id = 'official_toyx';

SELECT '2.2 — Listing details with image counts' AS check_name;
SELECT name, category, condition, array_length(image_urls, 1) AS image_count, image_urls
FROM toys
WHERE owner_id = 'official_toyx'
ORDER BY name;

SELECT '2.3 — All listings have images' AS check_name;
SELECT name, image_urls
FROM toys
WHERE owner_id = 'official_toyx' AND (image_urls IS NULL OR array_length(image_urls, 1) IS NULL OR array_length(image_urls, 1) = 0);

SELECT '2.4 — No non-official listings remain' AS check_name;
SELECT COUNT(*) AS non_official_listings FROM toys WHERE owner_id != 'official_toyx';

-- ════════════════════════════════════════════════════════════
-- SECTION 3: Empty State Verification
-- ════════════════════════════════════════════════════════════

SELECT '3.1 — Exchanges table empty' AS check_name;
SELECT COUNT(*) AS exchange_count FROM exchanges;

SELECT '3.2 — Messages table empty' AS check_name;
SELECT COUNT(*) AS message_count FROM messages;

SELECT '3.3 — Reviews table empty' AS check_name;
SELECT COUNT(*) AS review_count FROM reviews;

SELECT '3.4 — Favorites table empty' AS check_name;
SELECT COUNT(*) AS favorite_count FROM favorites;

SELECT '3.5 — Blocks table empty' AS check_name;
SELECT COUNT(*) AS block_count FROM blocks;

SELECT '3.6 — Reports table empty' AS check_name;
SELECT COUNT(*) AS report_count FROM reports;

SELECT '3.7 — Referrals table empty' AS check_name;
SELECT COUNT(*) AS referral_count FROM referrals;

SELECT '3.8 — Founding members table empty' AS check_name;
SELECT COUNT(*) AS founding_member_count FROM founding_members;

SELECT '3.9 — Launch settings table empty' AS check_name;
SELECT COUNT(*) AS launch_setting_count FROM launch_settings;

SELECT '3.10 — Marketing subscribers empty' AS check_name;
SELECT COUNT(*) AS subscriber_count FROM marketing_subscribers;

SELECT '3.11 — Reward ledger empty' AS check_name;
SELECT COUNT(*) AS reward_ledger_count FROM reward_ledger;

SELECT '3.12 — User rewards empty' AS check_name;
SELECT COUNT(*) AS user_reward_count FROM user_rewards;

-- ════════════════════════════════════════════════════════════
-- SECTION 4: Schema Verification
-- ════════════════════════════════════════════════════════════

SELECT '4.1 — account_type column exists' AS check_name;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'account_type';

COMMIT;

-- ════════════════════════════════════════════════════════════
-- FINAL SUMMARY
-- ════════════════════════════════════════════════════════════

-- Run separately after COMMIT:
-- SELECT '=== PRODUCTION DAY 0 SUMMARY ===' AS summary;
-- SELECT 'Users: ' || COUNT(*)::text FROM users;
-- SELECT '  └─ Official: ' || COUNT(*)::text FROM users WHERE account_type = 'official';
-- SELECT 'Toys: ' || COUNT(*)::text FROM toys;
-- SELECT '  └─ Official listings: ' || COUNT(*)::text FROM toys WHERE owner_id = 'official_toyx';
-- SELECT '  └─ With images: ' || COUNT(*)::text FROM toys WHERE owner_id = 'official_toyx' AND image_urls IS NOT NULL AND array_length(image_urls, 1) > 0;
-- SELECT 'All other tables: 0 rows expected';
-- SELECT 'Exchanges: ' || COUNT(*)::text FROM exchanges;
-- SELECT 'Messages: ' || COUNT(*)::text FROM messages;
-- SELECT 'Reviews: ' || COUNT(*)::text FROM reviews;
-- SELECT 'Favorites: ' || COUNT(*)::text FROM favorites;
-- SELECT 'Blocks: ' || COUNT(*)::text FROM blocks;
-- SELECT 'Reports: ' || COUNT(*)::text FROM reports;
-- SELECT 'Referrals: ' || COUNT(*)::text FROM referrals;
-- SELECT 'Founding Members: ' || COUNT(*)::text FROM founding_members;
-- SELECT 'Reward Ledger: ' || COUNT(*)::text FROM reward_ledger;
-- SELECT 'User Rewards: ' || COUNT(*)::text FROM user_rewards;
