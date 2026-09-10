import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { mockItems } from '@/src/data/mockItems';
import { deleteCloudItem, pullCloudItems, upsertCloudItem } from '@/src/supabase/items';
import { deleteSharedAttachment } from '@/src/supabase/attachments';
import { cancelItemNotification, scheduleItemNotification } from '@/src/notifications/localNotifications';
import { clearItems, loadItems, saveItems } from '@/src/storage/items';
import { clearLocalAttachments, removeLocalAttachment } from '@/src/storage/attachments';
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
  const { session } = useAuth();
  const [items, setItems] = useState<OneItem[]>(DEVELOPMENT_SEED_ITEMS);
  const [hydrated, setHydrated] = useState(false);
  const [cloudSyncing, setCloudSyncing] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadItems().then((stored) => {
      if (!mounted) return;
      setItems(stored ?? DEVELOPMENT_SEED_ITEMS);
      setHydrated(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveItems(items);
  }, [items, hydrated]);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId || !hydrated) return;
    const syncUserId = userId;

    let cancelled = false;

    async function syncFromCloud() {
      setCloudSyncing(true);
      try {
        const [cloud, allTombstones] = await Promise.all([
          pullCloudItems(),
          loadDeletionTombstones()
        ]);
        if (cancelled) return;

        const activeTombstones = allTombstones.filter(
          (entry) => !entry.userId || entry.userId === syncUserId
        );
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
            await removeDeletionTombstone(tombstone.id);
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

    syncFromCloud();
    return () => {
      cancelled = true;
    };
  }, [session?.user.id, hydrated]);

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

    setItems((current) => current.map((item) => (item.id === id ? updated : item));

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

    await saveDeletionTombstone({
      id,
      deletedAt: new Date().toISOString(),
      userId: session?.user.id,
      attachmentPaths
    });

    setItems((current) => current.filter((item) => item.id !== id));

    for (const path of attachmentPaths) {
      try {
        await removeLocalAttachment(path);
      } catch (error) {
        console.warn('ONE local attachment cleanup failed', error);
      }
    }

    if (!session?.user.id) return;

    try {
      await deleteCloudItem(id);
      await removeCloudAttachments(attachmentPaths, session.user.id);
      await removeDeletionTombstone(id);
    } catch (error) {
      console.warn('ONE cloud delete deferred until reconnect', error);
    }
  }, [items, session?.user.id]);

  const clearAll = useCallback(async () => {
    for (const item of items) {
      if (!item.notificationId) continue;
      try {
        await cancelItemNotification(item.notificationId);
      } catch (error) {
        console.warn('ONE notification cleanup failed', error);
      }
    }

    await Promise.all([
      clearItems(),
      clearDeletionTombstones(),
      clearLocalAttachments()
    ]);

    setItems([]);
  }, [items]);

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
