import type { Flight, Seat, Booking, FlightStatus, SeatClass, SeatStatus } from '@/types';

// Determine storage directory based on environment.
// On Vercel (Linux), use /tmp. On local Windows dev, use the original path.
// If neither works, fall back to pure in-memory (no persistence).
function getMockDbPath(): { dir: string; file: string } | null {
  try {
    const fs = require('fs');
    const path = require('path');

    // Check if we're on Vercel / Linux
    if (process.platform !== 'win32') {
      const dir = '/tmp/mock_db';
      return { dir, file: path.join(dir, 'mock_db.json') };
    }

    // Local Windows dev
    const dir = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\21b492a5-d640-491c-b06e-411f04966c53\\scratch';
    return { dir, file: path.join(dir, 'mock_db.json') };
  } catch {
    return null; // fs/path not available — pure in-memory mode
  }
}

const DB_PATH = getMockDbPath();

interface PersistedState {
  flights: Record<string, Flight>;
  seatStates: Record<string, Record<string, { status: SeatStatus; locked_until: string | null; locked_by: string | null; booking_id: string | null }>>;
  bookings: Record<string, Booking>;
}

// Global cached in-memory state as a fallback
let cachedState: PersistedState | null = null;

function loadState(): PersistedState {
  if (DB_PATH) {
    try {
      const fs = require('fs');
      if (!fs.existsSync(DB_PATH.dir)) {
        fs.mkdirSync(DB_PATH.dir, { recursive: true });
      }
      if (fs.existsSync(DB_PATH.file)) {
        const data = fs.readFileSync(DB_PATH.file, 'utf8');
        const parsed = JSON.parse(data);
        cachedState = parsed;
        return parsed;
      }
    } catch (err) {
      console.error('Failed to load mock database from file, falling back to memory:', err);
    }
  }

  if (cachedState) return cachedState;

  cachedState = {
    flights: {},
    seatStates: {},
    bookings: {}
  };
  return cachedState;
}

