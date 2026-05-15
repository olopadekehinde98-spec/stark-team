-- AI Error Monitor log table
-- Stores errors captured in the browser and analyzed by Claude
CREATE TABLE IF NOT EXISTS error_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  type        text NOT NULL CHECK (type IN ('runtime', 'promise', 'api', 'react')),
  message     text NOT NULL,
  stack       text,
  url         text,
  context     text,
  analysis    text,
  created_at  timestamptz DEFAULT now()
);

-- Only admins and leaders can read logs; anyone can insert their own
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

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

-- Auto-purge logs older than 30 days (run via cron or pg_cron)
-- DELETE FROM error_logs WHERE created_at < now() - interval '30 days';
