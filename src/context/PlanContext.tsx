import { createContext, useContext, useMemo } from 'react';
import { BETA_PLAN, hasPlanFeature, type OnePlan } from '@/src/subscription/features';

type PlanContextValue = {
  plan: OnePlan;
  hasAi: boolean;
  isBetaAccess: boolean;
};

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const value = useMemo<PlanContextValue>(
    () => ({
      plan: BETA_PLAN,
      hasAi: hasPlanFeature(BETA_PLAN, 'ask_one'),
      isBetaAccess: true
    }),
    []
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const context = useContext(PlanContext);
  if (!context) throw new Error('usePlan must be used inside PlanProvider');
  return context;
}
