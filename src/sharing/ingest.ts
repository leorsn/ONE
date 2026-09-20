import type { ResolvedSharePayload, SharePayload } from 'expo-sharing';
import { buildItemFromCapture } from '@/src/capture/buildItem';
import { interpretCapture, type CaptureDraft } from '@/src/capture/core';
import { enrichCaptureDraft } from '@/src/capture/enrichment';
import { normalizeSharedCapture, type SharedCaptureEnvelope } from './contract';
import type { OneItem } from '@/src/types/item';

export function createShareDraft({
  payload,
  resolved,
  context,
  extractedText,
  sourceApplication,
  now = new Date()
}: {
  payload: SharePayload;
  resolved?: ResolvedSharePayload;
  context?: string;
  extractedText?: string;
  sourceApplication?: string;
  now?: Date;
}): CaptureDraft {
  const envelope = createSharedCaptureEnvelope({ payload, resolved, sourceApplication, now });
  const input = {
    rawText: envelope.sharedText || envelope.normalizedUrl || envelope.originalName || '',
    extractedText,
    userContext: context,
    sourceType: 'share' as const,
    isImage: envelope.kind === 'image',
    url: envelope.normalizedUrl,
    now
  };

  return enrichCaptureDraft(interpretCapture(input), input);
}

export function createItemFromShare({
  payload,
  resolved,
  context,
  storedAttachmentPath,
  extractedText,
  draft,
  sourceApplication,
  now = new Date()
}: {
  payload: SharePayload;
  resolved?: ResolvedSharePayload;
  context: string;
  storedAttachmentPath?: string;
  extractedText?: string;
  draft?: CaptureDraft;
  sourceApplication?: string;
  now?: Date;
}): OneItem {
  const envelope = createSharedCaptureEnvelope({ payload, resolved, sourceApplication, now });
  const reviewed = draft || createShareDraft({
    payload,
    resolved,
    context,
    extractedText,
    sourceApplication,
    now
  });

  return buildItemFromCapture({
    draft: reviewed,
    sourceType: 'share',
    rawInput: [
      envelope.sharedText,
      envelope.normalizedUrl,
      envelope.originalName,
      reviewed.extractedText
    ].filter(Boolean).join('\n'),
    originalText: envelope.sharedText,
    sourceApp: envelope.sourceApplication,
    localAttachmentUri: storedAttachmentPath,
    attachmentMimeType: envelope.mimeType,
    attachmentName: envelope.originalName,
    now: new Date(envelope.captureTimestamp)
  });
}

export function createSharedCaptureEnvelope({
  payload,
  resolved,
  sourceApplication,
  now = new Date()
}: {
  payload: SharePayload;
  resolved?: ResolvedSharePayload;
  sourceApplication?: string;
  now?: Date;
}): SharedCaptureEnvelope {
  const rawValue = payload.value?.trim() || '';
  const contentUri = resolved && 'contentUri' in resolved ? resolved.contentUri || undefined : undefined;
  const isUrl = payload.shareType === 'url' || resolved?.contentType === 'website';
  const isText = payload.shareType === 'text';

  return normalizeSharedCapture({
    sourceApplication,
    sharedText: isText ? rawValue : undefined,
    sharedUrl: isUrl ? rawValue : undefined,
    fileUri: contentUri,
    mimeType: resolved?.contentMimeType || undefined,
    contentType: resolved?.contentType || payload.shareType || undefined,
    originalName: resolved?.originalName || undefined,
    captureTimestamp: now.toISOString(),
    rawPayload: {
      shareType: payload.shareType,
      value: rawValue || undefined
    }
  }, now);
}
