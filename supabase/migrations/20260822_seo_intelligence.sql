CREATE TABLE IF NOT EXISTS seo_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  deliverables TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_gsc_page_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr NUMERIC(8, 6) NOT NULL DEFAULT 0,
  position NUMERIC(8, 2) NOT NULL DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (page_path, period_start, period_end)
);

CREATE TABLE IF NOT EXISTS seo_gsc_query_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  page_path TEXT,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  ctr NUMERIC(8, 6) NOT NULL DEFAULT 0,
  position NUMERIC(8, 2) NOT NULL DEFAULT 0,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (query, page_path, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS seo_gsc_page_metrics_path_idx
  ON seo_gsc_page_metrics (page_path, period_end DESC);

CREATE INDEX IF NOT EXISTS seo_gsc_query_metrics_query_idx
  ON seo_gsc_query_metrics (query, period_end DESC);

CREATE INDEX IF NOT EXISTS seo_gsc_query_metrics_page_idx
  ON seo_gsc_query_metrics (page_path, period_end DESC);

DROP TRIGGER IF EXISTS trg_seo_proofs_updated_at ON seo_proofs;
CREATE TRIGGER trg_seo_proofs_updated_at
  BEFORE UPDATE ON seo_proofs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE seo_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_gsc_page_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_gsc_query_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin all seo_proofs" ON seo_proofs;
CREATE POLICY "Admin all seo_proofs" ON seo_proofs
  FOR ALL TO authenticated
  USING ((SELECT public.is_seo_admin()))
  WITH CHECK ((SELECT public.is_seo_admin()));

DROP POLICY IF EXISTS "Admin all seo_gsc_page_metrics" ON seo_gsc_page_metrics;
CREATE POLICY "Admin all seo_gsc_page_metrics" ON seo_gsc_page_metrics
  FOR ALL TO authenticated
  USING ((SELECT public.is_seo_admin()))
  WITH CHECK ((SELECT public.is_seo_admin()));

DROP POLICY IF EXISTS "Admin all seo_gsc_query_metrics" ON seo_gsc_query_metrics;
CREATE POLICY "Admin all seo_gsc_query_metrics" ON seo_gsc_query_metrics
  FOR ALL TO authenticated
  USING ((SELECT public.is_seo_admin()))
  WITH CHECK ((SELECT public.is_seo_admin()));

GRANT SELECT, INSERT, UPDATE, DELETE ON seo_proofs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON seo_gsc_page_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON seo_gsc_query_metrics TO authenticated;
GRANT ALL ON seo_proofs TO service_role;
GRANT ALL ON seo_gsc_page_metrics TO service_role;
GRANT ALL ON seo_gsc_query_metrics TO service_role;

INSERT INTO seo_proofs (slug, client_name, title, summary, deliverables, tags, sort_order)
VALUES
  (
    'linqio',
    'Linqio',
    'Application mobile live',
    'Application métier déployée en production avec parcours utilisateur complet.',
    ARRAY['application mobile', 'déploiement production'],
    ARRAY['application', 'mobile', 'production'],
    10
  ),
  (
    'macarte-imprimee',
    'Macarte Imprimée',
    'Agents IA pour fiches produit et SEO',
    'Automatisation de la production de fiches produit et enrichissement SEO.',
    ARRAY['agents IA', 'fiches produit', 'SEO'],
    ARRAY['agent-ia', 'seo', 'e-commerce'],
    20
  ),
  (
    'univercarte',
    'Univercarte',
    'Refonte site et automatisations',
    'Refonte du site web et mise en place d’automatisations métier.',
    ARRAY['refonte site', 'automatisations n8n'],
    ARRAY['site-web', 'automatisation', 'refonte'],
    30
  )
ON CONFLICT (slug) DO NOTHING;
