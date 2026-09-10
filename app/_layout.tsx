import { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from '@/src/context/AuthContext';
import { ItemsProvider, useItems } from '@/src/context/ItemsContext';
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
  const { hydrated: itemsHydrated } = useItems();
  const { theme, resolvedMode, loaded: themeLoaded } = useThemeContext();
  const { loading: subscriptionLoading, billingConfigured, hasBaseAccess } = usePlan();
  const appReady = loaded && themeLoaded && !subscriptionLoading && itemsHydrated;
  const canOpenMemories = completed && (!billingConfigured || hasBaseAccess);

  useEffect(() => {
    if (!appReady) return;

    const inOnboarding = segments[0] === 'onboarding';
    const inUpgrade = segments[0] === 'upgrade';
    const inAuth = segments[0] === 'auth';

    if (!completed && !inOnboarding && !inAuth) {
      router.replace('/onboarding');
      return;
    }

    if (completed && inOnboarding) {
      router.replace(billingConfigured && !hasBaseAccess ? '/upgrade' : '/(tabs)');
      return;
    }

    if (completed && billingConfigured && !hasBaseAccess && !inUpgrade && !inAuth) {
      router.replace('/upgrade');
    }
  }, [appReady, completed, billingConfigured, hasBaseAccess, segments, router]);

  useEffect(() => {
    if (!appReady || !canOpenMemories || Platform.OS === 'web') return;

    let cancelled = false;

    async function openNotificationItem(response: Notifications.NotificationResponse | null) {
      if (!response || cancelled) return;

      const itemId = response.notification.request.content.data?.itemId;
      if (typeof itemId !== 'string' || !itemId) return;

      await Notifications.clearLastNotificationResponseAsync();
      if (cancelled) return;

      router.push({ pathname: '/item/[id]', params: { id: itemId } });
    }

    void Notifications.getLastNotificationResponseAsync().then(openNotificationItem);

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      void openNotificationItem(response);
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [appReady, canOpenMemories, router]);

  if (!appReady) {
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
