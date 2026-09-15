import { ensureCanonicalItemMetadata } from '@/src/capture/itemMetadata';
import { refreshItemEmbedding } from '@/src/search/semantic';
import { supabase } from '@/src/supabase/client';
import type { Json } from '@/src/supabase/database.types';
import { collectPagedRows } from '@/src/sync/pagination';
import type { OneItem } from '@/src/types/item';

type CloudItemRow = {
  id: string;
  user_id: string;
  title: string;
  raw_input: string | null;
  type: OneItem['type'];
  kind: NonNullable<OneItem['kind']>;
  summary: string | null;
  people: string[];
  destination: NonNullable<OneItem['destination']>;
  review_status: NonNullable<OneItem['reviewStatus']>;
  ambiguities: string[];
  understanding_confidence: NonNullable<OneItem['understandingConfidence']>;
  processing_status: NonNullable<OneItem['processingStatus']>;
  confidence_metadata: Json;
  ai_metadata: Json | null;
  triage_state: NonNullable<OneItem['triageState']>;
  executed_actions: NonNullable<OneItem['executedActions']>;
  processed_at: string | null;
  archived_at: string | null;
  deferred_until: string | null;
  captured_at: string;
  extracted_dates: string[];
  extracted_times: string[];
  extracted_urls: string[];
  task_intent: boolean;
  event_intent: boolean;
  task_due_at: string | null;
  item_date: string | null;
  item_time: string | null;
  reminder_at: string | null;
  category: string | null;
  location: string | null;
  url: string | null;
  notes: string | null;
  completed: boolean;
  saved: boolean;
  source_type: OneItem['sourceType'];
  source_app: string | null;
  original_text: string | null;
  attachment_url: string | null;
  image_url: string | null;
  extracted_text: string | null;
  user_context: string | null;
  document_kind: OneItem['documentKind'] | null;
  merchant: string | null;
  amount: number | null;
  currency: string | null;
  tags: string[];
  entities: string[];
  created_at: string;
  updated_at: string;
};

const CLOUD_SELECT = [
  'id,user_id,title,raw_input,type,kind,summary,people,destination,review_status,ambiguities,understanding_confidence',
  'processing_status,confidence_metadata,ai_metadata,triage_state,executed_actions,processed_at,archived_at,deferred_until',
  'captured_at,extracted_dates,extracted_times,extracted_urls,task_intent,event_intent,task_due_at',
  'item_date,item_time,reminder_at,category,location,url,notes,completed,saved',
  'source_type,source_app,original_text,attachment_url,image_url,extracted_text,user_context',
  'document_kind,merchant,amount,currency,tags,entities,created_at,updated_at'
].join(',');

export async function pullCloudItems(): Promise<OneItem[]> {
  const rows = await collectPagedRows<CloudItemRow>(async (from, to) => {
    const { data, error } = await supabase
      .from('items')
      .select(CLOUD_SELECT)
      .order('updated_at', { ascending: false })
      .order('id', { ascending: true })
      .range(from, to);

    if (error) throw error;
    return data as unknown as CloudItemRow[];
  });

  return rows.map(fromRow);
}

export async function upsertCloudItem(
  item: OneItem,
  userId: string,
  options: { refreshEmbedding?: boolean } = {}
) {
  const { error } = await supabase
    .from('items')
    .upsert(toRow(item, userId), { onConflict: 'id' });

  if (error) throw error;

  if (options.refreshEmbedding !== false) {
    try {
      await refreshItemEmbedding(item.id);
    } catch (embeddingError) {
      console.warn('ONE semantic indexing failed', embeddingError);
    }
  }
}

export async function deleteCloudItem(id: string) {
  const { error } = await supabase.from('items').delete().eq('id', id);
  if (error) throw error;
}

