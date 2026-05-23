'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cancelBooking } from '@/actions/bookings';
import { Button } from '@/components/ui/Button';
import type { Booking } from '@/types';

import { useBookingStore } from '@/stores/bookingStore';
import { useFlightStore } from '@/stores/flightStore';
import { useUserStore } from '@/stores/userStore';

interface CancelBookingButtonProps {
  booking: Booking;
}

// Two-step cancellation: confirm dialog to prevent accidental cancellations
export function CancelBookingButton({ booking }: CancelBookingButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (booking.status === 'Cancelled') return null;

  const handleCancel = () => {
    setError(null);
    startTransition(async () => {
      const result = await cancelBooking(booking.id);

      if (!result.success) {
        setError(result.error ?? 'Cancellation failed.');
        setShowConfirm(false);
        return;
      }

      // Reset stores on successful booking cancellation
      useBookingStore.getState().resetBookingFlow();
      useFlightStore.getState().resetFlightStore();
      useUserStore.getState().resetUserStore();

      router.refresh();
    });
  };

  return (
    <div>
      {!showConfirm ? (
        <Button
          variant="danger"
          size="sm"
          onClick={() => setShowConfirm(true)}
        >
          Cancel Booking
        </Button>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border border-red-800 bg-red-950/40 p-4">
          <p className="text-sm text-red-300">
            Are you sure? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button
              variant="danger"
              size="sm"
              isLoading={isPending}
              onClick={handleCancel}
            >
              Yes, Cancel
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfirm(false)}
            >
              Keep It
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
