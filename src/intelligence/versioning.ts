import type { OneItem } from '@/src/types/item';
import { processItemIntelligence } from './pipeline';

export const NEVER_INTELLIGENCE_VERSION = '1.0.0';

export type IntelligenceMigrationPlan = {
  needsMigration: boolean;
  fromVersion?: string;
  toVersion: string;
  reason?: 'missing-version' | 'outdated-version' | 'failed-enrichment';
};

export function planIntelligenceMigration(item: OneItem): IntelligenceMigrationPlan {
  const current = item.aiMetadata?.version;
  if (item.processingStatus === 'failed_enrichment') return { needsMigration: true, fromVersion: current, toVersion: NEVER_INTELLIGENCE_VERSION, reason: 'failed-enrichment' };
  if (!current) return { needsMigration: true, toVersion: NEVER_INTELLIGENCE_VERSION, reason: 'missing-version' };
  if (current !== NEVER_INTELLIGENCE_VERSION) return { needsMigration: true, fromVersion: current, toVersion: NEVER_INTELLIGENCE_VERSION, reason: 'outdated-version' };
  return { needsMigration: false, fromVersion: current, toVersion: NEVER_INTELLIGENCE_VERSION };
}

export function migrateItemIntelligence(item: OneItem, now = new Date()): OneItem {
  const plan = planIntelligenceMigration(item); if (!plan.needsMigration) return item;
  const processed = processItemIntelligence(item, now).item;
  return { ...processed, aiMetadata: { ...(processed.aiMetadata ?? {}), origin: processed.aiMetadata?.origin ?? 'deterministic', version: NEVER_INTELLIGENCE_VERSION, interpretedAt: now.toISOString(), failureCode: undefined } };
}

export function migrateIntelligenceBatch(items: OneItem[], options: { limit?: number; now?: Date } = {}) {
  const limit = Math.max(1, options.limit ?? 50); const now = options.now ?? new Date(); let migrated = 0;
  const nextItems = items.map((item) => { if (migrated >= limit || !planIntelligenceMigration(item).needsMigration) return item; migrated += 1; return migrateItemIntelligence(item, now); });
  return { items: nextItems, migrated, remaining: nextItems.filter((item) => planIntelligenceMigration(item).needsMigration).length };
}
