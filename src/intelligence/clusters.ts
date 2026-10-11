import type { OneItem } from '@/src/types/item';
import { buildIntelligenceSnapshot } from './engine';
import { buildMemoryRelationships, type MemoryRelationship } from './relationships';

export type MemoryCluster = { id: string; itemIds: string[]; label: string; score: number; anchorEntities: string[] };

export function buildMemoryClusters(items: OneItem[], relationships: MemoryRelationship[] = buildMemoryRelationships(items)): MemoryCluster[] {
  const byId = new Map(items.map((item) => [item.id, item])); const adjacency = new Map<string, Set<string>>();
  for (const edge of relationships) { if (!adjacency.has(edge.itemId)) adjacency.set(edge.itemId, new Set()); if (!adjacency.has(edge.relatedItemId)) adjacency.set(edge.relatedItemId, new Set()); adjacency.get(edge.itemId)!.add(edge.relatedItemId); adjacency.get(edge.relatedItemId)!.add(edge.itemId); }
  const visited = new Set<string>(); const clusters: MemoryCluster[] = [];
  for (const item of items) {
    if (visited.has(item.id) || !adjacency.has(item.id)) continue;
    const queue = [item.id]; const ids: string[] = []; visited.add(item.id);
    while (queue.length) { const id = queue.shift()!; ids.push(id); for (const next of adjacency.get(id) ?? []) if (!visited.has(next)) { visited.add(next); queue.push(next); } }
    if (ids.length < 2) continue;
    const members = ids.map((id) => byId.get(id)).filter((value): value is OneItem => Boolean(value));
    const anchors = dominantEntities(members); const score = relationships.filter((edge) => ids.includes(edge.itemId) && ids.includes(edge.relatedItemId)).reduce((sum, edge) => sum + edge.score, 0);
    clusters.push({ id: `cluster:${ids.slice().sort().join(':')}`, itemIds: ids, label: anchors[0] ?? members[0]?.title ?? 'Related memories', score, anchorEntities: anchors });
  }
  return clusters.sort((a, b) => b.score - a.score);
}

function dominantEntities(items: OneItem[]) {
  const counts = new Map<string, { label: string; count: number }>();
  for (const item of items) for (const entity of buildIntelligenceSnapshot(item).entities) {
    if (entity.confidence === 'low' || !['person', 'organization', 'place'].includes(entity.kind)) continue;
    const key = entity.value.trim().toLowerCase(); const current = counts.get(key); counts.set(key, { label: current?.label ?? entity.value.trim(), count: (current?.count ?? 0) + 1 });
  }
  return [...counts.values()].filter((entry) => entry.count > 1).sort((a, b) => b.count - a.count).slice(0, 3).map((entry) => entry.label);
}
