import type {
  OneInboxAction,
  OneItem,
  OneTriageState,
  OneUnderstandingConfidence
} from '../types/item';

export type ProposedInboxAction = {
  id: OneInboxAction;
  label: string;
  reason: string;
  confidence: OneUnderstandingConfidence;
  primary: boolean;
};

export function triageStateForItem(item: OneItem): OneTriageState {
  if (item.triageState) return item.triageState;
  if (item.archivedAt) return 'archived';
  if (item.processedAt || (item.executedActions?.length ?? 0) > 0) return 'processed';
  if (item.reviewStatus === 'needs_review' || item.understandingConfidence === 'low') return 'needs_review';
  if (item.destination && item.destination !== 'inbox') return 'processed';
  if (isActionableByEvidence(item)) return 'actionable';
  return 'new';
}

export function initialTriageStateForItem(item: OneItem): OneTriageState {
  return triageStateForItem({ ...item, triageState: undefined });
}

export function isInboxActive(item: OneItem, now = new Date()) {
  const state = triageStateForItem(item);
  if (state === 'processed' || state === 'archived') return false;
  if (item.deferredUntil && new Date(item.deferredUntil).getTime() > now.getTime()) return false;
  return true;
}

export function proposedActionsForItem(item: OneItem): ProposedInboxAction[] {
  const state = triageStateForItem(item);
  if (state === 'archived') return [];

  const confidence = item.understandingConfidence ?? 'medium';
  const safeForConsequentialAction = confidence !== 'low' && item.reviewStatus !== 'needs_review';
  const actions: ProposedInboxAction[] = [];

  const add = (action: ProposedInboxAction) => {
    if (item.executedActions?.includes(action.id)) return;
    if (!actions.some((candidate) => candidate.id === action.id)) actions.push(action);
  };

  const eventLike = item.kind === 'event' || item.type === 'appointment' || item.type === 'event';
  const reminderLike = item.kind === 'reminder' || item.type === 'reminder' || item.type === 'task';

  if (eventLike && item.date && safeForConsequentialAction) {
    add({
      id: 'add_to_calendar',
      label: 'Add to Calendar',
      reason: item.time ? `Date and time found · ${item.date} at ${item.time}` : `Date found · ${item.date}`,
      confidence,
      primary: confidence === 'high'
    });
    add({
      id: 'create_reminder',
      label: 'Add reminder',
      reason: 'Use the confirmed event date for a ONE reminder.',
      confidence,
      primary: false
    });
    add({
      id: 'save_reference',
      label: 'Save reference',
      reason: 'Keep the captured source available in Saved.',
      confidence,
      primary: false
    });
  } else if (reminderLike && item.date && safeForConsequentialAction) {
    add({
      id: 'create_reminder',
      label: item.type === 'reminder' ? 'Confirm reminder' : 'Create reminder',
      reason: item.time ? `Due ${item.date} at ${item.time}` : `Due ${item.date}`,
      confidence,
      primary: confidence === 'high'
    });
  } else if (item.kind === 'receipt' || item.documentKind === 'receipt') {
    add({
      id: 'save_purchase',
      label: 'Save purchase',
      reason: [item.merchant, item.amount !== undefined ? formatAmount(item.amount, item.currency) : undefined]
        .filter(Boolean)
        .join(' · ') || 'Keep this receipt as a purchase reference.',
      confidence,
      primary: confidence !== 'low'
    });
  } else if (item.kind === 'document' || item.type === 'document' || item.kind === 'link' || item.kind === 'image') {
    add({
      id: 'save_reference',
      label: 'Save reference',
      reason: 'Keep the captured source searchable and available for recall.',
      confidence,
      primary: confidence !== 'low'
    });
  } else if (['note', 'idea', 'travel', 'shopping'].includes(item.type) || item.kind === 'note') {
    add({
      id: 'save_note',
      label: item.type === 'idea' ? 'Save idea' : 'Save',
      reason: 'Keep this as a durable ONE memory.',
      confidence,
      primary: true
    });
  }

  if (!actions.length) {
    add({
      id: 'save_reference',
      label: 'Save reference',
      reason: confidence === 'low'
        ? 'ONE is not confident enough to create a calendar item or reminder automatically.'
        : 'Keep this capture without adding unsupported assumptions.',
      confidence,
      primary: false
    });
  }

  return actions;
}

