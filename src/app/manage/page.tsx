import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserBookings } from '@/actions/bookings';
import { Badge } from '@/components/ui/Badge';
import { formatPrice, formatFlightDate } from '@/lib/utils';
import type { BookingStatus } from '@/types';

export const metadata: Metadata = {
  title: 'My Bookings',
};

const statusVariant: Record<BookingStatus, 'success' | 'warning' | 'danger'> = {
  Confirmed:   'success',
  Rescheduled: 'warning',
  Cancelled:   'danger',
};

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!(url && !url.includes('YOUR_PROJECT_REF'));
}

export default async function ManagePage() {
  let user: any = null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } else {
    // High-fidelity local developer mock session
    user = { id: 'mock-user-123', email: 'dev@sourceasia.com' };
  }

  if (!user) redirect('/auth/login?redirect=/manage');

  const { data: bookings, error } = await getUserBookings();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-bold text-slate-50">My Bookings</h1>

      {error && (
        <div role="alert" className="rounded-xl border border-red-800 bg-red-950/40 p-6 text-sm text-red-300">
          {error}
        </div>
      )}

      {bookings !== null && bookings.length === 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <p className="text-slate-400">No bookings found.</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-indigo-400 hover:text-indigo-300"
          >
            Search for flights →
          </Link>
        </div>
      )}

      {bookings && bookings.length > 0 && (
        <ul className="flex flex-col gap-4" role="list">
          {bookings.map((booking) => (
            <li key={booking.id}>
              <Link
                href={`/bookings/${booking.pnr}?email=${encodeURIComponent(booking.contact_email)}`}
                className="group block rounded-2xl border border-slate-800 bg-slate-900/60 p-5
                           transition-all hover:border-indigo-700 hover:shadow-lg hover:shadow-indigo-950/40"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-2xl font-bold tracking-widest text-slate-50">
                        {booking.pnr}
                      </span>
                      <Badge variant={statusVariant[booking.status]}>
                        {booking.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">
                      {booking.passenger_details.length} passenger
                      {booking.passenger_details.length !== 1 ? 's' : ''} ·{' '}
                      {formatFlightDate(booking.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-indigo-400">
                      {formatPrice(booking.total_price)}
                    </p>
                    <p className="text-xs text-slate-500 transition-colors group-hover:text-indigo-400">
                      View details →
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
