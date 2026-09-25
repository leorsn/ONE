import type { ComponentProps } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme/useTheme';
import { ThemeBackdrop } from './ThemeBackdrop';

/** One background and safe-area contract for core, utility and authentication routes. */
export function NeverScreen({ children, style, ...props }: ComponentProps<typeof SafeAreaView>) {
  const theme = useTheme();
  return <SafeAreaView {...props} style={[{ flex: 1, backgroundColor: theme.background }, style]}>
    <ThemeBackdrop theme={theme} />
    {children}
  </SafeAreaView>;
}
