export type SharePayloadLike = {
  shareType?: string | null;
  value?: string | null;
};

export type ResolvedShareLike = {
  contentType?: string | null;
  contentUri?: string | null;
  contentMimeType?: string | null;
  originalName?: string | null;
};

export type NormalizedShareCandidate = {
  index: number;
  payload: SharePayloadLike;
  resolved?: ResolvedShareLike;
  fingerprint: string;
  representationCount: number;
};

export function selectShareCandidate(
  payloads: SharePayloadLike[],
  resolvedPayloads: ResolvedShareLike[] = []
): NormalizedShareCandidate | undefined {
  if (!payloads.length) return undefined;

  const candidates = payloads
    .map((payload, index) => ({
      index,
      payload,
      resolved: resolvedPayloads[index],
      score: scoreShareRepresentation(payload, resolvedPayloads[index])
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const selected = candidates[0];
  if (!selected) return undefined;

  return {
    index: selected.index,
    payload: selected.payload,
    resolved: selected.resolved,
    fingerprint: fingerprintShare(selected.payload, selected.resolved),
    representationCount: payloads.length
  };
}

export function fingerprintShare(payload: SharePayloadLike, resolved?: ResolvedShareLike) {
  const value = [
    payload.shareType || '',
    payload.value?.trim() || '',
    resolved?.contentType || '',
    resolved?.contentUri || '',
    resolved?.contentMimeType || '',
    resolved?.originalName || ''
  ].join('|');

  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `share-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function shouldPreventDuplicateShare({
  previousFingerprint,
  previousHandledAt,
  nextFingerprint,
  now = Date.now(),
  duplicateWindowMs = 2 * 60 * 1000
}: {
  previousFingerprint?: string | null;
  previousHandledAt?: number | null;
  nextFingerprint: string;
  now?: number;
  duplicateWindowMs?: number;
}) {
  if (!previousFingerprint || !previousHandledAt) return false;
  if (previousFingerprint !== nextFingerprint) return false;
  return now - previousHandledAt >= 0 && now - previousHandledAt <= duplicateWindowMs;
}

function scoreShareRepresentation(payload: SharePayloadLike, resolved?: ResolvedShareLike) {
  const hasValue = Boolean(payload.value?.trim());
  const hasUri = Boolean(resolved?.contentUri);
  const type = resolved?.contentType || payload.shareType || '';

  if (hasUri && (type === 'image' || type === 'file')) return 60;
  if (hasUri) return 50;
  if (payload.shareType === 'url' && hasValue) return 45;
  if (payload.shareType === 'text' && hasValue) return 40;
  if (hasValue) return 20;
  return 0;
}
