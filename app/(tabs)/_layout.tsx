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
          left: 14,
          right: 14,
          bottom: Math.max(10, insets.bottom - 6),
          height: 70,
          paddingTop: 7,
          paddingBottom: 7,
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderWidth: 1,
          borderTopWidth: 1,
          borderRadius: 20,
          shadowColor: theme.shadow,
          shadowOpacity: 0.18,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 10 },
          elevation: 14
        },
        tabBarItemStyle: { paddingTop: 1 },
        tabBarLabelStyle: {
          fontSize: 9.5,
          fontWeight: '700',
          letterSpacing: 0.08,
          marginTop: 1
        },
        tabBarActiveTintColor: theme.chrome,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarIcon: ({ color, focused }) => (
          <View style={styles.iconStack}>
            <View
              style={[
                styles.iconWrap,
                focused && {
                  backgroundColor: theme.accentSoft,
                  borderColor: `${theme.accent}55`
                }
              ]}
            >
              <OneIcon
                name={tabIcon[route.name as keyof typeof tabIcon]}
                size={focused ? 19 : 18}
                color={focused ? theme.chrome : color}
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
  iconStack: { alignItems: 'center', justifyContent: 'center' },
  iconWrap: {
    width: 38,
    height: 30,
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center'
  },
  activeSignal: { position: 'absolute', bottom: -2, width: 20, height: 3, flexDirection: 'row', gap: 2 },
  activeSignalBlue: { flex: 2, borderRadius: 2 },
  activeSignalRed: { flex: 1, borderRadius: 2 }
});
