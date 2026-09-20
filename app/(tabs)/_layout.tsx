import type { ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OneIcon, icons } from '@/src/ui/icons';
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
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(7, insets.bottom - 7) }]}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: p.dark ? '#1C1C1EF2' : '#F8F8FAF2',
            borderColor: p.dark ? '#FFFFFF18' : '#FFFFFFCC',
            shadowColor: '#000000'
          }
        ]}
      >
        <View pointerEvents="none" style={[styles.highlight, { backgroundColor: p.dark ? '#FFFFFF18' : '#FFFFFF' }]} />
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
              style={({ pressed }) => [styles.tab, { opacity: pressed ? 0.58 : 1 }]}
            >
              <View
                style={[
                  styles.iconWell,
                  focused && {
                    backgroundColor: p.surface,
                    borderColor: p.dark ? '#FFFFFF16' : '#FFFFFF',
                    shadowColor: '#000000'
                  }
                ]}
              >
                <OneIcon
                  name={tabIcon[routeName]}
                  size={focused ? 18 : 17}
                  color={focused ? p.label : p.tertiary}
                />
              </View>
              <Text style={[styles.label, { color: focused ? p.label : p.tertiary, fontWeight: focused ? '600' : '500' }]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16 },
  bar: {
    height: 64,
    borderRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 7,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowOpacity: 0.13,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7
  },
  highlight: { position: 'absolute', top: 0, left: 28, right: 28, height: StyleSheet.hairlineWidth },
  tab: { flex: 1, height: 54, alignItems: 'center', justifyContent: 'center', gap: 2 },
  iconWell: {
    width: 34,
    height: 32,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center'
  },
  label: { fontSize: 9.5, lineHeight: 12, letterSpacing: -0.05 }
});