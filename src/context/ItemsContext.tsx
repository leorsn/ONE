import { applyItemResult, rebaseItemSnapshot } from '@/src/sync/inFlight';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { ensureCanonicalItemMetadata } from '@/src/capture/itemMetadata';
import { useAuth } from '@/src/context/AuthContext';
import { mockItems } from '@/src/data/mockItems';
import { completeMigration, planAnonymousMigration } from '@/src/migration/policy';
import { recordLastNativeError, recordNativeAcceptanceEvent } from '@/src/native/acceptance';
import {
  cancelItemNotification,
  getScheduledItemNotifications,
  scheduleItemNotification
} from '@/src/notifications/localNotifications';
import { isRemindable, notificationTransition } from '@/src/notifications/policy';
import {
  orphanedScheduledNotificationIds,
  reminderReconciliationAction
} from '@/src/notifications/reconciliation';
import { deleteSharedAttachment } from '@/src/supabase/attachments';
import { deleteCloudItem, pullCloudItems } from '@/src/supabase/items';
import { markProfileSynced } from '@/src/supabase/profile';
import { removeLocalAttachment } from '@/src/storage/attachments';
import {
  clearDeletionTombstones,
  loadDeletionTombstones,
  removeDeletionTombstone,
  saveDeletionTombstone,
  type DeletionTombstone
} from '@/src/storage/deletions';
import {
  clearItems,
  itemStorageScope,
  loadItems,
  saveItems,
  type ItemStorageScope
} from '@/src/storage/items';
import {
  clearLocalMigrationState,
  loadLocalMigrationState,
  saveLocalMigrationState
} from '@/src/storage/migration';
import { cloudAttachmentPath, syncItemToCloud } from '@/src/sync/cloudItem';
import { canApplyScopedSyncResult, preserveDeviceLocalState, resolveCloudSnapshot } from '@/src/sync/merge';
import {
  buildSyncQueue,
  canAutoRetry,
  markDeletionFailure,
  markSyncFailure,
  markSyncPending,
  syncPresentationState
} from '@/src/sync/queue';
import type { OneItem } from '@/src/types/item';

type SyncStatus = ReturnType<typeof syncPresentationState>;

type ItemsContextValue = {
  items: OneItem[];
  hydrated: boolean;
  hydrationError: boolean;
  retryHydration: () => void;
  cloudSyncing: boolean;
  syncStatus: SyncStatus;
  add: (item: OneItem) => Promise<OneItem>;
  update: (id: string, changes: Partial<OneItem>) => Promise<OneItem | undefined>;
  toggleCompleted: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  retrySync: () => Promise<void>;
  clearAll: () => Promise<void>;
};

const ItemsContext = createContext<ItemsContextValue | null>(null);
const DEVELOPMENT_SEED_ITEMS: OneItem[] = __DEV__ ? mockItems.map(ensureCanonicalItemMetadata) : [];
const DEVELOPMENT_SEED_IDS = new Set(mockItems.map((item) => item.id));

