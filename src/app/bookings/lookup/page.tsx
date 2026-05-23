'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { pnrLookupSchema, type PNRLookupInput } from '@/lib/validations';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';

export default function PNRLookupPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PNRLookupInput>({
    resolver: zodResolver(pnrLookupSchema),
  });

  const onSubmit = (data: PNRLookupInput) => {
    // Redirect to the PNR detail page with the email in the query string
    router.push(`/bookings/${data.pnr.toUpperCase()}?email=${encodeURIComponent(data.email.toLowerCase())}`);
  };

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-50">Find Your Booking</h1>
          <p className="mt-1 text-sm text-slate-400">
            Enter your PNR code and contact email to view details.
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="glass-card flex flex-col gap-5 p-6"
          noValidate
        >
          <Input
            label="PNR Code"
            placeholder="e.g. AB12XY"
            error={errors.pnr?.message}
            {...register('pnr')}
            maxLength={6}
            className="uppercase font-mono tracking-widest text-center"
            required
            autoComplete="off"
          />

          <Input
            label="Contact Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
            required
            autoComplete="email"
          />

          <Button type="submit" size="lg" isLoading={isSubmitting} className="mt-2 w-full">
            Find Booking
          </Button>

          <div className="flex justify-between items-center text-sm mt-2">
            <Link href="/" className="text-slate-400 hover:text-slate-300">
              ← Back to search
            </Link>
            <Link href="/manage" className="text-indigo-400 hover:text-indigo-300">
              Manage Bookings
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
