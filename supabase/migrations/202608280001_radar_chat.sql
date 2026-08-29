-- Conversation radar : consignes de recherche + discussion des pistes

CREATE TABLE IF NOT EXISTS radar_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  brief jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS radar_messages_created_idx ON radar_messages (created_at DESC);

ALTER TABLE radar_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CRUD radar_messages admin" ON radar_messages;
CREATE POLICY "CRUD radar_messages admin" ON radar_messages
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON radar_messages TO authenticated;
GRANT ALL ON radar_messages TO service_role;
