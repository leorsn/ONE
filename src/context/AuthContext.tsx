import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  isSupabaseConfigured,
  ONE_AUTH_CALLBACK_URL,
  ONE_PASSWORD_RESET_URL,
  supabase
} from '@/src/supabase/client';

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  requestPasswordReset: (email: string) => Promise<string | null>;
  updatePassword: (password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    if (!isSupabaseConfigured) return 'Cloud sync is not configured yet.';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }

  async function signUp(email: string, password: string) {
    if (!isSupabaseConfigured) return 'Cloud sync is not configured yet.';
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: ONE_AUTH_CALLBACK_URL
      }
    });
    return error?.message ?? null;
  }

  async function requestPasswordReset(email: string) {
    if (!isSupabaseConfigured) return 'Cloud sync is not configured yet.';
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: ONE_PASSWORD_RESET_URL
    });
    return error?.message ?? null;
  }

  async function updatePassword(password: string) {
    if (!isSupabaseConfigured) return 'Cloud sync is not configured yet.';
    const { error } = await supabase.auth.updateUser({ password });
    return error?.message ?? null;
  }

  async function signOut() {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  }

  const value = useMemo(
    () => ({
      session,
      loading,
      configured: isSupabaseConfigured,
      signIn,
      signUp,
      requestPasswordReset,
      updatePassword,
      signOut
    }),
    [session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
