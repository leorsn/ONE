import { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { NeverTheme } from '@/src/theme/editions';
import { materialWorldAssets } from '@/src/theme/materialWorlds';

/** One bundled image per premium world; System deliberately renders only its neutral basic background. */
export const ThemeBackdrop = memo(function ThemeBackdrop({ theme, preview = false }: { theme: NeverTheme; preview?: boolean }) {
  return (
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, styles.clip, { backgroundColor: theme.background }]}>
      {theme.artwork !== false ? (
        <Image key={theme.id} source={materialWorldAssets[theme.id]} resizeMode="cover" fadeDuration={0}
          accessible={false} style={[StyleSheet.absoluteFill, styles.image]} />
      ) : null}
      {theme.artwork !== false ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background, opacity: preview ? 0.025 : 0.08 }]} />
      ) : null}
    </View>
  );
});
const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  // iOS Image prepends the bundled source dimensions. Insets alone
  // do not override those explicit dimensions in Yoga; size to the container.
  image: { width: '100%', height: '100%' }
});
