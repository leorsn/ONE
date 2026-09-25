import type { OneItem } from '@/src/types/item';
import { processItemIntelligence } from './pipeline';
import { buildMemoryRelationships } from './relationships';
import { buildMemoryClusters } from './clusters';
import { buildIntelligenceContextPack } from './contextPack';
import { createActionRecords } from './actionLifecycle';

export function buildNeverIntelligenceState(items: OneItem[], now = new Date()) {
  const processed = items.map((item) => processItemIntelligence(item, now));
  const normalizedItems = processed.map((entry) => entry.item);
  const relationships = buildMemoryRelationships(normalizedItems);
  const clusters = buildMemoryClusters(normalizedItems, relationships);
  const contextPacks = clusters.map((cluster) => buildIntelligenceContextPack(normalizedItems, { cluster, includeMedium: false }));
  const actions = processed.flatMap((entry) => createActionRecords(entry.item.id, entry.snapshot.suggestions, now));
  return { items: normalizedItems, snapshots: processed.map((entry) => entry.snapshot), relationships, clusters, contextPacks, actions, changedItemIds: processed.filter((entry) => entry.changed).map((entry) => entry.item.id) };
}
