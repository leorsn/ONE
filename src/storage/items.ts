import AsyncStorage from '@react-native-async-storage/async-storage';
import { ensureCanonicalItemMetadata } from '@/src/capture/itemMetadata';
import type { OneItem } from '@/src/types/item';
import type { ItemStorageScope } from '@/src/storage/scope';

export { itemStorageScope, type ItemStorageScope } from '@/src/storage/scope';

const LEGACY_STORAGE_KEY = '@one/items/v1';
const STORAGE_PREFIX = '@one/items/v2/';

export async function loadItems(scope: ItemStorageScope): Promise<OneItem[] | null> {
  const scopedKey = storageKey(scope);
  const scopedRaw = await AsyncStorage.getItem(scopedKey);

  if (scopedRaw !== null) return parseItems(scopedRaw);

  // One-time migration from the pre-partitioned v1 store. Waiting for AuthContext
  // to finish loading before calling this decides whether the legacy collection
  // belongs to the current signed-in user or the anonymous device scope.
  const legacyRaw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacyRaw === null) return null;

  const legacyItems = parseItems(legacyRaw);
  if (legacyItems === null) {
    await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
    return null;
  }

  await AsyncStorage.multiSet([
    [scopedKey, JSON.stringify(legacyItems)],
    ['@one/items/migrated-v2', new Date().toISOString()]
  ]);
  await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
  return legacyItems;
}

export async function saveItems(scope: ItemStorageScope, items: OneItem[]) {
  await AsyncStorage.setItem(storageKey(scope), JSON.stringify(items));
}

export async function clearItems(scope: ItemStorageScope) {
  // Persist an intentionally empty collection so development seed data does not
  // reappear after a user explicitly clears this ONE storage scope.
  await AsyncStorage.setItem(storageKey(scope), '[]');
}

function storageKey(scope: ItemStorageScope) {
  return `${STORAGE_PREFIX}${scope}`;
}

function parseItems(raw: string): OneItem[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? (parsed as OneItem[]).map(ensureCanonicalItemMetadata)
      : null;
  } catch {
    return null;
  }
}
