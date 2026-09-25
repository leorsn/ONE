import { clearIntelligenceCache, getCachedIntelligenceSnapshot, intelligenceCacheSize, intelligenceSemanticKey } from '../cache';
import { clearNeverIntelligenceStateCache, getMemoizedNeverIntelligenceState } from '../stateCache';
import type { OneItem } from '@/src/types/item';

const item = (id: string, patch: Partial<OneItem> = {}): OneItem => ({
  id,
  title: id,
  type: 'note',
  kind: 'note',
  completed: false,
  saved: true,
  sourceType: 'manual',
  tags: [],
  entities: [],
  createdAt: '2026-09-23T10:00:00.000Z',
  updatedAt: '2026-09-23T10:00:00.000Z',
  understandingConfidence: 'high',
  confidenceMetadata: { overall: 'high', fields: {} },
  ...patch
});

describe('intelligence caching', () => {
  beforeEach(() => { clearIntelligenceCache(); clearNeverIntelligenceStateCache(); });

  it('uses the same semantic key when unordered metadata only changes order', () => {
    const a = item('a', { people: ['Alex', 'Sam'], tags: ['travel', 'work'], ambiguities: ['b', 'a'] });
    const b = item('a', { people: ['Sam', 'Alex'], tags: ['work', 'travel'], ambiguities: ['a', 'b'] });
    expect(intelligenceSemanticKey(a)).toBe(intelligenceSemanticKey(b));
  });

  it('invalidates a snapshot when semantic content changes', () => {
    const a = item('a', { title: 'Flight' });
    const b = item('a', { title: 'Hotel' });
    getCachedIntelligenceSnapshot(a);
    getCachedIntelligenceSnapshot(b);
    expect(intelligenceCacheSize()).toBe(2);
  });

  it('reuses aggregate state when only item ordering changes', () => {
    const a = item('a', { location: 'Munich' });
    const b = item('b', { location: 'Munich' });
    const first = getMemoizedNeverIntelligenceState([a, b]);
    const second = getMemoizedNeverIntelligenceState([b, a]);
    expect(second).toBe(first);
  });

  it('invalidates aggregate state after a semantic edit', () => {
    const a = item('a', { title: 'Before' });
    const first = getMemoizedNeverIntelligenceState([a]);
    const second = getMemoizedNeverIntelligenceState([{ ...a, title: 'After' }]);
    expect(second).not.toBe(first);
  });
});
