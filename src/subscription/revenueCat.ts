import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesPackage
} from 'react-native-purchases';
import {
  REVENUECAT_OFFERING_ID,
  revenueCatEntitlements,
  subscriptionProducts
} from '@/src/subscription/products';
import type { OnePlan, PaidOnePlan } from '@/src/subscription/features';

let configured = false;
let identifiedUserId: string | null = null;

export type PurchaseOutcome = {
  ok: boolean;
  cancelled?: boolean;
  error?: string;
  plan?: OnePlan;
};

export function isRevenueCatConfigured() {
  return Boolean(apiKeyForPlatform());
}

export async function configureRevenueCat(appUserId?: string) {
  const apiKey = apiKeyForPlatform();
  if (!apiKey || Platform.OS === 'web') return false;

  if (!configured) {
    Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
    Purchases.configure({ apiKey });
    configured = true;
  }

  await syncRevenueCatIdentity(appUserId);
  return true;
}

export async function getRevenueCatPlan(): Promise<OnePlan> {
  const customerInfo = await Purchases.getCustomerInfo();
  return planFromCustomerInfo(customerInfo);
}

export async function getSubscriptionManagementURL(): Promise<string | undefined> {
  const customerInfo = await Purchases.getCustomerInfo();
  return customerInfo.managementURL ?? undefined;
}

export async function purchaseRevenueCatPlan(plan: PaidOnePlan): Promise<PurchaseOutcome> {
  try {
    const rcPackage = await packageForPlan(plan);

    if (!rcPackage) {
      return {
        ok: false,
        error: 'This subscription is not available in the current RevenueCat offering.'
      };
    }

    const { customerInfo } = await Purchases.purchasePackage(rcPackage);
    return {
      ok: true,
      plan: planFromCustomerInfo(customerInfo)
    };
  } catch (error) {
    const cancelled = Boolean((error as { userCancelled?: boolean })?.userCancelled);
    return {
      ok: false,
      cancelled,
      error: cancelled ? undefined : errorMessage(error)
    };
  }
}

export async function restoreRevenueCatPurchases(): Promise<PurchaseOutcome> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return {
      ok: true,
      plan: planFromCustomerInfo(customerInfo)
    };
  } catch (error) {
    return {
      ok: false,
      error: errorMessage(error)
    };
  }
}

export function planFromCustomerInfo(customerInfo: CustomerInfo): OnePlan {
  if (customerInfo.entitlements.active[revenueCatEntitlements.oneAi]) return 'one_ai';
  if (customerInfo.entitlements.active[revenueCatEntitlements.one]) return 'one';
  return 'none';
}

async function packageForPlan(plan: PaidOnePlan): Promise<PurchasesPackage | undefined> {
  const offerings = await Purchases.getOfferings();
  const offering = offerings.all[REVENUECAT_OFFERING_ID] || offerings.current;
  if (!offering) return undefined;

  const product = plan === 'one_ai'
    ? subscriptionProducts.oneAiMonthly
    : subscriptionProducts.oneMonthly;

  return offering.availablePackages.find(
    (rcPackage) =>
      rcPackage.identifier === product.revenueCatPackageId ||
      rcPackage.product.identifier === product.id
  );
}

async function syncRevenueCatIdentity(appUserId?: string) {
  const nextUserId = appUserId || null;

  if (nextUserId && nextUserId !== identifiedUserId) {
    await Purchases.logIn(nextUserId);
    identifiedUserId = nextUserId;
    return;
  }

  if (!nextUserId && identifiedUserId) {
    await Purchases.logOut();
    identifiedUserId = null;
  }
}

function apiKeyForPlatform() {
  if (Platform.OS === 'ios') return process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
  if (Platform.OS === 'android') return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
  return undefined;
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error && 'message' in error) {
    return String((error as { message?: unknown }).message || 'Purchase failed');
  }
  return 'Purchase failed';
}
