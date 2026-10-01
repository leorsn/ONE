import { memo, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import type { NeverTheme } from '@/src/theme/editions';
import { materialWorldAssets } from '@/src/theme/materialWorlds';

type ArtworkLayer = {
  theme: NeverTheme;
};

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
  const [visible, setVisible] = useState<ArtworkLayer | null>(() =>
    theme.artwork === false ? null : { theme },
  );
  const [incoming, setIncoming] = useState<ArtworkLayer | null>(null);
  const incomingOpacity = useRef(new Animated.Value(0)).current;
  const requestRevision = useRef(0);

  useEffect(() => {
    requestRevision.current += 1;
    incomingOpacity.stopAnimation();

    if (theme.artwork === false) {
      setIncoming(null);
      setVisible(null);
      incomingOpacity.setValue(0);
      return;
    }

    if (visible?.theme.id === theme.id) {
      setIncoming(null);
      incomingOpacity.setValue(0);
      return;
    }

    setIncoming({ theme });
    incomingOpacity.setValue(0);
  }, [theme, visible?.theme.id, incomingOpacity]);

  const handleIncomingLoad = (id: NeverTheme['id']) => {
    if (!incoming || incoming.theme.id !== id || theme.artwork === false || theme.id !== id) {
      return;
    }

    const revision = requestRevision.current;
    const next = incoming;

    if (preview) {
      setVisible(next);
      setIncoming(null);
      incomingOpacity.setValue(0);
      return;
    }

    Animated.timing(incomingOpacity, {
      toValue: 1,
      duration: 140,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished || revision !== requestRevision.current) return;
      setVisible(next);
      setIncoming(null);
      incomingOpacity.setValue(0);
    });
  };

  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, styles.clip, { backgroundColor: theme.background }]}
    >
      {visible ? <Artwork theme={visible.theme} preview={preview} /> : null}

      {incoming ? (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: incomingOpacity }]}>
          <Image
            source={materialWorldAssets[incoming.theme.id]}
            resizeMode="cover"
            fadeDuration={0}
            accessible={false}
            onLoad={() => handleIncomingLoad(incoming.theme.id)}
            onError={() => setIncoming(null)}
            style={[StyleSheet.absoluteFill, styles.image]}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: incoming.theme.background,
                opacity: preview ? 0.025 : 0.08,
              },
            ]}
          />
        </Animated.View>
      ) : null}
    </View>
  );
});

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
