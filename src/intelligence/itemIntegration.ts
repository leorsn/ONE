import type { OneItem } from '@/src/types/item';
import { processItemIntelligence } from './pipeline';

/** Applies deterministic intelligence while preserving device/cloud sync ownership. */
export function intelligenceReadyItem(item: OneItem, now = new Date()): OneItem {
  return processItemIntelligence(item, now).item;
}

/** Reprocess only when user edits fields that can change semantic meaning. */
export function shouldReprocessIntelligence(changes: Partial<OneItem>) {
  const semanticKeys: (keyof OneItem)[] = [
    'title', 'rawInput', 'originalText', 'extractedText', 'summary', 'type', 'kind',
    'date', 'time', 'location', 'url', 'people', 'entities', 'merchant', 'amount',
    'currency', 'documentKind', 'tags', 'userContext'
  ];
  return semanticKeys.some((key) => Object.prototype.hasOwnProperty.call(changes, key));
}

export function reprocessAfterEdit(item: OneItem, changes: Partial<OneItem>, now = new Date()) {
  return shouldReprocessIntelligence(changes) ? intelligenceReadyItem(item, now) : item;
}
