import type { ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme, useThemePreference } from '@/src/theme/useTheme';

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
  const theme = useTheme();
  return (
    <Tabs
      tabBar={(props) => <NeverTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: theme.background },
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
  const theme = useTheme();
  const { resolvedMode } = useThemePreference();
  const dark = resolvedMode === 'dark';
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.tabBarWrap, { bottom: Math.max(8, insets.bottom - 6) }]}>
      <View style={[styles.tabBar, {
        backgroundColor: dark ? '#171C21F2' : '#F8FAFBEF',
        borderColor: dark ? '#FFFFFF18' : '#FFFFFFE8',
        shadowColor: theme.shadow
      }]}>
        <View pointerEvents="none" style={[styles.topReflection, { backgroundColor: theme.reflection }]} />

        {state.routes.map((route) => {
          const index = state.routes.indexOf(route);
          const focused = state.index === index;
          const routeName = route.name as keyof typeof tabIcon;
          const label = tabLabel[routeName] ?? route.name;
          const options = descriptors[route.key]?.options;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options?.tabBarAccessibilityLabel ?? label}
              testID={options?.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={({ pressed }) => [
                styles.tabItem,
                focused && [styles.tabItemActive, {
                  backgroundColor: dark ? '#262D34' : '#E9EDF0',
                  borderColor: dark ? '#FFFFFF18' : '#FFFFFF'
                }],
                { opacity: pressed ? 0.62 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }
              ]}
            >
              <OneIcon name={tabIcon[routeName]} size={focused ? 17.5 : 16.5} color={focused ? theme.text : theme.textTertiary} />
              <Text style={[styles.tabLabel, { color: focused ? theme.text : theme.textTertiary }, focused && styles.tabLabelActive]} numberOfLines={1}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarWrap: { position: 'absolute', left: 18, right: 18 },
  tabBar: {
    height: 62,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 6,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    overflow: 'hidden',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6
  },
  topReflection: { position: 'absolute', top: 0, left: 28, right: 28, height: StyleSheet.hairlineWidth, opacity: 0.9 },
  tabItem: { flex: 1, height: 50, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabItemActive: { borderWidth: StyleSheet.hairlineWidth },
  tabLabel: { fontSize: 9.1, lineHeight: 11, fontWeight: '600', letterSpacing: -0.04 },
  tabLabelActive: { fontWeight: '800' }
});
