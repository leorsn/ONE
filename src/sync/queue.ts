import type { OneItem } from '@/src/types/item';

export type DeletionQueueEntry = {
  id: string;
  deletedAt: string;
  userId: string;
  attachmentPaths: string[];
  attemptCount?: number;
  retryAt?: string;
  errorAt?: string;
};

export type SyncQueueOperation =
  | { kind: 'upsert'; itemId: string; attempt: number }
  | { kind: 'delete'; itemId: string; attempt: number };

const BASE_RETRY_MS = 5_000;
const MAX_RETRY_MS = 5 * 60_000;
export const MAX_AUTO_SYNC_ATTEMPTS = 8;

export function buildSyncQueue(
  items: OneItem[],
  deletions: DeletionQueueEntry[],
  now = new Date()
): SyncQueueOperation[] {
  const timestamp = now.getTime();
  const operations: SyncQueueOperation[] = [];

  for (const deletion of deletions) {
    const attempt = deletion.attemptCount ?? 0;
    if (!canAutoRetry(attempt) || !retryIsDue(deletion.retryAt, timestamp)) continue;
    operations.push({ kind: 'delete', itemId: deletion.id, attempt });
  }

  for (const item of items) {
    const attempt = item.syncAttemptCount ?? 0;
    if (item.syncConflictDetected || !canAutoRetry(attempt)) continue;
    if (item.syncState !== 'pending' && item.syncState !== 'error') continue;
    if (!retryIsDue(item.syncRetryAt, timestamp)) continue;
    operations.push({ kind: 'upsert', itemId: item.id, attempt });
  }

  return operations;
}

export function markSyncPending(item: OneItem): OneItem {
  return {
    ...item,
    syncState: 'pending',
    syncAttemptCount: 0,
    syncErrorAt: undefined,
    syncRetryAt: undefined,
    syncConflictDetected: undefined
  };
}

export function markSyncSuccess(item: OneItem): OneItem {
  return {
    ...item,
    syncState: 'synced',
    syncAttemptCount: 0,
    syncErrorAt: undefined,
    syncRetryAt: undefined,
    syncConflictDetected: undefined
  };
}

export function markSyncFailure(item: OneItem, now = new Date()): OneItem {
  const attempt = (item.syncAttemptCount ?? 0) + 1;
  return {
    ...item,
    syncState: 'error',
    syncAttemptCount: attempt,
    syncErrorAt: now.toISOString(),
    syncRetryAt: new Date(now.getTime() + retryDelayMs(attempt)).toISOString()
  };
}

export function markSyncConflict(item: OneItem): OneItem {
  return {
    ...item,
    syncState: 'error',
    syncConflictDetected: true,
    syncRetryAt: undefined
  };
}

export function markDeletionFailure<T extends DeletionQueueEntry>(entry: T, now = new Date()): T {
  const attempt = (entry.attemptCount ?? 0) + 1;
  return {
    ...entry,
    attemptCount: attempt,
    errorAt: now.toISOString(),
    retryAt: new Date(now.getTime() + retryDelayMs(attempt)).toISOString()
  };
}

export function canAutoRetry(attempt: number) {
  return attempt < MAX_AUTO_SYNC_ATTEMPTS;
}

export function retryDelayMs(attempt: number) {
  const exponent = Math.max(0, Math.min(6, attempt - 1));
  return Math.min(MAX_RETRY_MS, BASE_RETRY_MS * 2 ** exponent);
}

export function syncPresentationState(items: OneItem[], syncing: boolean) {
  if (syncing) return 'syncing' as const;
  if (items.some((item) => item.syncState === 'error')) return 'problem' as const;
  if (items.some((item) => item.syncState === 'pending')) return 'saved_local' as const;
  return 'saved' as const;
}

function retryIsDue(retryAt: string | undefined, now: number) {
  if (!retryAt) return true;
  const retry = new Date(retryAt).getTime();
  return !Number.isFinite(retry) || retry <= now;
}
