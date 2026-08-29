-- Plateforme multi-agent same'z : mémoire, missions, communications et approbations.

-- Le service_role est utilisé uniquement par les crons et routes serveur sécurisées.
CREATE OR REPLACE FUNCTION public.is_seo_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    (SELECT auth.role()) = 'service_role'
    OR ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
$$;

ALTER TABLE seo_document_versions
  ADD COLUMN IF NOT EXISTS agent_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS agent_review_run_id uuid,
  ADD COLUMN IF NOT EXISTS agent_review_score integer
    CHECK (agent_review_score IS NULL OR (agent_review_score >= 0 AND agent_review_score <= 100));

CREATE TABLE IF NOT EXISTS agent_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL CHECK (domain IN ('global', 'radar', 'seo', 'crm', 'analytics')),
  kind text NOT NULL CHECK (kind IN ('fact', 'preference', 'decision', 'experience', 'metric')),
  key text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_type text NOT NULL DEFAULT 'agent'
    CHECK (source_type IN ('agent', 'human', 'system', 'import')),
  source_agent text,
  source_ref_type text,
  source_ref_id text,
  status text NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'validated', 'rejected', 'superseded')),
  confidence numeric(4,3) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  validation_notes text,
  validated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  validated_at timestamptz,
  expires_at timestamptz,
  superseded_by uuid REFERENCES agent_memories(id) ON DELETE SET NULL,
  tags text[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS agent_memories_active_key_idx
  ON agent_memories (domain, kind, key)
  WHERE status IN ('proposed', 'validated');
CREATE INDEX IF NOT EXISTS agent_memories_context_idx
  ON agent_memories (domain, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS agent_memories_tags_idx
  ON agent_memories USING gin (tags);
CREATE INDEX IF NOT EXISTS agent_memories_expires_idx
  ON agent_memories (expires_at)
  WHERE expires_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objective text NOT NULL,
  domain text NOT NULL CHECK (domain IN ('global', 'radar', 'seo', 'crm', 'analytics')),
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'waiting_approval', 'done', 'error', 'cancelled')),
  trigger_type text NOT NULL DEFAULT 'manual'
    CHECK (trigger_type IN ('manual', 'schedule', 'event', 'agent')),
  orchestrator text NOT NULL DEFAULT 'samez-orchestrator',
  plan jsonb NOT NULL DEFAULT '[]'::jsonb,
  result jsonb,
  error text,
  model text,
  prompt_tokens integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_runs_status_idx
  ON agent_runs (status, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_runs_domain_idx
  ON agent_runs (domain, created_at DESC);

CREATE TABLE IF NOT EXISTS agent_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  parent_task_id uuid REFERENCES agent_tasks(id) ON DELETE SET NULL,
  assigned_agent text NOT NULL,
  kind text NOT NULL,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'waiting_approval', 'done', 'error', 'cancelled')),
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb,
  error text,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_tasks_run_idx
  ON agent_tasks (run_id, created_at);
CREATE INDEX IF NOT EXISTS agent_tasks_agent_status_idx
  ON agent_tasks (assigned_agent, status, created_at);

CREATE TABLE IF NOT EXISTS agent_events (
  id bigserial PRIMARY KEY,
  run_id uuid NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  task_id uuid REFERENCES agent_tasks(id) ON DELETE CASCADE,
  source_agent text NOT NULL,
  target_agent text,
  event_type text NOT NULL
    CHECK (event_type IN ('planned', 'delegated', 'tool_call', 'tool_result', 'message', 'memory', 'approval', 'completed', 'failed')),
  summary text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_events_run_idx
  ON agent_events (run_id, created_at);

CREATE TABLE IF NOT EXISTS agent_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  task_id uuid REFERENCES agent_tasks(id) ON DELETE CASCADE,
  action_type text NOT NULL
    CHECK (action_type IN ('publish_seo', 'send_email', 'convert_crm', 'change_stage', 'redirect', 'external_write')),
  risk text NOT NULL DEFAULT 'medium' CHECK (risk IN ('low', 'medium', 'high')),
  title text NOT NULL,
  summary text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'executed')),
  decided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decision_notes text,
  decided_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_approvals_pending_idx
  ON agent_approvals (status, created_at DESC);

CREATE TABLE IF NOT EXISTS agent_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES agent_runs(id) ON DELETE SET NULL,
  domain text NOT NULL CHECK (domain IN ('seo', 'radar', 'crm', 'analytics')),
  name text NOT NULL,
  hypothesis text NOT NULL,
  target_ref text,
  baseline jsonb NOT NULL DEFAULT '{}'::jsonb,
  outcome jsonb,
  status text NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'running', 'won', 'lost', 'inconclusive', 'cancelled')),
  starts_at timestamptz,
  evaluate_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_experiments_evaluate_idx
  ON agent_experiments (status, evaluate_at);

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'agent_memories',
    'agent_runs',
    'agent_tasks',
    'agent_approvals',
    'agent_experiments'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I', table_name, table_name);
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      table_name,
      table_name
    );
  END LOOP;
END $$;

ALTER TABLE agent_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_experiments ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'agent_memories',
    'agent_runs',
    'agent_tasks',
    'agent_events',
    'agent_approvals',
    'agent_experiments'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "CRUD %s admin" ON %I', table_name, table_name);
    EXECUTE format(
      'CREATE POLICY "CRUD %s admin" ON %I FOR ALL TO authenticated USING ((auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin'') WITH CHECK ((auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin'')',
      table_name,
      table_name
    );
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO authenticated', table_name);
    EXECUTE format('GRANT ALL ON %I TO service_role', table_name);
  END LOOP;
END $$;

GRANT USAGE, SELECT ON SEQUENCE agent_events_id_seq TO authenticated, service_role;

INSERT INTO agent_memories (
  domain, kind, key, title, content, payload, source_type, source_agent, status, confidence, tags
) VALUES
  (
    'global', 'fact', 'samez.positioning',
    'Positionnement same’z',
    'same’z conçoit des sites, applications, boutiques, automatisations, agents IA et outils de gestion pour les entreprises qui achètent ces services.',
    '{"market":"FR","audience":"TPE/PME"}'::jsonb,
    'system', 'bootstrap', 'validated', 1, ARRAY['positionnement','offres']
  ),
  (
    'radar', 'fact', 'radar.competitors.naf62',
    'Concurrents NAF 62',
    'Les agences web, ESN, programmeurs et sociétés NAF 62 sont des concurrents, pas des prospects standards.',
    '{"nafPrefixes":["62","63.1"]}'::jsonb,
    'human', 'bootstrap', 'validated', 1, ARRAY['radar','concurrent']
  ),
  (
    'global', 'preference', 'safety.external_actions',
    'Validation des actions externes',
    'Les emails commerciaux, conversions CRM et changements de relation client nécessitent toujours une validation humaine.',
    '{"approvalRequired":["send_email","convert_crm","change_stage"]}'::jsonb,
    'human', 'bootstrap', 'validated', 1, ARRAY['sécurité','approbation']
  )
ON CONFLICT DO NOTHING;
