import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { ensureCanonicalItemMetadata } from '@/src/capture/itemMetadata';
import { useAuth } from '@/src/context/AuthContext';
import { mockItems } from '@/src/data/mockItems';
import { cancelItemNotification, scheduleItemNotification } from '@/src/notifications/localNotifications';
import { isRemindable, notificationTransition } from '@/src/notifications/policy';
import { deleteCloudItem, pullCloudItems } from '@/src/supabase/items';
import { deleteSharedAttachment } from '@/src/supabase/attachments';
import {
  clearItems,
  itemStorageScope,
  loadItems,
  saveItems,
  type ItemStorageScope
} from '@/src/storage/items';
import { removeLocalAttachment } from '@/src/storage/attachments';
import {
  clearDeletionTombstones,
  loadDeletionTombstones,
  removeDeletionTombstone,
  saveDeletionTombstone
} from '@/src/storage/deletions';
import { syncItemToCloud } from '@/src/sync/cloudItem';
import { canApplyScopedSyncResult, preserveDeviceLocalState, resolveCloudSnapshot } from '@/src/sync/merge';
import type { OneItem } from '@/src/types/item';

type ItemsContextValue = {
  items: OneItem[];
  hydrated: boolean;
  cloudSyncing: boolean;
  add: (item: OneItem) => Promise<OneItem>;
  update: (id: string, changes: Partial<OneItem>) => Promise<OneItem | undefined>;
  toggleCompleted: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
};

const ItemsContext = createContext<ItemsContextValue | null>(null);
const DEVELOPMENT_SEED_ITEMS: OneItem[] = __DEV__ ? mockItems.map(ensureCanonicalItemMetadata) : [];
const DEVELOPMENT_SEED_IDS = new Set(mockItems.map((item) => item.id));

