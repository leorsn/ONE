import type { ResolvedSharePayload, SharePayload } from 'expo-sharing';
import { parseQuickCapture } from '@/src/parser/quickCapture';
import type { OneItem, OneSourceType } from '@/src/types/item';

export function createItemFromShare({
  payload,
  resolved,
  context,
  storedAttachmentPath
}: {
  payload: SharePayload;
  resolved?: ResolvedSharePayload;
  context: string;
  storedAttachmentPath?: string;
}): OneItem {
  const rawValue = payload.value?.trim() || '';
  const combined = [context.trim(), rawValue].filter(Boolean).join(' ');
  const parsed = parseQuickCapture(combined || context || 'Shared item');
  const now = new Date().toISOString();

  const resolvedType = resolved?.contentType ?? null;
  const sourceType: OneSourceType =
    resolvedType === 'image' || payload.shareType === 'image'
      ? 'screenshot'
      : payload.shareType === 'url'
        ? 'link'
        : 'share';

  const title =
    context.trim() ||
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
    type: parsed?.type || (payload.shareType === 'url' ? 'link' : 'note'),
    date: parsed?.date,
    time: parsed?.time,
    category: parsed?.category,
    url: payload.shareType === 'url' || resolvedType === 'website' ? rawValue || uri || undefined : undefined,
    completed: false,
    saved: true,
    sourceType,
    originalText: payload.shareType === 'text' ? rawValue : undefined,
    attachmentUrl: storedAttachmentPath || (isFile ? uri || rawValue || undefined : undefined),
    imageUrl: storedAttachmentPath || (isImage ? uri || rawValue || undefined : undefined),
    userContext: context.trim() || undefined,
    tags: [
      ...(parsed?.category ? [parsed.category.toLowerCase()] : []),
      sourceType
    ],
    entities: [],
    createdAt: now,
    updatedAt: now
  };
}
