const SUPPORTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/gif',
  'image/tiff',
  'application/pdf'
]);

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  heif: 'image/heif',
  gif: 'image/gif',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  pdf: 'application/pdf'
};

export function normalizedSupportedAttachmentMimeType(
  mimeType?: string | null,
  originalName?: string | null
) {
  const explicit = mimeType?.trim().toLowerCase();
  if (explicit && SUPPORTED_MIME_TYPES.has(explicit)) return explicit;

  // iOS providers sometimes expose a generic/empty MIME while still providing
  // a trustworthy filename. Only infer launch-supported formats by extension.
  if (!explicit || explicit === 'application/octet-stream') {
    const extension = originalName?.trim().toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
    if (extension) return MIME_BY_EXTENSION[extension];
  }

  return undefined;
}

export function isSupportedNeverAttachment(
  mimeType?: string | null,
  originalName?: string | null
) {
  return Boolean(normalizedSupportedAttachmentMimeType(mimeType, originalName));
}

export const NEVER_ATTACHMENT_SUPPORT_COPY =
  'NEVER currently syncs original images and PDF documents. JPEG, PNG, WebP, HEIC/HEIF, GIF, TIFF and PDF are supported.';
