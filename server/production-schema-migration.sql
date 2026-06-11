-- =============================================================
-- ToyX Production — Schema Alignment Migration
-- Compares Drizzle schema definitions against production database
-- and adds any missing tables, columns, indexes, or constraints.
-- Safe to run multiple times. No data loss.
-- =============================================================

BEGIN;

-- ══════════════════════════════════════════════════════════════
-- SECTION 1: Missing Tables
-- ══════════════════════════════════════════════════════════════
-- These tables are defined in shared/schema.ts but may not exist
-- in production if `npm run db:push` was never run.
-- All use IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS toy_interactions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  toy_id INTEGER NOT NULL REFERENCES toys(id),
  event_type VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reward_ledger (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  event_type VARCHAR(64) NOT NULL,
  points INTEGER NOT NULL,
  reference_type VARCHAR(32) NOT NULL,
  reference_id VARCHAR(64) NOT NULL,
  meta JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reward_redemptions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  reward_type VARCHAR(64) NOT NULL,
  cost_points INTEGER NOT NULL,
  meta JSONB,
  starts_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  referrer_id VARCHAR NOT NULL REFERENCES users(id),
  referee_id VARCHAR REFERENCES users(id),
  referee_email VARCHAR,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  qualified_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS marketing_subscribers (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_requests (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR,
  email VARCHAR,
  category VARCHAR(64) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blocks (
  id SERIAL PRIMARY KEY,
  blocker_id VARCHAR NOT NULL REFERENCES users(id),
  blocked_id VARCHAR NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  reporter_id VARCHAR NOT NULL REFERENCES users(id),
  reported_id VARCHAR NOT NULL REFERENCES users(id),
  reason VARCHAR(64) NOT NULL,
  details TEXT,
  context_type VARCHAR(32) NOT NULL,
  context_id VARCHAR(64),
  message_snapshot JSONB,
  status VARCHAR(32) NOT NULL DEFAULT 'open',
  resolution_note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS moderation_actions (
  id SERIAL PRIMARY KEY,
  admin_user_id VARCHAR NOT NULL REFERENCES users(id),
  target_user_id VARCHAR NOT NULL REFERENCES users(id),
  report_id INTEGER REFERENCES reports(id),
  action_type VARCHAR(32) NOT NULL,
  message TEXT,
  duration_days INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS moderation_messages (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  admin_user_id VARCHAR NOT NULL REFERENCES users(id),
  report_id INTEGER REFERENCES reports(id),
  subject VARCHAR(255),
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP
);

-- ══════════════════════════════════════════════════════════════
-- SECTION 2: Missing Columns on Existing Tables
-- ══════════════════════════════════════════════════════════════

-- users.account_type — added by migrate-official-account but ensure it exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type VARCHAR(32) NOT NULL DEFAULT 'standard';

-- founding_members.member_number — added by migrate-member-numbers but ensure sequence exists
CREATE SEQUENCE IF NOT EXISTS founding_member_number_seq;

-- Set column default if member_number column exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'founding_members' AND column_name = 'member_number') THEN
    ALTER TABLE founding_members ALTER COLUMN member_number SET DEFAULT nextval('founding_member_number_seq');
  END IF;
END $$;

-- founding_console_actions — added by migrate-founding-console but ensure table
CREATE TABLE IF NOT EXISTS founding_console_actions (
  id SERIAL PRIMARY KEY,
  admin_id VARCHAR NOT NULL REFERENCES users(id),
  action_type VARCHAR(32) NOT NULL,
  target_email VARCHAR,
  target_member_id INTEGER REFERENCES founding_members(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════════
-- SECTION 3: Missing Indexes
-- ══════════════════════════════════════════════════════════════

-- Session expiry index
CREATE INDEX IF NOT EXISTS idx_session_expire ON sessions (expire);

-- Toy interactions indexes
CREATE INDEX IF NOT EXISTS idx_interactions_user ON toy_interactions (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_interactions_user_event ON toy_interactions (user_id, event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_interactions_toy_event ON toy_interactions (toy_id, event_type);

-- Reports indexes
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports (reporter_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports (reported_id);

-- Moderation indexes
CREATE INDEX IF NOT EXISTS idx_mod_actions_target ON moderation_actions (target_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_mod_msgs_user ON moderation_messages (user_id, read_at, created_at);

-- Reward ledger unique lookup index
CREATE INDEX IF NOT EXISTS idx_ledger_unique ON reward_ledger (user_id, event_type, reference_id);

-- ══════════════════════════════════════════════════════════════
-- SECTION 4: Foreign Key Verification
-- ══════════════════════════════════════════════════════════════
-- All FK constraints are defined in the CREATE TABLE statements
-- above (for missing tables). Existing tables created by
-- `npm run db:push` should already have their FKs.
-- This section verifies existing tables have expected FKs.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'toy_interactions_user_id_fkey') THEN
    ALTER TABLE toy_interactions ADD CONSTRAINT toy_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'toy_interactions_toy_id_fkey') THEN
    ALTER TABLE toy_interactions ADD CONSTRAINT toy_interactions_toy_id_fkey FOREIGN KEY (toy_id) REFERENCES toys(id);
  END IF;
END $$;

COMMIT;

-- ══════════════════════════════════════════════════════════════
-- POST-MIGRATION VERIFICATION
-- ══════════════════════════════════════════════════════════════
-- Run these separately to verify:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT indexname FROM pg_indexes WHERE tablename NOT LIKE 'pg_%' ORDER BY indexname;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'account_type';
