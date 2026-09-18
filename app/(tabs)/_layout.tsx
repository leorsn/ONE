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
          left: 0,
          right: 0,
          bottom: 0,
          height: 58 + Math.max(insets.bottom, 10),
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 10),
          backgroundColor: dark ? '#1C1C1EF2' : '#FFFFFFF2',
          borderTopColor: dark ? '#FFFFFF12' : '#00000010',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderLeftWidth: 0,
          borderRightWidth: 0,
          borderBottomWidth: 0,
          borderRadius: 0,
          shadowColor: theme.shadow,
          shadowOpacity: dark ? 0.28 : 0.08,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: -5 },
          elevation: 12
        },
        tabBarItemStyle: { paddingTop: 0 },
        tabBarLabelStyle: {
          fontSize: 9.5,
          lineHeight: 11.5,
          fontWeight: '600',
          letterSpacing: -0.05,
          marginTop: 1
        },
        tabBarActiveTintColor: theme.sky,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarIcon: ({ color, focused }) => (
          <View style={styles.iconStack}>
            <OneIcon
              name={tabIcon[route.name as keyof typeof tabIcon]}
              size={focused ? 20 : 19}
              color={focused ? theme.sky : color}
            />
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
  iconStack: { minWidth: 34, minHeight: 27, alignItems: 'center', justifyContent: 'center' },
  activeSignal: { position: 'absolute', bottom: -5, width: 16, height: 2.5, flexDirection: 'row', gap: 2 },
  activeSignalBlue: { flex: 2, borderRadius: 2 },
  activeSignalRed: { flex: 1, borderRadius: 2 }
});
