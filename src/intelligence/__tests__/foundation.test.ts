import { transitionAction } from '../actionLifecycle';
import { buildIntelligenceContextPack } from '../contextPack';
import { buildMemoryRelationships } from '../relationships';
import type { OneItem } from '@/src/types/item';

const base = (id: string, patch: Partial<OneItem> = {}): OneItem => ({ id, title: id, type: 'note', completed: false, saved: true, sourceType: 'manual', tags: [], entities: [], createdAt: '2026-09-22T10:00:00.000Z', updatedAt: '2026-09-22T10:00:00.000Z', ...patch });

describe('NEVER intelligence foundation', () => {
  it('links memories sharing reliable people', () => { expect(buildMemoryRelationships([base('a', { people: ['Alex'] }), base('b', { people: ['Alex'] })]).length).toBe(1); });
  it('excludes low confidence memory from context packs', () => { const pack = buildIntelligenceContextPack([base('a', { understandingConfidence: 'low' })]); expect(pack.sources).toHaveLength(0); expect(pack.excludedItemIds).toEqual(['a']); });
  it('requires confirmation before execution', () => { const record = { id: 'x', itemId: 'a', action: 'save_note' as const, confidence: 'high' as const, reason: 'test', requiresConfirmation: true as const, state: 'suggested' as const, createdAt: 'x', updatedAt: 'x' }; expect(() => transitionAction(record, 'executing')).toThrow(/invalid_action_transition/); });
});
