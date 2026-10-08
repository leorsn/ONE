import { BETA_PLAN, type OnePlan } from './features.ts';

/**
 * Development clients may exercise the full product without live App Store
 * products. Release/preview builds never receive paid access merely because
 * RevenueCat configuration is absent.
 */
export function fallbackPlanForRuntime(isDevelopment: boolean): OnePlan {
  return isDevelopment ? BETA_PLAN : 'none';
}

/** Never show an entitlement resolved for a different authentication identity. */
export function planForCurrentIdentity(
  plan: OnePlan,
  resolvedIdentity: string | null,
  currentIdentity: string
): OnePlan {
  return resolvedIdentity === currentIdentity ? plan : 'none';
}

export function isDevelopmentBetaAccess(
  isDevelopment: boolean,
  billingConfigured: boolean
) {
  return isDevelopment && !billingConfigured;
}
