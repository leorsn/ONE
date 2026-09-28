import { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { NeverTheme } from '@/src/theme/editions';
import { materialWorldAssets } from '@/src/theme/materialWorlds';

/** One bundled image per world; native cover crops it without stretching. */
export const ThemeBackdrop = memo(function ThemeBackdrop({ theme, preview = false }: { theme: NeverTheme; preview?: boolean }) {
  return (
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, styles.clip, { backgroundColor: theme.background }]}>
      <Image key={theme.id} source={materialWorldAssets[theme.id]} resizeMode="cover" fadeDuration={0}
        accessible={false} style={[StyleSheet.absoluteFill, styles.image]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background, opacity: preview ? 0.025 : 0.08 }]} />
    </View>
  );
});
const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  // iOS Image prepends the bundled source dimensions (336 × 744). Insets alone
  // do not override those explicit dimensions in Yoga; size to the container.
  image: { width: '100%', height: '100%' }
});
