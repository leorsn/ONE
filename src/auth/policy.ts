export type OneRouteGroup =
  | 'onboarding'
  | 'auth_signin'
  | 'auth_flow'
  | 'upgrade'
  | 'dev-native'
  | 'app';

export function authGateTarget({
  configured,
  sessionPresent,
  onboardingComplete,
  routeGroup
}: {
  configured: boolean;
  sessionPresent: boolean;
  onboardingComplete: boolean;
  routeGroup: OneRouteGroup;
}) {
  if (!onboardingComplete) {
    if (routeGroup === 'onboarding' || routeGroup === 'auth_flow' || routeGroup === 'dev-native') return null;
    return '/onboarding' as const;
  }

  if (configured && !sessionPresent) {
    if (routeGroup === 'auth_signin' || routeGroup === 'auth_flow' || routeGroup === 'dev-native') return null;
    return '/auth/sign-in' as const;
  }

  if (sessionPresent && routeGroup === 'auth_signin') return '/(tabs)' as const;
  if (routeGroup === 'onboarding') return configured && !sessionPresent ? '/auth/sign-in' as const : '/(tabs)' as const;
  return null;
}
