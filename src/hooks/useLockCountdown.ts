'use client';

import { useEffect, useState } from 'react';
import { useBookingStore } from '@/stores/bookingStore';

// ============================================================
// useLockCountdown
//
// Tracks remaining time on the seat lock (5-minute window).
// Returns seconds remaining and whether the lock has expired.
// When expired, clears selectedSeats from the booking store
// so users cannot attempt to book with stale locks.
// ============================================================
export function useLockCountdown() {
  const { lockTimerExpiresAt, resetBookingFlow } = useBookingStore();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!lockTimerExpiresAt) {
      setSecondsLeft(null);
      return;
    }

    const tick = () => {
      const remaining = Math.floor(
        (new Date(lockTimerExpiresAt).getTime() - Date.now()) / 1000
      );

      if (remaining <= 0) {
        setSecondsLeft(0);
        // Reset booking flow — locks expired server-side too
        resetBookingFlow();
        return;
      }

      setSecondsLeft(remaining);
    };

    tick(); // immediate first run
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockTimerExpiresAt, resetBookingFlow]);

  const minutes = secondsLeft !== null ? Math.floor(secondsLeft / 60) : null;
  const seconds = secondsLeft !== null ? secondsLeft % 60 : null;
  const isExpired = secondsLeft === 0;
  const isActive  = secondsLeft !== null && secondsLeft > 0;

  return { secondsLeft, minutes, seconds, isExpired, isActive };
}
