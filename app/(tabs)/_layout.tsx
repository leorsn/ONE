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
  const dark = resolvedMode === 'dark';
  const insets = useSafeAreaInsets();

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
          bottom: Math.max(8, insets.bottom - 6),
          height: 68,
          paddingTop: 7,
          paddingBottom: 7,
          backgroundColor: dark ? '#171719E8' : '#FFFFFFDF',
          borderColor: dark ? '#FFFFFF20' : '#FFFFFFEE',
          borderWidth: StyleSheet.hairlineWidth,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderRadius: 25,
          shadowColor: dark ? '#000000' : '#667085',
          shadowOpacity: dark ? 0.42 : 0.18,
          shadowRadius: 30,
          shadowOffset: { width: 0, height: 14 },
          elevation: 12
        },
        tabBarItemStyle: { paddingTop: 0 },
        tabBarLabelStyle: { fontSize: 9.5, fontWeight: '600', marginTop: 1 },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarIcon: ({ color, focused }) => (
          <View style={styles.iconStack}>
            <View style={[
              styles.iconHalo,
              focused && {
                backgroundColor: dark ? `${theme.accent}22` : `${theme.accent}12`,
                borderColor: `${theme.accent}28`
              }
            ]}>
              <OneIcon name={tabIcon[route.name as keyof typeof tabIcon]} size={focused ? 18.5 : 17.5} color={focused ? theme.accent : color} />
            </View>
            {focused ? <View style={[styles.activeDot, { backgroundColor: theme.accent }]} /> : null}
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
  iconHalo: { width: 38, height: 30, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  activeDot: { position: 'absolute', bottom: -2, width: 4, height: 4, borderRadius: 2 }
});
