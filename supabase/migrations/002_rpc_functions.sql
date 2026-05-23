-- ============================================================
-- Migration 002: RPC Functions (Seat Locking, Reservation, Cancellation)
-- All functions use transactions + row-level locking to prevent
-- double-booking and race conditions.
-- ============================================================

-- ============================================================
-- RPC: lock_seat
-- Atomically locks a seat for 5 minutes for a given session.
-- Returns JSON: { success: bool, error?: string }
-- Concurrency: SELECT FOR UPDATE prevents simultaneous grants.
-- ============================================================
CREATE OR REPLACE FUNCTION public.lock_seat(
  p_flight_id  UUID,
  p_seat_code  TEXT,
  p_session_id TEXT  -- user_id or anonymous session token
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seat seats%ROWTYPE;
BEGIN
  -- Acquire exclusive row lock immediately (NOWAIT = fail fast, no queue)
  SELECT * INTO v_seat
  FROM public.seats
  WHERE flight_id = p_flight_id
    AND seat_code = p_seat_code
  FOR UPDATE NOWAIT;

  -- Seat does not exist
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'SEAT_NOT_FOUND');
  END IF;

  -- Seat is permanently booked
  IF v_seat.status = 'Booked' THEN
    RETURN jsonb_build_object('success', false, 'error', 'SEAT_ALREADY_BOOKED');
  END IF;

  -- Seat is actively locked by another session (not expired)
  IF v_seat.status = 'Locked'
    AND v_seat.locked_until IS NOT NULL
    AND v_seat.locked_until > now()
    AND v_seat.locked_by IS DISTINCT FROM p_session_id
  THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'SEAT_LOCKED',
      'locked_until', v_seat.locked_until
    );
  END IF;

  -- Grant the lock (also covers re-locking your own session or expired lock)
  UPDATE public.seats
  SET
    status       = 'Locked',
    locked_by    = p_session_id,
    locked_until = now() + INTERVAL '5 minutes'
  WHERE flight_id = p_flight_id
    AND seat_code = p_seat_code;

  RETURN jsonb_build_object('success', true);

EXCEPTION
  -- NOWAIT raises lock_not_available if another transaction holds the lock
  WHEN lock_not_available THEN
    RETURN jsonb_build_object('success', false, 'error', 'SEAT_CONTENTION');
END;
$$;

