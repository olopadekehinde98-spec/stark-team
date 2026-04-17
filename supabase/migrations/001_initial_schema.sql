-- ============================================================
-- STARK TEAM DATABASE SCHEMA v1.0
-- Run this in your Supabase SQL editor or via supabase db push
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- BRANCHES (created before users because users reference it)
-- ============================================================
CREATE TABLE branches (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  parent_id   uuid REFERENCES branches(id) ON DELETE SET NULL,
  leader_id   uuid,  -- will FK to users after users table exists
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text UNIQUE NOT NULL,
  full_name       text NOT NULL,
  username        text UNIQUE NOT NULL,
  avatar_url      text,
  bio             text,
  role            text NOT NULL DEFAULT 'member'
                    CHECK (role IN ('admin', 'leader', 'member')),
  rank            text NOT NULL DEFAULT 'distributor'
                    CHECK (rank IN ('distributor', 'manager', 'senior_manager', 'executive_manager', 'director')),
  branch_id       uuid REFERENCES branches(id) ON DELETE SET NULL,
  invited_by      uuid REFERENCES users(id) ON DELETE SET NULL,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  last_seen_at    timestamptz
);

-- Add FK from branches to users (leader_id) now that users table exists
ALTER TABLE branches
  ADD CONSTRAINT branches_leader_id_fkey
  FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================
-- INVITE LINKS
-- ============================================================
CREATE TABLE invite_links (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token           text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_by      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_role   text NOT NULL DEFAULT 'member'
                    CHECK (assigned_role IN ('leader', 'member')),
  assigned_branch uuid REFERENCES branches(id) ON DELETE SET NULL,
  assigned_rank   text NOT NULL DEFAULT 'distributor'
                    CHECK (assigned_rank IN ('distributor', 'manager', 'senior_manager', 'executive_manager', 'director')),
  assigned_email  text,        -- optional: lock link to a specific email address
  used_by         uuid REFERENCES users(id) ON DELETE SET NULL,
  used_at         timestamptz,
  used_from_ip    text,
  expires_at      timestamptz NOT NULL,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

-- ============================================================
-- ACTIVITY TYPE TEMPLATES
-- ============================================================
CREATE TABLE activity_templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  description     text,
  proof_required  boolean NOT NULL DEFAULT true,
  is_active       boolean NOT NULL DEFAULT true,
  created_by      uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at      timestamptz DEFAULT now()
);

-- Default templates
INSERT INTO activity_templates (name, description, proof_required) VALUES
  ('Sales Call', 'Record of a completed sales call', true),
  ('Client Meeting', 'In-person or virtual client meeting', true),
  ('Team Training', 'Attending or conducting team training', true),
  ('Recruitment', 'New recruit onboarded or prospect contacted', true),
  ('Product Demo', 'Product demonstration to prospect or client', true),
  ('Follow-up', 'Follow-up communication with prospect or client', false),
  ('Report Submission', 'Submission of a weekly or monthly report', true),
  ('Event Attendance', 'Attending a company or industry event', true);

-- ============================================================
-- GOALS
-- ============================================================
CREATE TABLE goals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  category        text,
  goal_type       text NOT NULL CHECK (goal_type IN ('daily', 'weekly', 'monthly')),
  target_metric   numeric NOT NULL CHECK (target_metric > 0),
  current_metric  numeric NOT NULL DEFAULT 0 CHECK (current_metric >= 0),
  deadline        date NOT NULL,
  status          text NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'completed', 'failed', 'archived')),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Prevent past deadlines on insert
CREATE OR REPLACE FUNCTION check_goal_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deadline < CURRENT_DATE THEN
    RAISE EXCEPTION 'Goal deadline cannot be in the past';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER goal_deadline_check
  BEFORE INSERT ON goals
  FOR EACH ROW EXECUTE FUNCTION check_goal_deadline();

-- ============================================================
-- ACTIVITIES
-- ============================================================
CREATE TABLE activities (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id         uuid REFERENCES goals(id) ON DELETE SET NULL,
  template_id     uuid REFERENCES activity_templates(id) ON DELETE SET NULL,
  title           text NOT NULL,
  description     text,
  activity_type   text NOT NULL,
  activity_date   date NOT NULL,
  proof_url       text,
  proof_type      text CHECK (proof_type IN ('image', 'video_link', 'document', 'none')),
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'verified', 'unverified', 'rejected')),
  edit_locked_at  timestamptz,   -- server sets this to submitted_at + 24h
  submitted_at    timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Automatically set edit_locked_at on insert
