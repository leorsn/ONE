import type { OneItem } from '@/src/types/item';

export type LocalMigrationState = {
  version: 1;
  ownerUserId: string;
  status: 'pending_cloud' | 'complete';
  sourceItemCount: number;
  copiedAt: string;
  completedAt?: string;
};

export function planAnonymousMigration({
  userId,
  anonymousItems,
  destinationItems,
  state,
  now = new Date()
}: {
  userId: string;
  anonymousItems: OneItem[];
  destinationItems: OneItem[];
  state: LocalMigrationState | null;
  now?: Date;
}) {
  if (!anonymousItems.length) {
    return { items: destinationItems, nextState: state, copied: false, blocked: false };
  }

  if (state && state.ownerUserId !== userId) {
    return { items: destinationItems, nextState: state, copied: false, blocked: true };
  }

  if (state?.status === 'complete') {
    return { items: destinationItems, nextState: state, copied: false, blocked: false };
  }

  const destinationById = new Map(destinationItems.map((item) => [item.id, item]));
  for (const anonymous of anonymousItems) {
    const existing = destinationById.get(anonymous.id);
    if (!existing || new Date(anonymous.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
      destinationById.set(anonymous.id, {
        ...anonymous,
        syncState: 'pending',
        syncAttemptCount: 0,
        syncErrorAt: undefined,
        syncRetryAt: undefined
      });
    }
  }

  const nextState: LocalMigrationState = state ?? {
    version: 1,
    ownerUserId: userId,
    status: 'pending_cloud',
    sourceItemCount: anonymousItems.length,
    copiedAt: now.toISOString()
  };

  return {
    items: Array.from(destinationById.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ),
    nextState,
    copied: true,
    blocked: false
  };
}

export function completeMigration(
  state: LocalMigrationState | null,
  userId: string,
  remainingUnsynced: number,
  now = new Date()
) {
  if (!state || state.ownerUserId !== userId || state.status === 'complete' || remainingUnsynced > 0) {
    return state;
  }

  return {
    ...state,
    status: 'complete' as const,
    completedAt: now.toISOString()
  };
}
