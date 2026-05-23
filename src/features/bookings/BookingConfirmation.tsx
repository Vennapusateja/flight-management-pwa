import { Badge } from '@/components/ui/Badge';
import { formatPrice, formatFlightDate, formatFlightTime } from '@/lib/utils';
import type { Booking, BookingStatus } from '@/types';

interface BookingConfirmationProps {
  booking:   Booking;
  isNew?:    boolean;  // shows congratulatory header on fresh bookings
}

const statusVariant: Record<BookingStatus, 'success' | 'warning' | 'danger'> = {
  Confirmed:   'success',
  Rescheduled: 'warning',
  Cancelled:   'danger',
};

export function BookingConfirmation({ booking, isNew }: BookingConfirmationProps) {
  return (
    <div className="mx-auto max-w-xl">
      {isNew && (
        <div className="mb-8 rounded-2xl border border-emerald-800 bg-emerald-950/40 p-6 text-center">
          <div className="mb-2 text-4xl" aria-hidden="true">✓</div>
          <h1 className="text-2xl font-bold text-emerald-400">Booking Confirmed!</h1>
          <p className="mt-1 text-sm text-slate-400">
            A confirmation has been sent to {booking.contact_email}
          </p>
        </div>
      )}

      <article className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
        {/* PNR Header */}
        <div className="border-b border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-slate-500">
                Booking Reference
              </p>
              <p className="mt-1 font-mono text-4xl font-bold tracking-widest text-slate-50">
                {booking.pnr}
              </p>
            </div>
            <Badge variant={statusVariant[booking.status]}>
              {booking.status}
            </Badge>
          </div>
        </div>

        {/* Passengers */}
        <div className="p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-500">
            Passengers
          </h2>
          <ul className="space-y-3">
            {booking.passenger_details.map((p, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg bg-slate-800/50 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-slate-100">
                    {p.title} {p.first_name} {p.last_name}
                  </p>
                </div>
                <span className="rounded-md border border-indigo-700 bg-indigo-950 px-2.5 py-1 font-mono text-sm font-bold text-indigo-300">
                  {p.seat_code}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Price */}
        <div className="border-t border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Total Paid</span>
            <span className="text-xl font-bold text-slate-50">
              {formatPrice(booking.total_price)}
            </span>
          </div>
        </div>
      </article>
    </div>
  );
}
