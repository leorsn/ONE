import type { OneItem } from '@/src/types/item';
import { buildIntelligenceSnapshot } from './engine';

export type MemoryRelationshipReason = 'shared-person' | 'shared-organization' | 'shared-place' | 'shared-date' | 'shared-url';
export type MemoryRelationship = { itemId: string; relatedItemId: string; score: number; reasons: MemoryRelationshipReason[] };

export function buildMemoryRelationships(items: OneItem[], minimumScore = 3): MemoryRelationship[] {
  const snapshots = new Map(items.map((item) => [item.id, buildIntelligenceSnapshot(item)]));
  const relationships: MemoryRelationship[] = [];
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const left = snapshots.get(items[i].id)!; const right = snapshots.get(items[j].id)!;
      const reasons: MemoryRelationshipReason[] = [];
      let score = 0;
      for (const [kind, reason, weight] of [
        ['person', 'shared-person', 4], ['organization', 'shared-organization', 4], ['place', 'shared-place', 3], ['date', 'shared-date', 2], ['url', 'shared-url', 2]
      ] as const) {
        if (sharesEntity(left.entities, right.entities, kind)) { reasons.push(reason); score += weight; }
      }
      if (score >= minimumScore) relationships.push({ itemId: items[i].id, relatedItemId: items[j].id, score, reasons });
    }
  }
  return relationships.sort((a, b) => b.score - a.score);
}

export function relatedItemIds(itemId: string, relationships: MemoryRelationship[], limit = 6) {
  return relationships.filter((edge) => edge.itemId === itemId || edge.relatedItemId === itemId).sort((a, b) => b.score - a.score).slice(0, limit).map((edge) => edge.itemId === itemId ? edge.relatedItemId : edge.itemId);
}

function sharesEntity(left: ReturnType<typeof buildIntelligenceSnapshot>['entities'], right: ReturnType<typeof buildIntelligenceSnapshot>['entities'], kind: string) {
  const values = new Set(left.filter((entity) => entity.kind === kind && entity.confidence !== 'low').map((entity) => normalize(entity.value)));
  return right.some((entity) => entity.kind === kind && entity.confidence !== 'low' && values.has(normalize(entity.value)));
}
function normalize(value: string) { return value.trim().toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, ''); }
