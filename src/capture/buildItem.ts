import { initialTriageStateForItem } from '../inbox/triage.ts';
import { normalizeContextLabel, normalizeTags } from './contextNormalization.ts';
import type { CaptureDraft } from './core';
import type { OneItem, OneSourceType } from '../types/item';

export function buildItemFromCapture({
  draft,
  sourceType,
  rawInput,
  originalText,
  sourceApp,
  localAttachmentUri,
  attachmentMimeType,
  attachmentName,
  now = new Date()
}: {
  draft: CaptureDraft;
  sourceType: OneSourceType;
  rawInput?: string;
  originalText?: string;
  sourceApp?: string;
  localAttachmentUri?: string;
  attachmentMimeType?: string;
  attachmentName?: string;
  now?: Date;
}): OneItem {
  const timestamp = now.toISOString();
  const isImage =
    sourceType === 'screenshot' ||
    sourceType === 'photo' ||
    Boolean(localAttachmentUri && attachmentMimeType?.startsWith('image/'));
  const reviewStatus = draft.needsReview.length
    ? 'needs_review' as const
    : draft.confirmedFields.length || draft.destinationConfirmed
      ? 'reviewed' as const
      : 'ready' as const;
  const userContext = normalizeContextLabel(draft.userContext);
  const extractedUrls = Array.from(new Set([
    ...(draft.url ? [draft.url] : []),
    ...draft.entities
      .filter((entity) => entity.startsWith('url:'))
      .map((entity) => entity.slice(4))
      .filter(Boolean)
  ]));
  const taskIntent = draft.itemType === 'task' || draft.itemType === 'reminder';
  const eventIntent = draft.itemType === 'appointment' || draft.itemType === 'event';
  const resolvedDestination = draft.destination;
  const automaticallyProcessed = !draft.needsReview.length && resolvedDestination !== 'inbox';

  const item: OneItem = {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    title: draft.title.trim() || 'Captured in NEVER',
    rawInput: rawInput?.trim() || draft.extractedText || draft.userContext || draft.title,
    type: draft.itemType,
    kind: draft.canonicalKind,
    summary: draft.summary?.trim() || undefined,
    people: draft.people,
    destination: resolvedDestination,
    reviewStatus,
    ambiguities: draft.ambiguities.map((ambiguity) => ambiguity.message),
    understandingConfidence: draft.overallConfidence,
    processingStatus: reviewStatus === 'needs_review' ? 'needs_attention' : 'ready',
    confidenceMetadata: {
      overall: draft.overallConfidence,
      fields: draft.fieldConfidence
    },
    aiMetadata: { origin: 'deterministic' },
    executedActions: [],
    processedAt: draft.destinationConfirmed || automaticallyProcessed ? timestamp : undefined,
    capturedAt: timestamp,
    date: draft.date || undefined,
    time: draft.time || undefined,
    extractedDates: draft.date ? [draft.date] : [],
    extractedTimes: draft.time ? [draft.time] : [],
    extractedUrls,
    taskIntent,
    eventIntent,
    category: draft.category || undefined,
    location: draft.location || undefined,
    url: draft.url || undefined,
    completed: false,
    saved: draft.saved,
    sourceType,
    sourceApp,
    originalText: originalText?.trim() || undefined,
    attachmentUrl: localAttachmentUri,
    imageUrl: isImage ? localAttachmentUri : undefined,
    localAttachmentUri,
    localAttachmentMimeType: attachmentMimeType,
    localAttachmentName: attachmentName,
    extractedText: draft.extractedText?.trim() || undefined,
    userContext,
    documentKind: draft.documentKind,
    merchant: draft.merchant?.trim() || undefined,
    amount: draft.amount,
    currency: draft.currency?.trim().toUpperCase() || undefined,
    tags: normalizeTags(draft.tags),
    entities: Array.from(new Set(draft.entities.map((value) => value.trim()).filter(Boolean))),
    notificationStatus: ['task', 'reminder', 'appointment', 'event'].includes(draft.itemType) && Boolean(draft.date)
      ? 'not_scheduled'
      : 'not_applicable',
    syncState: 'local',
    createdAt: timestamp,
    updatedAt: timestamp
  };

  return {
    ...item,
    triageState: draft.destinationConfirmed || automaticallyProcessed ? 'processed' : initialTriageStateForItem(item)
  };
}
