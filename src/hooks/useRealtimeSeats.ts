'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
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
// - Uses a ref to avoid stale closure issues in the callback
// ============================================================
export function useRealtimeSeats(flightId: string) {
  const updateSeatFromRealtime = useSeatStore((s) => s.updateSeatFromRealtime);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  if (!supabaseRef.current) {
    supabaseRef.current = createClient();
  }

  useEffect(() => {
    if (!flightId) return;

    const client = supabaseRef.current;
    if (!client) return;

    const channel = client
      .channel(`seats:flight:${flightId}`)
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'seats',
          filter: `flight_id=eq.${flightId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            updateSeatFromRealtime(payload.new as Seat);
          }
        }
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [flightId, updateSeatFromRealtime]);
}
