import React from 'react';

interface LoadingStateProps {
  message?: string;
  rows?: number;
}

export function LoadingState({ message = 'Loading flights...', rows = 3 }: LoadingStateProps) {
  return (
    <div className="w-full space-y-4" role="status" aria-live="polite">
      <div className="flex flex-col items-center justify-center py-10 text-center">
        {/* Animated premium spinner */}
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-950" />
          <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-300 animate-pulse">{message}</p>
      </div>

      {/* Elegant skeleton cards */}
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="w-full rounded-2xl border border-slate-800 bg-slate-900/30 p-6 backdrop-blur-md animate-pulse"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <div className="h-6 w-16 rounded bg-slate-800" />
                  <div className="mt-2 h-4 w-12 rounded bg-slate-800/60" />
                </div>
                <div className="h-4 w-8 rounded bg-slate-800/40" />
                <div>
                  <div className="h-6 w-16 rounded bg-slate-800" />
                  <div className="mt-2 h-4 w-12 rounded bg-slate-800/60" />
                </div>
              </div>
              <div className="flex items-center justify-between gap-6 sm:justify-end">
                <div className="text-right">
                  <div className="h-4 w-10 rounded bg-slate-800/60" />
                  <div className="mt-1 h-5 w-20 rounded bg-slate-800" />
                </div>
                <div className="h-10 w-28 rounded-lg bg-indigo-950/60 border border-indigo-800/50" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
