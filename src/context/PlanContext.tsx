import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import {
  BETA_PLAN,
  hasPlanFeature,
  type OnePlan,
  type PaidOnePlan
} from '@/src/subscription/features';
import {
  configureRevenueCat,
  getRevenueCatPlan,
  isRevenueCatConfigured,
  purchaseRevenueCatPlan,
  restoreRevenueCatPurchases,
  type PurchaseOutcome
} from '@/src/subscription/revenueCat';

type PlanContextValue = {
  plan: OnePlan;
  hasBaseAccess: boolean;
  hasAi: boolean;
  isBetaAccess: boolean;
  billingConfigured: boolean;
  loading: boolean;
  purchasing: boolean;
  purchase: (plan: PaidOnePlan) => Promise<PurchaseOutcome>;
  restore: () => Promise<PurchaseOutcome>;
  refresh: () => Promise<void>;
};

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [plan, setPlan] = useState<OnePlan>(BETA_PLAN);
  const [billingConfigured, setBillingConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const configured = await configureRevenueCat(session?.user.id);

      if (!configured) {
        setBillingConfigured(false);
        setPlan(BETA_PLAN);
        return;
      }

      const nextPlan = await getRevenueCatPlan();
      setBillingConfigured(true);
      setPlan(nextPlan);
    } catch (error) {
      console.warn('ONE subscription refresh failed', error);

      if (isRevenueCatConfigured()) {
        // Production billing exists, so never grant beta access on a billing failure.
        setBillingConfigured(true);
        setPlan('none');
      } else {
        setBillingConfigured(false);
        setPlan(BETA_PLAN);
      }
    } finally {
      setLoading(false);
    }
  }, [session?.user.id]);

  useEffect(() => {
    refresh();
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
      if (outcome.ok && outcome.plan) setPlan(outcome.plan);
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
      if (outcome.ok && outcome.plan) setPlan(outcome.plan);
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
      isBetaAccess: !billingConfigured,
      billingConfigured,
      loading,
      purchasing,
      purchase,
      restore,
      refresh
    }),
    [plan, billingConfigured, loading, purchasing, purchase, restore, refresh]
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) throw new Error('usePlan must be used inside PlanProvider');
  return context;
}
