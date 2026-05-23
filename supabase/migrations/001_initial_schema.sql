-- ============================================================
-- Migration 001: Initial Schema
-- Flight Management App
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE: flights
-- ============================================================
CREATE TABLE public.flights (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_number   TEXT NOT NULL,
  origin          CHAR(3) NOT NULL,  -- IATA airport code
  destination     CHAR(3) NOT NULL,
  departure_time  TIMESTAMPTZ NOT NULL,
  arrival_time    TIMESTAMPTZ NOT NULL,
  base_price      NUMERIC(10, 2) NOT NULL CHECK (base_price > 0),
  aircraft_type   TEXT NOT NULL DEFAULT 'A320',
  status          TEXT NOT NULL DEFAULT 'Scheduled'
                    CHECK (status IN ('Scheduled', 'Delayed', 'Departed', 'Cancelled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT flights_number_departure_unique UNIQUE (flight_number, departure_time),
  CONSTRAINT flights_departure_before_arrival CHECK (departure_time < arrival_time)
);

CREATE INDEX idx_flights_origin_destination ON public.flights (origin, destination);
CREATE INDEX idx_flights_departure_time     ON public.flights (departure_time);
CREATE INDEX idx_flights_status             ON public.flights (status);

-- ============================================================
-- TABLE: bookings
-- ============================================================
CREATE TABLE public.bookings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  pnr               TEXT UNIQUE NOT NULL,  -- populated by trigger
  status            TEXT NOT NULL DEFAULT 'Confirmed'
                      CHECK (status IN ('Confirmed', 'Cancelled', 'Rescheduled')),
  total_price       NUMERIC(10, 2) NOT NULL CHECK (total_price >= 0),
  -- JSONB array: [{ name, email, seat_code, class }]
  -- Passport/DOB stored server-side only; never in client state
  passenger_details JSONB NOT NULL DEFAULT '[]',
  contact_email     TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_user_id  ON public.bookings (user_id);
CREATE INDEX idx_bookings_pnr      ON public.bookings (pnr);
CREATE INDEX idx_bookings_status   ON public.bookings (status);

-- ============================================================
-- TABLE: seats
-- ============================================================
CREATE TABLE public.seats (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_id        UUID NOT NULL REFERENCES public.flights (id) ON DELETE CASCADE,
  seat_code        TEXT NOT NULL,  -- e.g. '12A'
  class            TEXT NOT NULL CHECK (class IN ('Economy', 'Business', 'First')),
  price_multiplier NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
  status           TEXT NOT NULL DEFAULT 'Available'
                     CHECK (status IN ('Available', 'Locked', 'Booked')),
  -- Optimistic locking: treat as Available if locked_until < now()
  locked_until     TIMESTAMPTZ,
  locked_by        TEXT,  -- stores user_id or anonymous session token
  booking_id       UUID REFERENCES public.bookings (id) ON DELETE SET NULL,
  CONSTRAINT unique_flight_seat UNIQUE (flight_id, seat_code)
);

CREATE INDEX idx_seats_flight_id   ON public.seats (flight_id);
CREATE INDEX idx_seats_status      ON public.seats (status);
CREATE INDEX idx_seats_locked_by   ON public.seats (locked_by);
CREATE INDEX idx_seats_booking_id  ON public.seats (booking_id);

-- ============================================================
-- TRIGGER: Auto-generate PNR on booking insert
-- Format: 6-character uppercase alphanumeric (e.g. AB12XY)
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_pnr()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  pnr   TEXT := '';
  i     INT;
BEGIN
  -- Retry loop to handle the extremely rare collision case
  LOOP
    pnr := '';
    FOR i IN 1..6 LOOP
      pnr := pnr || substr(chars, floor(random() * length(chars) + 1)::INT, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.bookings WHERE bookings.pnr = pnr);
  END LOOP;

  NEW.pnr := pnr;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_pnr
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  WHEN (NEW.pnr IS NULL OR NEW.pnr = '')
  EXECUTE FUNCTION public.generate_pnr();

-- ============================================================
-- TRIGGER: Update bookings.updated_at automatically
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
