import { ensureCanonicalItemMetadata } from '../capture/itemMetadata.ts';
import type { OneItem, OneProcessingStatus, OneUnderstandingConfidence } from '../types/item';
import { buildIntelligenceSnapshot } from './engine.ts';
import type { IntelligenceSnapshot } from './types';

export type IntelligenceProcessingResult = {
  item: OneItem;
  snapshot: IntelligenceSnapshot;
  changed: boolean;
};

/**
 * Runs the deterministic intelligence pass over an item without performing
 * external side effects. This makes capture, import and sync safe to retry.
 */
export function processItemIntelligence(item: OneItem, now = new Date()): IntelligenceProcessingResult {
  const canonical = ensureCanonicalItemMetadata(item);
  const snapshot = buildIntelligenceSnapshot(canonical, now);
  const reviewStatus = shouldRequireReview(snapshot) ? 'needs_review' as const : canonical.reviewStatus ?? 'ready';
  const processingStatus: OneProcessingStatus = reviewStatus === 'needs_review' ? 'needs_attention' : 'ready';
  const next: OneItem = {
    ...canonical,
    summary: snapshot.summary,
    understandingConfidence: snapshot.confidence,
    confidenceMetadata: mergeConfidence(canonical, snapshot),
    reviewStatus,
    processingStatus,
    ambiguities: snapshot.ambiguities,
    processedAt: now.toISOString()
  };

  return { item: next, snapshot, changed: intelligenceFingerprint(canonical) !== intelligenceFingerprint(next) };
}

export function shouldRequireReview(snapshot: IntelligenceSnapshot) {
  if (snapshot.confidence === 'low') return true;
  if (snapshot.ambiguities.length > 0) return true;
  return snapshot.entities.some((entity) => entity.confidence === 'low');
}

function mergeConfidence(item: OneItem, snapshot: IntelligenceSnapshot) {
  const fields = { ...(item.confidenceMetadata?.fields ?? {}) };
  for (const entity of snapshot.entities) {
    if (!entity.sourceField) continue;
    const field = String(entity.sourceField);
    fields[field] = weakest(fields[field], entity.confidence);
  }
  return { overall: snapshot.confidence, fields };
}

function weakest(a: OneUnderstandingConfidence | undefined, b: OneUnderstandingConfidence) {
  if (!a) return b;
  const rank: Record<OneUnderstandingConfidence, number> = { low: 0, medium: 1, high: 2 };
  return rank[a] <= rank[b] ? a : b;
}

function intelligenceFingerprint(item: OneItem) {
  return JSON.stringify({
    summary: item.summary,
    understandingConfidence: item.understandingConfidence,
    confidenceMetadata: item.confidenceMetadata,
    reviewStatus: item.reviewStatus,
    processingStatus: item.processingStatus,
    ambiguities: item.ambiguities
  });
}