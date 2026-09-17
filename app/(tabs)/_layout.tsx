import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

const tabIcon = {
  index: icons.inbox,
  search: icons.search,
  calendar: icons.calendar,
  saved: icons.saved,
  settings: icons.settings
} as const;

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { backgroundColor: theme.background },
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 78,
          paddingTop: 7,
          paddingBottom: 17,
          backgroundColor: theme.surfaceElevated,
          borderTopColor: theme.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          shadowColor: theme.shadow,
          shadowOpacity: 0.035,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 }
        },
        tabBarItemStyle: { paddingTop: 1 },
        tabBarLabelStyle: {
          fontSize: 9.75,
          fontWeight: '600',
          letterSpacing: 0.1
        },
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarIcon: ({ color, focused }) => (
          <View
            style={[
              styles.iconWrap,
              focused && { backgroundColor: theme.fill }
            ]}
          >
            <OneIcon
              name={tabIcon[route.name as keyof typeof tabIcon]}
              size={20}
              color={color}
            />
          </View>
        )
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Inbox' }} />
      <Tabs.Screen name="search" options={{ title: 'Search' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 34,
    height: 28,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
