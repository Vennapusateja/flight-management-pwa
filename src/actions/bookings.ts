'use server';

import { cookies } from 'next/headers';
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
// Cookie-based booking persistence (mock / dev mode only)
//
// WHY COOKIES INSTEAD OF /tmp:
// Vercel serverless functions are ephemeral — each request can land
// on a different instance with its own empty /tmp directory.
// Bookings written to /tmp during checkout are invisible to the
// /manage page running on a different instance.
//
// Browser cookies travel with every request and are instance-independent,
// making them the correct persistence layer for a stateless demo deployment.
// ============================================================
async function getMockBookingsFromCookie(): Promise<Booking[]> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get('sa-mock-bookings')?.value;
    if (!raw) return [];
    return JSON.parse(decodeURIComponent(raw)) as Booking[];
  } catch {
    return [];
  }
}

async function saveMockBookingToCookie(booking: Booking): Promise<void> {
  try {
    const existing = await getMockBookingsFromCookie();
    // Deduplicate by PNR — update status if same booking is re-saved (e.g. cancellation)
    const updated = [booking, ...existing.filter((b) => b.pnr !== booking.pnr)];
    const cookieStore = await cookies();
    cookieStore.set('sa-mock-bookings', encodeURIComponent(JSON.stringify(updated)), {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false,
      sameSite: 'lax',
    });
  } catch (e) {
    console.error('[saveMockBookingToCookie]', e);
  }
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
// In mock mode: saves booking to a cookie so it persists across
// Vercel serverless instances (cross-instance /tmp is not shared).
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
    // Calculate total price from real seat data
    const seats = mockDb.getSeatsForFlight(flightId);
    const flight = mockDb.getFlightById(flightId);
    const basePrice = flight?.base_price ?? 3000;
    const totalPrice = seatCodes.reduce((sum, code) => {
      const seat = seats.find((s) => s.seat_code === code);
      return sum + basePrice * (seat?.price_multiplier ?? 1.0);
    }, 0);

    const result = mockDb.reserveSeats(
      flightId,
      seatCodes,
      sessionId,
      'mock-user-123',
      parsed.data.contact_email,
      totalPrice,
      parsed.data.passengers
    );

    // Persist the full booking to a cookie so it shows up on /manage
    // even across different Vercel serverless instances
    if (result.success && result.pnr && result.booking_id) {
      const booking: Booking = {
        id: result.booking_id,
        user_id: 'mock-user-123',
        pnr: result.pnr,
        status: 'Confirmed',
        total_price: totalPrice,
        passenger_details: parsed.data.passengers.map((p, i) => ({
          seat_code: seatCodes[i] ?? '',
          title: p.title,
          first_name: p.first_name,
          last_name: p.last_name,
          ...(p.passport_number ? { passport_number: p.passport_number } : {}),
          ...(p.date_of_birth ? { date_of_birth: p.date_of_birth } : {}),
        })),
        contact_email: parsed.data.contact_email.toLowerCase(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await saveMockBookingToCookie(booking);
    }

    return result;
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
    const result = mockDb.cancelBooking(bookingId, 'mock-user-123');

    // Update the cookie so /manage shows the cancelled status
    if (result.success) {
      const bookings = await getMockBookingsFromCookie();
      const booking = bookings.find((b) => b.id === bookingId);
      if (booking) {
        await saveMockBookingToCookie({
          ...booking,
          status: 'Cancelled',
          updated_at: new Date().toISOString(),
        });
      }
    }

    return result;
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
// In mock mode: reads from cookie (cross-instance safe on Vercel).
// Previously used a hardcoded Windows local path which broke on Vercel.
// ============================================================
export async function getUserBookings(): Promise<{
  data: Booking[] | null;
  error: string | null;
}> {
  if (!isSupabaseConfigured()) {
    const bookings = await getMockBookingsFromCookie();
    return { data: bookings, error: null };
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
// In mock mode: checks cookie-stored bookings as fallback when
// mockDb returns null (different Vercel instance than the one
// that created the booking).
// ============================================================
export async function getBookingByPnr(
  pnr: string,
  email: string
): Promise<{ data: Booking | null; error: string | null }> {
  console.log('[getBookingByPnr] Incoming request:', { pnr, email });
  if (!isSupabaseConfigured()) {
    // 1. Try mockDb first (works if same Vercel instance handled booking)
    const dbBooking = mockDb.getBookingByPnr(pnr, email);
    if (dbBooking) {
      console.log('[getBookingByPnr] Found in mockDb');
      return { data: dbBooking, error: null };
    }

    // 2. Fall back to cookie (cross-instance lookup)
    const cookieBookings = await getMockBookingsFromCookie();
    const cookieBooking = cookieBookings.find(
      (b) =>
        b.pnr.toUpperCase() === pnr.toUpperCase() &&
        b.contact_email.toLowerCase() === email.toLowerCase()
    );

    if (cookieBooking) {
      console.log('[getBookingByPnr] Found in cookie');
      return { data: cookieBooking, error: null };
    }

    return { data: null, error: 'Booking not found.' };
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
