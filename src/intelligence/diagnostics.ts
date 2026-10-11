import type { OneItem } from '@/src/types/item';
import { buildIntelligenceSnapshot } from './engine';
import { planIntelligenceMigration } from './versioning';

export type IntelligenceDiagnosticCode = 'needs-review' | 'low-confidence' | 'ambiguity' | 'failed-enrichment' | 'outdated-intelligence' | 'missing-content';
export type IntelligenceDiagnostic = { itemId: string; code: IntelligenceDiagnosticCode; severity: 'info' | 'warning' | 'error'; detail?: string };

/** Diagnostics intentionally contain no raw captured text or attachment contents. */
export function diagnoseItemIntelligence(item: OneItem): IntelligenceDiagnostic[] {
  const snapshot = buildIntelligenceSnapshot(item); const diagnostics: IntelligenceDiagnostic[] = [];
  if (item.processingStatus === 'failed_enrichment') diagnostics.push({ itemId: item.id, code: 'failed-enrichment', severity: 'error', detail: item.aiMetadata?.failureCode });
  if (item.reviewStatus === 'needs_review' || item.processingStatus === 'needs_attention') diagnostics.push({ itemId: item.id, code: 'needs-review', severity: 'warning' });
  if (snapshot.confidence === 'low') diagnostics.push({ itemId: item.id, code: 'low-confidence', severity: 'warning' });
  if (snapshot.ambiguities.length) diagnostics.push({ itemId: item.id, code: 'ambiguity', severity: 'warning', detail: `${snapshot.ambiguities.length}` });
  if (planIntelligenceMigration(item).needsMigration) diagnostics.push({ itemId: item.id, code: 'outdated-intelligence', severity: 'info', detail: item.aiMetadata?.version });
  if (!item.rawInput && !item.originalText && !item.extractedText && !item.summary && !item.title) diagnostics.push({ itemId: item.id, code: 'missing-content', severity: 'error' });
  return diagnostics;
}

export function buildIntelligenceHealthReport(items: OneItem[]) {
  const diagnostics = items.flatMap(diagnoseItemIntelligence);
  const count = (severity: IntelligenceDiagnostic['severity']) => diagnostics.filter((entry) => entry.severity === severity).length;
  return { totalItems: items.length, healthyItems: items.filter((item) => diagnoseItemIntelligence(item).length === 0).length, warnings: count('warning'), errors: count('error'), info: count('info'), diagnostics };
}
