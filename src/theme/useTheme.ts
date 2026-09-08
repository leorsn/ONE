import { useThemeContext } from '@/src/context/ThemeContext';

export function useTheme() {
  return useThemeContext().theme;
}

export function useThemePreference() {
  const { preference, resolvedMode, loaded, setPreference } = useThemeContext();
  return { preference, resolvedMode, loaded, setPreference };
}
