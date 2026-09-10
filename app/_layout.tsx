import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/src/context/AuthContext';
import { ItemsProvider } from '@/src/context/ItemsContext';
import { OnboardingProvider, useOnboarding } from '@/src/context/OnboardingContext';
import { ThemeProvider, useThemeContext } from '@/src/context/ThemeContext';
import { PlanProvider, usePlan } from '@/src/context/PlanContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <OnboardingProvider>
        <AuthProvider>
          <PlanProvider>
            <ItemsProvider>
              <RootNavigation />
            </ItemsProvider>
          </PlanProvider>
        </AuthProvider>
      </OnboardingProvider>
    </ThemeProvider>
  );
}

function RootNavigation() {
  const router = useRouter();
  const segments = useSegments();
  const { loaded, completed } = useOnboarding();
  const { theme, resolvedMode, loaded: themeLoaded } = useThemeContext();
  const { loading: subscriptionLoading, billingConfigured, hasBaseAccess } = usePlan();

  useEffect(() => {
    if (!loaded || !themeLoaded || subscriptionLoading) return;

    const inOnboarding = segments[0] === 'onboarding';
    const inUpgrade = segments[0] === 'upgrade';

    if (!completed && !inOnboarding) {
      router.replace('/onboarding');
      return;
    }

    if (completed && inOnboarding) {
      router.replace(billingConfigured && !hasBaseAccess ? '/upgrade' : '/(tabs)');
      return;
    }

    if (completed && billingConfigured && !hasBaseAccess && !inUpgrade) {
      router.replace('/upgrade');
    }
  }, [
    completed,
    loaded,
    themeLoaded,
    subscriptionLoading,
    billingConfigured,
    hasBaseAccess,
    segments
  ]);

  if (!loaded || !themeLoaded || subscriptionLoading) {
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
