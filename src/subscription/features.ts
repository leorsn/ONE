export type OnePlan = 'one' | 'one_ai';
export type OneFeature = 'ask_one' | 'semantic_recall' | 'ai_answers' | 'document_ai';

const featureMatrix: Record<OnePlan, ReadonlySet<OneFeature>> = {
  one: new Set<OneFeature>(),
  one_ai: new Set<OneFeature>(['ask_one', 'semantic_recall', 'ai_answers', 'document_ai'])
};

export function hasPlanFeature(plan: OnePlan, feature: OneFeature) {
  return featureMatrix[plan].has(feature);
}

// During beta, AI recall remains available so the current product can be tested end-to-end.
// RevenueCat/App Store entitlements can replace this source without changing feature consumers.
export const BETA_PLAN: OnePlan = 'one_ai';
