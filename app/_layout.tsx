import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { ItemsProvider } from '@/src/context/ItemsContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ItemsProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </ItemsProvider>
  );
}
