import { z } from 'zod';

// ============================================================
// Flight Search Schema
// ============================================================
export const flightSearchSchema = z.object({
  origin: z
    .string()
    .length(3, 'Must be a 3-letter IATA code')
    .toUpperCase(),
  destination: z
    .string()
    .length(3, 'Must be a 3-letter IATA code')
    .toUpperCase(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  passengers: z
    .number()
    .int()
    .min(1, 'At least 1 passenger')
    .max(9, 'Maximum 9 passengers'),
}).refine((data) => data.origin !== data.destination, {
  message: 'Origin and destination must be different',
  path: ['destination'],
});

export type FlightSearchInput = z.infer<typeof flightSearchSchema>;

// ============================================================
// Passenger Detail Schema
// ============================================================
export const passengerSchema = z.object({
  seat_code: z.string().min(2),
  title: z.enum(['Mr', 'Ms', 'Mrs', 'Dr']),
  first_name: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50),
  last_name: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50),
  // Optional: collected on checkout, never persisted to localStorage
  passport_number: z
    .string()
    .regex(/^[A-Z0-9]{6,9}$/, 'Invalid passport number format')
    .optional(),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
    .optional(),
});

export type PassengerInput = z.infer<typeof passengerSchema>;

// ============================================================
// Checkout Schema (multi-passenger)
// ============================================================
export const checkoutSchema = z.object({
  contact_email: z.string().email('Invalid email address'),
  passengers: z
    .array(passengerSchema)
    .min(1, 'At least one passenger required'),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ============================================================
// PNR Lookup Schema
// ============================================================
export const pnrLookupSchema = z.object({
  pnr: z
    .string()
    .length(6, 'PNR must be exactly 6 characters')
    .toUpperCase()
    .regex(/^[A-Z0-9]{6}$/, 'PNR must be alphanumeric uppercase'),
  email: z.string().email('Invalid email address'),
});

export type PNRLookupInput = z.infer<typeof pnrLookupSchema>;

// ============================================================
// Auth Schemas
// ============================================================
export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signupSchema = loginSchema.extend({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
