-- expo_push_tokens: stores Expo push tokens for the native Android/iOS app
CREATE TABLE IF NOT EXISTS expo_push_tokens (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token      text NOT NULL UNIQUE,          -- ExponentPushToken[...]
  device     text,                          -- e.g. "android Samsung Galaxy S23"
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS expo_push_tokens_user_id_idx ON expo_push_tokens(user_id);

-- RLS: no client access — only server-side admin client reads/writes this table
ALTER TABLE expo_push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expo_push_tokens_no_client_access"
  ON expo_push_tokens FOR ALL USING (false);
