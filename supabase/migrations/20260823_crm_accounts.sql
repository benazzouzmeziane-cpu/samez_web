-- Comptes : pipeline + journal interne (notes / relances)
-- Les notes ne vivent PAS sur clients : le portail client lit sa propre fiche.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS company text,
  ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'prospect',
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS last_contacted_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clients_stage_check'
  ) THEN
    ALTER TABLE clients
      ADD CONSTRAINT clients_stage_check
      CHECK (stage IN ('prospect', 'qualifié', 'proposition', 'client', 'inactif'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS client_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'note'
    CHECK (kind IN ('note', 'relance', 'appel', 'email', 'statut')),
  title text NOT NULL,
  body text,
  due_at date,
  status text NOT NULL DEFAULT 'ouverte'
    CHECK (status IN ('ouverte', 'faite', 'annulée')),
  created_at timestamptz NOT NULL DEFAULT now(),
  done_at timestamptz
);

CREATE INDEX IF NOT EXISTS client_activities_client_idx ON client_activities (client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS client_activities_due_idx
  ON client_activities (due_at)
  WHERE status = 'ouverte' AND due_at IS NOT NULL;

ALTER TABLE client_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CRUD client_activities admin" ON client_activities;
CREATE POLICY "CRUD client_activities admin" ON client_activities
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON client_activities TO authenticated;
GRANT ALL ON client_activities TO service_role;

-- Backfill : une facture payée = client ; un devis = proposition
UPDATE clients
SET stage = 'client'
WHERE stage = 'prospect'
  AND id IN (
    SELECT DISTINCT client_id FROM pieces
    WHERE client_id IS NOT NULL AND type = 'facture' AND status = 'payée'
  );

UPDATE clients
SET stage = 'proposition'
WHERE stage = 'prospect'
  AND id IN (
    SELECT DISTINCT client_id FROM pieces
    WHERE client_id IS NOT NULL AND type = 'devis'
  );
