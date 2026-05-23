import type { Metadata } from 'next';
import Link from 'next/link';
import { FlightSearchForm } from '@/features/flights/FlightSearchForm';

export const metadata: Metadata = {
  title: 'SourceAsia Air — Book Flights',
  description: 'Search and book flights instantly with real-time seat selection.',
};

export default function HomePage() {
  const valueProps = [
    {
      title: 'Real-Time Cabin Layouts',
      desc: 'Visualize seat rows, cabin configurations (A320), and pick exactly where you sit.',
      icon: (
        <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      )
    },
    {
      title: '5-Minute Atomic Holds',
      desc: 'Locks your selected seats atomically so no other traveler can double-book them.',
      icon: (
        <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    },
    {
      title: 'Instant PNR Generation',
      desc: 'Obtain your structured 6-character booking reference code instantly upon checkout.',
      icon: (
        <svg className="h-5 w-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <main className="flex flex-1 flex-col">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center px-4 py-20 text-center lg:py-28 overflow-hidden">
        {/* Advanced radial background styling for depth */}
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-slate-950 to-slate-950" />
          <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-600/5 blur-[120px]" />
        </div>

        <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-indigo-800/40 bg-indigo-950/30 px-3.5 py-1 text-xs font-semibold text-indigo-300">
          <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Real-time seat holds and secure booking
        </div>

        <h1 className="mb-3 text-4xl font-bold tracking-tight text-slate-50 sm:text-5xl lg:text-6xl">
          Regional Flights,
          <span className="block sm:inline bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            {' '}Redefined
          </span>
        </h1>

        <p className="mb-10 max-w-xl text-md text-slate-400 leading-relaxed">
          Search regional flights, view interactive cabin grids, lock your seats instantly, and complete your reservation.
        </p>

        {/* Polished, highly readable search card */}
        <div className="w-full max-w-4xl rounded-2xl border border-slate-900 bg-slate-950/50 p-5 shadow-2xl backdrop-blur-md">
          <FlightSearchForm />
        </div>
      </section>

      {/* Trust & Features Section */}
      <section className="mx-auto w-full max-w-5xl px-4 pb-20">
        <div className="grid gap-6 sm:grid-cols-3">
          {valueProps.map((prop, idx) => (
            <div key={idx} className="rounded-xl border border-slate-900 bg-slate-950/30 p-5 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-950/40 border border-indigo-900/30">
                {prop.icon}
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-200">{prop.title}</h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{prop.desc}</p>
            </div>
          ))}
        </div>

        {/* Quick lookups */}
        <div className="mt-12 text-center border-t border-slate-900 pt-8">
          <p className="text-xs text-slate-500 mb-4 font-medium">Manage an existing trip?</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/manage"
              className="rounded-full border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-900 hover:text-white"
            >
              My Trips Dashboard
            </Link>
            <Link
              href="/bookings/lookup"
              className="rounded-full border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-900 hover:text-white"
            >
              Verify PNR Reference
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
