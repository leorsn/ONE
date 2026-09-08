import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { OneIcon, icons } from '@/src/ui/icons';
import { useTheme } from '@/src/theme/useTheme';

const tabIcon = {
  index: icons.inbox,
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
        tabBarStyle: {
          height: 82,
          paddingTop: 8,
          paddingBottom: 18,
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: StyleSheet.hairlineWidth
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700'
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarIcon: ({ color, focused }) => (
          <View style={{ opacity: focused ? 1 : 0.9 }}>
            <OneIcon
              name={tabIcon[route.name as keyof typeof tabIcon]}
              size={22}
              color={color}
            />
          </View>
        )
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Inbox' }} />
      <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
