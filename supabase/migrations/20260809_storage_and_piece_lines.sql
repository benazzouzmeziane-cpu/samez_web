-- =============================================
-- Storage réalisations + remplacement atomique des lignes
-- À exécuter dans l'éditeur SQL Supabase.
-- =============================================

-- Bucket public pour les images portfolio
INSERT INTO storage.buckets (id, name, public)
VALUES ('realisations', 'realisations', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public read realisations images" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload realisations images" ON storage.objects;
DROP POLICY IF EXISTS "Admin update realisations images" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete realisations images" ON storage.objects;

CREATE POLICY "Public read realisations images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'realisations');

CREATE POLICY "Admin upload realisations images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'realisations'
  AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admin update realisations images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'realisations'
  AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
  bucket_id = 'realisations'
  AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admin delete realisations images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'realisations'
  AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Remplacement atomique des lignes d'une pièce (delete + insert en une transaction)
CREATE OR REPLACE FUNCTION public.replace_piece_lines(
  p_piece_id UUID,
  p_lines JSONB DEFAULT '[]'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'accès refusé';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pieces WHERE id = p_piece_id) THEN
    RAISE EXCEPTION 'pièce introuvable';
  END IF;

  DELETE FROM piece_lines WHERE piece_id = p_piece_id;

  INSERT INTO piece_lines (piece_id, description, quantity, unit_price, order_index)
  SELECT
    p_piece_id,
    trim(line->>'description'),
    COALESCE(NULLIF(line->>'quantity', '')::NUMERIC, 1),
    COALESCE(NULLIF(line->>'unit_price', '')::NUMERIC, 0),
    COALESCE(NULLIF(line->>'order_index', '')::INTEGER, ord::INTEGER)
  FROM jsonb_array_elements(COALESCE(p_lines, '[]'::jsonb)) WITH ORDINALITY AS t(line, ord)
  WHERE trim(COALESCE(line->>'description', '')) <> '';
END;
$$;

REVOKE ALL ON FUNCTION public.replace_piece_lines(UUID, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.replace_piece_lines(UUID, JSONB) TO authenticated;