CREATE OR REPLACE FUNCTION set_edit_lock()
RETURNS TRIGGER AS $$
BEGIN
  NEW.edit_locked_at = NEW.submitted_at + INTERVAL '24 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER activity_edit_lock
  BEFORE INSERT ON activities
  FOR EACH ROW EXECUTE FUNCTION set_edit_lock();

-- Auto-convert pending -> unverified after 14 days (run as cron via Supabase Edge Function)
-- The cron function should run:
-- UPDATE activities SET status = 'unverified'
-- WHERE status = 'pending' AND submitted_at < now() - INTERVAL '14 days';

-- ============================================================
-- VERIFICATION RECORDS
-- ============================================================
CREATE TABLE verification_records (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id      uuid NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  verified_by      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action           text NOT NULL CHECK (action IN ('verified', 'rejected', 'unverified')),
  rejection_reason text,  -- required when action = 'rejected', enforced in API
  notes            text,
  created_at       timestamptz DEFAULT now()
);

-- ============================================================
-- LEADERBOARD WEIGHTS (single active row)
-- ============================================================
CREATE TABLE leaderboard_weights (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verified_weight   numeric NOT NULL DEFAULT 1.0 CHECK (verified_weight >= 0),
  unverified_weight numeric NOT NULL DEFAULT 0.2 CHECK (unverified_weight >= 0 AND unverified_weight <= 1),
  rejected_weight   numeric NOT NULL DEFAULT 0.0,
  updated_by        uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at        timestamptz DEFAULT now()
);

-- Seed default weights
INSERT INTO leaderboard_weights (verified_weight, unverified_weight, rejected_weight)
VALUES (1.0, 0.2, 0.0);

-- ============================================================
-- LEADERBOARD SNAPSHOTS
-- ============================================================
CREATE TABLE leaderboard_snapshots (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  score         numeric NOT NULL,
  rank_position integer,
  period        text NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'alltime')),
  created_at    timestamptz DEFAULT now(),
  UNIQUE(user_id, snapshot_date, period)
);

-- Snapshots are IMMUTABLE. No UPDATE/DELETE via RLS -- only inserts allowed.

-- ============================================================
-- RECOGNITIONS
-- ============================================================
CREATE TABLE recognitions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issued_by     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type    text NOT NULL
                  CHECK (badge_type IN ('activity', 'goal', 'rank', 'leadership', 'custom')),
  title         text NOT NULL,
  message       text NOT NULL CHECK (char_length(message) >= 50),
  is_auto       boolean NOT NULL DEFAULT false,
  is_revoked    boolean NOT NULL DEFAULT false,
  revoked_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  revoked_at    timestamptz,
  revoked_reason text,
  created_at    timestamptz DEFAULT now()
);

-- ============================================================
-- RECOGNITION RATE LIMIT (per leader per week)
-- ============================================================
CREATE TABLE recognition_weekly_limits (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start  date NOT NULL,
  count       integer NOT NULL DEFAULT 0,
  UNIQUE(issuer_id, week_start)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            text NOT NULL,
  title           text NOT NULL,
  body            text,
  reference_id    uuid,
  reference_type  text,
  is_read         boolean NOT NULL DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TABLE announcements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           text NOT NULL,
  body            text NOT NULL,
  target_role     text CHECK (target_role IN ('admin', 'leader', 'member')),  -- null = all
  target_branch   uuid REFERENCES branches(id) ON DELETE SET NULL,
  is_pinned       boolean NOT NULL DEFAULT false,
  published_at    timestamptz,
  expires_at      timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- ============================================================
-- AUDIT LOGS (write-only from server, never client)
-- ============================================================
CREATE TABLE audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  action      text NOT NULL,
  target_type text,
  target_id   uuid,
  metadata    jsonb,
  ip_address  text,
  created_at  timestamptz DEFAULT now()
);

-- ============================================================
-- RANK PROMOTION CRITERIA
-- ============================================================
CREATE TABLE rank_criteria (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rank                        text NOT NULL UNIQUE
                                CHECK (rank IN ('manager', 'senior_manager', 'executive_manager', 'director')),
  min_verified_activities     integer NOT NULL DEFAULT 0,
  min_verified_rate_pct       numeric NOT NULL DEFAULT 0,
  min_days_at_current_rank    integer NOT NULL DEFAULT 0,
  min_team_size               integer NOT NULL DEFAULT 0,
  updated_by                  uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at                  timestamptz DEFAULT now()
);