export function ItemsProvider({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const desiredScope = itemStorageScope(session?.user.id);
  const [items, setItems] = useState<OneItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [hydrationErrorScope, setHydrationErrorScope] = useState<ItemStorageScope | null>(null);
  const [hydrationRevision, setHydrationRevision] = useState(0);
  const [hydratedScope, setHydratedScope] = useState<ItemStorageScope | null>(null);
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [syncProblem, setSyncProblem] = useState(false);
  const [syncRevision, setSyncRevision] = useState(0);
  const activeScopeRef = useRef<ItemStorageScope | null>(null);
  const itemsRef = useRef<OneItem[]>([]);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryWakeAtRef = useRef<number | null>(null);
  const scopeReady = hydrated && !authLoading && hydratedScope === desiredScope;

  const scheduleSyncRetry = useCallback((retryAt?: string) => {
    const parsed = retryAt ? new Date(retryAt).getTime() : Number.NaN;
    const target = Number.isFinite(parsed) ? Math.max(Date.now() + 250, parsed) : Date.now() + 5_000;
    if (retryWakeAtRef.current && retryWakeAtRef.current <= target) return;

    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    retryWakeAtRef.current = target;
    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      retryWakeAtRef.current = null;
      setSyncRevision((value) => value + 1);
    }, Math.max(250, target - Date.now()));
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => () => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      void recordNativeAcceptanceEvent('app_state', state);
      if (state === 'active') setSyncRevision((value) => value + 1);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;
    const previousScope = activeScopeRef.current;
    activeScopeRef.current = null;

    async function hydrateScope() {
      try {
        if (previousScope && previousScope !== desiredScope && previousScope !== 'anonymous') {
          const suspended = await suspendItemNotifications(itemsRef.current);
          await saveItems(previousScope, suspended);
          if (cancelled) return;
          itemsRef.current = suspended;
        }

        if (cancelled) return;
        const stored = await loadItems(desiredScope);
        if (cancelled) return;
        let nextItems = (stored ?? (desiredScope === 'anonymous' ? DEVELOPMENT_SEED_ITEMS : []))
          .map(ensureCanonicalItemMetadata);

        if (desiredScope === 'anonymous') {
          nextItems = nextItems.map((item) => ({ ...item, syncState: 'local' }));
        } else {
          nextItems = nextItems
            .filter(shouldSyncItem)
            .map((item) => ({ ...item, syncState: item.syncState || 'pending' }));

          const userId = session?.user.id;
          if (userId) {
            const anonymousStored = previousScope === 'anonymous'
              ? itemsRef.current
              : (await loadItems('anonymous')) ?? [];
            const migrationState = await loadLocalMigrationState();
            const migration = planAnonymousMigration({
              userId,
              anonymousItems: anonymousStored.filter(shouldSyncItem).map(ensureCanonicalItemMetadata),
              destinationItems: nextItems,
              state: migrationState
            });

            if (migration.blocked) {
              await recordNativeAcceptanceEvent('local_migration_blocked', 'different-account-owner');
            } else {
              nextItems = migration.items;
              if (migration.nextState) await saveLocalMigrationState(migration.nextState);
              if (migration.copied) {
                await recordNativeAcceptanceEvent('local_migration_copied', `${migration.nextState?.sourceItemCount ?? 0} item(s)`);
              }
            }
          }
        }

        if (cancelled) return;
        if (desiredScope !== 'anonymous') {
          nextItems = await reconcileItemNotifications(nextItems);
          await saveItems(desiredScope, nextItems);
        } else {
          await cancelOrphanedItemNotifications(nextItems);
        }

        if (cancelled) return;
        activeScopeRef.current = desiredScope;
        itemsRef.current = nextItems;
        setItems(nextItems);
        setSyncProblem(nextItems.some((item) => item.syncState === 'error'));
        setHydrationErrorScope(null);
        setHydratedScope(desiredScope);
        setHydrated(true);
      } catch (error) {
        if (__DEV__) console.warn('ONE local storage hydration failed');
        await recordLastNativeError('local-hydration', error);
        if (cancelled) return;

        // Preserve the original bytes and block writes until loading succeeds.
        setHydrationErrorScope(desiredScope);
        setHydrated(false);
      }
    }

    void hydrateScope();
    return () => {
      cancelled = true;
    };
  }, [authLoading, desiredScope, session?.user.id, hydrationRevision]);

  useEffect(() => {
    if (!scopeReady) return;

    saveItems(desiredScope, items).catch((error) => {
      if (__DEV__) console.warn('ONE local storage save failed');
      void recordLastNativeError('local-save', error);
    });
  }, [items, scopeReady, desiredScope]);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId || !scopeReady) return;
    const syncUserId = userId;
    const syncScope = itemStorageScope(syncUserId);
    let cancelled = false;
    const stillActive = () => !cancelled && canApplyScopedSyncResult(syncScope, activeScopeRef.current);

    async function syncFromCloud() {
      setCloudSyncing(true);
      let hadSyncError = false;

      try {
        const pullSnapshot = itemsRef.current;
        const [cloud, activeTombstones, migrationState] = await Promise.all([
          pullCloudItems(),
          loadDeletionTombstones(syncUserId),
          loadLocalMigrationState()
        ]);
        if (cancelled || !canApplyScopedSyncResult(syncScope, activeScopeRef.current)) return;

        const deletedIds = new Set(activeTombstones.map((entry) => entry.id));
        const localSnapshot = pullSnapshot.filter((item) => !deletedIds.has(item.id));
        const visibleCloud = cloud.filter((item) => !deletedIds.has(item.id));
        const resolution = resolveCloudSnapshot(localSnapshot, visibleCloud);

        for (const remotelyDeleted of resolution.remoteDeleted) {
          if (!stillActive()) return;
          if (itemsRef.current.find((item) => item.id === remotelyDeleted.id) !== remotelyDeleted) continue;
          await cleanupDeviceState(remotelyDeleted);
        }

        let merged = await reconcileItemNotifications(resolution.merged.map(ensureCanonicalItemMetadata));
        if (cancelled || !canApplyScopedSyncResult(syncScope, activeScopeRef.current)) return;
        merged = rebaseItemSnapshot(localSnapshot, merged, itemsRef.current);
        itemsRef.current = merged;
        setItems(merged);

        const queue = buildSyncQueue(
          resolution.localToUpload.filter(shouldSyncItem),
          activeTombstones
        );

        for (const operation of queue) {
          if (cancelled || !canApplyScopedSyncResult(syncScope, activeScopeRef.current)) return;

          if (operation.kind === 'upsert') {
            const candidate = itemsRef.current.find((item) => item.id === operation.itemId);
            if (!candidate || !shouldSyncItem(candidate)) continue;

            try {
              const synced = await syncItemToCloud(ensureCanonicalItemMetadata(candidate), syncUserId);
              if (!stillActive()) return;
              merged = applyItemResult(itemsRef.current, candidate, preserveDeviceLocalState(synced, candidate));
              itemsRef.current = merged;
              setItems(merged);
            } catch (error) {
              if (!stillActive()) return;
              hadSyncError = true;
              const failed = markSyncFailure(candidate);
              merged = applyItemResult(itemsRef.current, candidate, failed);
              itemsRef.current = merged;
              setItems(merged);
              if (canAutoRetry(failed.syncAttemptCount ?? 0)) scheduleSyncRetry(failed.syncRetryAt);
              if (__DEV__) console.warn('ONE deferred item sync failed; capture remains local');
              await recordLastNativeError('item-sync', error);
            }
            continue;
          }

          const tombstone = activeTombstones.find((entry) => entry.id === operation.itemId);
          if (!tombstone) continue;
          try {
            await deleteCloudItem(tombstone.id);
            await removeCloudAttachments(tombstone.attachmentPaths, syncUserId);
            await removeDeletionTombstone(tombstone.id, syncUserId);
          } catch (error) {
            hadSyncError = true;
            const failed = markDeletionFailure(tombstone);
            await saveDeletionTombstone(failed);
            if (canAutoRetry(failed.attemptCount ?? 0)) scheduleSyncRetry(failed.retryAt);
            if (__DEV__) console.warn('ONE deferred delete cleanup failed');
            await recordLastNativeError('delete-sync', error);
          }
        }

        if (!stillActive()) return;
        merged = itemsRef.current;
        await saveItems(syncScope, merged);
        if (!stillActive()) return;
        const remainingTombstones = await loadDeletionTombstones(syncUserId);
        const remainingUnsynced = merged.filter(
          (item) => shouldSyncItem(item) && item.syncState !== 'synced'
        ).length + remainingTombstones.length;

        const completedMigration = completeMigration(migrationState, syncUserId, remainingUnsynced);
        if (completedMigration && completedMigration.status !== migrationState?.status) {
          await saveLocalMigrationState(completedMigration);
          await recordNativeAcceptanceEvent('local_migration_complete', `${completedMigration.sourceItemCount} item(s)`);
        }

        const hasPersistedProblems = merged.some((item) => item.syncState === 'error') ||
          remainingTombstones.some((entry) => Boolean(entry.errorAt));
        setSyncProblem(hadSyncError || hasPersistedProblems);

        if (!hadSyncError && !hasPersistedProblems) {
          try {
            await markProfileSynced(syncUserId);
          } catch {
            if (__DEV__) console.warn('ONE profile sync timestamp update deferred');
          }
        }

        await recordNativeAcceptanceEvent('sync_success', `${merged.length} item(s)`);
      } catch (error) {
        if (!stillActive()) return;
        hadSyncError = true;
        setSyncProblem(true);
        const failedItems = itemsRef.current.map((item) =>
          item.syncState === 'pending' && shouldSyncItem(item) ? markSyncFailure(item) : item
        );
        itemsRef.current = failedItems;
        setItems(failedItems);
        await saveItems(syncScope, failedItems);
        const retryable = failedItems.find(
          (item) => item.syncState === 'error' && canAutoRetry(item.syncAttemptCount ?? 0)
        );
        if (retryable) scheduleSyncRetry(retryable.syncRetryAt);
        if (__DEV__) console.warn('ONE cloud sync failed; local data preserved');
        await recordLastNativeError('cloud-sync', error);
        await recordNativeAcceptanceEvent('sync_failed', 'local-data-preserved');
      } finally {
        if (!cancelled) setCloudSyncing(false);
      }
    }

    void syncFromCloud();
    return () => {
      cancelled = true;
    };
  }, [session?.user.id, scopeReady, desiredScope, syncRevision, scheduleSyncRetry]);

  const applySyncedItem = useCallback((synced: OneItem, submitted: OneItem) => {
    let applied: OneItem | undefined;
    itemsRef.current = itemsRef.current.map((candidate) => {
      if (candidate !== submitted) return candidate;
      applied = preserveDeviceLocalState(ensureCanonicalItemMetadata(synced), candidate);
      return applied;
    });
    setItems(itemsRef.current);
    return applied;
  }, []);

  const add = useCallback(async (item: OneItem) => {
    const userId = session?.user.id;
    const scope = itemStorageScope(userId);
    if (!canApplyScopedSyncResult(scope, activeScopeRef.current)) throw new Error('Your account changed. Please try again.');
    const existing = itemsRef.current.find((candidate) => candidate.id === item.id);
    if (existing) return existing;
    const canonical = ensureCanonicalItemMetadata(item);
    const base = userId ? markSyncPending(canonical) : { ...canonical, syncState: 'local' as const };
    const scheduleResult = isRemindable(base)
      ? await scheduleItemNotification(base, { requestPermission: true })
      : { status: 'not_applicable' as const };
    const local: OneItem = {
      ...base,
      notificationId: scheduleResult.notificationId,
      notificationStatus: scheduleResult.status
    };

    if (!canApplyScopedSyncResult(scope, activeScopeRef.current)) {
      await cancelItemNotification(local.notificationId);
      throw new Error('Your account changed. Please try again.');
    }
    const concurrent = itemsRef.current.find((candidate) => candidate.id === local.id);
    if (concurrent) {
      await cancelItemNotification(local.notificationId);
      return concurrent;
    }
    itemsRef.current = [local, ...itemsRef.current];
    setItems(itemsRef.current);
    await saveItems(scope, itemsRef.current);

    if (!userId || !shouldSyncItem(local)) return local;

    try {
      const synced = await syncItemToCloud(local, userId);
      if (!canApplyScopedSyncResult(scope, activeScopeRef.current)) return local;
      const applied = applySyncedItem(synced, local) ?? local;
      await saveItems(scope, itemsRef.current);
      return applied;
    } catch (error) {
      if (!canApplyScopedSyncResult(scope, activeScopeRef.current)) return local;
      const failed = markSyncFailure(local);
      itemsRef.current = applyItemResult(itemsRef.current, local, failed);
      setItems(itemsRef.current);
      setSyncProblem(true);
      await saveItems(scope, itemsRef.current);
      if (canAutoRetry(failed.syncAttemptCount ?? 0)) scheduleSyncRetry(failed.syncRetryAt);
      if (__DEV__) console.warn('ONE cloud add deferred until reconnect');
      await recordLastNativeError('cloud-add', error);
      return failed;
    }
  }, [session?.user.id, applySyncedItem, scheduleSyncRetry]);

  const update = useCallback(async (id: string, changes: Partial<OneItem>) => {
    const currentItem = itemsRef.current.find((item) => item.id === id);
    if (!currentItem) return undefined;

    const userId = session?.user.id;
    const scope = itemStorageScope(userId);
    if (!canApplyScopedSyncResult(scope, activeScopeRef.current)) throw new Error('Your account changed. Please try again.');
    const canonical = ensureCanonicalItemMetadata({
      ...currentItem,
      ...changes,
      updatedAt: new Date().toISOString()
    });
    const baseUpdated = userId ? markSyncPending(canonical) : { ...canonical, syncState: 'local' as const };

    const transition = notificationTransition(currentItem, baseUpdated);
    let notificationId = currentItem.notificationId;
    let notificationStatus = currentItem.notificationStatus ?? (notificationId ? 'scheduled' : 'not_scheduled');

    if (transition === 'cancel' || transition === 'reschedule') {
      await cancelItemNotification(notificationId);
      notificationId = undefined;
      notificationStatus = isRemindable(baseUpdated) ? 'not_scheduled' : 'not_applicable';
    }
    if (transition === 'schedule' || transition === 'reschedule') {
      const result = await scheduleItemNotification(baseUpdated, { requestPermission: true });
      notificationId = result.notificationId;
      notificationStatus = result.status;
    } else if (!isRemindable(baseUpdated)) {
      notificationStatus = 'not_applicable';
    }

    const updated: OneItem = { ...baseUpdated, notificationId, notificationStatus };
    if (!canApplyScopedSyncResult(scope, activeScopeRef.current) || itemsRef.current.find((item) => item.id === id) !== currentItem) {
      if (notificationId !== currentItem.notificationId) await cancelItemNotification(notificationId);
      throw new Error('This memory changed. Please open it again.');
    }
    itemsRef.current = itemsRef.current.map((item) => (item.id === id ? updated : item));
    setItems(itemsRef.current);
    await saveItems(scope, itemsRef.current);

    if (!userId || !shouldSyncItem(updated)) return updated;

    try {
      const synced = await syncItemToCloud(updated, userId);
      if (!canApplyScopedSyncResult(scope, activeScopeRef.current)) return updated;
      const applied = applySyncedItem(synced, updated) ?? updated;
      await saveItems(scope, itemsRef.current);
      return applied;
    } catch (error) {
      if (!canApplyScopedSyncResult(scope, activeScopeRef.current)) return updated;
      const failed = markSyncFailure(updated);
      itemsRef.current = applyItemResult(itemsRef.current, updated, failed);
      setItems(itemsRef.current);
      setSyncProblem(true);
      await saveItems(scope, itemsRef.current);
      if (canAutoRetry(failed.syncAttemptCount ?? 0)) scheduleSyncRetry(failed.syncRetryAt);
      if (__DEV__) console.warn('ONE cloud edit deferred until reconnect');
      await recordLastNativeError('cloud-edit', error);
      return failed;
    }
  }, [session?.user.id, applySyncedItem, scheduleSyncRetry]);

  const toggleCompleted = useCallback(async (id: string) => {
    const currentItem = itemsRef.current.find((item) => item.id === id);
    if (!currentItem) return;
    await update(id, { completed: !currentItem.completed });
  }, [update]);

  const remove = useCallback(async (id: string) => {
    const currentItem = itemsRef.current.find((item) => item.id === id);
    if (!currentItem) return;

    await cancelItemNotification(currentItem.notificationId);

    const userId = session?.user.id;
    const cloudAttachmentPaths = Array.from(new Set(
      [
        currentItem.attachmentUrl,
        currentItem.imageUrl,
        userId ? cloudAttachmentPath(currentItem.id, userId) : undefined
      ].filter((value): value is string => Boolean(value && !/^(file|content|ph):\/\//i.test(value)))
    ));
    const localAttachmentPaths = Array.from(new Set(
      [currentItem.localAttachmentUri, currentItem.attachmentUrl, currentItem.imageUrl]
        .filter((value): value is string => Boolean(value && /^(file|content|ph):\/\//i.test(value)))
    ));

    let tombstone: DeletionTombstone | undefined;
    if (userId) {
      tombstone = {
        id,
        deletedAt: new Date().toISOString(),
        userId,
        attachmentPaths: cloudAttachmentPaths
      };
      await saveDeletionTombstone(tombstone);
    }

    if (!canApplyScopedSyncResult(itemStorageScope(userId), activeScopeRef.current)) return;
    itemsRef.current = itemsRef.current.filter((item) => item.id !== id);
    setItems(itemsRef.current);
    await saveItems(itemStorageScope(userId), itemsRef.current);

    for (const path of localAttachmentPaths) {
      try {
        await removeLocalAttachment(path);
      } catch (error) {
        if (__DEV__) console.warn('ONE local attachment cleanup failed');
        await recordLastNativeError('local-attachment-cleanup', error);
      }
    }

    if (!userId || !tombstone) return;

    try {
      await deleteCloudItem(id);
      await removeCloudAttachments(cloudAttachmentPaths, userId);
      await removeDeletionTombstone(id, userId);
    } catch (error) {
      const failed = markDeletionFailure(tombstone);
      await saveDeletionTombstone(failed);
      if (!canApplyScopedSyncResult(itemStorageScope(userId), activeScopeRef.current)) return;
      setSyncProblem(true);
      if (canAutoRetry(failed.attemptCount ?? 0)) scheduleSyncRetry(failed.retryAt);
      if (__DEV__) console.warn('ONE cloud delete deferred until reconnect');
      await recordLastNativeError('cloud-delete', error);
    }
  }, [session?.user.id, scheduleSyncRetry]);

  const retrySync = useCallback(async () => {
    const userId = session?.user.id;
    if (!userId) return;
    const scope = itemStorageScope(userId);
    const nextItems = itemsRef.current.map((item) =>
      item.syncState === 'error' && !item.syncConflictDetected ? markSyncPending(item) : item
    );
    itemsRef.current = nextItems;
    setItems(nextItems);
    await saveItems(scope, nextItems);

    const tombstones = await loadDeletionTombstones(userId);
    for (const tombstone of tombstones) {
      await saveDeletionTombstone({
        ...tombstone,
        attemptCount: 0,
        retryAt: undefined,
        errorAt: undefined
      });
    }

    if (!canApplyScopedSyncResult(scope, activeScopeRef.current)) return;
    setSyncProblem(nextItems.some((item) => Boolean(item.syncConflictDetected)));
    setSyncRevision((value) => value + 1);
  }, [session?.user.id]);

  const clearAll = useCallback(async () => {
    const currentScope = desiredScope;
    const currentUserId = session?.user.id;

    for (const item of itemsRef.current) await cleanupDeviceState(item);

    await clearItems(currentScope);
    if (currentUserId) {
      await clearDeletionTombstones(currentUserId);
      await clearItems('anonymous');
      await clearLocalMigrationState();
    }

    if (!canApplyScopedSyncResult(currentScope, activeScopeRef.current)) return;
    itemsRef.current = [];
    setItems([]);
    setSyncProblem(false);
  }, [desiredScope, session?.user.id]);

  const presentedSyncStatus = useMemo<SyncStatus>(() => {
    if (!scopeReady) return 'saved_local';
    const derived = syncPresentationState(items, cloudSyncing);
    if (!cloudSyncing && syncProblem) return 'problem';
    return derived;
  }, [items, scopeReady, cloudSyncing, syncProblem]);

  const retryHydration = useCallback(() => { setHydrationErrorScope(null); setHydrationRevision((value) => value + 1); }, []);

  const value = useMemo(
    () => ({
      items: scopeReady ? items : [],
      hydrated: scopeReady,
      hydrationError: hydrationErrorScope === desiredScope,
      retryHydration,
      cloudSyncing: scopeReady ? cloudSyncing : false,
      syncStatus: presentedSyncStatus,
      add,
      update,
      toggleCompleted,
      remove,
      retrySync,
      clearAll
    }),
    [items, scopeReady, hydrationErrorScope, desiredScope, retryHydration, cloudSyncing, presentedSyncStatus, add, update, toggleCompleted, remove, retrySync, clearAll]
  );

  return <ItemsContext.Provider value={value}>{children}</ItemsContext.Provider>;
}

function shouldSyncItem(item: OneItem) {
  return !(__DEV__ && DEVELOPMENT_SEED_IDS.has(item.id));
}

async function suspendItemNotifications(items: OneItem[]) {
  const next: OneItem[] = [];

  for (const item of items) {
    await cancelItemNotification(item.notificationId);
    next.push({
      ...item,
      notificationId: undefined,
      notificationStatus: isRemindable(item) ? 'not_scheduled' : 'not_applicable'
    });
  }

  return next;
}

async function reconcileItemNotifications(items: OneItem[]) {
  const scheduled = await getScheduledItemNotifications();
  const scheduledIds = scheduled ? new Set(scheduled.map((entry) => entry.identifier)) : null;
  const next: OneItem[] = [];

  for (const item of items) {
    const action = reminderReconciliationAction(item, scheduledIds);

    if (action === 'clear') {
      await cancelItemNotification(item.notificationId);
      next.push({ ...item, notificationId: undefined, notificationStatus: 'not_applicable' });
      continue;
    }

    if (action === 'keep') {
      next.push({
        ...item,
        notificationStatus: item.notificationStatus ?? (item.notificationId ? 'scheduled' : 'not_scheduled')
      });
      continue;
    }

    if (item.notificationId) await cancelItemNotification(item.notificationId);
    const result = await scheduleItemNotification({ ...item, notificationId: undefined });
    next.push({
      ...item,
      notificationId: result.notificationId,
      notificationStatus: result.status
    });
  }

  if (scheduled) {
    const orphaned = orphanedScheduledNotificationIds(scheduled, next);
    for (const identifier of orphaned) await cancelItemNotification(identifier);
  }

  return next;
}

async function cancelOrphanedItemNotifications(items: OneItem[]) {
  const scheduled = await getScheduledItemNotifications();
  if (!scheduled) return;

  const orphaned = orphanedScheduledNotificationIds(scheduled, items);
  for (const identifier of orphaned) await cancelItemNotification(identifier);
}

async function cleanupDeviceState(item: OneItem) {
  await cancelItemNotification(item.notificationId);

  const localPaths = Array.from(new Set(
    [item.localAttachmentUri, item.attachmentUrl, item.imageUrl]
      .filter((value): value is string => Boolean(value && /^(file|content|ph):\/\//i.test(value)))
  ));

  for (const path of localPaths) {
    try {
      await removeLocalAttachment(path);
    } catch (error) {
      if (__DEV__) console.warn('ONE local attachment cleanup failed');
      await recordLastNativeError('local-attachment-cleanup', error);
    }
  }
}

async function removeCloudAttachments(paths: string[], userId: string) {
  for (const path of paths) {
    if (!path.startsWith(userId + '/')) continue;
    await deleteSharedAttachment(path, userId);
  }
}

export function useItems() {
  const context = useContext(ItemsContext);
  if (!context) throw new Error('useItems must be used inside ItemsProvider');
  return context;
}
