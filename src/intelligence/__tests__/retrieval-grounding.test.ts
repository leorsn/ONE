import { intelligenceMatchScore } from '../retrieval';
import { buildRecallGroundingContext } from '../grounding';
import type { OneItem } from '@/src/types/item';
import type { RetrievalResult } from '@/src/search/retrieve';

const item = (id: string, patch: Partial<OneItem> = {}): OneItem => ({ id, title: id, type: 'note', kind: 'note', completed: false, saved: true, sourceType: 'manual', tags: [], entities: [], createdAt: '2026-09-23T10:00:00.000Z', updatedAt: '2026-09-23T10:00:00.000Z', understandingConfidence: 'high', confidenceMetadata: { overall: 'high', fields: {} }, ...patch });
const result = (value: OneItem): RetrievalResult => ({ item: value, score: 1, matchedTerms: [], reasons: ['text'] as RetrievalResult['reasons'] });

describe('intelligence retrieval and grounding', () => {
  it('weights high-confidence entities above low-confidence entities', () => { const high = item('high', { people: ['Alex'], confidenceMetadata: { overall: 'high', fields: { people: 'high' } } }); const low = item('low', { people: ['Alex'], understandingConfidence: 'low', confidenceMetadata: { overall: 'low', fields: { people: 'low' } } }); expect(intelligenceMatchScore(['alex'], high)).toBeGreaterThan(intelligenceMatchScore(['alex'], low)); });
  it('separates reliable sources from review sources', () => { const clean = item('clean', { people: ['Alex'] }); const uncertain = item('uncertain', { ambiguities: ['Unknown person'] }); const context = buildRecallGroundingContext([result(clean), result(uncertain)]); expect(context.reliableItemIds).toContain('clean'); expect(context.reviewItemIds).toContain('uncertain'); expect(context.confidence).toBe('medium'); });
  it('returns low grounding confidence when no evidence exists', () => { expect(buildRecallGroundingContext([]).confidence).toBe('low'); });
});
