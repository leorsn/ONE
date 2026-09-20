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
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.tabBarWrap, { bottom: Math.max(9, insets.bottom - 5) }]}>
      <View style={styles.tabBar}>
        <View pointerEvents="none" style={styles.topChrome} />
        <View pointerEvents="none" style={styles.bottomChrome} />
        <View pointerEvents="none" style={styles.dockMark}>
          <View style={styles.dockMarkLong} />
          <View style={styles.dockMarkShort} />
        </View>

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

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
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
                focused && styles.tabItemActive,
                { opacity: pressed ? 0.68 : 1, transform: [{ scale: pressed ? 0.965 : focused ? 1.015 : 1 }] }
              ]}
            >
              {focused ? <View style={styles.activeChrome} /> : null}
              <View style={[styles.iconWell, focused && styles.iconWellActive]}>
                <OneIcon name={tabIcon[routeName]} size={focused ? 18 : 16.5} color={focused ? '#11161B' : '#7F8A94'} />
              </View>
              <Text style={[styles.tabLabel, focused ? styles.tabLabelActive : styles.tabLabelInactive]} numberOfLines={1}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarWrap: { position: 'absolute', left: 14, right: 14 },
  tabBar: {
    height: 72,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FFFFFF24',
    backgroundColor: '#11161BF4',
    paddingHorizontal: 7,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10
  },
  topChrome: { position: 'absolute', top: 0, left: 34, right: 34, height: StyleSheet.hairlineWidth, backgroundColor: '#FFFFFF8F' },
  bottomChrome: { position: 'absolute', bottom: 0, left: 92, right: 92, height: StyleSheet.hairlineWidth, backgroundColor: '#FFFFFF20' },
  dockMark: { position: 'absolute', top: 6, left: '46%', flexDirection: 'row', gap: 3 },
  dockMarkLong: { width: 18, height: 2, borderRadius: 1, backgroundColor: '#DDE2E7' },
  dockMarkShort: { width: 6, height: 2, borderRadius: 1, backgroundColor: '#697580' },
  tabItem: {
    flex: 1,
    height: 57,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    position: 'relative'
  },
  tabItemActive: {
    backgroundColor: '#E9EDF0',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 }
  },
  activeChrome: { position: 'absolute', top: 4, width: 20, height: 2, borderRadius: 1, backgroundColor: '#596570' },
  iconWell: { width: 30, height: 29, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  iconWellActive: { backgroundColor: '#FFFFFFA8', borderWidth: StyleSheet.hairlineWidth, borderColor: '#FFFFFF' },
  tabLabel: { fontSize: 9, lineHeight: 11, letterSpacing: -0.04 },
  tabLabelActive: { color: '#11161B', fontWeight: '800' },
  tabLabelInactive: { color: '#7A858F', fontWeight: '600' }
});
