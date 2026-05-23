import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-900 bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          {/* Brand & Mission */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-md">
                <svg className="h-4 w-4 text-white transform -rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <span className="text-md font-bold tracking-tight text-white">
                SourceAsia<span className="text-indigo-400 font-medium">Air</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Experience the pinnacle of regional aviation with instant booking, premium cabin layouts, and real-time seat locks.
            </p>
            {/* Secure Badges */}
            <div className="flex items-center gap-3 pt-2">
              <div className="inline-flex items-center gap-1 rounded bg-slate-900 border border-slate-800 px-2 py-1 text-[10px] font-mono font-medium text-slate-400">
                <svg className="h-3 w-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.9L10 1.154l7.834 3.746A2 2 0 0119 6.72v4.918a9.003 9.003 0 01-5.32 8.15L10 21l-3.68-1.213A9.003 9.003 0 011 11.64V6.72a2 2 0 011.166-1.82zM10 5a1 1 0 00-.707.293l-3 3a1 1 0 001.414 1.414L9 8.414v5.172a1 1 0 102 0V8.414l1.293 1.293a1 1 0 101.414-1.414l-3-3A1 1 0 0010 5z" clipRule="evenodd" />
                </svg>
                SSL SECURED
              </div>
              <div className="inline-flex items-center gap-1 rounded bg-slate-900 border border-slate-800 px-2 py-1 text-[10px] font-mono font-medium text-slate-400">
                ★ STAR ALLIANCE
              </div>
            </div>
          </div>

          {/* Quick links columns */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Book & Manage</h3>
            <ul className="mt-4 space-y-2">
              {['Search Flights', 'Seat Map Selection', 'PNR Booking Retrieval', 'Refund Policy'].map((item) => (
                <li key={item}>
                  <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Support</h3>
            <ul className="mt-4 space-y-2">
              {['Help Center', 'Baggage Allowance', 'Flight Status', 'Travel Advisory'].map((item) => (
                <li key={item}>
                  <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Company</h3>
            <ul className="mt-4 space-y-2">
              {['About Us', 'Careers', 'Privacy Policy', 'Terms of Service'].map((item) => (
                <li key={item}>
                  <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="border-slate-900 my-8" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-[11px] text-slate-600">
            © {new Date().getFullYear()} SourceAsia Air Ltd. All rights reserved. Regional operations certified in strict compliance.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span>Powered by Next.js & Supabase SSG</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
