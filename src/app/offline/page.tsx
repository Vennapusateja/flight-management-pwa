import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'You are Offline - SourceAsia Air',
  description: 'Connection lost. You can still view cached bookings.',
};

export default function OfflinePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur-md shadow-2xl shadow-indigo-950/20">
        {/* Offline Icon Illustration */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-950 border border-indigo-800/80 mb-6 text-indigo-400">
          <svg className="h-10 w-10 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12h2m2 0h2m2 0h2m2 0h2m-4-6a9 9 0 011 18m-7.07-2.07c.07-.07.13-.13.2-.2M12 12a3 3 0 100-6 3 3 0 000 6z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.93 4.93l1.41 1.41M17.66 6.34l1.41-1.41M19.07 19.07l-1.41-1.41M6.34 17.66l-1.41 1.41" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-50 tracking-tight">Connection Lost</h1>
        <p className="mt-3 text-sm text-slate-400 leading-relaxed">
          It looks like you are currently offline. Don't worry! You can still access and view your active and last-cached bookings.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/manage"
            className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-600 hover:to-cyan-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Go to My Bookings
          </Link>
          
          <Link
            href="/"
            className="flex w-full items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-850 hover:text-slate-100 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Retry Connecting
          </Link>
        </div>
      </div>
    </main>
  );
}
