-- Colonnes Google Calendar / Meet pour les réservations
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS google_event_id text,
  ADD COLUMN IF NOT EXISTS meet_link text;
