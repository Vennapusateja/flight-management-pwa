'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useBookingStore } from '@/stores/bookingStore';
import { useFlightStore } from '@/stores/flightStore';
import { useUserStore } from '@/stores/userStore';
import { getCurrentUser, logout } from '@/actions/auth';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; full_name: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const links = [
    { label: 'Book Flights', href: '/' },
    { label: 'Manage Bookings', href: '/manage' },
    { label: 'Find by PNR', href: '/bookings/lookup' },
  ];

  // Fetch current session on mount / path change
  useEffect(() => {
    getCurrentUser().then(setUser);
  }, [pathname]);

  const handleSignOut = () => {
    startTransition(async () => {
      await logout();
      setUser(null);
      setMobileMenuOpen(false);
      // Reset stores on logout
      useBookingStore.getState().resetBookingFlow();
      useFlightStore.getState().resetFlightStore();
      useUserStore.getState().resetUserStore();
    });
  };

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-900 bg-slate-950/75 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Identity */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg">
            {/* Premium Airline SVG Logo */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-md shadow-indigo-500/20">
              <svg className="h-5 w-5 text-white transform -rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-white sm:block">
              SourceAsia<span className="text-indigo-400 font-medium">Air</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Global navigation">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md px-2.5 py-1',
                  pathname === link.href ? 'text-indigo-400' : 'text-slate-400'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Action Button */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {/* Profile initials badge */}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-950 border border-indigo-800 text-xs font-bold text-indigo-300">
                  {initials}
                </div>
                <span className="text-xs font-semibold text-slate-300">{user.full_name}</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSignOut}
                isLoading={isPending}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="secondary" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="shadow-lg shadow-indigo-500/10">
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-controls="mobile-menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open main menu</span>
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={cn('md:hidden border-t border-slate-900 bg-slate-950 px-4 py-4 space-y-3 transition-all duration-200', {
          block: mobileMenuOpen,
          hidden: !mobileMenuOpen,
        })}
        id="mobile-menu"
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              'block rounded-lg px-3 py-2 text-base font-medium transition-colors',
              pathname === link.href ? 'bg-indigo-950/40 text-indigo-400' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
            )}
          >
            {link.label}
          </Link>
        ))}
        <hr className="border-slate-900 my-2" />
        {user ? (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 px-3 py-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-950 border border-indigo-800 text-sm font-bold text-indigo-300">
                {initials}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-200">{user.full_name}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
            </div>
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleSignOut}
              isLoading={isPending}
            >
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="w-full">
              <Button variant="secondary" className="w-full">Sign In</Button>
            </Link>
            <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)} className="w-full">
              <Button className="w-full">Register</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

