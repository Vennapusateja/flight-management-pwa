'use client';

import { create } from 'zustand';
import type { Seat, LockSeatResult } from '@/types';
import { isEffectivelyAvailable } from '@/lib/utils';

// ============================================================
// Seat Store
//
// WHY THIS IS CLIENT STATE (not just server state):
// - Seat status changes in realtime via Supabase subscriptions
// - Optimistic updates are needed for instant UX on seat selection
// - Multiple components (SeatMap, SeatSummary, PriceDisplay) read seat state
//
// OPTIMISTIC UPDATE STRATEGY:
// 1. User clicks seat → immediately mark as 'Locked' in local state (optimistic)
// 2. Fire lock_seat RPC in background
// 3a. RPC success → update with server-confirmed locked_until timestamp
// 3b. RPC failure → rollback to previous state + show toast
//
// REALTIME:
// Supabase realtime subscription calls updateSeatFromRealtime() to merge
// server-pushed changes without overwriting locally-locked optimistic state.
// ============================================================

interface SeatStore {
  seats: Map<string, Seat>;  // key: seat_code
  isLoading: boolean;
  error: string | null;

  // Actions
  initSeats: (seats: Seat[]) => void;
  optimisticallyLockSeat: (seatCode: string, sessionId: string) => Seat | undefined;
  confirmSeatLock: (seatCode: string, lockedUntil: string) => void;
  rollbackSeatLock: (previousSeat: Seat) => void;
  updateSeatFromRealtime: (updatedSeat: Seat) => void;
  releaseSeatLocally: (seatCode: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSeatStore = create<SeatStore>((set, get) => ({
  seats: new Map(),
  isLoading: false,
  error: null,

  initSeats: (seats) => {
    const seatMap = new Map<string, Seat>();
    seats.forEach((seat) => seatMap.set(seat.seat_code, seat));
    set({ seats: seatMap });
  },

  // Returns the PREVIOUS seat state so the caller can rollback on failure
  optimisticallyLockSeat: (seatCode, sessionId) => {
    const { seats } = get();
    const previous = seats.get(seatCode);
    if (!previous) return undefined;

    // Only allow locking if effectively available
    if (!isEffectivelyAvailable(previous.status, previous.locked_until)) {
      return undefined;
    }

    const optimistic: Seat = {
      ...previous,
      status: 'Locked',
      locked_by: sessionId,
      locked_until: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    };

    set((state) => {
      const next = new Map(state.seats);
      next.set(seatCode, optimistic);
      return { seats: next };
    });

    return previous;
  },

  confirmSeatLock: (seatCode, lockedUntil) => {
    set((state) => {
      const next = new Map(state.seats);
      const seat = next.get(seatCode);
      if (seat) {
        next.set(seatCode, { ...seat, status: 'Locked', locked_until: lockedUntil });
      }
      return { seats: next };
    });
  },

  rollbackSeatLock: (previousSeat) => {
    set((state) => {
      const next = new Map(state.seats);
      next.set(previousSeat.seat_code, previousSeat);
      return { seats: next };
    });
  },

  // Merges realtime server pushes.
  // We don't overwrite 'Locked' seats that the current user holds —
  // server state takes priority for all OTHER sessions' changes.
  updateSeatFromRealtime: (updatedSeat) => {
    set((state) => {
      const next = new Map(state.seats);
      next.set(updatedSeat.seat_code, updatedSeat);
      return { seats: next };
    });
  },

  releaseSeatLocally: (seatCode) => {
    set((state) => {
      const next = new Map(state.seats);
      const seat = next.get(seatCode);
      if (seat) {
        next.set(seatCode, {
          ...seat,
          status: 'Available',
          locked_by: null,
          locked_until: null,
        });
      }
      return { seats: next };
    });
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
