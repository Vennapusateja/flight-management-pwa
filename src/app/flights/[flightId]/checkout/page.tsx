import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CheckoutForm } from '@/features/bookings/CheckoutForm';

export const metadata: Metadata = {
  title: 'Complete Booking',
};

interface PageProps {
  params: { flightId: string };
}

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!(url && !url.includes('YOUR_PROJECT_REF'));
}

export default async function CheckoutPage({ params }: PageProps) {
  // Require authentication for checkout
  let user: any = null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } else {
    // High-fidelity local developer mock session
    user = { id: 'mock-user-123', email: 'dev@sourceasia.com' };
  }

  if (!user) {
    redirect(`/auth/login?redirect=/flights/${params.flightId}/checkout`);
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-50">Complete Your Booking</h1>
        <p className="mt-1 text-sm text-slate-400">
          Your seats are held for 5 minutes. Complete checkout before they expire.
        </p>
      </div>

      <CheckoutForm flightId={params.flightId} />
    </main>
  );
}
