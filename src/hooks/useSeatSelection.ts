'use client';

import { useCallback } from 'react';
import { useSeatStore } from '@/stores/seatStore';
import { useBookingStore } from '@/stores/bookingStore';
import { getOrCreateSessionId } from '@/lib/utils';
import { lockSeatAction, releaseSeatLockAction } from '@/actions/bookings';

// ============================================================
// useSeatSelection
//
// Orchestrates the full optimistic seat lock flow:
// 1. Optimistic update in local store
// 2. Call lockSeatAction server action
// 3a. Confirm lock with server timestamp
// 3b. Rollback on failure + return error to UI
//
// Returns a stable selectSeat function — consumer components
// don't need to know about stores or RPC internals.
// ============================================================
export function useSeatSelection(flightId: string) {
  const {
    optimisticallyLockSeat,
    confirmSeatLock,
    rollbackSeatLock,
    releaseSeatLocally,
  } = useSeatStore();

  const { addSelectedSeat, removeSelectedSeat, selectedSeats } = useBookingStore();

  const selectSeat = useCallback(
    async (seatCode: string): Promise<{ error?: string }> => {
      const sessionId = getOrCreateSessionId();

      // Optimistic update — instant UI feedback
      const previousState = optimisticallyLockSeat(seatCode, sessionId);
      if (!previousState) {
        return { error: 'Seat is not available.' };
      }

      addSelectedSeat(seatCode);

      // Fire Server Action
      const result = await lockSeatAction(flightId, seatCode, sessionId);

      if (!result.success) {
        // Business rule or server failure — rollback
        rollbackSeatLock(previousState);
        removeSelectedSeat(seatCode);

        const messages: Record<string, string> = {
          SEAT_ALREADY_BOOKED: 'This seat was just booked by someone else.',
          SEAT_LOCKED:         'This seat is temporarily held by another user.',
          SEAT_CONTENTION:     'High demand — please select another seat.',
          SEAT_NOT_FOUND:      'Seat not found.',
        };

        return { error: messages[result.error ?? ''] ?? 'Seat unavailable.' };
      }

      // Confirm with real server timestamp
      if (result.locked_until) {
        confirmSeatLock(seatCode, result.locked_until);
      }

      return {};
    },
    [
      flightId,
      optimisticallyLockSeat,
      confirmSeatLock,
      rollbackSeatLock,
      addSelectedSeat,
      removeSelectedSeat,
    ]
  );

  const deselectSeat = useCallback(
    async (seatCode: string): Promise<void> => {
      const sessionId = getOrCreateSessionId();

      // Immediately release locally
      releaseSeatLocally(seatCode);
      removeSelectedSeat(seatCode);

      // Fire release Server Action (fire-and-forget — no rollback needed)
      await releaseSeatLockAction(flightId, seatCode, sessionId);
    },
    [flightId, releaseSeatLocally, removeSelectedSeat]
  );

  return { selectSeat, deselectSeat, selectedSeats };
}

