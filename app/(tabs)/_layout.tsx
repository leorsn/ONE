import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
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

function NeverTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.tabBarWrap,
        { bottom: Math.max(10, insets.bottom - 3) }
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

        {state.routes.map((route, index) => {
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
                focused ? styles.tabItemActive : styles.tabItemInactive,
                {
                  backgroundColor: focused ? theme.platinumSoft : 'transparent',
                  borderColor: focused ? theme.glassBorder : 'transparent',
                  opacity: pressed ? 0.62 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }]
                }
              ]}
            >
              {focused ? (
                <>
                  <View
                    style={[
                      styles.activeIconWell,
                      {
                        backgroundColor: theme.chromeSoft,
                        borderColor: theme.glassBorder
                      }
                    ]}
                  >
                    <OneIcon
                      name={tabIcon[routeName]}
                      size={16.5}
                      color={theme.chrome}
                    />
                  </View>
                  <Text
                    style={[
                      styles.activeLabel,
                      { color: theme.text }
                    ]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                </>
              ) : (
                <OneIcon
                  name={tabIcon[routeName]}
                  size={17}
                  color={theme.textTertiary}
                />
              )}
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
    left: 18,
    right: 18
  },
  tabBar: {
    height: 58,
    borderRadius: 23,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 7,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    overflow: 'hidden',
    shadowOpacity: 0.16,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 13 },
    elevation: 10
  },
  reflection: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: StyleSheet.hairlineWidth,
    opacity: 0.9
  },
  tabItem: {
    height: 44,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabItemActive: {
    flex: 1.72,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 9
  },
  tabItemInactive: {
    flex: 1
  },
  activeIconWell: {
    width: 29,
    height: 29,
    borderRadius: 11,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center'
  },
  activeLabel: {
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: '700',
    letterSpacing: -0.05
  }
});
