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
    if (!cloudItem) return localItem.syncState !== 'synced';
    return new Date(localItem.updatedAt).getTime() > new Date(cloudItem.updatedAt).getTime();
  });

  const mergedMap = new Map<string, OneItem>();

  for (const cloudItem of cloudById.values()) {
    mergedMap.set(cloudItem.id, cloudItem);
  }

  for (const localItem of visibleLocal) {
    const cloudItem = mergedMap.get(localItem.id);
    if (!cloudItem) {
      mergedMap.set(localItem.id, localItem);
      continue;
    }

    const localIsNewer = new Date(localItem.updatedAt).getTime() > new Date(cloudItem.updatedAt).getTime();
    const winner = localIsNewer ? localItem : cloudItem;

    mergedMap.set(localItem.id, preserveDeviceLocalState(winner, localItem));
  }

  return {
    merged: Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
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
