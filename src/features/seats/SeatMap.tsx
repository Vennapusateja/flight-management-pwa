'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSeatStore } from '@/stores/seatStore';
import { useBookingStore } from '@/stores/bookingStore';
import { useRealtimeSeats } from '@/hooks/useRealtimeSeats';
import { useSeatSelection } from '@/hooks/useSeatSelection';
import { useLockCountdown } from '@/hooks/useLockCountdown';
import { getOrCreateSessionId } from '@/lib/utils';
import { SeatButton } from './SeatButton';
import { Button } from '@/components/ui/Button';
import type { Seat } from '@/types';

interface SeatMapProps {
  flightId:     string;
  initialSeats: Seat[];
}

// ============================================================
// SeatMap
//
// This is the most complex component in the app. Responsibilities:
// 1. Initialize the seat store with server-fetched initial data
// 2. Subscribe to realtime changes via useRealtimeSeats
// 3. Render the cabin layout grouped by row
// 4. Handle seat selection (optimistic lock) via useSeatSelection
// 5. Show the lock countdown timer
//
// WHY IT'S A CLIENT COMPONENT:
// It needs Zustand stores, realtime, and click handlers.
// The parent page (Server Component) fetches the initial seat data
// and passes it as a prop — so first paint has real data, not empty.
// ============================================================
export function SeatMap({ flightId, initialSeats }: SeatMapProps) {
  const router = useRouter();
  const { initSeats, seats } = useSeatStore();
  const { selectedSeats }    = useBookingStore();
  const { selectSeat, deselectSeat } = useSeatSelection(flightId);
  const { minutes, seconds, isExpired, isActive } = useLockCountdown();
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const sessionId = getOrCreateSessionId();

  // Hydrate store with server data once on mount
  useEffect(() => {
    initSeats(initialSeats);
    setMounted(true);
  }, [initSeats, initialSeats]);

  // Subscribe to realtime updates
  useRealtimeSeats(flightId);

  const handleSelect = async (seatCode: string) => {
    setSelectionError(null);
    const { error } = await selectSeat(seatCode);
    if (error) setSelectionError(error);
  };

  // Group seats by row number for rendering
  const rows = useMemo(() => {
    const rowMap = new Map<number, Seat[]>();
    Array.from(seats.values()).forEach((seat) => {
      const rowNum = parseInt(seat.seat_code.slice(0, -1), 10);
      if (!rowMap.has(rowNum)) rowMap.set(rowNum, []);
      rowMap.get(rowNum)!.push(seat);
    });
    return Array.from(rowMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([row, rowSeats]) => ({
        row,
        seats: rowSeats.sort((a, b) => a.seat_code.localeCompare(b.seat_code)),
        class: rowSeats[0]?.class ?? 'Economy',
      }));
  }, [seats]);

  if (seats.size === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        No seats available for this flight.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Lock countdown */}
      {isActive && (
        <div className="rounded-full bg-indigo-950 border border-indigo-800 px-4 py-2 text-sm text-indigo-300">
          ⏱ Seat hold expires in{' '}
          <span className="font-mono font-bold">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>
      )}

      {isExpired && (
        <div role="alert" className="rounded-lg bg-red-950 border border-red-800 px-4 py-3 text-sm text-red-300">
          Your seat hold has expired. Please re-select your seats.
        </div>
      )}

      {selectionError && (
        <div role="alert" className="rounded-lg bg-red-950/80 border border-red-800 px-4 py-3 text-sm text-red-300">
          {selectionError}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
        <LegendItem color="border-amber-600"   label="First Class"  />
        <LegendItem color="border-indigo-600"  label="Business"     />
        <LegendItem color="border-slate-600"   label="Economy"      />
        <LegendItem color="bg-indigo-600"      label="Selected"     />
        <LegendItem color="bg-yellow-900/30 border-yellow-800" label="Held" />
        <LegendItem color="bg-slate-800"       label="Booked"       />
      </div>

      {/* Cabin layout */}
      <div className="w-full max-w-md overflow-x-auto">
        {/* Column headers */}
        <div className="mb-2 grid grid-cols-[2rem_repeat(3,2rem)_1rem_repeat(3,2rem)] gap-1 px-8 text-center">
          <div />
          {['A', 'B', 'C'].map((c) => (
            <div key={c} className="text-xs font-medium text-slate-500">{c}</div>
          ))}
          <div />
          {['D', 'E', 'F'].map((c) => (
            <div key={c} className="text-xs font-medium text-slate-500">{c}</div>
          ))}
        </div>

        {/* Rows */}
        <div className="flex flex-col gap-1">
          {rows.map(({ row, seats: rowSeats, class: seatClass }) => (
            <div
              key={row}
              className="grid grid-cols-[2rem_repeat(3,2rem)_1rem_repeat(3,2rem)] items-center gap-1"
            >
              {/* Row number */}
              <span className="text-center text-xs text-slate-600">{row}</span>

              {/* Left 3 seats (A, B, C) */}
              {rowSeats.slice(0, 3).map((seat) => (
                <SeatButton
                  key={seat.id}
                  seat={seat}
                  isSelected={mounted ? selectedSeats.includes(seat.seat_code) : false}
                  isMySession={mounted ? (seat.locked_by === sessionId) : false}
                  onSelect={handleSelect}
                  onDeselect={deselectSeat}
                />
              ))}

              {/* Aisle */}
              <div />

              {/* Right 3 seats (D, E, F) */}
              {rowSeats.slice(3, 6).map((seat) => (
                <SeatButton
                  key={seat.id}
                  seat={seat}
                  isSelected={mounted ? selectedSeats.includes(seat.seat_code) : false}
                  isMySession={mounted ? (seat.locked_by === sessionId) : false}
                  onSelect={handleSelect}
                  onDeselect={deselectSeat}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Premium Floating Booking Action Summary Bar */}
      {mounted && selectedSeats.length > 0 && (
        <div className="w-full max-w-md mt-8 p-5 rounded-2xl border border-indigo-900/40 bg-indigo-950/20 backdrop-blur-md flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-3 duration-250">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">Selected Seats</p>
            <p className="text-sm font-bold text-slate-100 font-mono">{selectedSeats.join(', ')}</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Holds expire in {minutes}m {seconds}s</p>
          </div>
          <Button
            size="sm"
            onClick={() => router.push(`/flights/${flightId}/checkout`)}
            className="shadow-lg shadow-indigo-500/20"
          >
            Proceed to Book →
          </Button>
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-4 w-4 rounded border ${color}`} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
