import { NEVER_INTELLIGENCE_VERSION, migrateIntelligenceBatch, planIntelligenceMigration } from '../versioning';
import { persistExecutedAction } from '../actionPersistence';
import type { OneItem } from '@/src/types/item';

const item = (id: string, patch: Partial<OneItem> = {}): OneItem => ({ id, title: id, type: 'note', kind: 'note', completed: false, saved: true, sourceType: 'manual', tags: [], entities: [], createdAt: '2026-09-23T10:00:00.000Z', updatedAt: '2026-09-23T10:00:00.000Z', ...patch });

describe('intelligence versioning and persistence', () => {
  it('plans migration for unversioned memories', () => { expect(planIntelligenceMigration(item('a')).reason).toBe('missing-version'); });
  it('leaves current memories alone', () => { expect(planIntelligenceMigration(item('a', { aiMetadata: { version: NEVER_INTELLIGENCE_VERSION } })).needsMigration).toBe(false); });
  it('migrates in bounded batches', () => { const result = migrateIntelligenceBatch([item('a'), item('b'), item('c')], { limit: 2, now: new Date('2026-09-23T12:00:00.000Z') }); expect(result.migrated).toBe(2); expect(result.remaining).toBe(1); });
  it('persists only executed actions', () => { const base = item('a'); const record = { id: 'r', itemId: 'a', action: 'save_note' as const, confidence: 'high' as const, reason: 'test', requiresConfirmation: true as const, state: 'executed' as const, createdAt: 'x', updatedAt: 'x' }; expect(persistExecutedAction(base, record).item.executedActions).toContain('save_note'); expect(() => persistExecutedAction(base, { ...record, state: 'confirmed' })).toThrow('action_not_executed'); });
});
