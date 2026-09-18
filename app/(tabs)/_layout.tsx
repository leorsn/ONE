import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
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

export default function TabsLayout() {
  const theme = useTheme();
  const { resolvedMode } = useThemePreference();
  const insets = useSafeAreaInsets();
  const dark = resolvedMode === 'dark';

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { backgroundColor: theme.background },
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: Math.max(8, insets.bottom - 5),
          height: 66,
          paddingTop: 7,
          paddingBottom: 6,
          backgroundColor: dark ? '#1C1C1ECC' : '#FFFFFFD5',
          borderColor: dark ? '#FFFFFF1A' : '#FFFFFFF7',
          borderWidth: StyleSheet.hairlineWidth,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderRadius: 28,
          shadowColor: dark ? '#000000' : '#646B7A',
          shadowOpacity: dark ? 0.4 : 0.18,
          shadowRadius: 30,
          shadowOffset: { width: 0, height: 14 },
          elevation: 14,
          overflow: 'hidden'
        },
        tabBarItemStyle: { paddingTop: 0 },
        tabBarLabelStyle: {
          fontSize: 9.25,
          lineHeight: 11,
          fontWeight: '600',
          letterSpacing: -0.08,
          marginTop: 0
        },
        tabBarActiveTintColor: theme.sky,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarIcon: ({ color, focused }) => (
          <View style={styles.iconStack}>
            <View
              style={[
                styles.iconHalo,
                focused && {
                  backgroundColor: dark ? `${theme.sky}18` : `${theme.sky}11`,
                  borderColor: dark ? `${theme.sky}36` : `${theme.sky}20`,
                  shadowColor: theme.sky,
                  shadowOpacity: dark ? 0.18 : 0.14
                }
              ]}
            >
              <OneIcon
                name={tabIcon[route.name as keyof typeof tabIcon]}
                size={focused ? 18.5 : 18}
                color={focused ? theme.sky : color}
              />
            </View>
            {focused ? (
              <View style={styles.activeSignal} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <View style={[styles.activeSignalBlue, { backgroundColor: theme.sky }]} />
                <View style={[styles.activeSignalRed, { backgroundColor: theme.danger }]} />
              </View>
            ) : null}
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
  iconStack: { minWidth: 38, minHeight: 30, alignItems: 'center', justifyContent: 'center' },
  iconHalo: {
    width: 36,
    height: 30,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 4 }
  },
  activeSignal: { position: 'absolute', bottom: -4, width: 17, height: 2.5, flexDirection: 'row', gap: 2 },
  activeSignalBlue: { flex: 2, borderRadius: 2 },
  activeSignalRed: { flex: 1, borderRadius: 2 }
});
