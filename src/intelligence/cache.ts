import type { OneItem } from '@/src/types/item';
import type { IntelligenceSnapshot } from './types';
import { buildIntelligenceSnapshot } from './engine';

const MAX_CACHE_SIZE = 256;
const snapshotCache = new Map<string, IntelligenceSnapshot>();

export function intelligenceSemanticKey(item: OneItem) {
  return JSON.stringify({ id: item.id, title: item.title, rawInput: item.rawInput, originalText: item.originalText, extractedText: item.extractedText, summary: item.summary, type: item.type, kind: item.kind, date: item.date, time: item.time, location: item.location, url: item.url, people: item.people, entities: item.entities, merchant: item.merchant, amount: item.amount, currency: item.currency, documentKind: item.documentKind, tags: item.tags, userContext: item.userContext, understandingConfidence: item.understandingConfidence, confidenceMetadata: item.confidenceMetadata, reviewStatus: item.reviewStatus, ambiguities: item.ambiguities });
}

export function getCachedIntelligenceSnapshot(item: OneItem): IntelligenceSnapshot {
  const key = intelligenceSemanticKey(item); const cached = snapshotCache.get(key); if (cached) return cached;
  const snapshot = buildIntelligenceSnapshot(item); snapshotCache.set(key, snapshot);
  if (snapshotCache.size > MAX_CACHE_SIZE) snapshotCache.delete(snapshotCache.keys().next().value as string);
  return snapshot;
}

export function clearIntelligenceCache() { snapshotCache.clear(); }
export function intelligenceCacheSize() { return snapshotCache.size; }
