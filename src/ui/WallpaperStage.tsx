import { createContext, memo, useContext, useLayoutEffect, useReducer, useState, type ReactNode } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { useThemeContext } from '@/src/context/ThemeContext';
import { resolveTheme, themes, themeIds } from '@/src/theme/editions';
import { materialWorldAssets } from '@/src/theme/materialWorlds';
import { initialWallpaperState, wallpaperId, wallpaperTransition } from '@/src/theme/wallpaperTransition';

const WallpaperStageContext = createContext(false);
export function useWallpaperStage() { return useContext(WallpaperStageContext); }

// Static sources, one full-size native Image per world, retained for the session.
// RN's default iOS decoded-image cache excludes large images; a prefetch alone
// would not keep these bitmaps ready. Mounted images are the decode/warm strategy.
const layers = [resolveTheme('system', 'light'), resolveTheme('system', 'dark'), ...themeIds.map(id => themes[id])]
  .map(theme => ({ id: wallpaperId(theme), theme, source: theme.artwork === false ? undefined : materialWorldAssets[theme.id] }));

export function WallpaperStage({ children }: { children: ReactNode }) {
  return <WallpaperStageContext.Provider value={true}>
    <View style={styles.root}>
      <ResidentWallpapers />
      {children}
    </View>
  </WallpaperStageContext.Provider>;
}

const ResidentWallpapers = memo(function ResidentWallpapers() {
  const { theme, reduceMotion } = useThemeContext();
  const [state, dispatch] = useReducer(wallpaperTransition, theme, initialWallpaperState);
  const requested = wallpaperId(theme);
  const [opacities] = useState(() => Object.fromEntries(layers.map(layer => [layer.id, new Animated.Value(layer.id === state.active ? 1 : 0)])));

  useLayoutEffect(() => { dispatch({ type: 'select', id: requested }); }, [requested]);
  useLayoutEffect(() => {
    // Only the incoming layer fades. The old image stays fully opaque below it:
    // fading both layers would expose the root canvas midway through the swap.
    for (const layer of layers) opacities[layer.id].setValue(layer.id === state.active ? 1 : 0);
    if (!state.incoming) return;
    const revision = state.revision;
    if (reduceMotion) {
      opacities[state.incoming].setValue(1);
      dispatch({ type: 'finished', revision });
      return;
    }
    const animation = Animated.timing(opacities[state.incoming], {
      toValue: 1, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true
    });
    animation.start(({ finished }) => { if (finished) dispatch({ type: 'finished', revision }); });
    return () => animation.stop();
  }, [state.active, state.incoming, state.revision, reduceMotion, opacities]);

  return <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
    style={[StyleSheet.absoluteFill, styles.clip]}>
    {layers.map(layer => <Animated.View key={layer.id} collapsable={false}
      style={[StyleSheet.absoluteFill, styles.clip, { backgroundColor: layer.theme.background, opacity: opacities[layer.id], zIndex: layer.id === state.incoming ? 1 : 0 }]}>
      {layer.source !== undefined ? <>
        <Image source={layer.source} resizeMode="cover" fadeDuration={0} accessible={false}
          onLoad={() => dispatch({ type: 'ready', id: layer.id })}
          onError={() => dispatch({ type: 'failed', id: layer.id })}
          style={[StyleSheet.absoluteFill, styles.image]} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: layer.theme.background, opacity: 0.08 }]} />
      </> : null}
    </Animated.View>)}
  </View>;
});

const styles = StyleSheet.create({
  root: { flex: 1 }, clip: { overflow: 'hidden' },
  image: { width: '100%', height: '100%' }
});
