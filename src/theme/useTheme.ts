import { useThemeContext } from '@/src/context/ThemeContext';

export function useTheme() {
  return useThemeContext().theme;
}

export function useThemePreference() {
  const { preference, resolvedMode, loaded, setPreference, reduceTransparency } = useThemeContext();
  return { preference, resolvedMode, loaded, setPreference, reduceTransparency };
}
