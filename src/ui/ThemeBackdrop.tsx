import { memo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { NeverTheme, ThemeId } from '@/src/theme/editions';
import { NEVER_THEME_BACKGROUND_SPRITE } from '@/src/theme/themeBackgroundSprite';

const spriteOrder: ThemeId[] = ['monolith', 'aurora', 'archive', 'orbit', 'tactile', 'platinum'];

/**
 * Full-bleed raster atmosphere for each NEVER Material World.
 *
 * The six generated backgrounds are packed into a single horizontal JPEG sprite
 * in this exact order: Monolith, Aurora, Archive, Orbit, Tactile, Platinum.
 * Keeping them in one image avoids six separate native asset registrations while
 * still rendering real artwork instead of procedural View geometry.
 */
export const ThemeBackdrop = memo(function ThemeBackdrop({ theme, preview = false }: { theme: NeverTheme; preview?: boolean }) {
  const index = Math.max(0, spriteOrder.indexOf(theme.id));

  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, styles.clip]}
    >
      <Image
        source={{ uri: NEVER_THEME_BACKGROUND_SPRITE }}
        resizeMode="stretch"
        fadeDuration={0}
        style={[
          styles.sprite,
          {
            left: `${index * -100}%`,
            opacity: preview ? 0.98 : 1,
          },
        ]}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: theme.background,
            opacity: preview ? 0.035 : theme.mode === 'dark' ? 0.1 : 0.07,
          },
        ]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  sprite: {
    position: 'absolute',
    top: 0,
    width: '600%',
    height: '100%',
  },
});