function toRow(item: OneItem, userId: string): CloudItemRow {
  const canonical = ensureCanonicalItemMetadata(item);
  return {
    id: canonical.id,
    user_id: userId,
    title: canonical.title,
    raw_input: canonical.rawInput ?? null,
    type: canonical.type,
    kind: canonical.kind!,
    summary: canonical.summary ?? null,
    people: canonical.people ?? [],
    destination: canonical.destination!,
    review_status: canonical.reviewStatus!,
    ambiguities: canonical.ambiguities ?? [],
    understanding_confidence: canonical.understandingConfidence!,
    processing_status: canonical.processingStatus!,
    confidence_metadata: canonical.confidenceMetadata as unknown as Json,
    ai_metadata: canonical.aiMetadata ? canonical.aiMetadata as unknown as Json : null,
    triage_state: canonical.triageState!,
    executed_actions: canonical.executedActions ?? [],
    processed_at: canonical.processedAt ?? null,
    archived_at: canonical.archivedAt ?? null,
    deferred_until: canonical.deferredUntil ?? null,
    captured_at: canonical.capturedAt!,
    extracted_dates: canonical.extractedDates ?? [],
    extracted_times: canonical.extractedTimes ?? [],
    extracted_urls: canonical.extractedUrls ?? [],
    task_intent: Boolean(canonical.taskIntent),
    event_intent: Boolean(canonical.eventIntent),
    task_due_at: canonical.taskDueAt ?? null,
    item_date: canonical.date ?? null,
    item_time: canonical.time ?? null,
    reminder_at: canonical.reminderAt ?? null,
    category: canonical.category ?? null,
    location: canonical.location ?? null,
    url: canonical.url ?? null,
    notes: canonical.notes ?? null,
    completed: canonical.completed,
    saved: canonical.saved,
    source_type: canonical.sourceType,
    source_app: canonical.sourceApp ?? null,
    original_text: canonical.originalText ?? null,
    attachment_url: cloudPath(canonical.attachmentUrl, userId),
    image_url: cloudPath(canonical.imageUrl, userId),
    extracted_text: canonical.extractedText ?? null,
    user_context: canonical.userContext ?? null,
    document_kind: canonical.documentKind ?? null,
    merchant: canonical.merchant ?? null,
    amount: canonical.amount ?? null,
    currency: canonical.currency ?? null,
    tags: canonical.tags,
    entities: canonical.entities,
    created_at: canonical.createdAt,
    updated_at: canonical.updatedAt
  };
}

function fromRow(row: CloudItemRow): OneItem {
  return ensureCanonicalItemMetadata({
    id: row.id,
    title: row.title,
    rawInput: row.raw_input ?? undefined,
    type: row.type,
    kind: row.kind,
    summary: row.summary ?? undefined,
    people: row.people ?? [],
    destination: row.destination,
    reviewStatus: row.review_status,
    ambiguities: row.ambiguities ?? [],
    understandingConfidence: row.understanding_confidence,
    processingStatus: row.processing_status,
    confidenceMetadata: row.confidence_metadata as unknown as OneItem['confidenceMetadata'],
    aiMetadata: row.ai_metadata as unknown as OneItem['aiMetadata'],
    triageState: row.triage_state,
    executedActions: row.executed_actions ?? [],
    processedAt: row.processed_at ?? undefined,
    archivedAt: row.archived_at ?? undefined,
    deferredUntil: row.deferred_until ?? undefined,
    capturedAt: row.captured_at,
    extractedDates: row.extracted_dates ?? [],
    extractedTimes: row.extracted_times ?? [],
    extractedUrls: row.extracted_urls ?? [],
    taskIntent: row.task_intent,
    eventIntent: row.event_intent,
    taskDueAt: row.task_due_at ?? undefined,
    date: row.item_date ?? undefined,
    time: row.item_time ?? undefined,
    reminderAt: row.reminder_at ?? undefined,
    category: row.category ?? undefined,
    location: row.location ?? undefined,
    url: row.url ?? undefined,
    notes: row.notes ?? undefined,
    completed: row.completed,
    saved: row.saved,
    sourceType: row.source_type,
    sourceApp: row.source_app ?? undefined,
    originalText: row.original_text ?? undefined,
    attachmentUrl: row.attachment_url ?? undefined,
    imageUrl: row.image_url ?? undefined,
    extractedText: row.extracted_text ?? undefined,
    userContext: row.user_context ?? undefined,
    documentKind: row.document_kind ?? undefined,
    merchant: row.merchant ?? undefined,
    amount: row.amount === null ? undefined : Number(row.amount),
    currency: row.currency ?? undefined,
    tags: row.tags ?? [],
    entities: row.entities ?? [],
    syncState: 'synced',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  });
}

function cloudPath(value: string | undefined, userId: string) {
  return value?.startsWith(`${userId}/`) ? value : null;
}
