import { BETA_PLAN, type OnePlan } from './features.ts';

/**
 * Development clients may exercise the full product without live App Store
 * products. Release/preview builds never receive paid access merely because
 * RevenueCat configuration is absent.
 */
export function fallbackPlanForRuntime(isDevelopment: boolean): OnePlan {
  return isDevelopment ? BETA_PLAN : 'none';
}

export function isDevelopmentBetaAccess(
  isDevelopment: boolean,
  billingConfigured: boolean
) {
  return isDevelopment && !billingConfigured;
}
