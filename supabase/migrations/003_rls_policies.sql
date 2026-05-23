-- ============================================================
-- Migration 003: Row Level Security Policies
-- ============================================================

ALTER TABLE public.flights  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats    ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FLIGHTS: Public read. Only service role can write.
-- ============================================================
CREATE POLICY "flights_select_public"
  ON public.flights FOR SELECT
  USING (true);

-- ============================================================
-- BOOKINGS: Users can only see their own bookings.
-- Unauthenticated users can see bookings by PNR lookup via RPC only.
-- ============================================================
CREATE POLICY "bookings_select_own"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow users to view their own bookings by PNR (for unauthenticated PNR lookups,
-- use a SECURITY DEFINER RPC function instead of direct table access)
CREATE POLICY "bookings_insert_authenticated"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- No direct UPDATE allowed — all mutations go through SECURITY DEFINER RPCs
-- which bypass RLS. This prevents clients from directly manipulating status.
-- (RPCs: cancel_booking, reschedule_booking)

-- ============================================================
-- SEATS: Public read of seat status.
-- All writes go through SECURITY DEFINER RPCs only (no direct client writes).
-- ============================================================
CREATE POLICY "seats_select_public"
  ON public.seats FOR SELECT
  USING (true);

-- ============================================================
-- SEED: Revoke direct write access for anon/authenticated roles.
-- All seat mutations must go through RPC (SECURITY DEFINER bypasses RLS).
-- This is the critical control — NEVER allow direct INSERT/UPDATE/DELETE on seats.
-- ============================================================
REVOKE INSERT, UPDATE, DELETE ON public.seats    FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.bookings FROM anon;
-- authenticated can INSERT bookings (via RLS policy above), but
-- UPDATE/DELETE must go via RPC:
REVOKE UPDATE, DELETE ON public.bookings FROM authenticated;
