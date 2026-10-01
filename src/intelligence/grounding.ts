import type { RetrievalResult } from '@/src/search/retrieve';
import { buildIntelligenceSnapshot } from './engine';

export type RecallGroundingContext = {
  allowedItemIds: string[];
  reliableItemIds: string[];
  reviewItemIds: string[];
  confidence: 'low' | 'medium' | 'high';
};

export function buildRecallGroundingContext(retrieval: RetrievalResult[], limit = 6): RecallGroundingContext {
  const selected = retrieval.slice(0, limit);
  const reliableItemIds: string[] = [];
  const reviewItemIds: string[] = [];
  let high = 0; let medium = 0;
  for (const result of selected) {
    const snapshot = buildIntelligenceSnapshot(result.item);
    if (snapshot.confidence === 'high' && snapshot.ambiguities.length === 0) { reliableItemIds.push(result.item.id); high += 1; }
    else { reviewItemIds.push(result.item.id); if (snapshot.confidence === 'medium') medium += 1; }
  }
  const confidence = !selected.length ? 'low' : high === selected.length ? 'high' : high + medium > 0 ? 'medium' : 'low';
  return { allowedItemIds: selected.map((result) => result.item.id), reliableItemIds, reviewItemIds, confidence };
}
