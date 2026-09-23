import type { OneItem } from '@/src/types/item';
import { migrateItemIntelligence, planIntelligenceMigration } from './versioning';

export type IntelligenceRecoveryResult = { items: OneItem[]; recoveredItemIds: string[]; skippedItemIds: string[] };

/** Retry only deterministic/migration-safe intelligence failures. External AI retries remain explicit. */
export function recoverIntelligenceItems(items: OneItem[], options: { limit?: number; now?: Date } = {}): IntelligenceRecoveryResult {
  const limit = Math.max(1, Math.min(options.limit ?? 20, 100)); const now = options.now ?? new Date(); const recoveredItemIds: string[] = []; const skippedItemIds: string[] = [];
  const next = items.map((item) => {
    if (!planIntelligenceMigration(item).needsMigration) return item;
    if (recoveredItemIds.length >= limit) { skippedItemIds.push(item.id); return item; }
    try { const recovered = migrateItemIntelligence(item, now); recoveredItemIds.push(item.id); return recovered; }
    catch { skippedItemIds.push(item.id); return { ...item, processingStatus: 'failed_enrichment', aiMetadata: { ...(item.aiMetadata ?? {}), failureCode: 'deterministic_recovery_failed' } }; }
  });
  return { items: next, recoveredItemIds, skippedItemIds };
}
