import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@one/deletions/v1';

export type DeletionTombstone = {
  id: string;
  deletedAt: string;
  userId?: string;
  attachmentPaths: string[];
};

export async function loadDeletionTombstones(): Promise<DeletionTombstone[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as DeletionTombstone[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveDeletionTombstone(tombstone: DeletionTombstone) {
  const current = await loadDeletionTombstones();
  const next = [tombstone, ...current.filter((entry) => entry.id !== tombstone.id)];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function removeDeletionTombstone(id: string) {
  const current = await loadDeletionTombstones();
  const next = current.filter((entry) => entry.id !== id);

  if (next.length) {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } else {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}