export function ItemsProvider({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const desiredScope = itemStorageScope(session?.user.id);
  const [items, setItems] = useState<OneItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [hydratedScope, setHydratedScope] = useState<ItemStorageScope | null>(null);
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [syncRevision, setSyncRevision] = useState(0);
  const activeScopeRef = useRef<ItemStorageScope | null>(null);
  const itemsRef = useRef<OneItem[]>([]);
  const scopeReady = hydrated && !authLoading && hydratedScope === desiredScope;

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setSyncRevision((value) => value + 1);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    const previousScope = activeScopeRef.current;

    async function hydrateScope() {
      try {
        if (
          previousScope &&
          previousScope !== desiredScope &&
          previousScope !== 'anonymous'
        ) {
          const suspended = await suspendItemNotifications(itemsRef.current);
          await saveItems(previousScope, suspended);
          itemsRef.current = suspended;
        }

        const stored = await loadItems(desiredScope);
        let nextItems = (stored ?? (desiredScope === 'anonymous' ? DEVELOPMENT_SEED_ITEMS : []))
          .map(ensureCanonicalItemMetadata);

        if (desiredScope === 'anonymous') {
          nextItems = nextItems.map((item) => ({ ...item, syncState: 'local' }));
        } else {
          nextItems = nextItems
            .filter(shouldSyncItem)
            .map((item) => ({ ...item, syncState: item.syncState || 'pending' }));
        }

        if (previousScope === 'anonymous' && desiredScope !== 'anonymous') {
          const transferable = itemsRef.current
            .filter(shouldSyncItem)
            .map((item) => ({ ...ensureCanonicalItemMetadata(item), syncState: 'pending' as const }));
          if (transferable.length) nextItems = mergeByUpdatedAt(transferable, nextItems);
          await clearItems('anonymous');
        }

        if (desiredScope !== 'anonymous') {
          nextItems = await reconcileItemNotifications(nextItems);
          await saveItems(desiredScope, nextItems);
        }

        if (cancelled) return;
        activeScopeRef.current = desiredScope;
        itemsRef.current = nextItems;
        setItems(nextItems);
        setHydratedScope(desiredScope);
        setHydrated(true);
      } catch (error) {
        console.warn('ONE local storage hydration failed', error);
        if (cancelled) return;

        const fallback = desiredScope === 'anonymous'
          ? DEVELOPMENT_SEED_ITEMS.map((item) => ({ ...item, syncState: 'local' as const }))
          : [];
        activeScopeRef.current = desiredScope;
        itemsRef.current = fallback;
        setItems(fallback);
        setHydratedScope(desiredScope);
        setHydrated(true);
      }
    }

    void hydrateScope();
    return () => {
      cancelled = true;
    };
  }, [authLoading, desiredScope]);

  useEffect(() => {
    if (!scopeReady) return;

    saveItems(desiredScope, items).catch((error) => {
      console.warn('ONE local storage save failed', error);
    });
  }, [items, scopeReady, desiredScope]);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId || !scopeReady) return;
    const syncUserId = userId;
    const syncScope = itemStorageScope(syncUserId);
    let cancelled = false;

    async function syncFromCloud() {
      setCloudSyncing(true);
      try {
        const [cloud, activeTombstones] = await Promise.all([
          pullCloudItems(),
          loadDeletionTombstones(syncUserId)
        ]);
        if (cancelled || !canApplyScopedSyncResult(syncScope, activeScopeRef.current)) return;

        const deletedIds = new Set(activeTombstones.map((entry) => entry.id));
        const localSnapshot = itemsRef.current.filter((item) => !deletedIds.has(item.id));
        const visibleCloud = cloud.filter((item) => !deletedIds.has(item.id));
        const resolution = resolveCloudSnapshot(localSnapshot, visibleCloud);

        for (const remotelyDeleted of resolution.remoteDeleted) {
          await cleanupDeviceState(remotelyDeleted);
        }

        let merged = await reconcileItemNotifications(resolution.merged.map(ensureCanonicalItemMetadata));
        if (cancelled || !canApplyScopedSyncResult(syncScope, activeScopeRef.current)) return;
        itemsRef.current = merged;
        setItems(merged);

        for (const candidate of resolution.localToUpload.filter(shouldSyncItem)) {
          try {
            const synced = await syncItemToCloud(ensureCanonicalItemMetadata(candidate), syncUserId);
            if (cancelled || !canApplyScopedSyncResult(syncScope, activeScopeRef.current)) return;
            merged = merged.map((item) =>
              item.id === synced.id ? preserveDeviceLocalState(synced, item) : item
            );
            itemsRef.current = merged;
            setItems(merged);
          } catch (error) {
            console.warn('ONE deferred item sync failed; capture remains local', error);
          }
        }

        for (const tombstone of activeTombstones) {
          try {
            await deleteCloudItem(tombstone.id);
            await removeCloudAttachments(tombstone.attachmentPaths, syncUserId);
            await removeDeletionTombstone(tombstone.id, syncUserId);
          } catch (error) {
            console.warn('ONE deferred delete cleanup failed', error);
          }
        }
      } catch (error) {
        console.warn('ONE cloud sync failed; local data preserved', error);
      } finally {
        if (!cancelled) setCloudSyncing(false);
      }
    }

    void syncFromCloud();
    return () => {
      cancelled = true;
    };
  }, [session?.user.id, scopeReady, desiredScope, syncRevision]);

  const applySyncedItem = useCallback((synced: OneItem) => {
    let applied: OneItem | undefined;
    itemsRef.current = itemsRef.current.map((candidate) => {
      if (candidate.id !== synced.id) return candidate;
      applied = preserveDeviceLocalState(ensureCanonicalItemMetadata(synced), candidate);
      return applied;
    });
    setItems(itemsRef.current);
    return applied;
  }, []);

  const add = useCallback(async (item: OneItem) => {
    const userId = session?.user.id;
    const scope = itemStorageScope(userId);
    const base: OneItem = {
      ...ensureCanonicalItemMetadata(item),
      syncState: userId ? 'pending' : 'local'
    };
    const scheduleResult = isRemindable(base)
      ? await scheduleItemNotification(base)
      : { status: 'not_applicable' as const };
    const local: OneItem = {
      ...base,
      notificationId: scheduleResult.notificationId,
      notificationStatus: scheduleResult.status
    };

    itemsRef.current = [local, ...itemsRef.current];
    setItems(itemsRef.current);

    if (!userId || !shouldSyncItem(local)) return local;

    try {
      const synced = await syncItemToCloud(local, userId);
      if (!canApplyScopedSyncResult(scope, activeScopeRef.current)) return local;
      return applySyncedItem(synced) ?? local;
    } catch (error) {
      console.warn('ONE cloud add deferred until reconnect', error);
      return local;
    }
  }, [session?.user.id, applySyncedItem]);

  const update = useCallback(async (id: string, changes: Partial<OneItem>) => {
    const currentItem = itemsRef.current.find((item) => item.id === id);
    if (!currentItem) return undefined;

    const userId = session?.user.id;
    const scope = itemStorageScope(userId);
    const baseUpdated = ensureCanonicalItemMetadata({
      ...currentItem,
      ...changes,
      syncState: userId ? 'pending' : 'local',
      updatedAt: new Date().toISOString()
    });

    const transition = notificationTransition(currentItem, baseUpdated);
    let notificationId = currentItem.notificationId;
    let notificationStatus = currentItem.notificationStatus ?? (notificationId ? 'scheduled' : 'not_scheduled');

    if (transition === 'cancel' || transition === 'reschedule') {
      await cancelItemNotification(notificationId);
      notificationId = undefined;
      notificationStatus = isRemindable(baseUpdated) ? 'not_scheduled' : 'not_applicable';
    }
    if (transition === 'schedule' || transition === 'reschedule') {
      const result = await scheduleItemNotification(baseUpdated);
      notificationId = result.notificationId;
      notificationStatus = result.status;
    } else if (!isRemindable(baseUpdated)) {
      notificationStatus = 'not_applicable';
    }

    const updated: OneItem = { ...baseUpdated, notificationId, notificationStatus };
    itemsRef.current = itemsRef.current.map((item) => (item.id === id ? updated : item));
    setItems(itemsRef.current);

    if (!userId || !shouldSyncItem(updated)) return updated;

    try {
      const synced = await syncItemToCloud(updated, userId);
      if (!canApplyScopedSyncResult(scope, activeScopeRef.current)) return updated;
      return applySyncedItem(synced) ?? updated;
    } catch (error) {
      console.warn('ONE cloud edit deferred until reconnect', error);
      return updated;
    }
  }, [session?.user.id, applySyncedItem]);

  const toggleCompleted = useCallback(async (id: string) => {
    const currentItem = itemsRef.current.find((item) => item.id === id);
    if (!currentItem) return;
    await update(id, { completed: !currentItem.completed });
  }, [update]);

  const remove = useCallback(async (id: string) => {
    const currentItem = itemsRef.current.find((item) => item.id === id);
    if (!currentItem) return;

    await cancelItemNotification(currentItem.notificationId);

    const cloudAttachmentPaths = Array.from(new Set(
      [currentItem.attachmentUrl, currentItem.imageUrl]
        .filter((value): value is string => Boolean(value && !/^(file|content|ph):\/\//i.test(value)))
    ));
    const localAttachmentPaths = Array.from(new Set(
      [currentItem.localAttachmentUri, currentItem.attachmentUrl, currentItem.imageUrl]
        .filter((value): value is string => Boolean(value && /^(file|content|ph):\/\//i.test(value)))
    ));
    const userId = session?.user.id;

    if (userId) {
      await saveDeletionTombstone({
        id,
        deletedAt: new Date().toISOString(),
        userId,
        attachmentPaths: cloudAttachmentPaths
      });
    }

    itemsRef.current = itemsRef.current.filter((item) => item.id !== id);
    setItems(itemsRef.current);

    for (const path of localAttachmentPaths) {
      try {
        await removeLocalAttachment(path);
      } catch (error) {
        console.warn('ONE local attachment cleanup failed', error);
      }
    }

    if (!userId) return;

    try {
      await deleteCloudItem(id);
      await removeCloudAttachments(cloudAttachmentPaths, userId);
      await removeDeletionTombstone(id, userId);
    } catch (error) {
      console.warn('ONE cloud delete deferred until reconnect', error);
    }
  }, [session?.user.id]);

  const clearAll = useCallback(async () => {
    const currentScope = desiredScope;
    const currentUserId = session?.user.id;

    for (const item of itemsRef.current) await cleanupDeviceState(item);

    await clearItems(currentScope);
    if (currentUserId) await clearDeletionTombstones(currentUserId);

    itemsRef.current = [];
    setItems([]);
  }, [desiredScope, session?.user.id]);

  const value = useMemo(
    () => ({
      items: scopeReady ? items : [],
      hydrated: scopeReady,
      cloudSyncing: scopeReady ? cloudSyncing : false,
      add,
      update,
      toggleCompleted,
      remove,
      clearAll
    }),
    [items, scopeReady, cloudSyncing, add, update, toggleCompleted, remove, clearAll]
  );

  return <ItemsContext.Provider value={value}>{children}</ItemsContext.Provider>;
}

function shouldSyncItem(item: OneItem) {
  return !(__DEV__ && DEVELOPMENT_SEED_IDS.has(item.id));
}

async function suspendItemNotifications(items: OneItem[]) {
  const next: OneItem[] = [];

  for (const item of items) {
    await cancelItemNotification(item.notificationId);
    next.push({
      ...item,
      notificationId: undefined,
      notificationStatus: isRemindable(item) ? 'not_scheduled' : 'not_applicable'
    });
  }

  return next;
}

async function reconcileItemNotifications(items: OneItem[]) {
  const next: OneItem[] = [];

  for (const item of items) {
    if (!isRemindable(item)) {
      await cancelItemNotification(item.notificationId);
      next.push({ ...item, notificationId: undefined, notificationStatus: 'not_applicable' });
      continue;
    }

    if (item.notificationId) {
      next.push({ ...item, notificationStatus: 'scheduled' });
      continue;
    }

    const result = await scheduleItemNotification(item);
    next.push({
      ...item,
      notificationId: result.notificationId,
      notificationStatus: result.status
    });
  }

  return next;
}

async function cleanupDeviceState(item: OneItem) {
  await cancelItemNotification(item.notificationId);

  const localPaths = Array.from(new Set(
    [item.localAttachmentUri, item.attachmentUrl, item.imageUrl]
      .filter((value): value is string => Boolean(value && /^(file|content|ph):\/\//i.test(value)))
  ));

  for (const path of localPaths) {
    try {
      await removeLocalAttachment(path);
    } catch (error) {
      console.warn('ONE local attachment cleanup failed', error);
    }
  }
}

async function removeCloudAttachments(paths: string[], userId: string) {
  for (const path of paths) {
    if (!path.startsWith(userId + '/')) continue;
    await deleteSharedAttachment(path, userId);
  }
}

function mergeByUpdatedAt(local: OneItem[], cloud: OneItem[]) {
  const merged = new Map<string, OneItem>();

  for (const item of [...local, ...cloud]) {
    const existing = merged.get(item.id);
    if (!existing || new Date(item.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
      merged.set(item.id, ensureCanonicalItemMetadata(existing ? preserveDeviceLocalState(item, existing) : item));
    }
  }

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function useItems() {
  const context = useContext(ItemsContext);
  if (!context) throw new Error('useItems must be used inside ItemsProvider');
  return context;
}
