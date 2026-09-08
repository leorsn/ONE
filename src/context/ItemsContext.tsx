import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { mockItems } from '@/src/data/mockItems';
import { cancelItemNotification, scheduleItemNotification } from '@/src/notifications/localNotifications';
import { loadItems, saveItems } from '@/src/storage/items';
import type { OneItem } from '@/src/types/item';

type ItemsContextValue = {
  items: OneItem[];
  hydrated: boolean;
  add: (item: OneItem) => Promise<void>;
  toggleCompleted: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

const ItemsContext = createContext<ItemsContextValue | null>(null);

export function ItemsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<OneItem[]>(mockItems);
  const [hydrated, setHydrated] = useState(false);

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

  const add = useCallback(async (item: OneItem) => {
    const notificationId = await scheduleItemNotification(item);
    const withNotification = notificationId ? { ...item, notificationId } : item;
    setItems((current) => [withNotification, ...current]);
  }, []);

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

    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              completed: nextCompleted,
              notificationId,
              updatedAt: new Date().toISOString()
            }
          : item
      )
    );
  }, [items]);

  const remove = useCallback(async (id: string) => {
    const currentItem = items.find((item) => item.id === id);
    if (currentItem?.notificationId) {
      await cancelItemNotification(currentItem.notificationId);
    }
    setItems((current) => current.filter((item) => item.id !== id));
  }, [items]);

  const value = useMemo(
    () => ({ items, hydrated, add, toggleCompleted, remove }),
    [items, hydrated, add, toggleCompleted, remove]
  );

  return <ItemsContext.Provider value={value}>{children}</ItemsContext.Provider>;
}

export function useItems() {
  const context = useContext(ItemsContext);
  if (!context) throw new Error('useItems must be used inside ItemsProvider');
  return context;
}
