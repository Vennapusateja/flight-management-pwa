# ✈️ SourceAsia Air — Flight Management Web App (PWA)

SourceAsia Air is a production-grade, highly responsive flight booking and management progressive web application. Designed for a seamless and immersive user experience, it features an end-to-end flight booking flow, custom airport hub selector, interactive seat maps with atomic locking mechanisms, booking cancellation & reschedule systems, and installable PWA offline capability.

---

## 🚀 Key Technical Highlights & Features

- **Next.js 14 App Router**: Leveraging Server Components for initial rendering and server-side data fetching combined with Client Components for dynamic client-side interactions.
- **Supabase Realtime Backend**: Implements PostgreSQL tables, Row-Level Security (RLS) policies, atomic seat-hold RPC functions, and database-level constraints (blocking late cancellations).
- **Zustand with Persistence**: Features persistent stores that cache search queries and active booking contexts, automatically filtering out sensitive PII details (like passport numbers) from browser storage.
- **Installable PWA**: Built with `next-pwa`, featuring a custom-designed, floating mobile installation banner, service worker configurations, and an offline fallback view.
- **Developer Sandbox Mode**: Features a robust, high-fidelity local mock database layer (`src/lib/mockDb.ts`) that runs automatically when Supabase environment keys are not configured, providing a zero-dependency sandbox.

---

## 📦 Project Directory Structure

```
├── public/                 # Static assets, manifests, service workers, and icons
├── src/
│   ├── actions/            # Secure Server Actions (flights, bookings, auth)
│   ├── app/                # Next.js App Router folders, dynamic routes, and page files
│   ├── components/         # Shared global design system components (Inputs, Comboboxes, Layouts)
│   ├── data/               # Static dataset configurations (Indian airport hubs list)
│   ├── features/           # Feature-scoped components (Seat maps, Checkout forms, Search flows)
│   ├── hooks/              # Custom React hooks (realtime sync, lock countdowns)
│   ├── lib/                # Database configurations, validations (Zod), and mock sandbox engines
│   ├── stores/             # Zustand stores (useBookingStore, useFlightStore, useUserStore)
│   └── types/              # Unified TypeScript interface definitions
└── supabase/
    └── migrations/         # Production-ready PostgreSQL schemas, RLS policies, seeds, and RPC scripts
```

---

## 🛠️ Local Setup & Deployment

Follow these quick steps to launch the application locally.

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher.
- **Package Manager**: `npm` or `yarn`.

### 2. Setup Environment Variables
Duplicate the template configuration from `.env.example` in the root folder to `.env.local`:
```bash
cp .env.example .env.local
```
Configure your keys inside `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-private-service-role-key
```
> 💡 **Developer Sandbox Fallback**: If you leave the environment values unset (e.g. pointing to `YOUR_PROJECT_REF`), the application automatically initiates its local developer mock sandbox, allowing you to fully test all booking, seats, login, PNR lookup, cancellation, and rescheduling processes completely offline!

### 3. Install Dependencies & Build
Install project dependencies:
```bash
npm install
```

Start the hot-reloading development server:
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

To verify a clean production compilation, run:
```bash
npm run build
```

---

## 💾 Database Schema & migrations (Supabase)

All database setup files are located under `/supabase/migrations`. If configuring a real Supabase instance, run these migrations in order:

1. **`001_initial_schema.sql`**  
   Creates standard PostgreSQL tables with strict constraints:
   - `flights`: base_price, locations, departure, arrival timestamps.
   - `seats`: mapped to flight, seat code, class zones (Economy, Business, First).
   - `bookings`: containing user ID mapping, PNR codes, status.
   - `passengers` & `reschedules`: dynamic passenger details.
2. **`002_rpc_functions.sql`**  
   Maintains database consistency:
   - **`reserve_seats`**: RPC function executing transaction-level holds to eliminate double-booking race conditions.
   - **`cancel_booking`**: Safely releases seats and marks bookings cancelled atomically.
   - **2-Hour Constraint Trigger**: Enforces that cancellations requested within 2 hours of departure are blocked and rejected database-side.
3. **`003_rls_policies.sql`**  
   Secures passenger data by enabling Row-Level Security (RLS) on all tables, ensuring users can only read, write, or modify their own bookings.
4. **`004_seed_data.sql`**  
   Seeds the tables with flight itineraries and seeds an Auth user profile.

---

## 🔒 Pre-Seeded Test Credentials

To log into the production backend, use the pre-configured passenger account credentials:
- **Email**: `passenger@sourceasia.com`
- **Password**: `password123`

---

## 🧠 Zustand Architecture & Security Filtering

To manage state across multi-page booking flows while keeping storage lightweight and secure, we designed three specialized stores:

### 1. `useFlightStore`
- **Responsibilities**: Manages active search queries, selected flight contexts, active seat arrays, current booking steps, and passenger form states.
- **Persistence**: Persists queries and in-progress steps to survive accidental browser tab closes.
- **PII Filtering (partialize)**: Employs a custom `partialize` configuration to automatically purge and exclude sensitive passenger data (like `passport_number` and `date_of_birth`) before writing to `localStorage`. Only non-sensitive parameters survive.

### 2. `useUserStore`
- **Responsibilities**: Keeps trace of Supabase authentication session tokens and offline-cached active bookings.
- **Persistence**: Persists **only the auth session token** under partialization, leaving bulky caches in-memory.

### 3. `useBookingStore`
- **Responsibilities**: Handles active seat maps and locks.
- **Optimistic State Updates**: Triggers immediate seat status selection changes on click in the local store, improving UI speed before database actions confirm.
- **Global Reset Integration**: Integrates a centralized store reset function triggered immediately upon successful **sign-out** or **booking cancellation** to keep the browser clean.

---

## 📶 Progressive Web App (PWA) Configurations

- **Installer Banner**: A styled, non-intrusive mobile banner at the bottom of the layout, which captures the `beforeinstallprompt` event and allows one-tap home screen installations.
- **Offline Fallback**: Serves a custom `/offline` page when the user loses network connections, prompting them to view their cached bookings which remain visible offline.
- **Caching Strategies**: Pre-caches static UI shell files (`CacheFirst`) while maintaining fresh flight search outcomes through standard `StaleWhileRevalidate` parameters.
