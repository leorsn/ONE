import { useEffect, useState, type ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OneIcon, icons } from '@/src/ui/icons';
import { NeverMaterial, selectionFeedback } from '@/src/ui/material';
import { neverControl } from '@/src/theme/tokens';
import { useTheme } from '@/src/theme/useTheme';
import { useNeverV5Palette } from '@/src/ui/appleV5';

const tabIcon = {
  index: icons.home,
  search: icons.search,
  calendar: icons.calendar,
  saved: icons.saved,
  settings: icons.settings
} as const;

const tabLabel = {
  index: 'Home',
  search: 'Search',
  calendar: 'Calendar',
  saved: 'Saved',
  settings: 'Settings'
} as const;

type NeverTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

export default function TabsLayout() {
  const p = useNeverV5Palette();
  return (
    <Tabs
      tabBar={(props) => <NeverTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: p.canvas },
        tabBarHideOnKeyboard: true
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="search" options={{ title: 'Search' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

function NeverTabBar({ state, descriptors, navigation }: NeverTabBarProps) {
  const p = useNeverV5Palette();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  if (keyboardVisible) return null;

  return (
    <View style={[styles.wrap, { pointerEvents: 'box-none', bottom: Math.max(7, insets.bottom - 7), left: Math.max(18, insets.left), right: Math.max(18, insets.right) }]}>
      <NeverMaterial role="navigation" style={styles.bar}>
        {theme.effects.reflection ? <View style={[styles.highlight, { pointerEvents: 'none', backgroundColor: p.reflection }]} /> : null}
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const routeName = route.name as keyof typeof tabIcon;
          const label = tabLabel[routeName] ?? route.name;
          const options = descriptors[route.key]?.options;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) { selectionFeedback(); navigation.navigate(route.name, route.params); }
          };
          const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options?.tabBarAccessibilityLabel ?? label}
              testID={options?.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [
                styles.tab,
                {
                  borderRadius: p.radius.chip,
                  backgroundColor: pressed ? p.fillSoft : 'transparent'
                }
              ]}
            >
              <View style={[styles.iconWell, { borderRadius: p.radius.icon }, focused && { backgroundColor: p.graphite, borderColor: p.dark ? p.glassBorder : p.graphite }]}>
                <OneIcon
                  name={tabIcon[routeName]}
                  size={focused ? 19 : 20}
                  color={focused ? p.onAccent : p.chrome}
                />
              </View>
              <Text
                style={[
                  styles.label,
                  { color: focused ? p.graphite : p.secondary, fontWeight: focused ? '700' : '500' }
                ]}
                numberOfLines={1} maxFontSizeMultiplier={1.3}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </NeverMaterial>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 18, right: 18 },
  bar: {
    width: '100%',
    maxWidth: 648,
    alignSelf: 'center',
    minHeight: neverControl.tabBar + 4,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 6,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden'
  },
  highlight: { position: 'absolute', left: 24, right: 24, top: 0, height: StyleSheet.hairlineWidth, opacity: 0.9 },
  tab: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 3 },
  iconWell: {
    width: 42,
    height: 30,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center'
  },
  label: { fontSize: 9.5, lineHeight: 12, letterSpacing: 0.02 }
});