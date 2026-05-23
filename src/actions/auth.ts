'use server';

import { createClient } from '@/lib/supabase/server';
import { loginSchema, signupSchema } from '@/lib/validations';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!(url && !url.includes('YOUR_PROJECT_REF'));
}

export async function getCurrentUser(): Promise<{ email: string; full_name: string } | null> {
  if (!isSupabaseConfigured()) {
    const cookieStore = await cookies();
    const session = cookieStore.get('mock-user-session')?.value;
    if (session) {
      return { email: session, full_name: 'Developer Mode' };
    }
    return null;
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return {
        email: user.email ?? '',
        full_name: user.user_metadata?.full_name || 'Passenger',
      };
    }
  } catch (e) {
    console.error('[getCurrentUser]', e);
  }
  return null;
}

export async function login(rawInput: unknown) {
  const parsed = loginSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid credentials' };
  }

  if (!isSupabaseConfigured()) {
    console.warn('[login] Supabase not configured. Simulating successful developer login.');
    const cookieStore = await cookies();
    cookieStore.set('mock-user-session', parsed.data.email, { path: '/' });
    redirect('/manage');
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email:    parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // Don't reveal if email exists — use a generic message
    return { error: 'Invalid email or password.' };
  }

  redirect('/manage');
}

export async function signup(rawInput: unknown) {
  const parsed = signupSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid signup data' };
  }

  if (!isSupabaseConfigured()) {
    console.warn('[signup] Supabase not configured. Simulating successful developer signup.');
    const cookieStore = await cookies();
    cookieStore.set('mock-user-session', parsed.data.email, { path: '/' });
    redirect('/manage');
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email:    parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/auth/verify-email');
}

export async function logout() {
  if (!isSupabaseConfigured()) {
    console.warn('[logout] Supabase not configured. Simulating successful developer logout.');
    const cookieStore = await cookies();
    cookieStore.delete('mock-user-session');
    redirect('/');
    return;
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

