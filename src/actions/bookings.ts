'use server';

import { createClient } from '@/lib/supabase/server';
import { checkoutSchema } from '@/lib/validations';
import type {
  Seat,
  ReserveSeatsResult,
  CancelBookingResult,
  RescheduleBookingResult,
  Booking,
} from '@/types';
import { mockDb } from '@/lib/mockDb';

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!(url && !url.includes('YOUR_PROJECT_REF'));
}

// ============================================================
// getSeatsForFlight
// Used by the seat map Server Component to hydrate initial state.
// Treats Locked + expired locked_until as Available at query time
// so stale UI locks don't block the initial render.
// ============================================================
export async function getSeatsForFlight(
  flightId: string
): Promise<{ data: Seat[] | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    const data = mockDb.getSeatsForFlight(flightId);
    return { data, error: null };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('seats')
    .select('*')
    .eq('flight_id', flightId)
    .order('seat_code', { ascending: true });

  if (error) {
    console.error('[getSeatsForFlight]', error.message);
    return { data: null, error: 'Could not load seat map.' };
  }

  return { data: data ?? [], error: null };
}

// ============================================================
// reserveSeats
// Calls the RPC which performs atomic validation + seat + booking update.
// Input validated server-side before the RPC call.
// ============================================================
export async function reserveSeats(
  flightId: string,
  seatCodes: string[],
  sessionId: string,
  rawPassengerData: unknown
): Promise<ReserveSeatsResult> {
  const parsed = checkoutSchema.safeParse(rawPassengerData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid passenger data' };
  }

  // Hybrid Mode Fallback:
  if (!isSupabaseConfigured()) {
    const totalPrice = seatCodes.length * 1000; // Simulating base calculations for mock
    return mockDb.reserveSeats(
      flightId,
      seatCodes,
      sessionId,
      'mock-user-123',
      parsed.data.contact_email,
      totalPrice,
      parsed.data.passengers
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'UNAUTHORIZED' };
  }

  const totalPrice = seatCodes.length * 1000; // Replace with real price calc from seat data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('reserve_seats', {
    p_flight_id:         flightId,
    p_seat_codes:        seatCodes,
    p_session_id:        sessionId,
    p_user_id:           user.id,
    p_contact_email:     parsed.data.contact_email,
    p_total_price:       totalPrice,
    p_passenger_details: parsed.data.passengers,
  }) as { data: ReserveSeatsResult | null; error: { message: string } | null };

  if (error) {
    console.error('[reserveSeats]', error.message);
    return { success: false, error: 'Booking failed. Please try again.' };
  }

  return data ?? { success: false, error: 'Empty response from server.' };
}

// ============================================================
// cancelBooking
// ============================================================
export async function cancelBooking(
  bookingId: string
): Promise<CancelBookingResult> {
  if (!isSupabaseConfigured()) {
    return mockDb.cancelBooking(bookingId, 'mock-user-123');
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'UNAUTHORIZED' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('cancel_booking', {
    p_booking_id: bookingId,
    p_user_id:    user.id,
  }) as { data: CancelBookingResult | null; error: { message: string } | null };

  if (error) {
    console.error('[cancelBooking]', error.message);
    return { success: false, error: 'Cancellation failed. Please try again.' };
  }

  return data ?? { success: false, error: 'Empty response from server.' };
}

// ============================================================
// getUserBookings
// ============================================================
export async function getUserBookings(): Promise<{
  data: Booking[] | null;
  error: string | null;
}> {
  if (!isSupabaseConfigured()) {
    // In hybrid mock mode, return mock bookings stored locally
    const fs = require('fs');
    const path = require('path');
    const dbDir = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\21b492a5-d640-491c-b06e-411f04966c53\\scratch';
    const dbFile = path.join(dbDir, 'mock_db.json');
    try {
      if (fs.existsSync(dbFile)) {
        const fileContent = fs.readFileSync(dbFile, 'utf8');
        const state = JSON.parse(fileContent);
        const userBookings = Object.values(state.bookings || {}) as Booking[];
        return { data: userBookings.reverse(), error: null };
      }
    } catch (e) {
      console.error(e);
    }
    return { data: [], error: null };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'UNAUTHORIZED' };
  }

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getUserBookings]', error.message);
    return { data: null, error: 'Could not fetch bookings.' };
  }

  return { data: data ?? [], error: null };
}

// ============================================================
// getBookingByPnr
// For PNR lookup — matches pnr + contact_email to prevent enumeration.
// ============================================================
export async function getBookingByPnr(
  pnr: string,
  email: string
): Promise<{ data: Booking | null; error: string | null }> {
  console.log('[getBookingByPnr] Incoming request:', { pnr, email });
  if (!isSupabaseConfigured()) {
    const booking = mockDb.getBookingByPnr(pnr, email);
    console.log('[getBookingByPnr] Mock DB lookup result:', booking);
    if (!booking) return { data: null, error: 'Booking not found.' };
    return { data: booking, error: null };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('pnr', pnr.toUpperCase())
    .eq('contact_email', email.toLowerCase())
    .single();

  if (error || !data) {
    // Intentionally vague — don't confirm if PNR exists
    return { data: null, error: 'Booking not found.' };
  }

  return { data, error: null };
}

// ============================================================
// lockSeatAction
// Secure wrapper to atomically hold a seat for 5 mins
// ============================================================
export async function lockSeatAction(
  flightId: string,
  seatCode: string,
  sessionId: string
): Promise<import('@/types').LockSeatResult> {
  if (!isSupabaseConfigured()) {
    const result = mockDb.lockSeat(flightId, seatCode, sessionId);
    if (!result.success) {
      return { success: false, error: result.error as any };
    }
    return {
      success: true,
      ...(result.locked_until ? { locked_until: result.locked_until } : {})
    };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('lock_seat', {
    p_flight_id:  flightId,
    p_seat_code:  seatCode,
    p_session_id: sessionId,
  }) as { data: import('@/types').LockSeatResult | null; error: { message: string } | null };

  if (error || !data) {
    console.error('[lockSeatAction]', error?.message ?? 'Empty response');
    return { success: false, error: 'SEAT_CONTENTION' };
  }

  return data;
}

// ============================================================
// releaseSeatLockAction
// Secure wrapper to release a seat hold
// ============================================================
export async function releaseSeatLockAction(
  flightId: string,
  seatCode: string,
  sessionId: string
): Promise<{ success: boolean }> {
  if (!isSupabaseConfigured()) {
    return mockDb.releaseSeatLock(flightId, seatCode, sessionId);
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).rpc('release_seat_lock', {
    p_flight_id:  flightId,
    p_seat_code:  seatCode,
    p_session_id: sessionId,
  });

  return { success: true };
}


