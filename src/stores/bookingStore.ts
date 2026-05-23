'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================================
// Booking Store
//
// WHY THIS EXISTS IN ZUSTAND (not server state):
// - The booking flow spans multiple pages (search → seat map → checkout → confirm)
// - Selected seats must survive soft navigations (back/forward)
// - The active flight context must be available to the seat map immediately
//
// WHY WE DON'T USE ZUSTAND FOR:
// - Passenger PII (passport, DOB): never persisted to localStorage
// - Flight search results: fetched via server components, URL state drives them
// - Confirmed booking data: fetched from DB on /bookings/[pnr] page
//
// PERSIST STRATEGY:
// partialize only preserves the booking context (flightId, selectedSeats).
// Sensitive passenger details are in-memory only and reset on page refresh.
// ============================================================

interface SafePersistedState {
  flightId: string | null;
  selectedSeats: string[];
}

interface BookingState extends SafePersistedState {
  // In-memory only — never reaches localStorage
  lockTimerExpiresAt: string | null;

  // Actions
  setFlightId: (id: string | null) => void;
  addSelectedSeat: (seatCode: string) => void;
  removeSelectedSeat: (seatCode: string) => void;
  setLockTimer: (expiresAt: string | null) => void;
  resetBookingFlow: () => void;
}

const initialState: SafePersistedState = {
  flightId: null,
  selectedSeats: [],
};

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      ...initialState,
      lockTimerExpiresAt: null,

      setFlightId: (id) => set({ flightId: id }),

      addSelectedSeat: (seatCode) =>
        set((state) => ({
          selectedSeats: state.selectedSeats.includes(seatCode)
            ? state.selectedSeats
            : [...state.selectedSeats, seatCode],
        })),

      removeSelectedSeat: (seatCode) =>
        set((state) => ({
          selectedSeats: state.selectedSeats.filter((s) => s !== seatCode),
        })),

      setLockTimer: (expiresAt) => set({ lockTimerExpiresAt: expiresAt }),

      resetBookingFlow: () =>
        set({ ...initialState, lockTimerExpiresAt: null }),
    }),
    {
      name: 'sa-booking-store',
      storage: createJSONStorage(() => localStorage),
      // CRITICAL: Only persist safe, non-sensitive fields
      partialize: (state): SafePersistedState => ({
        flightId: state.flightId,
        selectedSeats: state.selectedSeats,
      }),
    }
  )
);
