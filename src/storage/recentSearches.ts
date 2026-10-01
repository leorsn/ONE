import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_SEARCHES_KEY = '@never/search/recent/v1';
const MAX_RECENT_SEARCHES = 5;

export async function loadRecentSearches(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return normalizeRecentSearches(parsed.filter((value): value is string => typeof value === 'string'));
  } catch {
    return [];
  }
}

export async function saveRecentSearches(searches: string[]) {
  const normalized = normalizeRecentSearches(searches);
  await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(normalized));
  return normalized;
}

export async function clearRecentSearches() {
  await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
}

export function addRecentSearch(searches: string[], value: string) {
  const clean = value.trim();
  if (!clean) return normalizeRecentSearches(searches);
  return normalizeRecentSearches([clean, ...searches.filter((entry) => entry.trim().toLocaleLowerCase() !== clean.toLocaleLowerCase())]);
}

function normalizeRecentSearches(searches: string[]) {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const value of searches) {
    const clean = value.trim();
    if (!clean) continue;
    const key = clean.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(clean);
    if (normalized.length >= MAX_RECENT_SEARCHES) break;
  }
  return normalized;
}