-- Default promotion criteria
INSERT INTO rank_criteria (rank, min_verified_activities, min_verified_rate_pct, min_days_at_current_rank, min_team_size) VALUES
  ('manager',           20,  50, 30,  0),
  ('senior_manager',    50,  60, 60,  3),
  ('executive_manager', 100, 65, 90,  5),
  ('director',          200, 70, 180, 10);

-- ============================================================
-- AI COACH LOGS
-- ============================================================
CREATE TABLE ai_coach_logs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode             text NOT NULL CHECK (mode IN ('member', 'leader', 'admin')),
  rule_fired       text,
  user_message     text,
  ai_response      text,
  context_snapshot jsonb,
  created_at       timestamptz DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_activities_user_id     ON activities(user_id);
CREATE INDEX idx_activities_status      ON activities(status);
CREATE INDEX idx_activities_submitted   ON activities(submitted_at DESC);
CREATE INDEX idx_goals_user_id          ON goals(user_id);
CREATE INDEX idx_goals_status           ON goals(status);
CREATE INDEX idx_verification_activity  ON verification_records(activity_id);
CREATE INDEX idx_verification_verifier  ON verification_records(verified_by);
CREATE INDEX idx_leaderboard_user       ON leaderboard_snapshots(user_id);
CREATE INDEX idx_leaderboard_date       ON leaderboard_snapshots(snapshot_date DESC);
CREATE INDEX idx_notifications_user     ON notifications(user_id, is_read);
CREATE INDEX idx_audit_actor            ON audit_logs(actor_id);
CREATE INDEX idx_audit_created          ON audit_logs(created_at DESC);
CREATE INDEX idx_users_branch           ON users(branch_id);
CREATE INDEX idx_users_rank             ON users(rank);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE users                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_links              ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_templates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities                ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_records      ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_weights       ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_snapshots     ENABLE ROW LEVEL SECURITY;
ALTER TABLE recognitions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE recognition_weekly_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications             ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements             ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE rank_criteria             ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach_logs             ENABLE ROW LEVEL SECURITY;

-- USERS: Everyone sees basic profiles; only self or admin can update
CREATE POLICY "users_select_all_authenticated"
  ON users FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "users_update_own"
  ON users FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (true);

-- GOALS: Own goals always
CREATE POLICY "goals_own"
  ON goals FOR ALL USING (auth.uid() = user_id);

-- ACTIVITIES
CREATE POLICY "activities_own"
  ON activities FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "activities_insert_own"
  ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "activities_update_own_within_window"
  ON activities FOR UPDATE USING (
    auth.uid() = user_id AND
    edit_locked_at > now() AND
    status = 'pending'
  );

-- NOTIFICATIONS: Own only
CREATE POLICY "notifications_own"
  ON notifications FOR ALL USING (auth.uid() = user_id);

-- LEADERBOARD SNAPSHOTS: Readable by all authenticated users
CREATE POLICY "leaderboard_snapshots_read"
  ON leaderboard_snapshots FOR SELECT USING (auth.uid() IS NOT NULL);

-- RECOGNITIONS: Readable by all authenticated
CREATE POLICY "recognitions_read"
  ON recognitions FOR SELECT USING (auth.uid() IS NOT NULL AND is_revoked = false);

-- AUDIT LOGS: No direct client access (service role only via API)
CREATE POLICY "audit_logs_no_client_access"
  ON audit_logs FOR ALL USING (false);

-- INVITE LINKS: No direct client access (service role only)
CREATE POLICY "invite_links_no_client_access"
  ON invite_links FOR ALL USING (false);

-- AI COACH LOGS: Own only
CREATE POLICY "ai_coach_logs_own"
  ON ai_coach_logs FOR ALL USING (auth.uid() = user_id);

-- RANK CRITERIA: Readable by all authenticated
CREATE POLICY "rank_criteria_read"
  ON rank_criteria FOR SELECT USING (auth.uid() IS NOT NULL);

-- ACTIVITY TEMPLATES: Readable by all authenticated
CREATE POLICY "activity_templates_read"
  ON activity_templates FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);

-- ANNOUNCEMENTS: Readable by all authenticated
CREATE POLICY "announcements_read"
  ON announcements FOR SELECT USING (auth.uid() IS NOT NULL);
