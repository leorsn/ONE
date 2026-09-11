import type {
  OneDestination,
  OneItem,
  OneItemKind,
  OneReviewStatus,
  OneUnderstandingConfidence
} from '@/src/types/item';

export function canonicalKindForItem(
  item: Pick<OneItem, 'type' | 'documentKind' | 'sourceType'>
): OneItemKind {
  if (item.documentKind === 'receipt') return 'receipt';
  if (item.type === 'document') return 'document';
  if (item.type === 'appointment' || item.type === 'event') return 'event';
  if (item.type === 'reminder') return 'reminder';
  if (item.type === 'link') return 'link';
  if (
    item.sourceType === 'screenshot' ||
    item.sourceType === 'photo' ||
    (item.sourceType === 'scan' && item.type !== 'document')
  ) return 'image';
  if (['note', 'idea', 'travel', 'shopping', 'task'].includes(item.type)) return 'note';
  return 'unknown';
}

export function destinationForItem(
  item: Pick<OneItem, 'type' | 'kind' | 'date' | 'reviewStatus'>
): OneDestination {
  if (item.reviewStatus === 'needs_review' || item.kind === 'unknown') return 'inbox';
  if (
    item.kind === 'event' ||
    item.kind === 'reminder' ||
    item.type === 'appointment' ||
    item.type === 'event' ||
    item.type === 'reminder' ||
    (item.type === 'task' && Boolean(item.date))
  ) return 'calendar';
  if (item.type === 'task' && !item.date) return 'inbox';
  return 'saved';
}

export function summaryForItem(item: Pick<
  OneItem,
  'title' | 'date' | 'time' | 'location' | 'merchant' | 'amount' | 'currency' | 'userContext' | 'extractedText'
>) {
  const structured = [
    item.merchant && item.merchant !== item.title ? item.merchant : undefined,
    item.amount !== undefined ? formatAmount(item.amount, item.currency) : undefined,
    item.date,
    item.time,
    item.location
  ].filter(Boolean);

  if (structured.length) return truncate(`${item.title} · ${structured.join(' · ')}`, 220);

  const contextual = firstUsefulLine(item.userContext) || firstUsefulLine(item.extractedText);
  if (contextual && contextual !== item.title) return truncate(contextual, 220);
  return truncate(item.title, 220);
}

export function ensureCanonicalItemMetadata(item: OneItem): OneItem {
  const kind = item.kind ?? canonicalKindForItem(item);
  const reviewStatus: OneReviewStatus = item.reviewStatus ?? 'ready';
  const destination = item.destination ?? destinationForItem({ ...item, kind, reviewStatus });
  const understandingConfidence: OneUnderstandingConfidence = item.understandingConfidence ?? 'medium';

  return {
    ...item,
    kind,
    summary: item.summary || summaryForItem(item),
    people: item.people ?? [],
    destination,
    reviewStatus,
    ambiguities: item.ambiguities ?? [],
    understandingConfidence
  };
}

export function reviewedItemMetadata(item: OneItem): Pick<
  OneItem,
  'kind' | 'destination' | 'reviewStatus' | 'ambiguities' | 'summary' | 'understandingConfidence'
> {
  const kind = item.kind ?? canonicalKindForItem(item);
  const reviewStatus: OneReviewStatus = 'reviewed';
  return {
    kind,
    destination: destinationForItem({ ...item, kind, reviewStatus }),
    reviewStatus,
    ambiguities: [],
    summary: summaryForItem(item),
    understandingConfidence: 'high'
  };
}

function firstUsefulLine(value?: string) {
  return value
    ?.split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
}

function formatAmount(amount: number, currency = 'EUR') {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function truncate(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}
