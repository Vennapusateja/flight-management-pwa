import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types';

// Server client: reads/writes cookies for auth session management.
// Use in Server Components, Route Handlers, and Server Actions.
// The cookie store is read-only in Server Components — mutations happen in
// middleware and Server Actions which have a mutable cookie context.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component context: cookie writes are silently ignored.
            // Auth session refresh happens in middleware instead.
          }
        },
      },
    }
  );
}
