import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { mockItems } from '@/src/data/mockItems';
import { deleteCloudItem, pullCloudItems } from '@/src/supabase/items';
import { deleteSharedAttachment } from '@/src/supabase/attachments';
import { cancelItemNotification, scheduleItemNotification } from '@/src/notifications/localNotifications';
import { isRemindable, notificationTransition } from '@/src/notifications/policy';
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
  add: (item: OneItem) => Promise<void>;
  update: (id: string, changes: Partial<OneItem>) => Promise<void>;
  toggleCompleted: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
};

const ItemsContext = createContext<ItemsContextValue | null>(null);
const DEVELOPMENT_SEED_ITEMS: OneItem[] = __DEV__ ? mockItems : [];
const DEVELOPMENT_SEED_IDS = new Set(mockItems.map((item) => item.id));

export function ItemsProvider({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const desiredScope = itemStorageScope(session?.user.id);
  const [items, setItems] = useState<OneItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [syncRevision, setSyncRevision] = useState(0);
  const activeScopeRef = useRef<ItemStorageScope | null>(null);
  const itemsRef = useRef<OneItem[]>([]);

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
    setHydrated(false);

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
        let nextItems = stored ?? (desiredScope === 'anonymous' ? DEVELOPMENT_SEED_ITEMS : []);

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
            .map((item) => ({ ...item, syncState: 'pending' as const }));
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
        setHydrated(true);
      }
    }

    void hydrateScope();
    return () => {
      cancelled = true;
    };
  }, [authLoading, desiredScope]);

  useEffect(() => {
    if (authLoading || !hydrated || activeScopeRef.current !== desiredScope) return;

    saveItems(desiredScope, items).catch((error) => {
      console.warn('ONE local storage save failed', error);
    });
  }, [items, hydrated, authLoading, desiredScope]);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId || !hydrated || activeScopeRef.current !== desiredScope) return;
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

        let merged = await reconcileItemNotifications(resolution.merged);
        if (cancelled || !canApplyScopedSyncResult(syncScope, activeScopeRef.current)) return;
        itemsRef.current = merged;
        setItems(merged);

        for (const candidate of resolution.localToUpload.filter(shouldSyncItem)) {
          try {
            const synced = await syncItemToCloud(candidate, syncUserId);
            if (cancelled || !canApplyScopedSyncResult(syncScope, activeScopeRef.current)) return;
            merged = merged.map((item) =>
              item.id === synced.id
                ? preserveDeviceLocalState(synced, item)
                : item
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
  }, [session?.user.id, hydrated, desiredScope, syncRevision]);

  const add = useCallback(async (item: OneItem) => {
    const userId = session?.user.id;
    const scope = itemStorageScope(userId);
    const base: OneItem = {
      ...item,
      syncState: userId ? 'pending' : 'local'
    };
    const notificationId = isRemindable(base) ? await scheduleItemNotification(base) : undefined;
    const local = notificationId ? { ...base, notificationId } : base;

    itemsRef.current = [local, ...itemsRef.current];
    setItems((current) => [local, ...current]);

    if (!userId || !shouldSyncItem(local)) return;

    try {
      const synced = await syncItemToCloud(local, userId);
      if (!canApplyScopedSyncResult(scope, activeScopeRef.current)) return;
      setItems((current) => current.map((candidate) =>
        candidate.id === synced.id ? preserveDeviceLocalState(synced, candidate) : candidate
      ));
    } catch (error) {
      console.warn('ONE cloud add deferred until reconnect', error);
    }
  }, [session?.user.id]);

  const update = useCallback(async (id: string, changes: Partial<OneItem>) => {
    const currentItem = itemsRef.current.find((item) => item.id === id);
    if (!currentItem) return;

    const userId = session?.user.id;
    const scope = itemStorageScope(userId);
    const baseUpdated: OneItem = {
      ...currentItem,
      ...changes,
      syncState: userId ? 'pending' : 'local',
      updatedAt: new Date().toISOString()
    };

    const transition = notificationTransition(currentItem, baseUpdated);
    let notificationId = currentItem.notificationId;

    if (transition === 'cancel' || transition === 'reschedule') {
      await cancelItemNotification(notificationId);
      notificationId = undefined;
    }
    if (transition === 'schedule' || transition === 'reschedule') {
      notificationId = await scheduleItemNotification(baseUpdated);
    }

    const updated: OneItem = { ...baseUpdated, notificationId };
    itemsRef.current = itemsRef.current.map((item) => (item.id === id ? updated : item));
    setItems((current) => current.map((item) => (item.id === id ? updated : item)));

    if (!userId || !shouldSyncItem(updated)) return;

    try {
      const synced = await syncItemToCloud(updated, userId);
      if (!canApplyScopedSyncResult(scope, activeScopeRef.current)) return;
      setItems((current) => current.map((candidate) =>
        candidate.id === synced.id ? preserveDeviceLocalState(synced, candidate) : candidate
      ));
    } catch (error) {
      console.warn('ONE cloud edit deferred until reconnect', error);
    }
  }, [session?.user.id]);

  const toggleCompleted = useCallback(async (id: string) => {
    const currentItem = itemsRef.current.find((item) => item.id === id);
    if (!currentItem) return;
    await update(id, { completed: !currentItem.completed });
  }, [update]);

  const remove = useCallback(async (id: string) => {
    const currentItem = itemsRef.current.find((item) => item.id === id);
    if (!currentItem) return;

    if (currentItem.notificationId) await cancelItemNotification(currentItem.notificationId);

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
    setItems((current) => current.filter((item) => item.id !== id));

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
    () => ({ items, hydrated, cloudSyncing, add, update, toggleCompleted, remove, clearAll }),
    [items, hydrated, cloudSyncing, add, update, toggleCompleted, remove, clearAll]
  );

  return <ItemsContext.Provider value={value}>{children}</ItemsContext.Provider>;
}

function shouldSyncItem(item: OneItem) {
  return !(__DEV__ && DEVELOPMENT_SEED_IDS.has(item.id));
}

async function suspendItemNotifications(items: OneItem[]) {
  const next: OneItem[] = [];

  for (const item of items) {
    if (!item.notificationId) {
      next.push(item);
      continue;
    }

    try {
      await cancelItemNotification(item.notificationId);
    } catch (error) {
      console.warn('ONE notification privacy suspension failed', error);
    }

    next.push({ ...item, notificationId: undefined });
  }

  return next;
}

async function reconcileItemNotifications(items: OneItem[]) {
  const next: OneItem[] = [];

  for (const item of items) {
    if (!isRemindable(item)) {
      if (item.notificationId) {
        try {
          await cancelItemNotification(item.notificationId);
        } catch (error) {
          console.warn('ONE stale notification cleanup failed', error);
        }
      }
      next.push(item.notificationId ? { ...item, notificationId: undefined } : item);
      continue;
    }

    if (item.notificationId) {
      next.push(item);
      continue;
    }

    try {
      const notificationId = await scheduleItemNotification(item);
      next.push(notificationId ? { ...item, notificationId } : item);
    } catch (error) {
      console.warn('ONE notification reconciliation failed', error);
      next.push(item);
    }
  }

  return next;
}

async function cleanupDeviceState(item: OneItem) {
  if (item.notificationId) {
    try {
      await cancelItemNotification(item.notificationId);
    } catch (error) {
      console.warn('ONE notification cleanup failed', error);
    }
  }

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
      merged.set(item.id, existing ? preserveDeviceLocalState(item, existing) : item);
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
