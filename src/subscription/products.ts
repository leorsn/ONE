export const SUBSCRIPTION_GROUP = 'ONE Membership';

export const subscriptionProducts = {
  oneMonthly: {
    id: 'app.one.mobile.one.monthly',
    plan: 'one' as const,
    displayName: 'ONE',
    priceEUR: 2.99,
    period: 'month' as const,
    trialDays: 7,
    autoRenews: true,
    subscriptionLevel: 2
  },
  oneAiMonthly: {
    id: 'app.one.mobile.oneai.monthly',
    plan: 'one_ai' as const,
    displayName: 'ONE AI',
    priceEUR: 4.99,
    period: 'month' as const,
    trialDays: 0,
    autoRenews: true,
    subscriptionLevel: 1
  }
} as const;

export type SubscriptionProductKey = keyof typeof subscriptionProducts;
