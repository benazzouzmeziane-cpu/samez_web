-- =============================================
-- CMS SEO/GEO — documents versionnés, maillage, médias
-- =============================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_seo_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
$$;

CREATE TABLE IF NOT EXISTS seo_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('service', 'pillar', 'guide', 'case_study')),
  slug TEXT NOT NULL UNIQUE,
  silo TEXT,
  parent_id UUID REFERENCES seo_documents(id) ON DELETE SET NULL,
  is_indexable BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS seo_documents_type_idx ON seo_documents (type);
CREATE INDEX IF NOT EXISTS seo_documents_parent_id_idx ON seo_documents (parent_id);

CREATE TABLE IF NOT EXISTS seo_document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES seo_documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'in_review', 'scheduled', 'published', 'archived')),
  title TEXT NOT NULL,
  h1 TEXT,
  excerpt TEXT,
  meta_title TEXT,
  meta_description TEXT,
  canonical_path TEXT,
  og_image_url TEXT,
  og_title TEXT,
  og_description TEXT,
  robots_index BOOLEAN NOT NULL DEFAULT TRUE,
  robots_follow BOOLEAN NOT NULL DEFAULT TRUE,
  keyword_primary TEXT,
  search_intent TEXT CHECK (search_intent IS NULL OR search_intent IN (
    'informational', 'commercial', 'transactional', 'navigational'
  )),
  audience TEXT,
  entities JSONB NOT NULL DEFAULT '[]'::jsonb,
  factual_summary TEXT,
  geo_locality TEXT,
  geo_region TEXT DEFAULT 'FR',
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  faq JSONB NOT NULL DEFAULT '[]'::jsonb,
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  extra_json_ld JSONB,
  target_slug TEXT,
  cta_label TEXT,
  cta_href TEXT,
  author_name TEXT NOT NULL DEFAULT 'same''z',
  ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  human_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  review_notes TEXT,
  publish_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_by UUID,
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (document_id, version_number)
);

CREATE INDEX IF NOT EXISTS seo_document_versions_document_id_idx
  ON seo_document_versions (document_id);
CREATE INDEX IF NOT EXISTS seo_document_versions_status_idx
  ON seo_document_versions (status);
CREATE UNIQUE INDEX IF NOT EXISTS seo_document_versions_one_published
  ON seo_document_versions (document_id)
  WHERE status = 'published';
CREATE UNIQUE INDEX IF NOT EXISTS seo_document_versions_one_scheduled
  ON seo_document_versions (document_id)
  WHERE status = 'scheduled';

CREATE TABLE IF NOT EXISTS seo_internal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_version_id UUID NOT NULL REFERENCES seo_document_versions(id) ON DELETE CASCADE,
  target_document_id UUID NOT NULL REFERENCES seo_documents(id) ON DELETE CASCADE,
  anchor_text TEXT NOT NULL,
  rel TEXT,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS seo_internal_links_source_idx
  ON seo_internal_links (source_version_id);
CREATE INDEX IF NOT EXISTS seo_internal_links_target_idx
  ON seo_internal_links (target_document_id);

CREATE TABLE IF NOT EXISTS seo_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path TEXT NOT NULL UNIQUE,
  to_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seo_generation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES seo_documents(id) ON DELETE SET NULL,
  version_id UUID REFERENCES seo_document_versions(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB,
  error TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS seo_generation_runs_document_id_idx
  ON seo_generation_runs (document_id);

CREATE TABLE IF NOT EXISTS seo_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  alt TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_seo_documents_updated_at ON seo_documents;
CREATE TRIGGER trg_seo_documents_updated_at
  BEFORE UPDATE ON seo_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_seo_document_versions_updated_at ON seo_document_versions;
CREATE TRIGGER trg_seo_document_versions_updated_at
  BEFORE UPDATE ON seo_document_versions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE seo_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_internal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_generation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin all seo_documents" ON seo_documents;
CREATE POLICY "Admin all seo_documents" ON seo_documents
  FOR ALL TO authenticated
  USING ((SELECT public.is_seo_admin()))
  WITH CHECK ((SELECT public.is_seo_admin()));

DROP POLICY IF EXISTS "Public read seo_documents" ON seo_documents;
CREATE POLICY "Public read seo_documents" ON seo_documents
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM seo_document_versions v
      WHERE v.document_id = seo_documents.id
        AND (
          v.status = 'published'
          OR (v.status = 'scheduled' AND v.publish_at IS NOT NULL AND v.publish_at <= NOW())
        )
    )
  );

DROP POLICY IF EXISTS "Admin all seo_document_versions" ON seo_document_versions;
CREATE POLICY "Admin all seo_document_versions" ON seo_document_versions
  FOR ALL TO authenticated
  USING ((SELECT public.is_seo_admin()))
  WITH CHECK ((SELECT public.is_seo_admin()));

DROP POLICY IF EXISTS "Public read live seo_document_versions" ON seo_document_versions;
CREATE POLICY "Public read live seo_document_versions" ON seo_document_versions
  FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    OR (status = 'scheduled' AND publish_at IS NOT NULL AND publish_at <= NOW())
  );

DROP POLICY IF EXISTS "Admin all seo_internal_links" ON seo_internal_links;
CREATE POLICY "Admin all seo_internal_links" ON seo_internal_links
  FOR ALL TO authenticated
  USING ((SELECT public.is_seo_admin()))
  WITH CHECK ((SELECT public.is_seo_admin()));

