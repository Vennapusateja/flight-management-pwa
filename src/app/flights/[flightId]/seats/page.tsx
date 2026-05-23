import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getFlightById } from '@/actions/flights';
import { getSeatsForFlight } from '@/actions/bookings';
import { SeatMap } from '@/features/seats/SeatMap';
import { SeatMapErrorHandler } from '@/features/seats/SeatMapErrorHandler';
import { formatFlightTime, formatFlightDate, calcDuration } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Select Seats',
};

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { flightId: string };
}

// Server component: fetches flight + initial seats server-side.
// SeatMap (client) hydrates the store with this data on mount.
// This prevents the "loading seats..." flicker on first render.
export default async function SeatsPage({ params }: PageProps) {
  const [{ data: flight, error: flightError }, { data: seats, error: seatsError }] =
    await Promise.all([
      getFlightById(params.flightId),
      getSeatsForFlight(params.flightId),
    ]);

  if (flightError || !flight) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      {/* Flight summary */}
      <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-slate-50">
                {formatFlightTime(flight.departure_time)}
              </span>
              <span className="text-slate-500">→</span>
              <span className="text-3xl font-bold text-slate-50">
                {formatFlightTime(flight.arrival_time)}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {flight.origin} → {flight.destination} ·{' '}
              {calcDuration(flight.departure_time, flight.arrival_time)} ·{' '}
              {formatFlightDate(flight.departure_time)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Flight</p>
            <p className="font-mono font-medium text-slate-300">{flight.flight_number}</p>
          </div>
        </div>
      </div>

      {seatsError && (
        <div role="alert" className="rounded-xl border border-red-800 bg-red-950/40 p-6 text-center text-sm text-red-300">
          {seatsError}
        </div>
      )}

      {seats && (
        <SeatMapErrorHandler>
          <SeatMap
            flightId={params.flightId}
            initialSeats={seats}
          />
        </SeatMapErrorHandler>
      )}
    </main>
  );
}
