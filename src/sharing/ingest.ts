import type { ResolvedSharePayload, SharePayload } from 'expo-sharing';
import { analyzeOcrText } from '@/src/ocr/intelligence';
import { parseQuickCapture } from '@/src/parser/quickCapture';
import type { OneItem, OneSourceType } from '@/src/types/item';

export function createItemFromShare({
  payload,
  resolved,
  context,
  storedAttachmentPath,
  extractedText
}: {
  payload: SharePayload;
  resolved?: ResolvedSharePayload;
  context: string;
  storedAttachmentPath?: string;
  extractedText?: string;
}): OneItem {
  const rawValue = payload.value?.trim() || '';
  const ocr = analyzeOcrText(extractedText || '', context);
  const combined = [context.trim(), rawValue, extractedText?.trim()].filter(Boolean).join(' ');
  const parsed = parseQuickCapture(combined || context || 'Shared item');
  const now = new Date().toISOString();

  const resolvedType = resolved?.contentType ?? null;
  const sourceType: OneSourceType =
    resolvedType === 'image' || payload.shareType === 'image'
      ? 'screenshot'
      : payload.shareType === 'url'
        ? 'link'
        : 'share';

  const isStructuredDocument = Boolean(ocr.documentKind);
  const title =
    context.trim() ||
    (ocr.merchant
      ? ocr.documentKind === 'invoice'
        ? `${ocr.merchant} invoice`
        : `${ocr.merchant} receipt`
      : undefined) ||
    ocr.suggestedTitle ||
    parsed?.title ||
    resolved?.originalName ||
    (payload.shareType === 'url' ? rawValue : 'Shared to ONE');

  const uri = 'contentUri' in (resolved || {}) ? resolved?.contentUri : null;
  const isImage = resolvedType === 'image' || payload.shareType === 'image';
  const isFile = ['file', 'video', 'audio'].includes(payload.shareType || '');

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    rawInput: combined || rawValue || context,
    type: isStructuredDocument ? 'document' : parsed?.type || (payload.shareType === 'url' ? 'link' : 'note'),
    date: parsed?.date || ocr.date,
    time: parsed?.time || ocr.time,
    category: ocr.category || parsed?.category,
    url: payload.shareType === 'url' || resolvedType === 'website' ? rawValue || uri || undefined : undefined,
    completed: false,
    saved: true,
    sourceType,
    originalText: payload.shareType === 'text' ? rawValue : undefined,
    attachmentUrl: storedAttachmentPath || (isFile ? uri || rawValue || undefined : undefined),
    imageUrl: storedAttachmentPath || (isImage ? uri || rawValue || undefined : undefined),
    extractedText: extractedText?.trim() || undefined,
    userContext: context.trim() || undefined,
    documentKind: ocr.documentKind,
    merchant: ocr.merchant,
    amount: ocr.amount,
    currency: ocr.currency,
    tags: Array.from(new Set([
      ...(parsed?.category ? [parsed.category.toLowerCase()] : []),
      ...ocr.tags,
      sourceType
    ])),
    entities: ocr.entities,
    createdAt: now,
    updatedAt: now
  };
}
