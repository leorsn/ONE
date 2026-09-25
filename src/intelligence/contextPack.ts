import type { OneItem } from '@/src/types/item';
import { buildIntelligenceSnapshot } from './engine';
import type { MemoryCluster } from './clusters';

export type IntelligenceContextSource = { itemId: string; title: string; summary: string; confidence: 'low' | 'medium' | 'high'; entities: string[] };
export type IntelligenceContextPack = { clusterId?: string; label?: string; sources: IntelligenceContextSource[]; excludedItemIds: string[] };

/** Builds a small, auditable context pack for future grounded synthesis. */
export function buildIntelligenceContextPack(items: OneItem[], options: { cluster?: MemoryCluster; limit?: number; includeMedium?: boolean } = {}): IntelligenceContextPack {
  const limit = Math.max(1, Math.min(options.limit ?? 6, 10)); const scopeIds = options.cluster ? new Set(options.cluster.itemIds) : undefined;
  const scoped = scopeIds ? items.filter((item) => scopeIds.has(item.id)) : items;
  const sources: IntelligenceContextSource[] = []; const excludedItemIds: string[] = [];
  for (const item of scoped) {
    const snapshot = buildIntelligenceSnapshot(item);
    const acceptable = snapshot.confidence === 'high' || (options.includeMedium === true && snapshot.confidence === 'medium' && snapshot.ambiguities.length === 0);
    if (!acceptable) { excludedItemIds.push(item.id); continue; }
    if (sources.length >= limit) { excludedItemIds.push(item.id); continue; }
    sources.push({ itemId: item.id, title: item.title || 'Saved item', summary: snapshot.summary, confidence: snapshot.confidence, entities: snapshot.entities.filter((entity) => entity.confidence !== 'low').slice(0, 8).map((entity) => `${entity.kind}:${entity.value}`) });
  }
  return { clusterId: options.cluster?.id, label: options.cluster?.label, sources, excludedItemIds };
}
