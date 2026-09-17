import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { fallbackPlanForRuntime, isDevelopmentBetaAccess } from '@/src/subscription/access';
import {
  hasPlanFeature,
  type OnePlan,
  type PaidOnePlan
} from '@/src/subscription/features';
import {
  configureRevenueCat,
  getRevenueCatPlan,
  getRevenueCatStorefront,
  getSubscriptionManagementURL,
  isRevenueCatConfigured,
  purchaseRevenueCatPlan,
  restoreRevenueCatPurchases,
  type PurchaseOutcome,
  type RevenueCatIntroOffer,
  type RevenueCatPriceStrings
} from '@/src/subscription/revenueCat';

type PlanContextValue = {
  plan: OnePlan;
  hasBaseAccess: boolean;
  hasAi: boolean;
  isBetaAccess: boolean;
  billingConfigured: boolean;
  localizedPrices: RevenueCatPriceStrings;
  introOffers: Partial<Record<PaidOnePlan, RevenueCatIntroOffer>>;
  managementUrl?: string;
  loading: boolean;
  purchasing: boolean;
  purchase: (plan: PaidOnePlan) => Promise<PurchaseOutcome>;
  restore: () => Promise<PurchaseOutcome>;
  refresh: () => Promise<void>;
};

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id;
  const runtimeFallbackPlan = fallbackPlanForRuntime(__DEV__);
  const [plan, setPlan] = useState<OnePlan>(runtimeFallbackPlan);
  const [billingConfigured, setBillingConfigured] = useState(false);
  const [localizedPrices, setLocalizedPrices] = useState<RevenueCatPriceStrings>({});
  const [introOffers, setIntroOffers] = useState<Partial<Record<PaidOnePlan, RevenueCatIntroOffer>>>({});
  const [managementUrl, setManagementUrl] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const configured = await configureRevenueCat(userId);

      if (!configured) {
        setBillingConfigured(false);
        setPlan(runtimeFallbackPlan);
        setLocalizedPrices({});
        setIntroOffers({});
        setManagementUrl(undefined);
        return;
      }

      const [nextPlan, nextManagementUrl, storefront] = await Promise.all([
        getRevenueCatPlan(),
        getSubscriptionManagementURL(),
        getRevenueCatStorefront().catch((error) => {
          console.warn('NEVER subscription storefront refresh failed', error);
          return { prices: {}, introOffers: {} };
        })
      ]);
      setBillingConfigured(true);
      setPlan(nextPlan);
      setLocalizedPrices(storefront.prices);
      setIntroOffers(storefront.introOffers);
      setManagementUrl(nextManagementUrl);
    } catch (error) {
      console.warn('NEVER subscription refresh failed', error);

      if (isRevenueCatConfigured()) {
        setBillingConfigured(true);
        setPlan('none');
        setLocalizedPrices({});
        setIntroOffers({});
        setManagementUrl(undefined);
      } else {
        setBillingConfigured(false);
        setPlan(runtimeFallbackPlan);
        setLocalizedPrices({});
        setIntroOffers({});
        setManagementUrl(undefined);
      }
    } finally {
      setLoading(false);
    }
  }, [userId, runtimeFallbackPlan]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void refresh();
    }, 0);

    return () => clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });

    return () => subscription.remove();
  }, [refresh]);

  const purchase = useCallback(async (nextPlan: PaidOnePlan) => {
    if (!billingConfigured) {
      return {
        ok: false,
        error: 'App Store billing is not configured in this build.'
      };
    }

    setPurchasing(true);
    try {
      const outcome = await purchaseRevenueCatPlan(nextPlan);
      if (outcome.ok && outcome.plan) {
        setPlan(outcome.plan);
        setManagementUrl(await getSubscriptionManagementURL());
      }
      return outcome;
    } finally {
      setPurchasing(false);
    }
  }, [billingConfigured]);

  const restore = useCallback(async () => {
    if (!billingConfigured) {
      return {
        ok: false,
        error: 'App Store billing is not configured in this build.'
      };
    }

    setPurchasing(true);
    try {
      const outcome = await restoreRevenueCatPurchases();
      if (outcome.ok && outcome.plan) {
        setPlan(outcome.plan);
        setManagementUrl(await getSubscriptionManagementURL());
      }
      return outcome;
    } finally {
      setPurchasing(false);
    }
  }, [billingConfigured]);

  const value = useMemo<PlanContextValue>(
    () => ({
      plan,
      hasBaseAccess: plan === 'one' || plan === 'one_ai',
      hasAi: hasPlanFeature(plan, 'ask_one'),
      isBetaAccess: isDevelopmentBetaAccess(__DEV__, billingConfigured),
      billingConfigured,
      localizedPrices,
      introOffers,
      managementUrl,
      loading,
      purchasing,
      purchase,
      restore,
      refresh
    }),
    [plan, billingConfigured, localizedPrices, introOffers, managementUrl, loading, purchasing, purchase, restore, refresh]
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) throw new Error('usePlan must be used inside PlanProvider');
  return context;
}
