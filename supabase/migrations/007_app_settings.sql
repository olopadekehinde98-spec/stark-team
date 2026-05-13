-- app_settings: key-value store for admin-controlled settings
CREATE TABLE IF NOT EXISTS app_settings (
  key        text PRIMARY KEY,
  value      text NOT NULL DEFAULT '',
  updated_at timestamptz DEFAULT now() NOT NULL,
  updated_by uuid REFERENCES auth.users(id)
);

-- Seed defaults
INSERT INTO app_settings (key, value) VALUES
  ('goal_window_override', 'false')
ON CONFLICT (key) DO NOTHING;

-- Only admin client can read/write this table
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "app_settings_no_client_access"
  ON app_settings FOR ALL USING (false);