-- ============================================================
-- RPC: release_seat_lock
-- Releases a lock held by a specific session (on abandonment/deselect).
-- ============================================================
CREATE OR REPLACE FUNCTION public.release_seat_lock(
  p_flight_id  UUID,
  p_seat_code  TEXT,
  p_session_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.seats
  SET
    status       = 'Available',
    locked_by    = NULL,
    locked_until = NULL
  WHERE flight_id = p_flight_id
    AND seat_code = p_seat_code
    AND locked_by = p_session_id
    AND status    = 'Locked';
END;
$$;

-- ============================================================
-- RPC: reserve_seats
-- Atomic seat confirmation + booking creation.
-- Called after payment/confirmation step.
-- Validates all seats are still locked by caller's session_id before
-- finalizing. Rolls back entirely if any seat is no longer available.
-- ============================================================
CREATE OR REPLACE FUNCTION public.reserve_seats(
  p_flight_id        UUID,
  p_seat_codes       TEXT[],
  p_session_id       TEXT,
  p_user_id          UUID,
  p_contact_email    TEXT,
  p_total_price      NUMERIC(10, 2),
  p_passenger_details JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_id UUID;
  v_pnr        TEXT;
  v_seat_code  TEXT;
  v_seat       seats%ROWTYPE;
BEGIN
  -- Validate each seat is still locked by this session
  FOREACH v_seat_code IN ARRAY p_seat_codes LOOP
    SELECT * INTO v_seat
    FROM public.seats
    WHERE flight_id = p_flight_id
      AND seat_code = v_seat_code
    FOR UPDATE;  -- Lock all rows for the duration of this transaction

    IF NOT FOUND THEN
      RAISE EXCEPTION 'SEAT_NOT_FOUND: %', v_seat_code;
    END IF;

    IF v_seat.status <> 'Locked'
       OR v_seat.locked_by <> p_session_id
       OR v_seat.locked_until <= now()
    THEN
      RAISE EXCEPTION 'SEAT_LOCK_EXPIRED: %', v_seat_code;
    END IF;
  END LOOP;

  -- Create booking (PNR populated by trigger)
  INSERT INTO public.bookings (
    user_id, pnr, total_price, passenger_details, contact_email
  ) VALUES (
    p_user_id, '', p_total_price, p_passenger_details, p_contact_email
  )
  RETURNING id, pnr INTO v_booking_id, v_pnr;

  -- Confirm all seats
  UPDATE public.seats
  SET
    status       = 'Booked',
    booking_id   = v_booking_id,
    locked_by    = NULL,
    locked_until = NULL
  WHERE flight_id = p_flight_id
    AND seat_code = ANY(p_seat_codes);

  RETURN jsonb_build_object(
    'success',     true,
    'booking_id',  v_booking_id,
    'pnr',         v_pnr
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Transaction auto-rolls back; surface the error message to the caller
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================================
-- RPC: cancel_booking
-- Cancels a booking and releases its seats back to Available.
-- Only the booking owner can cancel.
-- ============================================================
CREATE OR REPLACE FUNCTION public.cancel_booking(
  p_booking_id UUID,
  p_user_id    UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'BOOKING_NOT_FOUND');
  END IF;

  IF v_booking.user_id <> p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  END IF;

  IF v_booking.status = 'Cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_CANCELLED');
  END IF;

  -- Release seats
  UPDATE public.seats
  SET
    status       = 'Available',
    booking_id   = NULL,
    locked_by    = NULL,
    locked_until = NULL
  WHERE booking_id = p_booking_id;

  -- Mark booking cancelled
  UPDATE public.bookings
  SET status = 'Cancelled'
  WHERE id = p_booking_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- RPC: reschedule_booking
-- Moves a booking to a new flight with new seat codes.
-- Atomically validates new seats, cancels old seats, confirms new.
-- ============================================================
CREATE OR REPLACE FUNCTION public.reschedule_booking(
  p_booking_id      UUID,
  p_user_id         UUID,
  p_new_flight_id   UUID,
  p_new_seat_codes  TEXT[],
  p_session_id      TEXT,
  p_price_delta     NUMERIC(10, 2)  -- additional charge (can be negative for refund)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking    bookings%ROWTYPE;
  v_seat_code  TEXT;
  v_seat       seats%ROWTYPE;
BEGIN
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'BOOKING_NOT_FOUND');
  END IF;

  IF v_booking.user_id <> p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED');
  END IF;

  IF v_booking.status <> 'Confirmed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'BOOKING_NOT_RESCHEDULABLE');
  END IF;

  -- Validate new seats are locked by caller
  FOREACH v_seat_code IN ARRAY p_new_seat_codes LOOP
    SELECT * INTO v_seat
    FROM public.seats
    WHERE flight_id = p_new_flight_id
      AND seat_code = v_seat_code
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'NEW_SEAT_NOT_FOUND: %', v_seat_code;
    END IF;

    IF v_seat.status <> 'Locked'
       OR v_seat.locked_by <> p_session_id
       OR v_seat.locked_until <= now()
    THEN
      RAISE EXCEPTION 'NEW_SEAT_LOCK_EXPIRED: %', v_seat_code;
    END IF;
  END LOOP;

  -- Release old seats
  UPDATE public.seats
  SET
    status       = 'Available',
    booking_id   = NULL,
    locked_by    = NULL,
    locked_until = NULL
  WHERE booking_id = p_booking_id;

  -- Confirm new seats
  UPDATE public.seats
  SET
    status       = 'Booked',
    booking_id   = p_booking_id,
    locked_by    = NULL,
    locked_until = NULL
  WHERE flight_id = p_new_flight_id
    AND seat_code = ANY(p_new_seat_codes);

  -- Update booking
  UPDATE public.bookings
  SET
    status      = 'Rescheduled',
    total_price = total_price + p_price_delta
  WHERE id = p_booking_id;

  RETURN jsonb_build_object('success', true);

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================================
-- FUNCTION: expire_stale_locks (run via pg_cron or Supabase Edge Function)
-- Resets any seats whose lock has expired back to Available.
-- This is a safety net — the query layer already treats expired
-- locks as Available, but this keeps the data consistent.
-- ============================================================
CREATE OR REPLACE FUNCTION public.expire_stale_locks()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected INT;
BEGIN
  UPDATE public.seats
  SET
    status       = 'Available',
    locked_by    = NULL,
    locked_until = NULL
  WHERE status       = 'Locked'
    AND locked_until <= now();

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;
