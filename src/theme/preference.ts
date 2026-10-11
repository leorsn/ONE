import { parseThemePreference, type ThemePreference } from './editions.ts';

export const THEME_STORAGE_KEY = '@one/theme/v1';
type PreferenceStore = { getItem: (key: string) => Promise<string | null>; setItem: (key: string, value: string) => Promise<void> };
export async function loadThemePreference(store: PreferenceStore): Promise<ThemePreference> {
  try { return parseThemePreference(await store.getItem(THEME_STORAGE_KEY)); }
  catch { return 'platinum'; }
}
// Serialize disk writes: rapid selections cannot persist in the wrong order.
export function createThemeWriter(store: PreferenceStore) {
  let pending = Promise.resolve();
  return (next: ThemePreference) => {
    const result = pending.catch(() => undefined).then(() => store.setItem(THEME_STORAGE_KEY, next));
    pending = result;
    return result;
  };
}
