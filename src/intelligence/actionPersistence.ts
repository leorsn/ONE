import type { OneInboxAction, OneItem } from '@/src/types/item';
import type { IntelligenceActionRecord } from './actionLifecycle';

export type PersistedActionOutcome = { item: OneItem; record: IntelligenceActionRecord };

/** Persist only completed product actions. Suggested/confirmed/executing are transient UI state. */
export function persistExecutedAction(item: OneItem, record: IntelligenceActionRecord, now = new Date()): PersistedActionOutcome {
  if (record.itemId !== item.id) throw new Error('action_item_mismatch');
  if (record.state !== 'executed') throw new Error('action_not_executed');
  const action = record.action as OneInboxAction;
  const executedActions = Array.from(new Set([...(item.executedActions ?? []), action]));
  return { item: { ...item, executedActions, processedAt: now.toISOString(), updatedAt: now.toISOString() }, record };
}

export function hasExecutedAction(item: OneItem, action: OneInboxAction) { return Boolean(item.executedActions?.includes(action)); }