DROP POLICY IF EXISTS "Public read approved seo_internal_links" ON seo_internal_links;
CREATE POLICY "Public read approved seo_internal_links" ON seo_internal_links
  FOR SELECT TO anon, authenticated
  USING (
    approved = TRUE
    AND EXISTS (
      SELECT 1
      FROM seo_document_versions v
      WHERE v.id = seo_internal_links.source_version_id
        AND (
          v.status = 'published'
          OR (v.status = 'scheduled' AND v.publish_at IS NOT NULL AND v.publish_at <= NOW())
        )
    )
  );

DROP POLICY IF EXISTS "Admin all seo_redirects" ON seo_redirects;
CREATE POLICY "Admin all seo_redirects" ON seo_redirects
  FOR ALL TO authenticated
  USING ((SELECT public.is_seo_admin()))
  WITH CHECK ((SELECT public.is_seo_admin()));

DROP POLICY IF EXISTS "Public read seo_redirects" ON seo_redirects;
CREATE POLICY "Public read seo_redirects" ON seo_redirects
  FOR SELECT TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "Admin all seo_generation_runs" ON seo_generation_runs;
CREATE POLICY "Admin all seo_generation_runs" ON seo_generation_runs
  FOR ALL TO authenticated
  USING ((SELECT public.is_seo_admin()))
  WITH CHECK ((SELECT public.is_seo_admin()));

DROP POLICY IF EXISTS "Admin all seo_media" ON seo_media;
CREATE POLICY "Admin all seo_media" ON seo_media
  FOR ALL TO authenticated
  USING ((SELECT public.is_seo_admin()))
  WITH CHECK ((SELECT public.is_seo_admin()));

DROP POLICY IF EXISTS "Public read seo_media" ON seo_media;
CREATE POLICY "Public read seo_media" ON seo_media
  FOR SELECT TO anon, authenticated
  USING (TRUE);

GRANT SELECT ON seo_documents TO anon, authenticated;
GRANT SELECT ON seo_document_versions TO anon, authenticated;
GRANT SELECT ON seo_internal_links TO anon, authenticated;
GRANT SELECT ON seo_redirects TO anon, authenticated;
GRANT SELECT ON seo_media TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON seo_documents TO authenticated;
GRANT INSERT, UPDATE, DELETE ON seo_document_versions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON seo_internal_links TO authenticated;
GRANT INSERT, UPDATE, DELETE ON seo_redirects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON seo_generation_runs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON seo_media TO authenticated;

GRANT ALL ON seo_documents TO service_role;
GRANT ALL ON seo_document_versions TO service_role;
GRANT ALL ON seo_internal_links TO service_role;
GRANT ALL ON seo_redirects TO service_role;
GRANT ALL ON seo_generation_runs TO service_role;
GRANT ALL ON seo_media TO service_role;

CREATE OR REPLACE FUNCTION public.publish_seo_version(p_version_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_document_id UUID;
  v_new_path TEXT;
  v_old_path TEXT;
  v_type TEXT;
  v_live_slug TEXT;
  v_slug TEXT;
  v_canonical TEXT;
BEGIN
  IF NOT (SELECT public.is_seo_admin()) THEN
    RAISE EXCEPTION 'accès refusé';
  END IF;

  SELECT v.document_id, d.type, d.slug, COALESCE(NULLIF(v.target_slug, ''), d.slug), v.canonical_path
  INTO v_document_id, v_type, v_live_slug, v_slug, v_canonical
  FROM seo_document_versions v
  JOIN seo_documents d ON d.id = v.document_id
  WHERE v.id = p_version_id;

  IF v_document_id IS NULL THEN
    RAISE EXCEPTION 'version introuvable';
  END IF;

  v_old_path := CASE v_type
    WHEN 'service' THEN '/services/' || v_live_slug
    WHEN 'guide' THEN '/guides/' || v_live_slug
    WHEN 'case_study' THEN '/realisations/' || v_live_slug
    ELSE '/' || v_live_slug
  END;

  v_new_path := CASE v_type
    WHEN 'service' THEN '/services/' || v_slug
    WHEN 'guide' THEN '/guides/' || v_slug
    WHEN 'case_study' THEN '/realisations/' || v_slug
    ELSE '/' || v_slug
  END;

  UPDATE seo_documents
  SET slug = v_slug
  WHERE id = v_document_id;

  UPDATE seo_document_versions
  SET status = 'archived'
  WHERE document_id = v_document_id
    AND status IN ('published', 'scheduled')
    AND id <> p_version_id;

  UPDATE seo_document_versions
  SET
    status = 'published',
    published_at = COALESCE(published_at, NOW()),
    publish_at = NULL,
    canonical_path = COALESCE(NULLIF(v_canonical, ''), v_new_path)
  WHERE id = p_version_id;

  IF v_old_path IS DISTINCT FROM v_new_path THEN
    INSERT INTO seo_redirects (from_path, to_path)
    VALUES (v_old_path, v_new_path)
    ON CONFLICT (from_path) DO UPDATE SET to_path = EXCLUDED.to_path;
  END IF;

  RETURN p_version_id;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_seo_version(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.publish_seo_version(UUID) TO authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('seo-assets', 'seo-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read seo-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload seo-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin update seo-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete seo-assets" ON storage.objects;

CREATE POLICY "Public read seo-assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'seo-assets');

CREATE POLICY "Admin upload seo-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'seo-assets'
  AND (SELECT public.is_seo_admin())
);

CREATE POLICY "Admin update seo-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'seo-assets'
  AND (SELECT public.is_seo_admin())
)
WITH CHECK (
  bucket_id = 'seo-assets'
  AND (SELECT public.is_seo_admin())
);

CREATE POLICY "Admin delete seo-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'seo-assets'
  AND (SELECT public.is_seo_admin())
);

NOTIFY pgrst, 'reload schema';
