import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme/useTheme';
import { ThemeBackdrop } from './ThemeBackdrop';

/** Artwork belongs to the full route; only content observes safe-area insets. */
export function NeverScreen({ children, style, ...props }: ComponentProps<typeof SafeAreaView>) {
  const theme = useTheme();
  return <View style={[styles.root, { backgroundColor: theme.background }]}>
    <ThemeBackdrop theme={theme} />
    <SafeAreaView {...props} style={[styles.content, style, styles.transparent]}>
      {children}
    </SafeAreaView>
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, content: { flex: 1 }, transparent: { backgroundColor: 'transparent' }
});
