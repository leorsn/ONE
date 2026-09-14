import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import {
  isSupabaseConfigured,
  ONE_AUTH_CALLBACK_URL,
  ONE_PASSWORD_RESET_URL,
  supabase
} from '@/src/supabase/client';

export type AuthListener = (event: AuthChangeEvent, session: Session | null) => void;

export async function restoreAuthSession() {
  if (!isSupabaseConfigured) return { session: null as Session | null, error: null as string | null };
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error: error?.message ?? null };
}

export function subscribeToAuthState(listener: AuthListener) {
  const { data } = supabase.auth.onAuthStateChange(listener);
  return () => data.subscription.unsubscribe();
}

export async function signInWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured) return 'Cloud sync is not configured yet.';
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error?.message ?? null;
}

export async function signUpWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured) return 'Cloud sync is not configured yet.';
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: ONE_AUTH_CALLBACK_URL }
  });
  return error?.message ?? null;
}

export async function requestEmailPasswordReset(email: string) {
  if (!isSupabaseConfigured) return 'Cloud sync is not configured yet.';
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: ONE_PASSWORD_RESET_URL
  });
  return error?.message ?? null;
}

export async function replacePassword(password: string) {
  if (!isSupabaseConfigured) return 'Cloud sync is not configured yet.';
  const { error } = await supabase.auth.updateUser({ password });
  return error?.message ?? null;
}

export async function signOutCurrentDevice() {
  if (!isSupabaseConfigured) return null;
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  return error?.message ?? null;
}
