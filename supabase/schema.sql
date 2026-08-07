-- =============================================
-- SAMEZ — Schéma Supabase
-- Exécuter dans l'éditeur SQL de Supabase
-- =============================================

-- Activer l'extension uuid si besoin
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------
-- Table contacts (messages formulaire)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------
-- Table clients
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  address TEXT,
  access_token UUID DEFAULT gen_random_uuid() UNIQUE, -- legacy, non exposé
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------
-- Table pièces commerciales (factures + devis)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS pieces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'facture',     -- 'facture' | 'devis'
  status TEXT NOT NULL DEFAULT 'brouillon', -- 'brouillon' | 'envoyée' | 'payée' | 'annulée'
  client_id UUID REFERENCES clients(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  tva_rate DECIMAL(5,2) DEFAULT 20.00,
  notes TEXT,
  paid_date DATE,                            -- date du règlement
  payment_method TEXT,                       -- 'virement' | 'carte' | 'chèque' | 'espèces'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------
-- Table lignes de prestation
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS piece_lines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  piece_id UUID REFERENCES pieces(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  order_index INTEGER DEFAULT 0
);

-- =============================================
-- Row Level Security (RLS)
-- Rôle admin = app_metadata.role = 'admin' (jamais user_metadata)
-- =============================================

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE piece_lines ENABLE ROW LEVEL SECURITY;

-- contacts : insertion publique (formulaire), lecture/update admin seulement
CREATE POLICY "Insert contact public" ON contacts
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Read contacts admin" ON contacts
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Update contacts admin" ON contacts
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- clients : admin full access, client lecture de son propre profil uniquement
CREATE POLICY "CRUD clients admin" ON clients
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Read own client profile" ON clients
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'client'
    AND email = auth.jwt() ->> 'email'
  );

-- pieces : admin full access, client lecture de ses pièces non-brouillon
CREATE POLICY "CRUD pieces admin" ON pieces
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Read own pieces client" ON pieces
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'client'
    AND status IS DISTINCT FROM 'brouillon'
    AND client_id IN (
      SELECT id FROM clients WHERE email = auth.jwt() ->> 'email'
    )
  );

-- piece_lines : admin full access, client lecture de ses propres lignes
CREATE POLICY "CRUD piece_lines admin" ON piece_lines
  FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

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

-- -----------------------------------------------
-- Table réalisations (portfolio)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS realisations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE realisations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read published realisations" ON realisations
  FOR SELECT TO anon
  USING (published = TRUE);

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

-- Numérotation atomique FAC/DEV
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
