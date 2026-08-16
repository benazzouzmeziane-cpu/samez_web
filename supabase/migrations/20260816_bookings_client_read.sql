-- Les clients voient uniquement leurs propres rendez-vous (email de session)
DROP POLICY IF EXISTS "Read own bookings client" ON bookings;
CREATE POLICY "Read own bookings client" ON bookings
  FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'client'
    AND lower(email) = lower(auth.jwt() ->> 'email')
  );
