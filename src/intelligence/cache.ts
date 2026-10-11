import type { OneItem } from '@/src/types/item';
import type { IntelligenceSnapshot } from './types';
import { buildIntelligenceSnapshot } from './engine';

const MAX_CACHE_SIZE = 256;
const snapshotCache = new Map<string, IntelligenceSnapshot>();

export function intelligenceSemanticKey(item: OneItem) {
  return JSON.stringify({
    id: item.id,
    title: item.title,
    rawInput: item.rawInput,
    originalText: item.originalText,
    extractedText: item.extractedText,
    summary: item.summary,
    type: item.type,
    kind: item.kind,
    date: item.date,
    time: item.time,
    location: item.location,
    url: item.url,
    people: stableStrings(item.people),
    entities: stableStrings(item.entities),
    merchant: item.merchant,
    amount: item.amount,
    currency: item.currency,
    documentKind: item.documentKind,
    tags: stableStrings(item.tags),
    userContext: item.userContext,
    understandingConfidence: item.understandingConfidence,
    confidenceMetadata: stableConfidence(item.confidenceMetadata),
    reviewStatus: item.reviewStatus,
    ambiguities: stableStrings(item.ambiguities)
  });
}

export function getCachedIntelligenceSnapshot(item: OneItem): IntelligenceSnapshot {
  const key = intelligenceSemanticKey(item);
  const cached = snapshotCache.get(key);
  if (cached) return cached;

  const snapshot = buildIntelligenceSnapshot(item);
  snapshotCache.set(key, snapshot);
  if (snapshotCache.size > MAX_CACHE_SIZE) {
    const oldestKey = snapshotCache.keys().next().value;
    if (oldestKey) snapshotCache.delete(oldestKey);
  }
  return snapshot;
}

export function clearIntelligenceCache() {
  snapshotCache.clear();
}

export function intelligenceCacheSize() {
  return snapshotCache.size;
}

function stableStrings(values?: string[]) {
  return values ? [...values].sort((a, b) => a.localeCompare(b)) : undefined;
}

function stableConfidence(value: OneItem['confidenceMetadata']) {
  if (!value) return undefined;
  return {
    overall: value.overall,
    fields: Object.fromEntries(
      Object.entries(value.fields ?? {}).sort(([left], [right]) => left.localeCompare(right))
    )
  };
}
