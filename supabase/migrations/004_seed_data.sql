-- ============================================================
-- Migration 004: Seed Data (A320 aircraft layout for sample flights)
-- ============================================================

-- Insert sample flights
INSERT INTO public.flights (flight_number, origin, destination, departure_time, arrival_time, base_price, aircraft_type, status)
VALUES
  ('SA101', 'DEL', 'BOM', now() + INTERVAL '6 hours',  now() + INTERVAL '8 hours',  4500.00, 'A320', 'Scheduled'),
  ('SA102', 'BOM', 'DEL', now() + INTERVAL '10 hours', now() + INTERVAL '12 hours', 4800.00, 'A320', 'Scheduled'),
  ('SA201', 'DEL', 'BLR', now() + INTERVAL '7 hours',  now() + INTERVAL '10 hours', 5200.00, 'A320', 'Scheduled'),
  ('SA202', 'BLR', 'DEL', now() + INTERVAL '14 hours', now() + INTERVAL '17 hours', 5400.00, 'A320', 'Scheduled'),
  ('SA301', 'BOM', 'BLR', now() + INTERVAL '9 hours',  now() + INTERVAL '11 hours', 3800.00, 'A320', 'Scheduled'),
  ('SA302', 'BLR', 'BOM', now() + INTERVAL '16 hours', now() + INTERVAL '18 hours', 3900.00, 'A320', 'Scheduled');

-- Generate A320 seat layout for each flight:
-- Rows 1-3: First Class (A,C,D,F) — 4 seats per row
-- Rows 4-8: Business (A,B,C,D,E,F) — 6 seats per row  
-- Rows 9-30: Economy (A,B,C,D,E,F) — 6 seats per row
DO $$
DECLARE
  v_flight_id    UUID;
  v_row          INT;
  v_col          TEXT;
  v_class        TEXT;
  v_multiplier   NUMERIC(4,2);
  v_seat_code    TEXT;
  first_cols     TEXT[] := ARRAY['A','C','D','F'];
  all_cols       TEXT[] := ARRAY['A','B','C','D','E','F'];
BEGIN
  FOR v_flight_id IN SELECT id FROM public.flights LOOP
    -- First Class (rows 1-3, 4 seats per row)
    FOR v_row IN 1..3 LOOP
      FOREACH v_col IN ARRAY first_cols LOOP
        v_seat_code := v_row::TEXT || v_col;
        INSERT INTO public.seats (flight_id, seat_code, class, price_multiplier)
        VALUES (v_flight_id, v_seat_code, 'First', 3.50);
      END LOOP;
    END LOOP;

    -- Business (rows 4-8, 6 seats per row)
    FOR v_row IN 4..8 LOOP
      FOREACH v_col IN ARRAY all_cols LOOP
        v_seat_code := v_row::TEXT || v_col;
        INSERT INTO public.seats (flight_id, seat_code, class, price_multiplier)
        VALUES (v_flight_id, v_seat_code, 'Business', 2.00);
      END LOOP;
    END LOOP;

    -- Economy (rows 9-30, 6 seats per row)
    FOR v_row IN 9..30 LOOP
      FOREACH v_col IN ARRAY all_cols LOOP
        v_seat_code := v_row::TEXT || v_col;
        INSERT INTO public.seats (flight_id, seat_code, class, price_multiplier)
        VALUES (v_flight_id, v_seat_code, 'Economy', 1.00);
      END LOOP;
    END LOOP;
  END LOOP;
END;
$$;

-- ============================================================
-- Seed Test User Account (passenger@sourceasia.com / password123)
-- ============================================================
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  confirmation_token,
  email_change,
  email_change_sent_at,
  last_sign_in_at
)
VALUES (
  'a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3',
  '00000000-0000-0000-0000-000000000000',
  'passenger@sourceasia.com',
  -- bcrypt hash for 'password123'
  '$2a$10$T87sK4.v.2k8W2qfW8V26unPebXW3f7k/5o9vBfD52i59gM3c9Pqy',
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"John Passenger"}',
  now(),
  now(),
  'authenticated',
  '',
  '',
  null,
  now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  'a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3',
  'a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3',
  '{"sub":"a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3","email":"passenger@sourceasia.com"}',
  'email',
  now(),
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

