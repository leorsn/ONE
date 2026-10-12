import { memo, useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, useWindowDimensions, View } from 'react-native';
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
  cleanAmbient: { position: 'absolute' },
  cleanMain: { position: 'absolute' },
  cleanRim: { position: 'absolute' },
  // iOS Image prepends the bundled source dimensions. Insets alone
  // do not override those explicit dimensions in Yoga; size to the container.
  image: { width: '100%', height: '100%' },
});

/**
 * Resolution-independent clean backgrounds. These are native rounded surfaces,
 * not raster images: the contours are rendered at device pixel density.
 * Keep geometry outside the content column and do not animate asset loading.
 */
function CleanSilkBackdrop({ dark }: { dark: boolean }) {
  const { width, height } = useWindowDimensions();
  const scale = Math.max(width / 390, height / 844);
  const dimension = 1080 * scale;
  const left = width * 0.14;
  const top = height * -0.31;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.cleanAmbient, {
        backgroundColor: dark ? '#111113' : '#E8E3DD',
        width: dimension * 0.95,
        height: dimension * 0.95,
        left: -dimension * 0.48,
        top: height * 0.33,
        borderRadius: dimension,
      }]} />
      <View style={[styles.cleanMain, {
        backgroundColor: dark ? '#28282B' : '#FDFBF8',
        borderColor: dark ? '#6D6D70' : '#D4CDC5',
        width: dimension,
        height: dimension,
        left,
        top,
        borderRadius: dimension / 2,
        borderWidth: dark ? 1.5 : 1,
      }]} />
      <View style={[styles.cleanRim, {
        borderColor: dark ? '#D3D1CF' : '#FFFFFF',
        width: dimension + 4 * scale,
        height: dimension + 4 * scale,
        left: left - 2 * scale,
        top: top - 2 * scale,
        borderRadius: (dimension + 4 * scale) / 2,
        borderWidth: dark ? 0.7 : 0.8,
        opacity: dark ? 0.65 : 0.7,
      }]} />
    </View>
  );
}
