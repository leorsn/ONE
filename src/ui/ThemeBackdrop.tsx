import { memo, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { NeverTheme, ThemeId } from '@/src/theme/editions';
import { NEVER_THEME_BACKGROUND_SPRITE } from '@/src/theme/themeBackgroundSprite';
import { backgroundSpriteLayout } from '@/src/theme/backgroundLayout';

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
  const [size, setSize] = useState({ width: 0, height: 0 });
  const index = Math.max(0, spriteOrder.indexOf(theme.id));

  return (
    <View
      onLayout={({ nativeEvent: { layout } }) => setSize((previous) => previous.width === layout.width && previous.height === layout.height ? previous : { width: layout.width, height: layout.height })}
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, styles.clip]}
    >
      <Image
        source={{ uri: NEVER_THEME_BACKGROUND_SPRITE }}
        resizeMode="contain"
        fadeDuration={0}
        style={[
          styles.sprite,
          {
            ...backgroundSpriteLayout(size.width, size.height, index),
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
  },
});
