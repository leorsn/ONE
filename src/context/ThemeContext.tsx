import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme, type OneTheme } from '@/src/theme/colors';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = '@one/theme/v1';

type ThemeContextValue = {
  theme: OneTheme;
  preference: ThemePreference;
  resolvedMode: 'light' | 'dark';
  loaded: boolean;
  setPreference: (preference: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemMode = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!mounted) return;
        if (value === 'light' || value === 'dark' || value === 'system') {
          setPreferenceState(value);
        }
      })
      .finally(() => {
        if (mounted) setLoaded(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function setPreference(next: ThemePreference) {
    setPreferenceState(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  }

  const resolvedMode = preference === 'system' ? systemMode : preference;
  const theme = resolvedMode === 'dark' ? darkTheme : lightTheme;

  const value = useMemo(
    () => ({ theme, preference, resolvedMode, loaded, setPreference }),
    [theme, preference, resolvedMode, loaded]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeContext must be used inside ThemeProvider');
  return context;
}
