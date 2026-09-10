import * as FileSystem from 'expo-file-system/legacy';

const ROOT = FileSystem.documentDirectory
  ? FileSystem.documentDirectory + 'one-attachments/'
  : null;

export async function persistLocalAttachment({
  uri,
  originalName
}: {
  uri: string;
  originalName?: string | null;
}) {
  if (!ROOT || isPersistedLocalAttachment(uri)) return uri;

  await ensureRoot();
  const fileName = sanitizeName(
    originalName ||
      uri.split('/').pop()?.split('?')[0] ||
      'attachment'
  );

  const destination =
    ROOT +
    String(Date.now()) +
    '-' +
    Math.random().toString(36).slice(2, 8) +
    '-' +
    fileName;

  await FileSystem.copyAsync({
    from: uri,
    to: destination
  });

  return destination;
}

export function isPersistedLocalAttachment(uri?: string | null) {
  return Boolean(ROOT && uri && uri.startsWith(ROOT));
}

export async function removeLocalAttachment(uri?: string | null) {
  if (!uri || !isPersistedLocalAttachment(uri)) return false;

  await FileSystem.deleteAsync(uri, { idempotent: true });
  return true;
}

export async function clearLocalAttachments() {
  if (!ROOT) return;
  await FileSystem.deleteAsync(ROOT, { idempotent: true });
}

async function ensureRoot() {
  if (!ROOT) return;

  const info = await FileSystem.getInfoAsync(ROOT);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(ROOT, { intermediates: true });
  }
}

function sanitizeName(name: string) {
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-100);
  return safe || 'attachment';
}
