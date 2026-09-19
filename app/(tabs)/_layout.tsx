import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
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

export default function TabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { backgroundColor: theme.background },
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          left: 20,
          right: 20,
          bottom: Math.max(10, insets.bottom - 4),
          height: 58,
          paddingTop: 6,
          paddingBottom: 5,
          backgroundColor: theme.glassStrong,
          borderColor: theme.glassBorder,
          borderWidth: StyleSheet.hairlineWidth,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderRadius: 22,
          shadowColor: theme.shadow,
          shadowOpacity: 0.13,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 11 },
          elevation: 8
        },
        tabBarItemStyle: { paddingTop: 0 },
        tabBarLabelStyle: {
          fontSize: 8.5,
          lineHeight: 10,
          fontWeight: '600',
          letterSpacing: 0.05,
          marginTop: -1
        },
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarIcon: ({ color, focused }) => (
          <View style={styles.iconStack}>
            <View
              style={[
                styles.iconHalo,
                focused && {
                  backgroundColor: theme.platinumSoft,
                  borderColor: theme.glassBorder
                }
              ]}
            >
              <OneIcon
                name={tabIcon[route.name as keyof typeof tabIcon]}
                size={focused ? 17 : 16}
                color={focused ? theme.chrome : color}
              />
            </View>
            {focused ? <View style={[styles.activePill, { backgroundColor: theme.chrome }]} /> : null}
          </View>
        )
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="search" options={{ title: 'Search' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconStack: {
    minWidth: 34,
    minHeight: 27,
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconHalo: {
    width: 32,
    height: 25,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center'
  },
  activePill: {
    position: 'absolute',
    bottom: -1,
    width: 13,
    height: 2,
    borderRadius: 2,
    opacity: 0.72
  }
});
