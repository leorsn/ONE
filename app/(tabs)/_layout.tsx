import type { ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

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
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.tabBarWrap,
        { bottom: Math.max(9, insets.bottom - 5) }
      ]}
    >
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.glassStrong,
            borderColor: theme.glassBorder,
            shadowColor: theme.shadow
          }
        ]}
      >
        <View pointerEvents="none" style={[styles.reflection, { backgroundColor: theme.reflection }]} />
        <View pointerEvents="none" style={[styles.lowerReflection, { backgroundColor: theme.reflection }]} />
        <View pointerEvents="none" style={[styles.centerRail, { backgroundColor: theme.platinum }]} />

        {state.routes.map((route) => {
          const index = state.routes.indexOf(route);
          const focused = state.index === index;
          const routeName = route.name as keyof typeof tabIcon;
          const label = tabLabel[routeName] ?? route.name;
          const options = descriptors[route.key]?.options;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key
            });
          };

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
                styles.tabItem,
                focused && [
                  styles.tabItemActive,
                  {
                    backgroundColor: theme.platinumSoft,
                    borderColor: theme.glassBorder,
                    shadowColor: theme.shadow
                  }
                ],
                {
                  opacity: pressed ? 0.62 : 1,
                  transform: [{ scale: pressed ? 0.965 : focused ? 1.015 : 1 }]
                }
              ]}
            >
              {focused ? <View style={[styles.activeRail, { backgroundColor: theme.chrome }]} /> : null}
              <View style={[styles.iconWell, focused && { backgroundColor: theme.glassStrong, borderColor: theme.glassBorder }]}>
                <OneIcon
                  name={tabIcon[routeName]}
                  size={focused ? 18.5 : 17}
                  color={focused ? theme.chrome : theme.textTertiary}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  focused ? styles.tabLabelActive : styles.tabLabelInactive,
                  { color: focused ? theme.text : theme.textTertiary }
                ]}
                numberOfLines={1}
              >
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
  tabBarWrap: {
    position: 'absolute',
    left: 14,
    right: 14
  },
  tabBar: {
    height: 70,
    borderRadius: 29,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 7,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    overflow: 'hidden',
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8
  },
  reflection: {
    position: 'absolute',
    top: 0,
    left: 30,
    right: 30,
    height: StyleSheet.hairlineWidth,
    opacity: 0.98
  },
  lowerReflection: {
    position: 'absolute',
    left: 84,
    right: 84,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    opacity: 0.28
  },
  centerRail: {
    position: 'absolute',
    top: 5,
    left: '42%',
    right: '42%',
    height: 2,
    borderRadius: 2,
    opacity: 0.26
  },
  tabItem: {
    flex: 1,
    height: 56,
    borderRadius: 21,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    position: 'relative'
  },
  tabItemActive: {
    borderWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }
  },
  activeRail: {
    position: 'absolute',
    top: 4,
    width: 20,
    height: 2,
    borderRadius: 2,
    opacity: 0.9
  },
  iconWell: {
    width: 31,
    height: 28,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabLabel: {
    fontSize: 9.2,
    lineHeight: 11,
    letterSpacing: -0.04
  },
  tabLabelActive: {
    fontWeight: '800'
  },
  tabLabelInactive: {
    fontWeight: '600'
  }
});
