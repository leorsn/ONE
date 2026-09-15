import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  replacePassword,
  requestEmailPasswordReset,
  restoreAuthSession,
  signInWithEmail,
  signOutCurrentDevice,
  signUpWithEmail,
  subscribeToAuthState
} from '@/src/auth/service';
import { isSupabaseConfigured } from '@/src/supabase/client';
import { ensureOneProfile } from '@/src/supabase/profile';

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  configured: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  requestPasswordReset: (email: string) => Promise<string | null>;
  updatePassword: (password: string) => Promise<string | null>;
  signOut: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // The initial state already resolves loading=false when cloud auth is not
    // configured. Avoid a synchronous effect state update that can introduce a
    // render cascade in fallback builds.
    if (!isSupabaseConfigured) return;

    void restoreAuthSession().then(async (result) => {
      if (!mounted) return;
      setSession(result.session);
      setError(result.error);
      setLoading(false);
      if (result.session?.user.id) {
        try {
          await ensureOneProfile(result.session.user.id);
        } catch (profileError) {
          console.warn('ONE profile bootstrap deferred', profileError);
        }
      }
    });

    const unsubscribe = subscribeToAuthState((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setError(null);
      setLoading(false);
      if (nextSession?.user.id) {
        void ensureOneProfile(nextSession.user.id).catch((profileError) => {
          console.warn('ONE profile bootstrap deferred', profileError);
        });
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    const nextError = await signInWithEmail(email, password);
    setError(nextError);
    return nextError;
  }

  async function signUp(email: string, password: string) {
    const nextError = await signUpWithEmail(email, password);
    setError(nextError);
    return nextError;
  }

  async function requestPasswordReset(email: string) {
    const nextError = await requestEmailPasswordReset(email);
    setError(nextError);
    return nextError;
  }

  async function updatePassword(password: string) {
    const nextError = await replacePassword(password);
    setError(nextError);
    return nextError;
  }

  async function signOut() {
    const nextError = await signOutCurrentDevice();
    setError(nextError);
    return nextError;
  }

  const value = useMemo(
    () => ({
      session,
      loading,
      configured: isSupabaseConfigured,
      error,
      signIn,
      signUp,
      requestPasswordReset,
      updatePassword,
      signOut
    }),
    [session, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