export function triageActionChanges(
  item: OneItem,
  action: OneInboxAction,
  now = new Date()
): Partial<OneItem> | null {
  if (item.executedActions?.includes(action)) return null;
  const timestamp = now.toISOString();
  const executedActions = Array.from(new Set([...(item.executedActions ?? []), action]));
  const processed = {
    triageState: 'processed' as const,
    processedAt: item.processedAt ?? timestamp,
    deferredUntil: undefined,
    reviewStatus: 'reviewed' as const,
    ambiguities: [],
    executedActions
  };

  if (action === 'add_to_calendar') {
    if (!item.date) return null;
    return {
      ...processed,
      type: ['appointment', 'event'].includes(item.type) ? item.type : 'event',
      kind: 'event',
      destination: 'calendar',
      saved: true
    };
  }

  if (action === 'create_reminder') {
    if (!item.date) return null;
    return {
      ...processed,
      type: 'reminder',
      kind: 'reminder',
      destination: 'calendar',
      completed: false,
      saved: true
    };
  }

  if (action === 'save_purchase') {
    return { ...processed, destination: 'saved', saved: true };
  }

  if (action === 'save_reference' || action === 'save_note') {
    return { ...processed, destination: 'saved', saved: true };
  }

  if (action === 'mark_processed') {
    const destination = item.destination === 'inbox'
      ? item.date && (item.kind === 'event' || item.kind === 'reminder')
        ? 'calendar'
        : 'saved'
      : item.destination;
    return { ...processed, destination, saved: destination === 'saved' ? true : item.saved };
  }

  if (action === 'archive') {
    return {
      triageState: 'archived',
      archivedAt: timestamp,
      processedAt: item.processedAt ?? timestamp,
      deferredUntil: undefined,
      executedActions
    };
  }

  return null;
}

export function confirmReviewChanges(item: OneItem): Partial<OneItem> {
  const confirmed: OneItem = {
    ...item,
    reviewStatus: 'reviewed',
    ambiguities: [],
    understandingConfidence: 'high',
    triageState: undefined,
    deferredUntil: undefined
  };
  const actions = proposedActionsForItem(confirmed);
  const actionable = actions.some((action) => ['add_to_calendar', 'create_reminder'].includes(action.id));
  return {
    reviewStatus: 'reviewed',
    ambiguities: [],
    understandingConfidence: 'high',
    triageState: actionable ? 'actionable' : 'new',
    deferredUntil: undefined
  };
}

export function deferReviewChanges(now = new Date(), hours = 24): Partial<OneItem> {
  const until = new Date(now.getTime() + hours * 60 * 60 * 1000);
  return { deferredUntil: until.toISOString() };
}

export function captureFingerprint(item: Pick<
  OneItem,
  'sourceType' | 'title' | 'rawInput' | 'originalText' | 'extractedText' | 'url' | 'merchant' | 'amount' | 'currency' | 'localAttachmentName'
>) {
  const basis = [
    item.sourceType,
    item.title,
    item.rawInput,
    item.originalText,
    item.extractedText,
    item.url,
    item.merchant,
    item.amount !== undefined ? String(item.amount) : undefined,
    item.currency,
    item.localAttachmentName
  ]
    .map(normalize)
    .filter(Boolean)
    .join('|');

  if (!basis) return undefined;
  let hash = 2166136261;
  for (let index = 0; index < basis.length; index += 1) {
    hash ^= basis.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `one-${(hash >>> 0).toString(36)}`;
}

export function findLikelyDuplicate(item: OneItem, items: OneItem[], maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
  const fingerprint = captureFingerprint(item);
  if (!fingerprint) return undefined;
  const created = new Date(item.createdAt).getTime();

  return items
    .filter((candidate) => candidate.id !== item.id && captureFingerprint(candidate) === fingerprint)
    .filter((candidate) => {
      const candidateCreated = new Date(candidate.createdAt).getTime();
      return Number.isFinite(created) && Number.isFinite(candidateCreated)
        ? Math.abs(created - candidateCreated) <= maxAgeMs
        : true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
}

export function triagePriority(item: OneItem) {
  const state = triageStateForItem(item);
  if (state === 'needs_review') return 0;
  if (state === 'actionable') return 1;
  if (state === 'new') return 2;
  if (state === 'processed') return 3;
  return 4;
}

function isActionableByEvidence(item: OneItem) {
  if (item.understandingConfidence === 'low') return false;
  if (item.kind === 'event' || item.kind === 'reminder') return Boolean(item.date);
  if (item.type === 'task' && item.date) return true;
  if (item.kind === 'receipt' || item.kind === 'document') return true;
  return false;
}

function normalize(value: string | number | undefined | null) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function formatAmount(amount: number, currency = 'EUR') {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
