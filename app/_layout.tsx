import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/src/context/AuthContext';
import { ItemsProvider } from '@/src/context/ItemsContext';
import { OnboardingProvider, useOnboarding } from '@/src/context/OnboardingContext';
import { ThemeProvider, useThemeContext } from '@/src/context/ThemeContext';
import { PlanProvider } from '@/src/context/PlanContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <OnboardingProvider>
        <PlanProvider>
          <AuthProvider>
            <ItemsProvider>
              <RootNavigation />
            </ItemsProvider>
          </AuthProvider>
        </PlanProvider>
      </OnboardingProvider>
    </ThemeProvider>
  );
}

function RootNavigation() {
  const router = useRouter();
  const segments = useSegments();
  const { loaded, completed } = useOnboarding();
  const { theme, resolvedMode, loaded: themeLoaded } = useThemeContext();

  useEffect(() => {
    if (!loaded || !themeLoaded) return;

    const inOnboarding = segments[0] === 'onboarding';

    if (!completed && !inOnboarding) {
      router.replace('/onboarding');
    } else if (completed && inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [completed, loaded, themeLoaded, segments]);

  if (!loaded || !themeLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
          animation: 'fade'
        }}
      />
    </>
  );
}
