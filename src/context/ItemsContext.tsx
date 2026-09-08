import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { mockItems } from '@/src/data/mockItems';
import { loadItems, saveItems } from '@/src/storage/items';
import type { OneItem } from '@/src/types/item';

type ItemsContextValue = {
  items: OneItem[];
  hydrated: boolean;
  add: (item: OneItem) => void;
  toggleCompleted: (id: string) => void;
  remove: (id: string) => void;
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

  const add = useCallback((item: OneItem) => {
    setItems((current) => [item, ...current]);
  }, []);

  const toggleCompleted = useCallback((id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, completed: !item.completed, updatedAt: new Date().toISOString() }
          : item
      )
    );
  }, []);

  const remove = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

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
