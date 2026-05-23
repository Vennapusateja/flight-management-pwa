import React from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({
  title = 'No search results found',
  description = 'Try altering your departure date, selecting alternate airports, or searching a different route.',
  icon,
  action
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/30 p-12 text-center backdrop-blur-md">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-400">
        {icon ?? (
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
            />
          </svg>
        )}
      </div>

      <h3 className="mt-6 text-lg font-semibold text-slate-100">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-400 leading-relaxed">{description}</p>

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
