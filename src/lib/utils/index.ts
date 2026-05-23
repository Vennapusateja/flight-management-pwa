import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// cn: merges Tailwind class strings safely — handles conflicts like
// `bg-red-500 bg-blue-500` → `bg-blue-500`
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format a price in INR (or any locale/currency)
export function formatPrice(
  amount: number,
  locale = 'en-IN',
  currency = 'INR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format a datetime string to a human-readable flight time
export function formatFlightTime(isoString: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(isoString));
}

// Format a date string to a readable flight date
export function formatFlightDate(isoString: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoString));
}

// Calculate flight duration from two ISO timestamps
export function calcDuration(departureIso: string, arrivalIso: string): string {
  const diffMs = new Date(arrivalIso).getTime() - new Date(departureIso).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m`;
}

// Returns true if a seat's lock has expired, treating it as available
export function isEffectivelyAvailable(
  status: 'Available' | 'Locked' | 'Booked',
  lockedUntil: string | null
): boolean {
  if (status === 'Available') return true;
  if (status === 'Booked') return false;
  // Locked: check expiry
  if (!lockedUntil) return true;
  return new Date(lockedUntil) <= new Date();
}

// Generate a stable anonymous session ID for unauthenticated seat locking
// Stored in sessionStorage (not localStorage) — cleared when tab closes
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return 'ssr-temp-session-id';
  }
  const key = 'sa_session_id';
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const newId = crypto.randomUUID();
  sessionStorage.setItem(key, newId);
  return newId;
}
