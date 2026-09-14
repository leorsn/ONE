export type SharedCaptureKind = 'text' | 'url' | 'image' | 'file' | 'unsupported';

export type SharedCaptureInput = {
  sourceApplication?: string;
  sharedText?: string;
  sharedUrl?: string;
  fileUri?: string;
  mimeType?: string;
  contentType?: string;
  originalName?: string;
  captureTimestamp?: string;
  rawPayload?: unknown;
};

export type SharedCaptureEnvelope = {
  ingestionSource: 'share_extension';
  kind: SharedCaptureKind;
  sourceApplication?: string;
  sharedText?: string;
  sharedUrl?: string;
  normalizedUrl?: string;
  fileUri?: string;
  mimeType?: string;
  contentType?: string;
  originalName?: string;
  captureTimestamp: string;
  rawPayload?: unknown;
  fingerprint: string;
  unavailableReason?: 'missing_file_uri' | 'unsupported_payload';
};

export function normalizeSharedCapture(
  input: SharedCaptureInput,
  now = new Date()
): SharedCaptureEnvelope {
  const sharedUrl = clean(input.sharedUrl);
  const normalizedUrl = sharedUrl ? normalizeHttpUrl(sharedUrl) : undefined;
  const sharedText = clean(input.sharedText) || (sharedUrl && !normalizedUrl ? sharedUrl : undefined);
  const fileUri = clean(input.fileUri);
  const mimeType = clean(input.mimeType)?.toLowerCase();
  const contentType = clean(input.contentType)?.toLowerCase();
  const originalName = clean(input.originalName);
  const looksImage = contentType === 'image' || Boolean(mimeType?.startsWith('image/'));

  let kind: SharedCaptureKind = 'unsupported';
  if (looksImage) kind = 'image';
  else if (normalizedUrl) kind = 'url';
  else if (sharedText) kind = 'text';
  else if (fileUri || mimeType || originalName) kind = 'file';

  const captureTimestamp = validTimestamp(input.captureTimestamp) || now.toISOString();
  const unavailableReason =
    (kind === 'image' || kind === 'file') && !fileUri
      ? 'missing_file_uri' as const
      : kind === 'unsupported'
        ? 'unsupported_payload' as const
        : undefined;

  const fingerprint = fingerprintSharedCapture({
    sharedText,
    sharedUrl: normalizedUrl,
    fileUri,
    mimeType,
    contentType,
    originalName
  });

  return {
    ingestionSource: 'share_extension',
    kind,
    sourceApplication: clean(input.sourceApplication),
    sharedText,
    sharedUrl,
    normalizedUrl,
    fileUri,
    mimeType,
    contentType,
    originalName,
    captureTimestamp,
    rawPayload: input.rawPayload,
    fingerprint,
    unavailableReason
  };
}

export function fingerprintSharedCapture(input: Omit<SharedCaptureInput, 'captureTimestamp' | 'sourceApplication' | 'rawPayload'>) {
  const normalizedUrl = clean(input.sharedUrl) ? normalizeHttpUrl(clean(input.sharedUrl)!) : undefined;
  const normalizedText = normalizeText(input.sharedText);
  const value = [
    normalizedUrl || '',
    normalizedText,
    clean(input.fileUri) || '',
    clean(input.mimeType)?.toLowerCase() || '',
    clean(input.contentType)?.toLowerCase() || '',
    normalizeText(input.originalName)
  ].join('|');

  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `share-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function isLikelyDuplicateSharedCapture(
  previous: SharedCaptureEnvelope,
  next: SharedCaptureEnvelope,
  duplicateWindowMs = 2 * 60 * 1000
) {
  if (previous.fingerprint !== next.fingerprint) return false;
  const delta = new Date(next.captureTimestamp).getTime() - new Date(previous.captureTimestamp).getTime();
  return delta >= 0 && delta <= duplicateWindowMs;
}

export function normalizeHttpUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
    url.hash = '';
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, '');
    if ((url.protocol === 'https:' && url.port === '443') || (url.protocol === 'http:' && url.port === '80')) {
      url.port = '';
    }
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, '');
    return url.toString();
  } catch {
    return undefined;
  }
}

function normalizeText(value?: string) {
  return (value || '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function clean(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function validTimestamp(value?: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : undefined;
}
