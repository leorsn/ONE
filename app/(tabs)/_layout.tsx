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
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(6, insets.bottom - 8) }]}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: p.dark ? '#1C1C1EDC' : '#FFFFFFE8',
            borderColor: p.dark ? '#FFFFFF12' : '#FFFFFFF2',
            shadowColor: '#000000'
          }
        ]}
      >
        <View pointerEvents="none" style={[styles.highlight, { backgroundColor: p.dark ? '#FFFFFF12' : '#FFFFFF' }]} />
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
                    backgroundColor: p.dark ? '#2C2C2E' : '#F2F2F4',
                    borderColor: p.dark ? '#FFFFFF10' : '#FFFFFF',
                    shadowColor: '#000000'
                  }
                ]}
              >
                <OneIcon
                  name={tabIcon[routeName]}
                  size={focused ? 17.5 : 16.5}
                  color={focused ? p.label : p.secondary}
                />
              </View>
              <Text style={[styles.label, { color: focused ? p.label : p.secondary, fontWeight: focused ? '600' : '500' }]} numberOfLines={1}>
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
  wrap: { position: 'absolute', left: 14, right: 14 },
  bar: {
    height: 58,
    borderRadius: 25,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 6,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5
  },
  highlight: { position: 'absolute', top: 0, left: 24, right: 24, height: StyleSheet.hairlineWidth },
  tab: { flex: 1, height: 50, alignItems: 'center', justifyContent: 'center', gap: 1 },
  iconWell: {
    width: 32,
    height: 29,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center'
  },
  label: { fontSize: 9.2, lineHeight: 11, letterSpacing: -0.04 }
});