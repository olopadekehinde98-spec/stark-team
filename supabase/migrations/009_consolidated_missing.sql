-- ============================================================
-- MIGRATION 009: Consolidated missing migrations
-- Safely applies 002, 003, 006, 007, 008 if not already present.
-- Run this once in your Supabase SQL editor.
-- ============================================================

-- ── 002: e_member rank + pending_approval goal status ─────────

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_rank_check;
ALTER TABLE users
  ADD CONSTRAINT users_rank_check
  CHECK (rank IN ('e_member', 'distributor', 'manager', 'senior_manager', 'executive_manager', 'director'));
ALTER TABLE users
  ALTER COLUMN rank SET DEFAULT 'e_member';

ALTER TABLE invite_links
  DROP CONSTRAINT IF EXISTS invite_links_assigned_rank_check;
ALTER TABLE invite_links
  ADD CONSTRAINT invite_links_assigned_rank_check
  CHECK (assigned_rank IN ('e_member', 'distributor', 'manager', 'senior_manager', 'executive_manager', 'director'));
ALTER TABLE invite_links
  ALTER COLUMN assigned_rank SET DEFAULT 'e_member';

ALTER TABLE goals
  DROP CONSTRAINT IF EXISTS goals_status_check;
ALTER TABLE goals
  ADD CONSTRAINT goals_status_check
  CHECK (status IN ('pending_approval', 'active', 'completed', 'failed', 'archived', 'rejected'));
ALTER TABLE goals
  ALTER COLUMN status SET DEFAULT 'pending_approval';

-- ── 003: push_subscriptions ───────────────────────────────────

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint   text NOT NULL UNIQUE,
  p256dh     text NOT NULL,
  auth       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "push_subscriptions_own" ON push_subscriptions;
CREATE POLICY "push_subscriptions_own"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- ── 006: expo_push_tokens ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS expo_push_tokens (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_expo_push_tokens_user ON expo_push_tokens(user_id);
ALTER TABLE expo_push_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "expo_push_tokens_own" ON expo_push_tokens;
CREATE POLICY "expo_push_tokens_own"
  ON expo_push_tokens FOR ALL
  USING (auth.uid() = user_id);

-- ── 007: app_settings ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS app_settings (
  key        text PRIMARY KEY,
  value      text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now() NOT NULL,
  updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "app_settings_no_client_access" ON app_settings;
CREATE POLICY "app_settings_no_client_access"
  ON app_settings FOR ALL USING (false);
INSERT INTO app_settings (key, value) VALUES
  ('goal_window_override', 'false')
ON CONFLICT (key) DO NOTHING;

-- ── 008: error_logs ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS error_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  type       text NOT NULL CHECK (type IN ('runtime', 'promise', 'api', 'react')),
  message    text NOT NULL,
  stack      text,
  url        text,
  context    text,
  analysis   text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users can insert own error logs" ON error_logs;
DROP POLICY IF EXISTS "admins and leaders can read all error logs" ON error_logs;
CREATE POLICY "users can insert own error logs"
  ON error_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins and leaders can read all error logs"
  ON error_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'leader')
    )
  );

-- ── Fix: recognition_weekly_limits missing SELECT policy ──────
-- Without this, the weekly badge limit was never enforced.
DROP POLICY IF EXISTS "recognition_weekly_limits_own_select" ON recognition_weekly_limits;
CREATE POLICY "recognition_weekly_limits_own_select"
  ON recognition_weekly_limits FOR SELECT
  USING (auth.uid() = issuer_id);
