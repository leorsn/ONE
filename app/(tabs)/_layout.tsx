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
        { bottom: Math.max(8, insets.bottom - 5) }
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
        <View
          pointerEvents="none"
          style={[
            styles.reflection,
            { backgroundColor: theme.reflection }
          ]}
        />

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
                    borderColor: theme.glassBorder
                  }
                ],
                {
                  opacity: pressed ? 0.62 : 1,
                  transform: [{ scale: pressed ? 0.975 : 1 }]
                }
              ]}
            >
              <OneIcon
                name={tabIcon[routeName]}
                size={focused ? 17.5 : 17}
                color={focused ? theme.chrome : theme.textTertiary}
              />
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
    left: 16,
    right: 16
  },
  tabBar: {
    height: 58,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 6,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    overflow: 'hidden',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 9 },
    elevation: 5
  },
  reflection: {
    position: 'absolute',
    top: 0,
    left: 26,
    right: 26,
    height: StyleSheet.hairlineWidth,
    opacity: 0.7
  },
  tabItem: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3
  },
  tabItemActive: {
    borderWidth: StyleSheet.hairlineWidth
  },
  tabLabel: {
    fontSize: 9.25,
    lineHeight: 11,
    letterSpacing: -0.04
  },
  tabLabelActive: {
    fontWeight: '700'
  },
  tabLabelInactive: {
    fontWeight: '600'
  }
});