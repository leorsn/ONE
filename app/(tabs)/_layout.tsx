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
          left: 10,
          right: 10,
          bottom: Math.max(8, insets.bottom - 8),
          height: 64,
          paddingTop: 7,
          paddingBottom: 6,
          backgroundColor: `${theme.surface}E8`,
          borderColor: `${theme.text}18`,
          borderWidth: StyleSheet.hairlineWidth,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderRadius: 21,
          shadowColor: theme.shadow,
          shadowOpacity: 0.12,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 10 },
          elevation: 8
        },
        tabBarItemStyle: { paddingTop: 1 },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600',
          letterSpacing: 0.02,
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
                  backgroundColor: `${theme.sky}18`,
                  borderColor: `${theme.sky}32`
                }
              ]}
            >
              <OneIcon
                name={tabIcon[route.name as keyof typeof tabIcon]}
                size={focused ? 18.5 : 17.5}
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
  iconStack: { minWidth: 38, minHeight: 28, alignItems: 'center', justifyContent: 'center' },
  iconHalo: {
    width: 31,
    height: 28,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center'
  },
  activeSignal: { position: 'absolute', bottom: -4, width: 17, height: 2.5, flexDirection: 'row', gap: 2 },
  activeSignalBlue: { flex: 2, borderRadius: 2 },
  activeSignalRed: { flex: 1, borderRadius: 2 }
});
