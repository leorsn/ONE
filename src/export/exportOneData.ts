import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { OneItem } from '@/src/types/item';

const EXPORT_SCHEMA_VERSION = 1;

export async function exportOneData(items: OneItem[]): Promise<string | null> {
  if (Platform.OS === 'web') {
    return 'Data export is currently available in the native ONE app.';
  }

  if (!FileSystem.cacheDirectory) {
    return 'ONE could not access temporary device storage for the export.';
  }

  const sharingAvailable = await Sharing.isAvailableAsync();
  if (!sharingAvailable) {
    return 'The system share sheet is not available on this device.';
  }

  const exportedAt = new Date().toISOString();
  const payload = {
    app: 'ONE',
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt,
    itemCount: items.length,
    items
  };

  const stamp = exportedAt.replace(/[:.]/g, '-');
  const path = `${FileSystem.cacheDirectory}ONE-export-${stamp}.json`;

  try {
    await FileSystem.writeAsStringAsync(path, JSON.stringify(payload, null, 2), {
      encoding: FileSystem.EncodingType.UTF8
    });

    await Sharing.shareAsync(path, {
      mimeType: 'application/json',
      dialogTitle: 'Export ONE data',
      UTI: 'public.json'
    });

    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'ONE could not export your data.';
  } finally {
    try {
      await FileSystem.deleteAsync(path, { idempotent: true });
    } catch {
      // Temporary export cleanup is best-effort.
    }
  }
}
