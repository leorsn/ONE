import { memo, useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import type { NeverTheme } from '@/src/theme/editions';
import { materialWorldAssets } from '@/src/theme/materialWorlds';

/**
 * One bundled image per premium world; System deliberately renders only its
 * neutral basic background. Premium artwork uses a two-layer handoff so the
 * currently visible wallpaper stays mounted until the replacement has loaded.
 */
export const ThemeBackdrop = memo(function ThemeBackdrop({
  theme,
  preview = false,
}: {
  theme: NeverTheme;
  preview?: boolean;
}) {
  const clean = theme.id === 'platinum' || theme.id === 'monolith';
  const [visibleTheme, setVisibleTheme] = useState<NeverTheme | null>(() =>
    theme.artwork === false || theme.id === 'platinum' || theme.id === 'monolith' ? null : theme,
  );

  const incomingTheme = useMemo(() => {
    if (theme.artwork === false || clean) return null;
    if (visibleTheme?.id === theme.id) return null;
    return theme;
  }, [theme, visibleTheme?.id, clean]);

  const showVisible = theme.artwork !== false && !clean ? visibleTheme : null;

  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, styles.clip, { backgroundColor: theme.background }]}
    >
      {clean ? <CleanSilkBackdrop dark={theme.mode === 'dark'} /> : null}
      {showVisible ? <Artwork theme={showVisible} preview={preview} /> : null}

      {incomingTheme ? (
        <IncomingArtwork
          key={incomingTheme.id}
          theme={incomingTheme}
          preview={preview}
          onReady={(loadedTheme) => {
            if (!clean && theme.artwork !== false && theme.id === loadedTheme.id) {
              setVisibleTheme(loadedTheme);
            }
          }}
        />
      ) : null}
    </View>
  );
});

function IncomingArtwork({
  theme,
  preview,
  onReady,
}: {
  theme: NeverTheme;
  preview: boolean;
  onReady: (theme: NeverTheme) => void;
}) {
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    return () => opacity.stopAnimation();
  }, [opacity]);

  const handleLoad = () => {
    if (preview) {
      onReady(theme);
      return;
    }

    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onReady(theme);
    });
  };

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
      <Image
        source={materialWorldAssets[theme.id]}
        resizeMode="cover"
        fadeDuration={0}
        accessible={false}
        onLoad={handleLoad}
        style={[StyleSheet.absoluteFill, styles.image]}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: theme.background,
            opacity: preview ? 0.025 : 0.08,
          },
        ]}
      />
    </Animated.View>
  );
}

function Artwork({ theme, preview }: { theme: NeverTheme; preview: boolean }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Image
        source={materialWorldAssets[theme.id]}
        resizeMode="cover"
        fadeDuration={0}
        accessible={false}
        style={[StyleSheet.absoluteFill, styles.image]}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: theme.background,
            opacity: preview ? 0.025 : 0.08,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  // iOS Image prepends the bundled source dimensions. Insets alone
  // do not override those explicit dimensions in Yoga; size to the container.
  image: { width: '100%', height: '100%' },
});

/** Bundled, offline-ready final Pearl Light and Graphite Dark artwork.
 * Render a single image with no animated blank frame when switching themes.
 */
function CleanSilkBackdrop({ dark }: { dark: boolean }) {
  return (
    <Image
      source={dark ? require('../../assets/clean/never-dark.jpg') : require('../../assets/clean/never-light.jpg')}
      resizeMode="cover"
      fadeDuration={0}
      accessible={false}
      style={[StyleSheet.absoluteFill, styles.image]}
    />
  );
}
