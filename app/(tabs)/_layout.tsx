import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTheme } from '@/src/theme/useTheme';

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <NativeTabs
      tintColor={theme.sky}
      minimizeBehavior="onScrollDown"
    >
      <NativeTabs.Trigger name="index" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }} md={{ default: 'grid_view', selected: 'grid_view' }} />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="calendar" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon sf={{ default: 'calendar', selected: 'calendar' }} md={{ default: 'calendar_month', selected: 'calendar_month' }} />
        <NativeTabs.Trigger.Label>Calendar</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="saved" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon sf={{ default: 'bookmark', selected: 'bookmark.fill' }} md={{ default: 'bookmark_border', selected: 'bookmark' }} />
        <NativeTabs.Trigger.Label>Saved</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} md={{ default: 'settings', selected: 'settings' }} />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search" role="search" disableAutomaticContentInsets>
        <NativeTabs.Trigger.Icon sf={{ default: 'magnifyingglass', selected: 'magnifyingglass' }} md={{ default: 'search', selected: 'search' }} />
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
