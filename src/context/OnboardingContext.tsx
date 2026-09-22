import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = '@one/onboarding/v1';

type OnboardingContextValue = {
  loaded: boolean;
  completed: boolean;
  complete: () => Promise<void>;
  reset: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (mounted) setCompleted(value === 'done');
      })
      .catch(() => { /* Keep the safe initial preference if local storage is unavailable. */ })
      .finally(() => {
        if (mounted) setLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function complete() {
    await AsyncStorage.setItem(STORAGE_KEY, 'done');
    setCompleted(true);
  }

  async function reset() {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setCompleted(false);
  }

  const value = useMemo(
    () => ({ loaded, completed, complete, reset }),
    [loaded, completed]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used inside OnboardingProvider');
  return context;
}
