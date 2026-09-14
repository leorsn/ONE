import { markSyncConflict } from './queue.ts';
import type { OneItem } from '../types/item';

export type CloudSnapshotResolution = {
  merged: OneItem[];
  localToUpload: OneItem[];
  remoteDeleted: OneItem[];
};

export function resolveCloudSnapshot(local: OneItem[], cloud: OneItem[]): CloudSnapshotResolution {
  const cloudById = new Map(cloud.map((item) => [item.id, { ...item, syncState: 'synced' as const }]));

  const remoteDeleted = local.filter((item) => item.syncState === 'synced' && !cloudById.has(item.id));
  const remoteDeletedIds = new Set(remoteDeleted.map((item) => item.id));
  const visibleLocal = local.filter((item) => !remoteDeletedIds.has(item.id));

  const localToUpload = visibleLocal.filter((localItem) => {
    const cloudItem = cloudById.get(localItem.id);
    if (!cloudItem) return localItem.syncState !== 'synced' && !localItem.syncConflictDetected;
    if (localItem.syncState === 'synced' || localItem.syncConflictDetected) return false;
    if (!meaningfullyDifferent(localItem, cloudItem)) return false;
    return timestamp(localItem.updatedAt) >= timestamp(cloudItem.updatedAt);
  });

  const mergedMap = new Map<string, OneItem>();

  for (const cloudItem of cloudById.values()) mergedMap.set(cloudItem.id, cloudItem);

  for (const localItem of visibleLocal) {
    const cloudItem = mergedMap.get(localItem.id);
    if (!cloudItem) {
      mergedMap.set(localItem.id, localItem);
      continue;
    }

    const localTime = timestamp(localItem.updatedAt);
    const cloudTime = timestamp(cloudItem.updatedAt);
    const divergentUnsynced = localItem.syncState !== 'synced' && meaningfullyDifferent(localItem, cloudItem);

    if (divergentUnsynced && cloudTime > localTime) {
      // Preserve both states: keep the local edit on-device and leave the newer
      // cloud version untouched until a future conflict UI can resolve it.
      mergedMap.set(localItem.id, preserveDeviceLocalState(markSyncConflict(localItem), localItem));
      continue;
    }

    const localIsNewerOrPendingTie = localTime > cloudTime || (divergentUnsynced && localTime === cloudTime);
    const winner = localIsNewerOrPendingTie ? localItem : cloudItem;
    mergedMap.set(localItem.id, preserveDeviceLocalState(winner, localItem));
  }

  return {
    merged: Array.from(mergedMap.values()).sort(
      (a, b) => timestamp(b.updatedAt) - timestamp(a.updatedAt)
    ),
    localToUpload,
    remoteDeleted
  };
}

export function preserveDeviceLocalState(winner: OneItem, local: OneItem): OneItem {
  return {
    ...winner,
    notificationId: local.notificationId || winner.notificationId,
    notificationStatus: local.notificationStatus || winner.notificationStatus,
    localAttachmentUri: local.localAttachmentUri || winner.localAttachmentUri,
    localAttachmentMimeType: local.localAttachmentMimeType || winner.localAttachmentMimeType,
    localAttachmentName: local.localAttachmentName || winner.localAttachmentName
  };
}

export function canApplyScopedSyncResult(expectedScope: string, activeScope: string | null) {
  return Boolean(activeScope && expectedScope === activeScope);
}

function meaningfullyDifferent(left: OneItem, right: OneItem) {
  return JSON.stringify(syncComparable(left)) !== JSON.stringify(syncComparable(right));
}

function syncComparable(item: OneItem) {
  const cloudFields: Partial<OneItem> = { ...item };
  delete cloudFields.notificationId;
  delete cloudFields.notificationStatus;
  delete cloudFields.localAttachmentUri;
  delete cloudFields.localAttachmentMimeType;
  delete cloudFields.localAttachmentName;
  delete cloudFields.syncState;
  delete cloudFields.syncAttemptCount;
  delete cloudFields.syncErrorAt;
  delete cloudFields.syncRetryAt;
  delete cloudFields.syncConflictDetected;
  return cloudFields;
}

function timestamp(value: string) {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}
