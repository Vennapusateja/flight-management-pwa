'use server';

import { createClient } from '@/lib/supabase/server';
import { flightSearchSchema } from '@/lib/validations';
import type { Flight } from '@/types';
import { mockDb } from '@/lib/mockDb';

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!(url && !url.includes('YOUR_PROJECT_REF'));
}

// ============================================================
// searchFlights
// Called from a Server Component or as a Server Action.
// Returns flights matching origin/destination/date.
// Date filtering is done as a range match on departure_time.
// ============================================================
export async function searchFlights(
  rawInput: unknown
): Promise<{ data: Flight[] | null; error: string | null }> {
  const parsed = flightSearchSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { data: null, error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const { origin, destination, date } = parsed.data;

  // Hybrid Mode Fallback:
  if (!isSupabaseConfigured()) {
    console.warn('[searchFlights] Supabase not configured. Using high-fidelity development mock DB.');
    const data = mockDb.searchFlights(origin, destination, date);
    return { data, error: null };
  }

  // Build date range: full calendar day in UTC
  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd   = `${date}T23:59:59.999Z`;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('flights')
    .select('*')
    .eq('origin', origin)
    .eq('destination', destination)
    .gte('departure_time', dayStart)
    .lte('departure_time', dayEnd)
    .neq('status', 'Cancelled')
    .order('departure_time', { ascending: true });

  if (error) {
    console.error('[searchFlights]', error.message);
    return { data: null, error: 'Failed to fetch flights. Please try again.' };
  }

  return { data: data ?? [], error: null };
}

// ============================================================
// getFlightById
// Fetches a single flight — used on the seat selection page.
// ============================================================
export async function getFlightById(
  flightId: string
): Promise<{ data: Flight | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    const flight = mockDb.getFlightById(flightId);
    if (!flight) return { data: null, error: 'Flight not found.' };
    return { data: flight, error: null };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('flights')
    .select('*')
    .eq('id', flightId)
    .single();

  if (error) {
    console.error('[getFlightById]', error.message);
    return { data: null, error: 'Flight not found.' };
  }

  return { data, error: null };
}

