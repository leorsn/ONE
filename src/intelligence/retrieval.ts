import type { RetrievalResult } from '@/src/search/retrieve';
import type { OneItem } from '@/src/types/item';
import { buildIntelligenceSnapshot } from './engine';

/** Adds deterministic structured-memory signals without replacing the existing search stack. */
export function applyIntelligenceRetrievalSignals(query: string, results: RetrievalResult[]): RetrievalResult[] {
  const terms = normalize(query).split(/\s+/).filter((term) => term.length > 1);
  if (!terms.length) return results;

  return results
    .map((result) => {
      const signal = intelligenceMatchScore(terms, result.item);
      if (!signal) return result;
      return {
        ...result,
        score: result.score + signal,
        reasons: Array.from(new Set([...result.reasons, 'intelligence-entity']))
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function intelligenceMatchScore(terms: string[], item: OneItem) {
  const snapshot = buildIntelligenceSnapshot(item);
  let score = 0;
  for (const entity of snapshot.entities) {
    const value = normalize(entity.value);
    const matched = terms.filter((term) => value.includes(term));
    if (!matched.length) continue;
    const confidenceMultiplier = entity.confidence === 'high' ? 1 : entity.confidence === 'medium' ? 0.7 : 0.35;
    const kindWeight = entity.kind === 'person' || entity.kind === 'organization' || entity.kind === 'place' ? 3 : 2;
    score += matched.length * kindWeight * confidenceMultiplier;
  }
  return Math.min(score, 12);
}

function normalize(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}
