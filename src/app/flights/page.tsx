import type { Metadata } from 'next';
import { Suspense } from 'react';
import { searchFlights } from '@/actions/flights';
import { FlightCard } from '@/features/flights/FlightCard';

export const metadata: Metadata = {
  title: 'Search Results',
  description: 'Available flights matching your search criteria.',
};

export const dynamic = 'force-dynamic';

// Results are driven entirely by URL search params.
// This is a Server Component — no client bundle cost.
// Suspense handles the async search without blocking the page shell.

interface SearchParams {
  origin?:      string;
  destination?: string;
  date?:        string;
  passengers?:  string;
}

export default async function FlightsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const passengers = Number(searchParams.passengers) || 1;

  const { data: flights, error } = await searchFlights({
    origin:      searchParams.origin      ?? '',
    destination: searchParams.destination ?? '',
    date:        searchParams.date        ?? '',
    passengers,
  });

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-50">
          {searchParams.origin} → {searchParams.destination}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {searchParams.date} · {passengers} passenger{passengers !== 1 ? 's' : ''}
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-800 bg-red-950/40 p-6 text-center text-sm text-red-300">
          {error}
        </div>
      )}

      {!error && flights !== null && flights.length === 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <p className="text-slate-400">No flights found for this route and date.</p>
          <p className="mt-1 text-sm text-slate-600">Try a different date or nearby airports.</p>
        </div>
      )}

      {flights && flights.length > 0 && (
        <ul className="flex flex-col gap-4" role="list">
          {flights.map((flight) => (
            <li key={flight.id}>
              <FlightCard flight={flight} passengers={passengers} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
