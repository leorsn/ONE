import { useEffect, useRef } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { ItemsProvider, useItems } from '@/src/context/ItemsContext';
import { OnboardingProvider, useOnboarding } from '@/src/context/OnboardingContext';
import { ThemeProvider, useThemeContext } from '@/src/context/ThemeContext';
import { PlanProvider, usePlan } from '@/src/context/PlanContext';
import { recordNativeAcceptanceEvent } from '@/src/native/acceptance';

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
  const { loading: authLoading } = useAuth();
  const { hydrated: itemsHydrated, items } = useItems();
  const { theme, resolvedMode, loaded: themeLoaded } = useThemeContext();
  const { loading: subscriptionLoading, billingConfigured, hasBaseAccess } = usePlan();
  const itemsRef = useRef(items);
  const handledNotificationResponsesRef = useRef(new Set<string>());
  const appReady = loaded && themeLoaded && !authLoading && !subscriptionLoading && itemsHydrated;
  const canOpenMemories = completed && (!billingConfigured || hasBaseAccess);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (!appReady) return;

    const inOnboarding = segments[0] === 'onboarding';
    const inUpgrade = segments[0] === 'upgrade';
    const inAuth = segments[0] === 'auth';
    const inNativeAcceptance = __DEV__ && segments[0] === 'dev-native';

    if (!completed && !inOnboarding && !inAuth && !inNativeAcceptance) {
      router.replace('/onboarding');
      return;
    }

    if (completed && inOnboarding) {
      router.replace(billingConfigured && !hasBaseAccess ? '/upgrade' : '/(tabs)');
      return;
    }

    if (completed && billingConfigured && !hasBaseAccess && !inUpgrade && !inAuth && !inNativeAcceptance) {
      router.replace('/upgrade');
    }
  }, [appReady, completed, billingConfigured, hasBaseAccess, segments, router]);

  useEffect(() => {
    if (!appReady || !canOpenMemories || Platform.OS === 'web') return;

    let cancelled = false;

    async function openNotificationItem(response: Notifications.NotificationResponse | null) {
      if (!response || cancelled) return;

      const responseKey = `${response.notification.request.identifier}:${response.actionIdentifier}`;
      if (handledNotificationResponsesRef.current.has(responseKey)) return;
      handledNotificationResponsesRef.current.add(responseKey);
      if (handledNotificationResponsesRef.current.size > 32) {
        handledNotificationResponsesRef.current = new Set([responseKey]);
      }

      await Notifications.clearLastNotificationResponseAsync();
      if (cancelled) return;

      const data = response.notification.request.content.data;
      const itemId = data?.itemId;
      if (typeof itemId !== 'string' || !itemId) {
        if (data?.acceptanceTest) {
          await recordNativeAcceptanceEvent('notification_opened', 'acceptance-test');
        }
        return;
      }

      const exists = itemsRef.current.some((item) => item.id === itemId);
      if (!exists) {
        await recordNativeAcceptanceEvent('notification_stale', 'missing-item');
        router.replace('/(tabs)');
        return;
      }

      await recordNativeAcceptanceEvent('notification_opened', 'item');
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
