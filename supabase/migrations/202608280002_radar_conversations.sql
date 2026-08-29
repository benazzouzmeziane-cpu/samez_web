-- Fils de discussion radar (menu type ChatGPT)

CREATE TABLE IF NOT EXISTS radar_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Nouveau chat',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE radar_messages
  ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES radar_conversations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS radar_conversations_updated_idx
  ON radar_conversations (updated_at DESC);

CREATE INDEX IF NOT EXISTS radar_messages_conversation_idx
  ON radar_messages (conversation_id, created_at);

DO $$
DECLARE
  conv_id uuid;
BEGIN
  SELECT id INTO conv_id
  FROM radar_conversations
  WHERE title = 'Discussion précédente'
  LIMIT 1;

  IF EXISTS (SELECT 1 FROM radar_messages WHERE conversation_id IS NULL) THEN
    IF conv_id IS NULL THEN
      INSERT INTO radar_conversations (title)
      VALUES ('Discussion précédente')
      RETURNING id INTO conv_id;
    END IF;
    UPDATE radar_messages
    SET conversation_id = conv_id
    WHERE conversation_id IS NULL;
  END IF;
END $$;

ALTER TABLE radar_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CRUD radar_conversations admin" ON radar_conversations;
CREATE POLICY "CRUD radar_conversations admin" ON radar_conversations
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON radar_conversations TO authenticated;
GRANT ALL ON radar_conversations TO service_role;
