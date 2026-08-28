-- Radar commercial : créations / cessions BODACC + marchés BOAMP
-- Les cibles restent hors CRM tant qu’elles n’ont pas été ouvertes en fiche.

CREATE TABLE IF NOT EXISTS radar_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL
    CHECK (kind IN ('creation', 'immatriculation', 'cession', 'marche')),
  source text NOT NULL
    CHECK (source IN ('bodacc', 'sirene', 'boamp')),
  external_id text NOT NULL,
  title text NOT NULL,
  subtitle text,
  city text,
  department text,
  published_at date,
  deadline_at timestamptz,
  url text,
  contact_name text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  pre_score integer NOT NULL DEFAULT 0,
  score integer,
  fit text CHECK (fit IN ('go', 'possible', 'nogo')),
  offer text,
  reasons text[] NOT NULL DEFAULT '{}',
  approach_subject text,
  approach_body text,
  next_action text,
  status text NOT NULL DEFAULT 'nouveau'
    CHECK (status IN ('nouveau', 'a_contacter', 'contacte', 'converti', 'ecarte')),
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  scored_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS radar_items_source_ext_idx
  ON radar_items (source, external_id);
CREATE INDEX IF NOT EXISTS radar_items_kind_status_idx
  ON radar_items (kind, status, score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS radar_items_fit_idx
  ON radar_items (fit, status);

CREATE TABLE IF NOT EXISTS radar_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'done', 'error')),
  fetched integer NOT NULL DEFAULT 0,
  kept integer NOT NULL DEFAULT 0,
  scored integer NOT NULL DEFAULT 0,
  error text,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE radar_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE radar_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CRUD radar_items admin" ON radar_items;
CREATE POLICY "CRUD radar_items admin" ON radar_items
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "CRUD radar_runs admin" ON radar_runs;
CREATE POLICY "CRUD radar_runs admin" ON radar_runs
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

GRANT SELECT, INSERT, UPDATE, DELETE ON radar_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON radar_runs TO authenticated;
GRANT ALL ON radar_items TO service_role;
GRANT ALL ON radar_runs TO service_role;
