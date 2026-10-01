import { processItemIntelligence, shouldRequireReview } from '../pipeline';
import { buildIntelligenceSnapshot } from '../engine';
import type { OneItem } from '@/src/types/item';

const item = (patch: Partial<OneItem> = {}): OneItem => ({ id: 'item-1', title: 'Dinner with Alex', type: 'note', kind: 'note', completed: false, saved: true, sourceType: 'manual', tags: [], entities: [], createdAt: '2026-09-23T10:00:00.000Z', updatedAt: '2026-09-23T10:00:00.000Z', understandingConfidence: 'high', confidenceMetadata: { overall: 'high', fields: {} }, ...patch });

describe('intelligence pipeline', () => {
  it('is deterministic for the same semantic input', () => { const now = new Date('2026-09-23T12:00:00.000Z'); const a = processItemIntelligence(item(), now); const b = processItemIntelligence(item(), now); expect(a.item).toEqual(b.item); expect(a.snapshot).toEqual(b.snapshot); });
  it('requires review for explicit ambiguity', () => { const snapshot = buildIntelligenceSnapshot(item({ ambiguities: ['Which Alex?'] })); expect(shouldRequireReview(snapshot)).toBe(true); });
  it('preserves high-confidence clean memory as ready', () => { const result = processItemIntelligence(item({ people: ['Alex'], ambiguities: [] }), new Date('2026-09-23T12:00:00.000Z')); expect(result.item.reviewStatus).toBe('ready'); expect(result.item.processingStatus).toBe('ready'); });
  it('never executes suggested actions during processing', () => { const result = processItemIntelligence(item({ type: 'event', kind: 'event', date: '2026-10-01', eventIntent: true, executedActions: [] })); expect(result.item.executedActions).toEqual([]); expect(result.snapshot.suggestions.some((s) => s.action === 'add_to_calendar' && s.requiresConfirmation)).toBe(true); });
});
