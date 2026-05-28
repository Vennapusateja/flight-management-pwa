'use client';

import { useEffect } from 'react';
import { useSeatStore } from '@/stores/seatStore';
import type { Seat } from '@/types';

// ============================================================
// useRealtimeSeats
//
// Subscribes to Supabase Realtime changes on the seats table
// for a specific flight. Merges incoming updates into the seat
// store so all connected clients see live seat status changes.
//
// WHY REALTIME HERE:
// Without realtime, a user could select a seat that another user
// is booking simultaneously. The realtime feed keeps the map
// consistent for all viewers without polling.
//
// CHANNEL LIFECYCLE:
// - Subscribes on mount with the flightId
// - Unsubscribes on unmount (no memory leaks)
// - Gracefully skips subscription when Supabase is not configured
// ============================================================

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(
    url &&
    !url.includes('YOUR_PROJECT_REF') &&
    key &&
    !key.includes('YOUR_ANON_KEY')
  );
}

export function useRealtimeSeats(flightId: string) {
  const updateSeatFromRealtime = useSeatStore((s) => s.updateSeatFromRealtime);

  useEffect(() => {
    // Skip realtime subscription in mock/dev mode — Supabase not configured
    if (!flightId || !isSupabaseConfigured()) return;

    // Dynamic import so @supabase/ssr is only loaded when actually needed.
    // This prevents a crash when env vars contain placeholder values.
    let isMounted = true;
    let cleanup: (() => void) | undefined;

    (async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        if (!isMounted) return;

        const client = createClient();

        const channel = client
          .channel(`seats:flight:${flightId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'seats',
              filter: `flight_id=eq.${flightId}`,
            },
            (payload) => {
              if (payload.new && typeof payload.new === 'object') {
                updateSeatFromRealtime(payload.new as Seat);
              }
            }
          )
          .subscribe();

        cleanup = () => {
          void client.removeChannel(channel);
        };
      } catch (err) {
        console.warn('[useRealtimeSeats] Failed to initialize realtime:', err);
      }
    })();

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [flightId, updateSeatFromRealtime]);
}
