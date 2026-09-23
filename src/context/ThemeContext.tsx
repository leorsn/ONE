import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Appearance, Platform, useColorScheme } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { resolveTheme, type NeverTheme, type ThemePreference } from '@/src/theme/editions';
import { createThemeWriter, loadThemePreference } from '@/src/theme/preference';
export type { ThemePreference } from '@/src/theme/editions';

type ThemeContextValue = {
  theme: NeverTheme; reduceMotion: boolean; reduceTransparency: boolean; preference: ThemePreference; resolvedMode: 'light' | 'dark'; loaded: boolean;
  setPreference: (preference: ThemePreference) => Promise<void>;
};
const ThemeContext = createContext<ThemeContextValue | null>(null);
// A provider-level error boundary can still use the last resolved appearance.
let lastTheme = resolveTheme('platinum', 'light');
export function getLastResolvedTheme() { return lastTheme; }

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemMode = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [preference, setPreferenceState] = useState<ThemePreference>('platinum');
  const [loaded, setLoaded] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(true);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (active) setReduceMotion(value); }).catch(() => undefined);
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { active = false; listener.remove(); };
  }, []);
  const [reduceTransparency, setReduceTransparency] = useState(Platform.OS === 'ios');
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let active = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then((value) => { if (active) setReduceTransparency(value); }).catch(() => undefined);
    const listener = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduceTransparency);
    return () => { active = false; listener.remove(); };
  }, []);
  const [write] = useState(() => createThemeWriter(AsyncStorage));
  const revision = useRef(0);
  const committed = useRef<ThemePreference>('platinum');
  useEffect(() => {
    let mounted = true;
    const initialRevision = revision.current;
    void loadThemePreference(AsyncStorage).then((value) => {
      if (!mounted) return;
      if (revision.current === initialRevision) { committed.current = value; setPreferenceState(value); }
      setLoaded(true);
    });
    return () => { mounted = false; };
  }, []);
  const setPreference = useCallback(async (next: ThemePreference) => {
    const request = ++revision.current;
    setPreferenceState(next);
    try { await write(next); committed.current = next; }
    catch (error) {
      if (revision.current === request) setPreferenceState(committed.current);
      throw error;
    }
  }, [write]);
  const theme = resolveTheme(loaded ? preference : 'system', systemMode);
  useEffect(() => {
    if (!loaded || Platform.OS === 'web') return;
    Appearance.setColorScheme(preference === 'system' ? 'unspecified' : theme.mode);
    void SystemUI.setBackgroundColorAsync(theme.background).catch(() => undefined);
  }, [loaded, preference, theme.mode, theme.background]);
  useEffect(() => { lastTheme = theme; }, [theme]);
  const value = useMemo(() => ({ theme, reduceMotion, reduceTransparency, preference, resolvedMode: theme.mode, loaded, setPreference }), [theme, reduceMotion, reduceTransparency, preference, loaded, setPreference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useOptionalThemeContext() { return useContext(ThemeContext); }
export function useThemeContext() {
  const context = useOptionalThemeContext();
  if (!context) throw new Error('useThemeContext must be used inside ThemeProvider');
  return context;
}
