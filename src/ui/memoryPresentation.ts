import type { OneItem } from '../types/item';

export function matchesMemoryCategory(item: OneItem, category: string) {
  if (category === 'Documents') return item.type === 'document';
  if (category === 'Links') return item.type === 'link' || Boolean(item.url);
  if (category === 'Ideas') return item.type === 'idea' || item.type === 'note';
  return true;
}

// A local attachment can be a PDF; only image sources belong in thumbnail views.
export function memoryPreview(item: OneItem) {
  if (item.localAttachmentMimeType && !item.localAttachmentMimeType.startsWith('image/')) {
    return item.imageUrl && /^https?:\/\//i.test(item.imageUrl) ? item.imageUrl : undefined;
  }
  const candidate = item.localAttachmentUri || item.imageUrl;
  const image = item.localAttachmentMimeType?.startsWith('image/') || item.imageUrl || item.kind === 'image' || ['scan', 'photo', 'screenshot'].includes(item.sourceType);
  return image && candidate && /^(file|content|ph|https?):\/\//i.test(candidate) ? candidate : undefined;
}

export function memoryDateLabel(value: string | undefined, withTime = false) {
  if (!value) return 'Date unavailable';
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  if (!Number.isFinite(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en', {
    month: 'short', day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } as const : {})
  }).format(date);
}
