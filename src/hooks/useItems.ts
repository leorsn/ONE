import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadItems, saveItems } from '@/src/storage/items';
import type { OneItem } from '@/src/types/item';

export function useItems(seed: OneItem[]) {
  const [items, setItems] = useState<OneItem[]>(seed);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadItems().then((stored) => {
      if (!mounted) return;
      if (stored !== null) setItems(stored);
      setHydrated(true);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveItems(items);
  }, [items, hydrated]);

  const add = useCallback((item: OneItem) => {
    setItems((current) => [item, ...current]);
  }, []);

  const toggleCompleted = useCallback((id: string) => {
    setItems((current) => current.map((item) =>
      item.id === id ? { ...item, completed: !item.completed, updatedAt: new Date().toISOString() } : item
    ));
  }, []);

  const remove = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  return useMemo(() => ({ items, add, toggleCompleted, remove, hydrated }), [items, add, toggleCompleted, remove, hydrated]);
}
