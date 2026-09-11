import AsyncStorage from '@react-native-async-storage/async-storage';
import { shouldPreventDuplicateShare } from '@/src/native/sharePayload';

const KEY = '@one/native-share/last-handled-v1';

type LastHandledShare = {
  fingerprint: string;
  handledAt: number;
};

export async function isRecentlyHandledShare(fingerprint: string) {
  const previous = await loadLastHandledShare();
  return shouldPreventDuplicateShare({
    previousFingerprint: previous?.fingerprint,
    previousHandledAt: previous?.handledAt,
    nextFingerprint: fingerprint
  });
}

export async function markShareHandled(fingerprint: string) {
  const record: LastHandledShare = { fingerprint, handledAt: Date.now() };
  await AsyncStorage.setItem(KEY, JSON.stringify(record));
}

async function loadLastHandledShare(): Promise<LastHandledShare | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastHandledShare>;
    if (typeof parsed.fingerprint !== 'string' || typeof parsed.handledAt !== 'number') return null;
    return { fingerprint: parsed.fingerprint, handledAt: parsed.handledAt };
  } catch {
    return null;
  }
}
