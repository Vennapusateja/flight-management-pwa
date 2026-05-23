import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBookingByPnr } from '@/actions/bookings';
import { getCurrentUser } from '@/actions/auth';
import { BookingConfirmation } from '@/features/bookings/BookingConfirmation';
import { CancelBookingButton } from '@/features/bookings/CancelBookingButton';

export const metadata: Metadata = {
  title: 'Booking Details',
};

interface PageProps {
  params:      { pnr: string };
  searchParams: { new?: string; email?: string };
}

export default async function BookingDetailPage({ params, searchParams }: PageProps) {
  console.log('[BookingDetailPage] Start rendering:', { params, searchParams });
  // For fresh bookings (redirected from checkout), we get email from session
  // For PNR lookups, email comes from the lookup form query param
  let email = searchParams.email ?? '';
  const isNew = searchParams.new === 'true';

  if (!email) {
    const user = await getCurrentUser();
    if (user?.email) {
      email = user.email;
    }
  }

  const { data: booking, error } = await getBookingByPnr(params.pnr, email);

  if (error || !booking) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <BookingConfirmation booking={booking} isNew={isNew} />

      <div className="mt-8 flex justify-center">
        <CancelBookingButton booking={booking} />
      </div>
    </main>
  );
}
