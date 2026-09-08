import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { mockItems } from '@/src/data/mockItems';
import { deleteCloudItem, pullCloudItems, upsertCloudItem } from '@/src/supabase/items';
import { cancelItemNotification, scheduleItemNotification } from '@/src/notifications/localNotifications';
import { loadItems, saveItems } from '@/src/storage/items';
import type { OneItem } from '@/src/types/item';

type ItemsContextValue = {
  items: OneItem[];
  hydrated: boolean;
  cloudSyncing: boolean;
  add: (item: OneItem) => Promise<void>;
  toggleCompleted: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

const ItemsContext = createContext<ItemsContextValue | null>(null);

export function ItemsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [items, setItems] = useState<OneItem[]>(mockItems);
  const [hydrated, setHydrated] = useState(false);
  const [cloudSyncing, setCloudSyncing] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadItems().then((stored) => {
      if (!mounted) return;
      setItems(stored.length ? stored : mockItems);
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
    if (!session?.user.id || !hydrated) return;

    let cancelled = false;

    async function syncFromCloud() {
      setCloudSyncing(true);
      try {
        const cloud = await pullCloudItems();
        if (cancelled) return;

        const merged = mergeByUpdatedAt(items, cloud);
        setItems(merged);

        const cloudById = new Map(cloud.map((item) => [item.id, item]));
        const localToUpload = items.filter((localItem) => {
          const cloudItem = cloudById.get(localItem.id);
          return (
            !cloudItem ||
            new Date(localItem.updatedAt).getTime() > new Date(cloudItem.updatedAt).getTime()
          );
        });

        if (localToUpload.length) {
          await Promise.all(
            localToUpload.map((item) => upsertCloudItem(item, session.user.id))
          );
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

    if (session?.user.id) {
      try {
        await upsertCloudItem(withNotification, session.user.id);
      } catch (error) {
        console.warn('ONE cloud add failed', error);
      }
    }
  }, [session?.user.id]);

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

    if (session?.user.id) {
      try {
        await upsertCloudItem(updated, session.user.id, { refreshEmbedding: false });
      } catch (error) {
        console.warn('ONE cloud update failed', error);
      }
    }
  }, [items, session?.user.id]);

  const remove = useCallback(async (id: string) => {
    const currentItem = items.find((item) => item.id === id);
    if (currentItem?.notificationId) {
      await cancelItemNotification(currentItem.notificationId);
    }

    setItems((current) => current.filter((item) => item.id !== id));

    if (session?.user.id) {
      try {
        await deleteCloudItem(id);
      } catch (error) {
        console.warn('ONE cloud delete failed', error);
      }
    }
  }, [items, session?.user.id]);

  const value = useMemo(
    () => ({ items, hydrated, cloudSyncing, add, toggleCompleted, remove }),
    [items, hydrated, cloudSyncing, add, toggleCompleted, remove]
  );

  return <ItemsContext.Provider value={value}>{children}</ItemsContext.Provider>;
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
