import { useEffect, useRef } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { authGateTarget, type OneRouteGroup } from '@/src/auth/policy';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { ItemsProvider, useItems } from '@/src/context/ItemsContext';
import { OnboardingProvider, useOnboarding } from '@/src/context/OnboardingContext';
import { ThemeProvider, useThemeContext } from '@/src/context/ThemeContext';
import { PlanProvider, usePlan } from '@/src/context/PlanContext';
import { recordNativeAcceptanceEvent } from '@/src/native/acceptance';
import { V5Wordmark, useNeverV5Palette } from '@/src/ui/appleV5';

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
  const { loading: authLoading, session, configured } = useAuth();
  const { hydrated: itemsHydrated, items } = useItems();
  const { resolvedMode, loaded: themeLoaded } = useThemeContext();
  const { loading: subscriptionLoading, hasBaseAccess } = usePlan();
  const p = useNeverV5Palette();
  const itemsRef = useRef(items);
  const handledNotificationResponsesRef = useRef(new Set<string>());
  const appReady = loaded && themeLoaded && !authLoading && !subscriptionLoading && itemsHydrated;
  const canOpenMemories = completed && (!configured || Boolean(session)) && hasBaseAccess;

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (!appReady) return;

    const routeGroup = routeGroupFor(segments);
    const authTarget = authGateTarget({
      configured,
      sessionPresent: Boolean(session),
      onboardingComplete: completed,
      routeGroup
    });

    if (authTarget) {
      router.replace(authTarget);
      return;
    }

    const inUpgrade = routeGroup === 'upgrade';
    const inAuth = routeGroup === 'auth_signin' || routeGroup === 'auth_flow';
    const inNativeAcceptance = routeGroup === 'dev-native';

    if (completed && !hasBaseAccess && !inUpgrade && !inAuth && !inNativeAcceptance) {
      router.replace('/upgrade');
    }
  }, [appReady, completed, configured, session, hasBaseAccess, segments, router]);

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
      <View style={{ flex: 1, backgroundColor: p.canvas, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <V5Wordmark />
        <ActivityIndicator color={p.chrome} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={resolvedMode === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: p.canvas },
          animation: 'default'
        }}
      />
    </>
  );
}

function routeGroupFor(segments: readonly string[]): OneRouteGroup {
  const first = segments[0];
  if (first === 'onboarding') return 'onboarding';
  if (first === 'upgrade') return 'upgrade';
  if (first === 'dev-native') return 'dev-native';
  if (first === 'auth') return segments[1] === 'sign-in' ? 'auth_signin' : 'auth_flow';
  return 'app';
}
