-- ============================================================
-- MIGRATION 002: Add e_member rank + goal approval status
-- ============================================================

-- Add 'e_member' to users.rank CHECK constraint
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_rank_check;

ALTER TABLE users
  ADD CONSTRAINT users_rank_check
  CHECK (rank IN ('e_member', 'distributor', 'manager', 'senior_manager', 'executive_manager', 'director'));

-- Update default rank on users to e_member
ALTER TABLE users
  ALTER COLUMN rank SET DEFAULT 'e_member';

-- Add 'e_member' to invite_links.assigned_rank CHECK constraint
ALTER TABLE invite_links
  DROP CONSTRAINT IF EXISTS invite_links_assigned_rank_check;

ALTER TABLE invite_links
  ADD CONSTRAINT invite_links_assigned_rank_check
  CHECK (assigned_rank IN ('e_member', 'distributor', 'manager', 'senior_manager', 'executive_manager', 'director'));

-- Update default assigned_rank on invite_links to e_member
ALTER TABLE invite_links
  ALTER COLUMN assigned_rank SET DEFAULT 'e_member';

-- Add 'pending_approval' and 'rejected' to goals.status CHECK constraint
ALTER TABLE goals
  DROP CONSTRAINT IF EXISTS goals_status_check;

ALTER TABLE goals
  ADD CONSTRAINT goals_status_check
  CHECK (status IN ('pending_approval', 'active', 'completed', 'failed', 'archived', 'rejected'));

-- Update default goal status to pending_approval (requires leader/admin approval)
ALTER TABLE goals
  ALTER COLUMN status SET DEFAULT 'pending_approval';