function saveState(state: PersistedState) {
  cachedState = state;
  if (DB_PATH) {
    try {
      const fs = require('fs');
      if (!fs.existsSync(DB_PATH.dir)) {
        fs.mkdirSync(DB_PATH.dir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH.file, JSON.stringify(state, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to save mock database to file:', err);
    }
  }
}

// Generate the standard 180 seats for an Airbus A320
function generateSeatsForFlight(flightId: string, basePrice: number, savedStates: Record<string, any> = {}): Seat[] {
  const seats: Seat[] = [];
  const firstRows = [1, 2, 3];
  const firstCols = ['A', 'C', 'D', 'F'];
  const businessRows = [4, 5, 6, 7, 8];
  const economyRows = Array.from({ length: 22 }, (_, i) => i + 9); // Rows 9 to 30
  const standardCols = ['A', 'B', 'C', 'D', 'E', 'F'];

  // 1. First Class
  for (const row of firstRows) {
    for (const col of firstCols) {
      const code = `${row}${col}`;
      const state = savedStates[code] || {};
      seats.push({
        id: `${flightId}-${code}`,
        flight_id: flightId,
        seat_code: code,
        class: 'First',
        price_multiplier: 3.5,
        status: state.status || 'Available',
        locked_until: state.locked_until || null,
        locked_by: state.locked_by || null,
        booking_id: state.booking_id || null
      });
    }
  }

  // 2. Business Class
  for (const row of businessRows) {
    for (const col of standardCols) {
      const code = `${row}${col}`;
      const state = savedStates[code] || {};
      seats.push({
        id: `${flightId}-${code}`,
        flight_id: flightId,
        seat_code: code,
        class: 'Business',
        price_multiplier: 2.0,
        status: state.status || 'Available',
        locked_until: state.locked_until || null,
        locked_by: state.locked_by || null,
        booking_id: state.booking_id || null
      });
    }
  }

  // 3. Economy Class
  for (const row of economyRows) {
    for (const col of standardCols) {
      const code = `${row}${col}`;
      const state = savedStates[code] || {};
      // Seed a few booked seats based on simple deterministic patterns for realism
      let initialStatus: SeatStatus = 'Available';
      if (!state.status) {
        const seedValue = (row * 7 + col.charCodeAt(0)) % 10;
        if (seedValue === 1 || seedValue === 5) {
          initialStatus = 'Booked';
        }
      }
      seats.push({
        id: `${flightId}-${code}`,
        flight_id: flightId,
        seat_code: code,
        class: 'Economy',
        price_multiplier: 1.0,
        status: state.status || initialStatus,
        locked_until: state.locked_until || null,
        locked_by: state.locked_by || null,
        booking_id: state.booking_id || null
      });
    }
  }

  return seats;
}

// ============================================================
// parseFlightId
// Extracts origin, destination, flight number and date from the
// deterministic ID format: {ORG}{DST}{NUM}-{YYYYMMDD}
// e.g. "DELVTZ203-20260528" → { origin:'DEL', destination:'VTZ',
//                               number:'203', dateStr:'2026-05-28' }
// Used to reconstruct flights without needing persisted /tmp state
// (critical on Vercel where each serverless instance has its own /tmp)
// ============================================================
function parseFlightId(id: string): { origin: string; destination: string; number: string; dateStr: string } | null {
  const match = id.match(/^([A-Z]{3})([A-Z]{3})(\d{3})-(\d{8})$/);
  if (!match) return null;
  const origin      = match[1]!;
  const destination = match[2]!;
  const number      = match[3]!;
  const dateCompact = match[4]!;
  const dateStr = `${dateCompact.slice(0, 4)}-${dateCompact.slice(4, 6)}-${dateCompact.slice(6, 8)}`;
  return { origin, destination, number, dateStr };
}

// Generate flights for a route and date if not already generated
function generateRouteFlights(origin: string, destination: string, dateStr: string): Flight[] {
  const state = loadState();
  const dateKey = `${origin}-${destination}-${dateStr}`;

  // Find if we have already generated flights for this key
  const existingFlights = Object.values(state.flights).filter(
    (f) => f.origin === origin && f.destination === destination && f.departure_time.startsWith(dateStr)
  );

  if (existingFlights.length > 0) {
    return existingFlights;
  }

  // Generate 4 new flights
  const newFlights: Flight[] = [];
  const schedule = [
    { number: '101', time: '06:15', dur: 135, price: 4500 }, // 6:15 AM - 8:30 AM
    { number: '203', time: '11:45', dur: 140, price: 3900 }, // 11:45 AM - 2:05 PM
    { number: '305', time: '16:30', dur: 135, price: 5200 }, // 4:30 PM - 6:45 PM
    { number: '407', time: '21:00', dur: 145, price: 3400 }  // 9:00 PM - 11:25 PM
  ];

  for (const s of schedule) {
    const flightId = `${origin}${destination}${s.number}-${dateStr.replace(/-/g, '')}`;
    const [depHours, depMins] = s.time.split(':').map(Number);
    const departure = new Date(`${dateStr}T${s.time}:00.000Z`);
    const arrival = new Date(departure.getTime() + s.dur * 60 * 1000);

    const flight: Flight = {
      id: flightId,
      flight_number: `SA${s.number}`,
      origin,
      destination,
      departure_time: departure.toISOString(),
      arrival_time: arrival.toISOString(),
      base_price: s.price,
      aircraft_type: 'A320',
      status: 'Scheduled',
      created_at: new Date().toISOString()
    };

    state.flights[flightId] = flight;
    newFlights.push(flight);
  }

  saveState(state);
  return newFlights;
}

export const mockDb = {
  searchFlights(origin: string, destination: string, dateStr: string): Flight[] {
    return generateRouteFlights(origin.toUpperCase(), destination.toUpperCase(), dateStr);
  },

  getFlightById(id: string): Flight | null {
    // 1. Try persisted state first (local dev or same Vercel instance)
    const state = loadState();
    if (state.flights[id]) return state.flights[id];

    // 2. Reconstruct from deterministic ID — handles Vercel ephemeral /tmp
    //    where the flight was generated in a different function instance.
    const parsed = parseFlightId(id);
    if (!parsed) return null;

    // Re-running generateRouteFlights will persist all 4 flights for the
    // route/date, so subsequent lookups within this instance are cached.
    const flights = generateRouteFlights(parsed.origin, parsed.destination, parsed.dateStr);
    return flights.find((f) => f.id === id) ?? null;
  },

  getSeatsForFlight(flightId: string): Seat[] {
    // Resolve the flight (handles ephemeral /tmp via ID reconstruction)
    const flight = this.getFlightById(flightId);
    if (!flight) return [];

    const state = loadState();
    const savedStates = state.seatStates[flightId] || {};
    return generateSeatsForFlight(flightId, flight.base_price, savedStates);
  },

  lockSeat(flightId: string, seatCode: string, sessionId: string): { success: boolean; error?: string; locked_until?: string } {
    const state = loadState();
    const seats = this.getSeatsForFlight(flightId);
    const seat = seats.find((s) => s.seat_code === seatCode);

    if (!seat) {
      return { success: false, error: 'SEAT_NOT_FOUND' };
    }

    const now = new Date();
    const isLocked = seat.status === 'Locked' && seat.locked_until && new Date(seat.locked_until) > now;

    if (seat.status === 'Booked') {
      return { success: false, error: 'SEAT_ALREADY_BOOKED' };
    }

    if (isLocked && seat.locked_by !== sessionId) {
      return { success: false, error: 'SEAT_LOCKED' };
    }

    // Grant or extend lock for 5 minutes
    const lockedUntil = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
    if (!state.seatStates[flightId]) {
      state.seatStates[flightId] = {};
    }

    state.seatStates[flightId][seatCode] = {
      status: 'Locked',
      locked_until: lockedUntil,
      locked_by: sessionId,
      booking_id: null
    };

    saveState(state);
    return { success: true, locked_until: lockedUntil };
  },

  releaseSeatLock(flightId: string, seatCode: string, sessionId: string): { success: boolean } {
    const state = loadState();
    const saved = state.seatStates[flightId]?.[seatCode];

    if (saved && saved.status === 'Locked' && saved.locked_by === sessionId) {
      if (state.seatStates[flightId]) {
        delete state.seatStates[flightId][seatCode];
      }
      saveState(state);
    }

    return { success: true };
  },

  reserveSeats(
    flightId: string,
    seatCodes: string[],
    sessionId: string,
    userId: string | null,
    contactEmail: string,
    totalPrice: number,
    passengerDetails: any[]
  ): { success: boolean; booking_id?: string; pnr?: string; error?: string } {
    const state = loadState();
    const flight = state.flights[flightId];

    if (!flight) {
      return { success: false, error: 'Flight not found.' };
    }

    // Verify all seats are either available or locked by this session
    const seats = this.getSeatsForFlight(flightId);
    const now = new Date();

    for (const code of seatCodes) {
      const seat = seats.find((s) => s.seat_code === code);
      if (!seat) {
        return { success: false, error: `Seat ${code} not found.` };
      }
      if (seat.status === 'Booked') {
        return { success: false, error: `Seat ${code} is already booked.` };
      }
      const isLockedByOthers =
        seat.status === 'Locked' && seat.locked_until && new Date(seat.locked_until) > now && seat.locked_by !== sessionId;
      if (isLockedByOthers) {
        return { success: false, error: `Seat ${code} is held by another user.` };
      }
    }

    // Generate atomic booking details
    const bookingId = `book-${Math.random().toString(36).substring(2, 11)}`;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    let pnr = '';
    // Elegant 6-character PNR format (e.g. SA7A3D)
    for (let i = 0; i < 6; i++) {
      if (i < 2) pnr += chars[Math.floor(Math.random() * chars.length)];
      else if (i < 4) pnr += nums[Math.floor(Math.random() * nums.length)];
      else pnr += chars[Math.floor(Math.random() * chars.length)];
    }

    const booking: Booking = {
      id: bookingId,
      user_id: userId,
      pnr,
      status: 'Confirmed',
      total_price: totalPrice,
      passenger_details: passengerDetails,
      contact_email: contactEmail.toLowerCase(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Store the booking
    state.bookings[pnr] = booking;

    // Persist seat states as Booked
    if (!state.seatStates[flightId]) {
      state.seatStates[flightId] = {};
    }

    for (const code of seatCodes) {
      state.seatStates[flightId][code] = {
        status: 'Booked',
        locked_until: null,
        locked_by: null,
        booking_id: bookingId
      };
    }

    saveState(state);
    return { success: true, booking_id: bookingId, pnr };
  },

  getBookingByPnr(pnr: string, email: string): Booking | null {
    const state = loadState();
    const booking = state.bookings[pnr.toUpperCase()];
    if (booking && booking.contact_email.toLowerCase() === email.toLowerCase()) {
      return booking;
    }
    return null;
  },

  cancelBooking(bookingId: string, userId: string | null): { success: boolean; error?: string } {
    const state = loadState();
    // Find the booking record
    const booking = Object.values(state.bookings).find((b) => b.id === bookingId);
    if (!booking) {
      return { success: false, error: 'Booking not found.' };
    }

    // Cancel booking record
    booking.status = 'Cancelled';
    booking.updated_at = new Date().toISOString();

    // Release all booked seats for this booking ID
    for (const flightId of Object.keys(state.seatStates)) {
      const seats = state.seatStates[flightId];
      if (seats) {
        for (const code of Object.keys(seats)) {
          if (seats[code]?.booking_id === bookingId) {
            delete seats[code];
          }
        }
      }
    }

    saveState(state);
    return { success: true };
  }
};
