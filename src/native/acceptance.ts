import AsyncStorage from '@react-native-async-storage/async-storage';

const EVENTS_KEY = '@one/native-acceptance/events-v1';
const LAST_ERROR_KEY = '@one/native-acceptance/last-error-v1';
const MAX_EVENTS = 40;

export type NativeAcceptanceEventKind =
  | 'share_intent'
  | 'share_received'
  | 'share_saved'
  | 'share_duplicate_blocked'
  | 'ocr_success'
  | 'ocr_empty'
  | 'ocr_failed'
  | 'attachment_persisted'
  | 'deep_link_received'
  | 'notification_scheduled'
  | 'notification_denied'
  | 'notification_cancelled'
  | 'sync_success'
  | 'sync_failed'
  | 'native_error';

export type NativeAcceptanceEvent = {
  id: string;
  kind: NativeAcceptanceEventKind;
  at: string;
  detail?: string;
};

export async function recordNativeAcceptanceEvent(
  kind: NativeAcceptanceEventKind,
  detail?: string
) {
  if (!__DEV__) return;

  try {
    const events = await loadNativeAcceptanceEvents();
    const next: NativeAcceptanceEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      kind,
      at: new Date().toISOString(),
      detail: sanitizeDetail(detail)
    };
    await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify([next, ...events].slice(0, MAX_EVENTS)));
  } catch {
    // Diagnostics must never break the product flow.
  }
}

export async function recordLastNativeError(scope: string, error: unknown) {
  if (!__DEV__) return;
  const message = error instanceof Error ? error.message : String(error || 'Unknown native error');
  const value = `${scope}: ${message}`.slice(0, 500);

  try {
    await AsyncStorage.setItem(LAST_ERROR_KEY, value);
    await recordNativeAcceptanceEvent('native_error', value);
  } catch {
    // Diagnostics must never break the product flow.
  }
}

export async function loadNativeAcceptanceEvents(): Promise<NativeAcceptanceEvent[]> {
  if (!__DEV__) return [];
  try {
    const raw = await AsyncStorage.getItem(EVENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed as NativeAcceptanceEvent[] : [];
  } catch {
    return [];
  }
}

export async function loadLastNativeError() {
  if (!__DEV__) return null;
  try {
    return await AsyncStorage.getItem(LAST_ERROR_KEY);
  } catch {
    return null;
  }
}

export async function clearNativeAcceptanceLog() {
  if (!__DEV__) return;
  await AsyncStorage.multiRemove([EVENTS_KEY, LAST_ERROR_KEY]);
}

function sanitizeDetail(value?: string) {
  if (!value) return undefined;
  return value
    .replace(/([?&](?:code|token|access_token|refresh_token)=)[^&#\s]+/gi, '$1[redacted]')
    .slice(0, 300);
}
