import { summaryForItem } from '../capture/itemMetadata.ts';
import type { OneInboxAction, OneItem, OneUnderstandingConfidence } from '../types/item';
import type { IntelligenceEntity, IntelligenceSnapshot, IntelligenceSuggestion } from './types';

const confidenceRank: Record<OneUnderstandingConfidence, number> = { low: 0, medium: 1, high: 2 };

export function buildIntelligenceSnapshot(item: OneItem, now = new Date()): IntelligenceSnapshot {
  const entities = extractStructuredEntities(item);
  const confidence = deriveOverallConfidence(item, entities);
  return {
    itemId: item.id,
    schemaVersion: 1,
    summary: item.summary || summaryForItem(item),
    confidence,
    entities,
    suggestions: suggestActions(item, confidence),
    ambiguities: item.ambiguities ?? [],
    generatedAt: now.toISOString()
  };
}

export function extractStructuredEntities(item: OneItem): IntelligenceEntity[] {
  const out: IntelligenceEntity[] = [];
  const add = (entity: IntelligenceEntity | undefined) => {
    if (!entity?.value.trim()) return;
    if (!out.some((candidate) => candidate.kind === entity.kind && candidate.value === entity.value)) out.push(entity);
  };
  const fieldConfidence = (field: string): OneUnderstandingConfidence => item.confidenceMetadata?.fields?.[field] ?? item.understandingConfidence ?? 'medium';

  item.people?.forEach((value) => add({ kind: 'person', value, confidence: fieldConfidence('people'), sourceField: 'people' }));
  if (item.merchant) add({ kind: 'organization', value: item.merchant, confidence: fieldConfidence('merchant'), sourceField: 'merchant' });
  if (item.location) add({ kind: 'place', value: item.location, confidence: fieldConfidence('location'), sourceField: 'location' });
  item.extractedDates?.forEach((value) => add({ kind: 'date', value, confidence: fieldConfidence('extractedDates'), sourceField: 'extractedDates' }));
  item.extractedTimes?.forEach((value) => add({ kind: 'time', value, confidence: fieldConfidence('extractedTimes'), sourceField: 'extractedTimes' }));
  item.extractedUrls?.forEach((value) => add({ kind: 'url', value, confidence: fieldConfidence('extractedUrls'), sourceField: 'extractedUrls' }));
  if (item.amount !== undefined) add({ kind: 'money', value: `${item.amount} ${item.currency ?? 'EUR'}`, confidence: fieldConfidence('amount'), sourceField: 'amount' });
  return out;
}

export function deriveOverallConfidence(item: OneItem, entities = extractStructuredEntities(item)): OneUnderstandingConfidence {
  const declared = item.confidenceMetadata?.overall ?? item.understandingConfidence ?? 'medium';
  if (item.reviewStatus === 'needs_review' || item.ambiguities?.length) return confidenceRank[declared] > 0 ? 'medium' : 'low';
  if (!entities.length && item.kind === 'unknown') return 'low';
  return declared;
}

export function suggestActions(item: OneItem, confidence = deriveOverallConfidence(item)): IntelligenceSuggestion[] {
  const suggestions: IntelligenceSuggestion[] = [];
  const push = (action: OneInboxAction, reason: string, actionConfidence: OneUnderstandingConfidence = confidence) => {
    if (item.executedActions?.includes(action) || suggestions.some((entry) => entry.action === action)) return;
    suggestions.push({ action, reason, confidence: actionConfidence, requiresConfirmation: true });
  };

  const hasSchedule = Boolean(item.date || item.reminderAt || item.taskDueAt || item.extractedDates?.length);
  if ((item.eventIntent || item.kind === 'event' || item.type === 'appointment' || item.type === 'event') && hasSchedule) {
    push('add_to_calendar', 'A dated event was recognized.');
  }
  if ((item.taskIntent || item.kind === 'reminder' || item.type === 'task' || item.type === 'reminder') && hasSchedule) {
    push('create_reminder', 'A time-sensitive task or reminder was recognized.');
  }
  if (item.documentKind === 'receipt' || item.kind === 'receipt' || item.amount !== undefined) {
    push('save_purchase', 'Purchase evidence or an amount was recognized.');
  } else if (item.kind === 'document' || item.type === 'document' || item.kind === 'link' || item.type === 'link') {
    push('save_reference', 'This content is useful as a saved reference.');
  } else if (!suggestions.length) {
    push('save_note', 'Keep this information in NEVER memory.', confidence === 'low' ? 'medium' : confidence);
  }

  return confidence === 'low' ? suggestions.map((suggestion) => ({ ...suggestion, confidence: 'low' })) : suggestions;
}