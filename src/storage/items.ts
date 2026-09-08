import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OneItem } from '@/src/types/item';

const STORAGE_KEY = '@one/items/v1';

export async function loadItems(): Promise<OneItem[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as OneItem[];
  } catch {
    return [];
  }
}

export async function saveItems(items: OneItem[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
