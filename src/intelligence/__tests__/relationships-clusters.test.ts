import { buildMemoryRelationships } from '../relationships';
import { buildMemoryClusters } from '../clusters';
import type { OneItem } from '@/src/types/item';

const item = (id: string, patch: Partial<OneItem> = {}): OneItem => ({ id, title: id, type: 'note', kind: 'note', completed: false, saved: true, sourceType: 'manual', tags: [], entities: [], createdAt: '2026-09-23T10:00:00.000Z', updatedAt: '2026-09-23T10:00:00.000Z', understandingConfidence: 'high', confidenceMetadata: { overall: 'high', fields: {} }, ...patch });

describe('memory graph', () => {
  it('builds a cluster from connected memories', () => { const items = [item('flight', { location: 'Munich' }), item('hotel', { location: 'Munich' }), item('dinner', { location: 'Munich' })]; const edges = buildMemoryRelationships(items); const clusters = buildMemoryClusters(items, edges); expect(edges.length).toBeGreaterThanOrEqual(3); expect(clusters).toHaveLength(1); expect(new Set(clusters[0].itemIds)).toEqual(new Set(['flight', 'hotel', 'dinner'])); expect(clusters[0].label).toBe('Munich'); });
  it('does not link memories through low-confidence entities', () => { const items = [item('a', { people: ['Alex'], confidenceMetadata: { overall: 'low', fields: { people: 'low' } } }), item('b', { people: ['Alex'], confidenceMetadata: { overall: 'low', fields: { people: 'low' } } })]; expect(buildMemoryRelationships(items)).toHaveLength(0); });
  it('keeps unrelated memories separate', () => { const items = [item('a', { location: 'Hamburg' }), item('b', { location: 'Munich' })]; expect(buildMemoryClusters(items)).toHaveLength(0); });
});
