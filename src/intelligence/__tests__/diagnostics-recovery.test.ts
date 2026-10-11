import { buildIntelligenceHealthReport, diagnoseItemIntelligence } from '../diagnostics';
import { recoverIntelligenceItems } from '../recovery';
import { NEVER_INTELLIGENCE_VERSION } from '../versioning';
import type { OneItem } from '@/src/types/item';

const item = (id: string, patch: Partial<OneItem> = {}): OneItem => ({ id, title: id, type: 'note', kind: 'note', completed: false, saved: true, sourceType: 'manual', tags: [], entities: [], createdAt: '2026-09-23T10:00:00.000Z', updatedAt: '2026-09-23T10:00:00.000Z', understandingConfidence: 'high', confidenceMetadata: { overall: 'high', fields: {} }, ...patch });

describe('intelligence diagnostics and recovery', () => {
  it('reports failures without exposing captured text', () => { const value = item('a', { rawInput: 'private secret text', processingStatus: 'failed_enrichment', aiMetadata: { failureCode: 'timeout' } }); const diagnostics = diagnoseItemIntelligence(value); expect(diagnostics.some((entry) => entry.code === 'failed-enrichment')).toBe(true); expect(JSON.stringify(diagnostics)).not.toContain('private secret text'); });
  it('summarizes intelligence health', () => { const report = buildIntelligenceHealthReport([item('a', { aiMetadata: { version: NEVER_INTELLIGENCE_VERSION } }), item('b', { processingStatus: 'needs_attention', reviewStatus: 'needs_review', aiMetadata: { version: NEVER_INTELLIGENCE_VERSION } })]); expect(report.totalItems).toBe(2); expect(report.warnings).toBeGreaterThan(0); });
  it('recovers unversioned items in bounded batches', () => { const result = recoverIntelligenceItems([item('a'), item('b'), item('c')], { limit: 2, now: new Date('2026-09-23T12:00:00.000Z') }); expect(result.recoveredItemIds).toHaveLength(2); expect(result.skippedItemIds).toContain('c'); });
});
