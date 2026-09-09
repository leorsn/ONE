export type OnePlan = 'none' | 'one' | 'one_ai';
export type PaidOnePlan = Exclude<OnePlan, 'none'>;
export type OneFeature = 'ask_one' | 'semantic_recall' | 'ai_answers' | 'document_ai';

const featureMatrix: Record<OnePlan, ReadonlySet<OneFeature>> = {
  none: new Set<OneFeature>(),
  one: new Set<OneFeature>(),
  one_ai: new Set<OneFeature>(['ask_one', 'semantic_recall', 'ai_answers', 'document_ai'])
};

export function hasPlanFeature(plan: OnePlan, feature: OneFeature) {
  return featureMatrix[plan].has(feature);
}

export const BETA_PLAN: PaidOnePlan = 'one_ai';
