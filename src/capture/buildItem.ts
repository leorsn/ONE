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
  const isImage = sourceType === 'screenshot' || sourceType === 'photo' || Boolean(localAttachmentUri && attachmentMimeType?.startsWith('image/'));

  return {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    title: draft.title.trim() || 'Captured in ONE',
    rawInput: rawInput?.trim() || draft.extractedText || draft.userContext || draft.title,
    type: draft.itemType,
    date: draft.date || undefined,
    time: draft.time || undefined,
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
    userContext: draft.userContext?.trim() || undefined,
    documentKind: draft.documentKind,
    merchant: draft.merchant?.trim() || undefined,
    amount: draft.amount,
    currency: draft.currency?.trim().toUpperCase() || undefined,
    tags: Array.from(new Set(draft.tags.map((value) => value.trim()).filter(Boolean))),
    entities: Array.from(new Set(draft.entities.map((value) => value.trim()).filter(Boolean))),
    syncState: 'local',
    createdAt: timestamp,
    updatedAt: timestamp
  };
}
