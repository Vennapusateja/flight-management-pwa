'use client';

import React, { useState, type ReactNode } from 'react';

// Error handler wrapper for the SeatMap component.
// Provides an onError callback that renders an alert toast.
// Keeps the SeatMap component itself unaware of UI concerns.
export function SeatMapErrorHandler({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);

  const childWithError = React.isValidElement(children)
    ? React.cloneElement(children, {
        onError: (msg: string) => {
          setError(msg);
          setTimeout(() => setError(null), 5000);
        },
      } as any)
    : children;

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300
                     transition-opacity animate-in fade-in"
        >
          {error}
        </div>
      )}
      {childWithError as ReactNode}
    </div>
  );
}
