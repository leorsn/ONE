import type { IntelligenceSuggestion } from './types';

export type IntelligenceActionState = 'suggested' | 'confirmed' | 'executing' | 'executed' | 'failed' | 'dismissed';
export type IntelligenceActionRecord = IntelligenceSuggestion & { id: string; itemId: string; state: IntelligenceActionState; createdAt: string; updatedAt: string; error?: string };

export function createActionRecords(itemId: string, suggestions: IntelligenceSuggestion[], now = new Date()): IntelligenceActionRecord[] {
  return suggestions.map((suggestion, index) => ({ ...suggestion, id: `${itemId}:${suggestion.action}:${index}`, itemId, state: 'suggested', createdAt: now.toISOString(), updatedAt: now.toISOString() }));
}
export function transitionAction(record: IntelligenceActionRecord, next: IntelligenceActionState, now = new Date(), error?: string): IntelligenceActionRecord {
  const allowed: Record<IntelligenceActionState, IntelligenceActionState[]> = { suggested: ['confirmed', 'dismissed'], confirmed: ['executing', 'dismissed'], executing: ['executed', 'failed'], executed: [], failed: ['confirmed', 'dismissed'], dismissed: [] };
  if (!allowed[record.state].includes(next)) throw new Error(`invalid_action_transition:${record.state}:${next}`);
  return { ...record, state: next, updatedAt: now.toISOString(), error: next === 'failed' ? error ?? 'action_failed' : undefined };
}
export function canExecuteAction(record: IntelligenceActionRecord) { return record.state === 'confirmed'; }
