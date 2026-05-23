'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Booking } from '@/types';

interface UserState {
  sessionToken: string | null;
  cachedBookings: Booking[];

  // Actions
  setSessionToken: (token: string | null) => void;
  setCachedBookings: (bookings: Booking[]) => void;
  resetUserStore: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      sessionToken: null,
      cachedBookings: [],
      setSessionToken: (token) => set({ sessionToken: token }),
      setCachedBookings: (bookings) => set({ cachedBookings: bookings }),
      resetUserStore: () => set({ sessionToken: null, cachedBookings: [] }),
    }),
    {
      name: 'sa-user-store',
      storage: createJSONStorage(() => localStorage),
      // Persist only the session token, do not persist cached bookings
      partialize: (state) => ({
        sessionToken: state.sessionToken,
      }),
    }
  )
);
