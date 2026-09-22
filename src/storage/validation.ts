import type { OneItem } from '../types/item.ts';

const requiredStrings = ['id', 'title', 'type', 'sourceType', 'createdAt', 'updatedAt'] as const;
const lists = ['tags', 'entities', 'people', 'ambiguities', 'extractedDates', 'extractedTimes', 'extractedUrls', 'executedActions'] as const;
const strings = ['rawInput', 'kind', 'summary', 'destination', 'reviewStatus', 'understandingConfidence', 'processingStatus', 'triageState', 'processedAt', 'archivedAt', 'deferredUntil', 'date', 'time', 'reminderAt', 'capturedAt', 'taskDueAt', 'notificationId', 'notificationStatus', 'category', 'location', 'url', 'notes', 'sourceApp', 'originalText', 'attachmentUrl', 'imageUrl', 'localAttachmentUri', 'localAttachmentMimeType', 'localAttachmentName', 'extractedText', 'userContext', 'documentKind', 'merchant', 'currency', 'syncState', 'syncErrorAt', 'syncRetryAt'] as const;

/** Fail closed on corruption: never turn unreadable persisted data into an empty store. */
export function decodeStoredItems(raw: string): OneItem[] {
  const value: unknown = JSON.parse(raw);
  if (!Array.isArray(value)) throw new Error('The saved memory collection could not be read.');
  const ids = new Set<string>();
  return value.map((entry: unknown) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('A saved memory could not be read.');
    const item = entry as Record<string, unknown>;
    if (requiredStrings.some((key) => typeof item[key] !== 'string') || !item.id || ids.has(item.id as string)) throw new Error('A saved memory has invalid identity fields.');
    if (typeof item.completed !== 'boolean' || typeof item.saved !== 'boolean') throw new Error('A saved memory has invalid state.');
    if (strings.some((key) => item[key] !== undefined && typeof item[key] !== 'string')) throw new Error('A saved memory has invalid text fields.');
    if (lists.some((key) => item[key] !== undefined && (!Array.isArray(item[key]) || !(item[key] as unknown[]).every((value) => typeof value === 'string')))) throw new Error('A saved memory has invalid list fields.');
    if (item.amount !== undefined && (typeof item.amount !== 'number' || !Number.isFinite(item.amount))) throw new Error('A saved memory has an invalid amount.');
    ids.add(item.id as string);
    // Older collections may not contain optional arrays. Normalize those only.
    return { ...item, tags: item.tags ?? [], entities: item.entities ?? [] } as OneItem;
  });
}
