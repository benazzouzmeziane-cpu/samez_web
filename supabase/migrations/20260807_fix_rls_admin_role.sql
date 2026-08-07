-- =============================================
-- Fix RLS : exiger role = 'admin' (au lieu de « ≠ client »)
-- À exécuter dans l'éditeur SQL Supabase.
--
-- IMPORTANT — après cette migration, attribuer le rôle admin :
--   UPDATE auth.users
--   SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
--   WHERE email IN ('contact@samez.fr' /* , autres emails admin */);
--
-- Puis forcer un refresh de session (déconnexion / reconnexion).
-- =============================================

-- contacts
DROP POLICY IF EXISTS "Read contacts admin" ON contacts;
DROP POLICY IF EXISTS "Update contacts admin" ON contacts;

CREATE POLICY "Read contacts admin" ON contacts
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Update contacts admin" ON contacts
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- clients
DROP POLICY IF EXISTS "CRUD clients admin" ON clients;

CREATE POLICY "CRUD clients admin" ON clients
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- pieces
DROP POLICY IF EXISTS "CRUD pieces admin" ON pieces;

CREATE POLICY "CRUD pieces admin" ON pieces
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Clients : ne voir que les pièces non-brouillon
DROP POLICY IF EXISTS "Read own pieces client" ON pieces;

CREATE POLICY "Read own pieces client" ON pieces
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'client'
    AND status IS DISTINCT FROM 'brouillon'
    AND client_id IN (
      SELECT id FROM clients WHERE email = auth.jwt() ->> 'email'
    )
  );

-- piece_lines
DROP POLICY IF EXISTS "CRUD piece_lines admin" ON piece_lines;

CREATE POLICY "CRUD piece_lines admin" ON piece_lines
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Read own piece_lines client" ON piece_lines;

CREATE POLICY "Read own piece_lines client" ON piece_lines
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'client'
    AND piece_id IN (
      SELECT id FROM pieces
      WHERE status IS DISTINCT FROM 'brouillon'
        AND client_id IN (
          SELECT id FROM clients WHERE email = auth.jwt() ->> 'email'
        )
    )
  );

-- realisations
DROP POLICY IF EXISTS "Read all realisations admin" ON realisations;
DROP POLICY IF EXISTS "Insert realisations admin" ON realisations;
DROP POLICY IF EXISTS "Update realisations admin" ON realisations;
DROP POLICY IF EXISTS "Delete realisations admin" ON realisations;

CREATE POLICY "Read all realisations admin" ON realisations
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Insert realisations admin" ON realisations
  FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Update realisations admin" ON realisations
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Delete realisations admin" ON realisations
  FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Numérotation atomique FAC/DEV (advisory lock anti-course)
CREATE OR REPLACE FUNCTION public.next_piece_number(p_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prefix TEXT;
  yr TEXT;
  next_seq INTEGER;
BEGIN
  IF p_type NOT IN ('facture', 'devis') THEN
    RAISE EXCEPTION 'type invalide: %', p_type;
  END IF;

  IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'accès refusé';
  END IF;

  prefix := CASE WHEN p_type = 'facture' THEN 'FAC' ELSE 'DEV' END;
  yr := to_char(CURRENT_DATE, 'YYYY');

  PERFORM pg_advisory_xact_lock(hashtext(prefix || '-' || yr));

  SELECT COALESCE(MAX(split_part(number, '-', 3)::INTEGER), 0) + 1
  INTO next_seq
  FROM pieces
  WHERE number LIKE (prefix || '-' || yr || '-%')
    AND split_part(number, '-', 3) ~ '^[0-9]+$';

  RETURN prefix || '-' || yr || '-' || lpad(next_seq::TEXT, 3, '0');
END;
$$;

REVOKE ALL ON FUNCTION public.next_piece_number(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_piece_number(TEXT) TO authenticated;
