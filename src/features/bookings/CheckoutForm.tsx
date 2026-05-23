'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { checkoutSchema, type CheckoutInput } from '@/lib/validations';
import { reserveSeats } from '@/actions/bookings';
import { useBookingStore } from '@/stores/bookingStore';
import { getOrCreateSessionId } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface CheckoutFormProps {
  flightId: string;
}

// ============================================================
// CheckoutForm
//
// Multi-passenger checkout. One passenger entry per locked seat.
// Uses useFieldArray to dynamically render forms per passenger.
//
// NOTE ON PII HANDLING:
// passport_number and date_of_birth are collected in the form but
// are NOT stored in Zustand or localStorage. They're submitted
// directly via the server action and stored only in the DB (JSONB).
// ============================================================
export function CheckoutForm({ flightId }: CheckoutFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const { selectedSeats, resetBookingFlow } = useBookingStore();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      contact_email: '',
      passengers: selectedSeats.map((seatCode) => ({
        seat_code:   seatCode,
        title:       'Mr',
        first_name:  '',
        last_name:   '',
      })),
    },
  });

  const { fields } = useFieldArray({ control, name: 'passengers' });

  const onSubmit = (data: CheckoutInput) => {
    setServerError(null);
    startTransition(async () => {
      const sessionId = getOrCreateSessionId();
      const result = await reserveSeats(flightId, selectedSeats, sessionId, data);

      if (!result.success || !result.pnr) {
        setServerError(result.error ?? 'Booking failed. Please try again.');
        return;
      }

      resetBookingFlow();
      router.push(`/bookings/${result.pnr}?new=true&email=${encodeURIComponent(data.contact_email)}`);
    });
  };

  if (selectedSeats.length === 0) {
    return (
      <div className="rounded-lg border border-amber-800 bg-amber-950/40 p-4 text-sm text-amber-300">
        No seats selected. Please go back and select your seats.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-8"
      noValidate
    >
      {/* Contact */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-200">Contact Information</h2>
        <Input
          label="Contact Email"
          type="email"
          placeholder="you@example.com"
          error={errors.contact_email?.message}
          {...register('contact_email')}
          required
        />
      </section>

      {/* Passengers */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-200">
          Passenger Details
        </h2>
        <div className="flex flex-col gap-6">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"
            >
              <h3 className="mb-4 text-sm font-medium text-indigo-400">
                Passenger {index + 1} — Seat {field.seat_code}
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-300">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <select
                    {...register(`passengers.${index}.title`)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100
                               focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Mr">Mr</option>
                    <option value="Ms">Ms</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Dr">Dr</option>
                  </select>
                </div>

                <Input
                  label="First Name"
                  placeholder="John"
                  error={errors.passengers?.[index]?.first_name?.message}
                  {...register(`passengers.${index}.first_name`)}
                  required
                />

                <Input
                  label="Last Name"
                  placeholder="Doe"
                  error={errors.passengers?.[index]?.last_name?.message}
                  {...register(`passengers.${index}.last_name`)}
                  required
                />

                <Input
                  label="Passport Number"
                  placeholder="A1234567"
                  hint="Optional for domestic flights"
                  error={errors.passengers?.[index]?.passport_number?.message}
                  {...register(`passengers.${index}.passport_number`)}
                  className="uppercase"
                />

                <Input
                  label="Date of Birth"
                  type="date"
                  error={errors.passengers?.[index]?.date_of_birth?.message}
                  {...register(`passengers.${index}.date_of_birth`)}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {serverError && (
        <div role="alert" className="rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
          {serverError}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        isLoading={isPending}
      >
        Confirm Booking
      </Button>
    </form>
  );
}
