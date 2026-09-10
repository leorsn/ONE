import type { ResolvedSharePayload, SharePayload } from 'expo-sharing';
import { buildItemFromCapture } from '@/src/capture/buildItem';
import { interpretCapture, type CaptureDraft } from '@/src/capture/core';
import type { OneItem, OneSourceType } from '@/src/types/item';

export function createShareDraft({
  payload,
  resolved,
  context,
  extractedText
}: {
  payload: SharePayload;
  resolved?: ResolvedSharePayload;
  context?: string;
  extractedText?: string;
}): CaptureDraft {
  const rawValue = payload.value?.trim() || '';
  const resolvedType = resolved?.contentType ?? null;
  const sourceType: OneSourceType =
    resolvedType === 'image' || payload.shareType === 'image'
      ? 'screenshot'
      : payload.shareType === 'url'
        ? 'link'
        : 'share';

  return interpretCapture({
    rawText: rawValue || resolved?.originalName || '',
    extractedText,
    userContext: context,
    sourceType,
    isImage: sourceType === 'screenshot',
    url: payload.shareType === 'url' || resolvedType === 'website' ? rawValue : undefined
  });
}

export function createItemFromShare({
  payload,
  resolved,
  context,
  storedAttachmentPath,
  extractedText,
  draft
}: {
  payload: SharePayload;
  resolved?: ResolvedSharePayload;
  context: string;
  storedAttachmentPath?: string;
  extractedText?: string;
  draft?: CaptureDraft;
}): OneItem {
  const rawValue = payload.value?.trim() || '';
  const resolvedType = resolved?.contentType ?? null;
  const sourceType: OneSourceType =
    resolvedType === 'image' || payload.shareType === 'image'
      ? 'screenshot'
      : payload.shareType === 'url'
        ? 'link'
        : 'share';

  const reviewed = draft || createShareDraft({ payload, resolved, context, extractedText });

  return buildItemFromCapture({
    draft: reviewed,
    sourceType,
    rawInput: [rawValue, reviewed.extractedText].filter(Boolean).join('\n'),
    originalText: payload.shareType === 'text' ? rawValue : undefined,
    localAttachmentUri: storedAttachmentPath,
    attachmentMimeType: resolved?.contentMimeType || undefined,
    attachmentName: resolved?.originalName || undefined
  });
}
