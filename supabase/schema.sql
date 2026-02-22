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
-- =============================================

-- Activer RLS sur toutes les tables
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE piece_lines ENABLE ROW LEVEL SECURITY;

-- contacts : insertion publique (formulaire), lecture admin seulement
CREATE POLICY "Insert contact public" ON contacts
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Read contacts admin" ON contacts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Update contacts admin" ON contacts
  FOR UPDATE TO authenticated USING (true);

-- clients : CRUD admin seulement
CREATE POLICY "CRUD clients admin" ON clients
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- pieces : CRUD admin seulement
CREATE POLICY "CRUD pieces admin" ON pieces
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- piece_lines : CRUD admin seulement
CREATE POLICY "CRUD piece_lines admin" ON piece_lines
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
