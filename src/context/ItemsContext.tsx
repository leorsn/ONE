import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { mockItems } from '@/src/data/mockItems';
import { deleteCloudItem, pullCloudItems, upsertCloudItem } from '@/src/supabase/items';
import { deleteSharedAttachment } from '@/src/supabase/attachments';
import { cancelItemNotification, scheduleItemNotification } from '@/src/notifications/localNotifications';
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
  const activeScopeRef = useRef<ItemStorageScope | null>(null);
  const itemsRef = useRef<OneItem[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    const previousScope = activeScopeRef.current;
    setHydrated(false);

    async function hydrateScope() {
      try {
        const stored = await loadItems(desiredScope);
        let nextItems = stored ?? (desiredScope === 'anonymous' ? DEVELOPMENT_SEED_ITEMS : []);

        if (desiredScope !== 'anonymous') {
          // Development demo memories must never become part of an authenticated
          // user's local account partition or cloud sync input.
          nextItems = nextItems.filter(shouldSyncItem);
        }

        if (previousScope === 'anonymous' && desiredScope !== 'anonymous') {
          const transferable = itemsRef.current.filter(shouldSyncItem);
          if (transferable.length) {
            nextItems = mergeByUpdatedAt(transferable, nextItems);
            await saveItems(desiredScope, nextItems);
          }

          // Once the user explicitly signs in, their real anonymous captures move
          // into that account and are removed from the signed-out device scope.
          await clearItems('anonymous');
        }

        if (cancelled) return;
        activeScopeRef.current = desiredScope;
        itemsRef.current = nextItems;
        setItems(nextItems);
        setHydrated(true);
      } catch (error) {
        console.warn('ONE local storage hydration failed', error);
        if (cancelled) return;

        const fallback = desiredScope === 'anonymous' ? DEVELOPMENT_SEED_ITEMS : [];
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

    let cancelled = false;

    async function syncFromCloud() {
      setCloudSyncing(true);
      try {
        const [cloud, activeTombstones] = await Promise.all([
          pullCloudItems(),
          loadDeletionTombstones(syncUserId)
        ]);
        if (cancelled) return;

        const deletedIds = new Set(activeTombstones.map((entry) => entry.id));
        const visibleLocal = items.filter((item) => !deletedIds.has(item.id));
        const visibleCloud = cloud.filter((item) => !deletedIds.has(item.id));

        const merged = mergeByUpdatedAt(visibleLocal, visibleCloud);
        setItems(merged);

        const cloudById = new Map(visibleCloud.map((item) => [item.id, item]));
        const localToUpload = visibleLocal.filter((localItem) => {
          if (!shouldSyncItem(localItem)) return false;
          const cloudItem = cloudById.get(localItem.id);
          return (
            !cloudItem ||
            new Date(localItem.updatedAt).getTime() > new Date(cloudItem.updatedAt).getTime()
          );
        });

        if (localToUpload.length) {
          await Promise.all(localToUpload.map((item) => upsertCloudItem(item, syncUserId)));
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
        console.warn('ONE cloud sync failed', error);
      } finally {
        if (!cancelled) setCloudSyncing(false);
      }
    }

    void syncFromCloud();
    return () => {
      cancelled = true;
    };
  }, [session?.user.id, hydrated, desiredScope]);

  const add = useCallback(async (item: OneItem) => {
    const notificationId = await scheduleItemNotification(item);
    const withNotification = notificationId ? { ...item, notificationId } : item;
    setItems((current) => [withNotification, ...current]);

    if (session?.user.id && shouldSyncItem(withNotification)) {
      try {
        await upsertCloudItem(withNotification, session.user.id);
      } catch (error) {
        console.warn('ONE cloud add failed', error);
      }
    }
  }, [session?.user.id]);

  const update = useCallback(async (id: string, changes: Partial<OneItem>) => {
    const currentItem = items.find((item) => item.id === id);
    if (!currentItem) return;

    if (currentItem.notificationId) {
      await cancelItemNotification(currentItem.notificationId);
    }

    const baseUpdated: OneItem = {
      ...currentItem,
      ...changes,
      notificationId: undefined,
      updatedAt: new Date().toISOString()
    };

    const notificationId =
      !baseUpdated.completed && baseUpdated.date
        ? await scheduleItemNotification(baseUpdated)
        : undefined;

    const updated = notificationId ? { ...baseUpdated, notificationId } : baseUpdated;

    setItems((current) => current.map((item) => (item.id === id ? updated : item)));

    if (session?.user.id && shouldSyncItem(updated)) {
      try {
        await upsertCloudItem(updated, session.user.id);
      } catch (error) {
        console.warn('ONE cloud edit failed', error);
      }
    }
  }, [items, session?.user.id]);

  const toggleCompleted = useCallback(async (id: string) => {
    const currentItem = items.find((item) => item.id === id);
    if (!currentItem) return;

    const nextCompleted = !currentItem.completed;
    let notificationId = currentItem.notificationId;

    if (nextCompleted) {
      await cancelItemNotification(notificationId);
      notificationId = undefined;
    } else if (currentItem.date) {
      notificationId = await scheduleItemNotification({ ...currentItem, completed: false });
    }

    const updated: OneItem = {
      ...currentItem,
      completed: nextCompleted,
      notificationId,
      updatedAt: new Date().toISOString()
    };

    setItems((current) => current.map((item) => (item.id === id ? updated : item)));

    if (session?.user.id && shouldSyncItem(updated)) {
      try {
        await upsertCloudItem(updated, session.user.id, { refreshEmbedding: false });
      } catch (error) {
        console.warn('ONE cloud update failed', error);
      }
    }
  }, [items, session?.user.id]);

  const remove = useCallback(async (id: string) => {
    const currentItem = items.find((item) => item.id === id);
    if (!currentItem) return;

    if (currentItem.notificationId) {
      await cancelItemNotification(currentItem.notificationId);
    }

    const attachmentPaths = Array.from(
      new Set([currentItem.attachmentUrl, currentItem.imageUrl].filter((value): value is string => Boolean(value)))
    );
    const userId = session?.user.id;

    if (userId) {
      await saveDeletionTombstone({
        id,
        deletedAt: new Date().toISOString(),
        userId,
        attachmentPaths
      });
    }

    setItems((current) => current.filter((item) => item.id !== id));

    for (const path of attachmentPaths) {
      try {
        await removeLocalAttachment(path);
      } catch (error) {
        console.warn('ONE local attachment cleanup failed', error);
      }
    }

    if (!userId) return;

    try {
      await deleteCloudItem(id);
      await removeCloudAttachments(attachmentPaths, userId);
      await removeDeletionTombstone(id, userId);
    } catch (error) {
      console.warn('ONE cloud delete deferred until reconnect', error);
    }
  }, [items, session?.user.id]);

  const clearAll = useCallback(async () => {
    const currentScope = desiredScope;
    const currentUserId = session?.user.id;

    for (const item of items) {
      if (item.notificationId) {
        try {
          await cancelItemNotification(item.notificationId);
        } catch (error) {
          console.warn('ONE notification cleanup failed', error);
        }
      }

      const localPaths = [item.attachmentUrl, item.imageUrl].filter((value): value is string => Boolean(value));
      for (const path of localPaths) {
        try {
          await removeLocalAttachment(path);
        } catch (error) {
          console.warn('ONE local attachment cleanup failed', error);
        }
      }
    }

    await clearItems(currentScope);
    if (currentUserId) await clearDeletionTombstones(currentUserId);

    itemsRef.current = [];
    setItems([]);
  }, [items, desiredScope, session?.user.id]);

  const value = useMemo(
    () => ({ items, hydrated, cloudSyncing, add, update, toggleCompleted, remove, clearAll }),
    [items, hydrated, cloudSyncing, add, update, toggleCompleted, remove, clearAll]
  );

  return <ItemsContext.Provider value={value}>{children}</ItemsContext.Provider>;
}

function shouldSyncItem(item: OneItem) {
  return !(__DEV__ && DEVELOPMENT_SEED_IDS.has(item.id));
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
      merged.set(item.id, item);
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
