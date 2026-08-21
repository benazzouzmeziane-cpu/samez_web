CREATE TABLE IF NOT EXISTS seo_research_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'done', 'error')),
  model TEXT NOT NULL DEFAULT 'cloudflare-seo-strategist',
  prompt_version TEXT NOT NULL DEFAULT 'samez-research-v1',
  input JSONB NOT NULL DEFAULT '{}'::JSONB,
  output JSONB,
  error TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS seo_research_runs_created_at_idx
  ON seo_research_runs (created_at DESC);

DROP TRIGGER IF EXISTS trg_seo_research_runs_updated_at ON seo_research_runs;
CREATE TRIGGER trg_seo_research_runs_updated_at
  BEFORE UPDATE ON seo_research_runs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE seo_research_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin all seo_research_runs" ON seo_research_runs;
CREATE POLICY "Admin all seo_research_runs" ON seo_research_runs
  FOR ALL TO authenticated
  USING ((SELECT public.is_seo_admin()))
  WITH CHECK ((SELECT public.is_seo_admin()));

GRANT SELECT, INSERT, UPDATE, DELETE ON seo_research_runs TO authenticated;
GRANT ALL ON seo_research_runs TO service_role;
