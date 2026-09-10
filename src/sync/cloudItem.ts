import { uploadSharedAttachment } from '@/src/supabase/attachments';
import { upsertCloudItem } from '@/src/supabase/items';
import type { OneItem } from '@/src/types/item';

export async function syncItemToCloud(item: OneItem, userId: string): Promise<OneItem> {
  let next: OneItem = { ...item, syncState: 'pending' };
  const existingCloudPath = isCloudStoragePath(next.attachmentUrl, userId)
    ? next.attachmentUrl
    : undefined;
  const localUri =
    next.localAttachmentUri ||
    (isDeviceUri(next.attachmentUrl) ? next.attachmentUrl : undefined) ||
    (isDeviceUri(next.imageUrl) ? next.imageUrl : undefined);

  if (!existingCloudPath && localUri) {
    const path = await uploadSharedAttachment({
      uri: localUri,
      mimeType: next.localAttachmentMimeType,
      originalName: next.localAttachmentName,
      userId
    });

    next = {
      ...next,
      attachmentUrl: path,
      imageUrl: isImageItem(next) ? path : next.imageUrl
    };
  }

  const synced: OneItem = { ...next, syncState: 'synced' };
  await upsertCloudItem(synced, userId);
  return synced;
}

export function isDeviceUri(value?: string | null) {
  return Boolean(value && /^(file|content|ph):\/\//i.test(value));
}

export function isCloudStoragePath(value: string | undefined, userId: string) {
  return Boolean(value && value.startsWith(`${userId}/`));
}

function isImageItem(item: OneItem) {
  return item.sourceType === 'screenshot' || item.sourceType === 'photo' || item.sourceType === 'scan' || Boolean(item.localAttachmentMimeType?.startsWith('image/'));
}
