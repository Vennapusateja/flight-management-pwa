'use client';

import { cn } from '@/lib/utils';
import { isEffectivelyAvailable } from '@/lib/utils';
import type { Seat, SeatClass } from '@/types';

interface SeatButtonProps {
  seat:        Seat;
  isSelected:  boolean;
  isMySession: boolean;  // locked by this user's session
  onSelect:    (seatCode: string) => void;
  onDeselect:  (seatCode: string) => void;
}

const classColors: Record<SeatClass, string> = {
  First:    'data-[available]:border-amber-600    data-[available]:hover:bg-amber-900/40',
  Business: 'data-[available]:border-indigo-600   data-[available]:hover:bg-indigo-900/40',
  Economy:  'data-[available]:border-slate-600    data-[available]:hover:bg-slate-800/60',
};

export function SeatButton({
  seat,
  isSelected,
  isMySession,
  onSelect,
  onDeselect,
}: SeatButtonProps) {
  const available = isEffectivelyAvailable(seat.status, seat.locked_until);
  const isBooked  = seat.status === 'Booked';
  const isLocked  = !available && !isBooked;  // locked by another user

  const handleClick = () => {
    if (isBooked || isLocked) return;
    if (isSelected) {
      onDeselect(seat.seat_code);
    } else {
      onSelect(seat.seat_code);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isBooked || isLocked}
      aria-label={`Seat ${seat.seat_code} — ${seat.class}${isBooked ? ', booked' : isLocked ? ', held' : isSelected ? ', selected' : ', available'}`}
      aria-pressed={isSelected}
      data-available={available ? '' : undefined}
      className={cn(
        'h-8 w-8 rounded-t-lg border-2 text-[10px] font-bold transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950',
        // Booked: greyed out
        isBooked && 'cursor-not-allowed border-slate-800 bg-slate-800 text-slate-700',
        // Locked by another session
        isLocked && !isMySession && 'cursor-not-allowed border-yellow-800 bg-yellow-900/30 text-yellow-700',
        // My own lock (selected)
        isSelected && 'border-indigo-400 bg-indigo-600 text-white shadow-lg shadow-indigo-900/60 scale-110',
        // Available
        available && !isSelected && cn(
          'bg-transparent text-slate-400',
          classColors[seat.class]
        ),
      )}
    >
      {seat.seat_code}
    </button>
  );
}
