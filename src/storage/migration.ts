import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LocalMigrationState } from '@/src/migration/policy';

const STORAGE_KEY = '@one/local-migration/v1';

export async function loadLocalMigrationState(): Promise<LocalMigrationState | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as LocalMigrationState;
    if (parsed?.version !== 1 || !parsed.ownerUserId) return null;
    if (parsed.status !== 'pending_cloud' && parsed.status !== 'complete') return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveLocalMigrationState(state: LocalMigrationState) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function clearLocalMigrationState() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
