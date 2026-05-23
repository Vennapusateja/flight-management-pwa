import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import {
  formatFlightTime,
  formatFlightDate,
  calcDuration,
  formatPrice,
} from '@/lib/utils';
import type { Flight } from '@/types';

interface FlightCardProps {
  flight:     Flight;
  passengers: number;
}

export function FlightCard({ flight, passengers }: FlightCardProps) {
  const totalPrice = flight.base_price * passengers;

  const statusVariant =
    flight.status === 'Scheduled' ? 'success' :
    flight.status === 'Delayed'   ? 'warning' :
    flight.status === 'Cancelled' ? 'danger'  : 'default';

  return (
    <article
      className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-sm
                 transition-all duration-200 hover:border-indigo-700 hover:shadow-lg hover:shadow-indigo-950/40"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Route & Times */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-50 tabular-nums">
              {formatFlightTime(flight.departure_time)}
            </p>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
              {flight.origin}
            </p>
          </div>

          <div className="flex flex-col items-center gap-1 px-4">
            <p className="text-xs text-slate-500">{calcDuration(flight.departure_time, flight.arrival_time)}</p>
            <div className="relative flex items-center gap-1">
              <div className="h-px w-12 bg-slate-700 sm:w-20" />
              <svg className="h-4 w-4 rotate-90 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
              </svg>
              <div className="h-px w-12 bg-slate-700 sm:w-20" />
            </div>
            <p className="text-xs text-slate-500">Non-stop</p>
          </div>

          <div className="text-center">
            <p className="text-2xl font-bold text-slate-50 tabular-nums">
              {formatFlightTime(flight.arrival_time)}
            </p>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
              {flight.destination}
            </p>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant}>{flight.status}</Badge>
            <span className="text-xs text-slate-500">{flight.flight_number}</span>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-indigo-400">
              {formatPrice(totalPrice)}
            </p>
            <p className="text-xs text-slate-500">
              {passengers > 1 ? `for ${passengers} passengers` : 'per passenger'}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
        <p className="text-sm text-slate-500">
          {formatFlightDate(flight.departure_time)}
        </p>
        <Link
          href={`/flights/${flight.id}/seats`}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white
                     transition-colors hover:bg-indigo-500 focus-visible:outline-none
                     focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          Select Seats →
        </Link>
      </div>
    </article>
  );
}
