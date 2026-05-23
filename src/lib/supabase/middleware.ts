import { NextResponse, type NextRequest } from 'next/server';

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return !!(url && !url.includes('YOUR_PROJECT_REF') && key && !key.includes('YOUR_ANON_KEY'));
}

// Middleware runs on every request to refresh the Supabase auth session.
// This is required for SSR — without it, server components will see a stale/null session.
// The middleware MUST be able to set cookies (unlike server components).
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // If Supabase is not configured, skip auth session refresh entirely.
  // This prevents Edge Runtime crashes from importing @supabase/ssr
  // when environment variables are missing or contain placeholders.
  if (!isSupabaseConfigured()) {
    return supabaseResponse;
  }

  // Dynamic import so @supabase/ssr is only loaded when actually needed
  const { createServerClient } = await import('@supabase/ssr');

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options as Record<string, unknown>);
          });
        },
      },
    }
  );

  // Refresh session — this must be called before any auth checks
  await supabase.auth.getUser();

  return supabaseResponse;
}
