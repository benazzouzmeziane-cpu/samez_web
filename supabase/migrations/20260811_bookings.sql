-- Bookings: créneaux d'échange visio (45 min)
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'cancelled')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS bookings_starts_at_unique
  ON bookings (starts_at)
  WHERE status = 'confirmed';

CREATE INDEX IF NOT EXISTS bookings_starts_at_idx ON bookings (starts_at);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Lecture admin uniquement
DROP POLICY IF EXISTS "Read bookings admin" ON bookings;
CREATE POLICY "Read bookings admin" ON bookings
  FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Update bookings admin" ON bookings;
CREATE POLICY "Update bookings admin" ON bookings
  FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Inserts publics via service role only (API route) — no anon insert policy

GRANT SELECT, UPDATE ON bookings TO authenticated;
GRANT ALL ON bookings TO service_role;
