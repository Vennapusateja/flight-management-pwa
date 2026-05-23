import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface BadgeProps {
  children:  ReactNode;
  variant?:  'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const variantClasses = {
  default: 'bg-slate-800 text-slate-300 border border-slate-700',
  success: 'bg-emerald-950 text-emerald-400 border border-emerald-800',
  warning: 'bg-amber-950  text-amber-400  border border-amber-800',
  danger:  'bg-red-950    text-red-400    border border-red-800',
  info:    'bg-indigo-950 text-indigo-400 border border-indigo-800',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
