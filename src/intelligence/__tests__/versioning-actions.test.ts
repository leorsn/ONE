import { NEVER_INTELLIGENCE_VERSION, migrateIntelligenceBatch, planIntelligenceMigration } from '../versioning';
import { persistExecutedAction } from '../actionPersistence';
import type { IntelligenceActionRecord } from '../actionLifecycle';
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
  ...patch
});

const executedRecord = (patch: Partial<IntelligenceActionRecord> = {}): IntelligenceActionRecord => ({
  id: 'r',
  itemId: 'a',
  action: 'save_note',
  confidence: 'high',
  reason: 'test',
  requiresConfirmation: true,
  state: 'executed',
  createdAt: 'x',
  updatedAt: 'x',
  ...patch
});

describe('intelligence versioning and persistence', () => {
  it('plans migration for unversioned memories', () => {
    expect(planIntelligenceMigration(item('a')).reason).toBe('missing-version');
  });

  it('plans migration for outdated memories', () => {
    const plan = planIntelligenceMigration(item('a', { aiMetadata: { version: '0.9.0' } }));
    expect(plan.needsMigration).toBe(true);
    expect(plan.reason).toBe('outdated-version');
  });

  it('prioritizes failed enrichment even when the version is current', () => {
    const plan = planIntelligenceMigration(item('a', {
      processingStatus: 'failed_enrichment',
      aiMetadata: { version: NEVER_INTELLIGENCE_VERSION, failureCode: 'timeout' }
    }));
    expect(plan.reason).toBe('failed-enrichment');
  });

  it('leaves current memories alone', () => {
    expect(planIntelligenceMigration(item('a', {
      aiMetadata: { version: NEVER_INTELLIGENCE_VERSION }
    })).needsMigration).toBe(false);
  });

  it('migrates in bounded batches', () => {
    const result = migrateIntelligenceBatch([item('a'), item('b'), item('c')], {
      limit: 2,
      now: new Date('2026-09-23T12:00:00.000Z')
    });
    expect(result.migrated).toBe(2);
    expect(result.remaining).toBe(1);
  });

  it('caps oversized migration batches', () => {
    const items = Array.from({ length: 120 }, (_, index) => item(String(index)));
    const result = migrateIntelligenceBatch(items, { limit: 1000 });
    expect(result.migrated).toBe(100);
    expect(result.remaining).toBe(20);
  });

  it('persists only executed actions', () => {
    const base = item('a');
    expect(persistExecutedAction(base, executedRecord()).item.executedActions).toContain('save_note');
    expect(() => persistExecutedAction(base, executedRecord({ state: 'confirmed' }))).toThrow('action_not_executed');
  });

  it('rejects an action belonging to another item', () => {
    expect(() => persistExecutedAction(item('a'), executedRecord({ itemId: 'b' }))).toThrow('action_item_mismatch');
  });
});
