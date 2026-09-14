import { supabase } from '@/src/supabase/client';

const BUCKET = 'one-attachments';

export async function uploadSharedAttachment({
  uri,
  mimeType,
  originalName,
  userId,
  storageKey
}: {
  uri: string;
  mimeType?: string | null;
  originalName?: string | null;
  userId: string;
  storageKey?: string;
}) {
  const response = await fetch(uri);
  if (!response.ok) throw new Error(`Attachment read failed (${response.status})`);
  const bytes = await response.arrayBuffer();

  const cleanName = storageKey
    ? sanitizeName(storageKey)
    : sanitizeName(originalName || `share-${Date.now()}.${extensionForMime(mimeType)}`);
  const path = `${userId}/${cleanName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, {
      contentType: mimeType || 'application/octet-stream',
      upsert: Boolean(storageKey)
    });

  if (error) throw error;
  return data.path;
}

export async function deleteSharedAttachment(path: string, userId: string) {
  if (!path.startsWith(userId + '/')) return false;

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([path]);

  if (error) throw error;
  return true;
}

export async function createAttachmentSignedUrl(path: string, expiresInSeconds = 3600) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error) throw error;
  return data.signedUrl;
}

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-120);
}

function extensionForMime(mimeType?: string | null) {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'jpg';
}
