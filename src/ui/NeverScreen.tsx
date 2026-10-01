import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme/useTheme';
import { ThemeBackdrop } from './ThemeBackdrop';
import { useWallpaperStage } from './WallpaperStage';

/** Routes share the fixed root artwork; only content observes safe-area insets. */
export function NeverScreen({ children, style, ...props }: ComponentProps<typeof SafeAreaView>) {
  const theme = useTheme();
  const sharedWallpaper = useWallpaperStage();
  return <View style={[styles.root, { backgroundColor: sharedWallpaper ? 'transparent' : theme.background }]}>
    {!sharedWallpaper ? <ThemeBackdrop theme={theme} /> : null}
    <SafeAreaView {...props} style={[styles.content, style, styles.transparent]}>
      {children}
    </SafeAreaView>
  </View>;
}
const styles = StyleSheet.create({
  root: { flex: 1 }, content: { flex: 1 }, transparent: { backgroundColor: 'transparent' }
});
