import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types';

// Browser client: uses ANON key only.
// Safe to use in Client Components and hooks.
// Never use service role key here.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
