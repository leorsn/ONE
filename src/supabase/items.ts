import { refreshItemEmbedding } from '@/src/search/semantic';
import { supabase } from '@/src/supabase/client';
import type { OneItem } from '@/src/types/item';

type CloudItemRow = {
  id: string;
  user_id: string;
  title: string;
  raw_input: string | null;
  type: OneItem['type'];
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
  amount: number | string | null;
  currency: string | null;
  tags: string[];
  entities: string[];
  created_at: string;
  updated_at: string;
};

export async function pullCloudItems(): Promise<OneItem[]> {
  const { data, error } = await supabase
    .from('items')
    .select(
      'id,user_id,title,raw_input,type,item_date,item_time,reminder_at,category,location,url,notes,completed,saved,source_type,source_app,original_text,attachment_url,image_url,extracted_text,user_context,document_kind,merchant,amount,currency,tags,entities,created_at,updated_at'
    )
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data as CloudItemRow[]).map(fromRow);
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
  return {
    id: item.id,
    user_id: userId,
    title: item.title,
    raw_input: item.rawInput ?? null,
    type: item.type,
    item_date: item.date ?? null,
    item_time: item.time ?? null,
    reminder_at: item.reminderAt ?? null,
    category: item.category ?? null,
    location: item.location ?? null,
    url: item.url ?? null,
    notes: item.notes ?? null,
    completed: item.completed,
    saved: item.saved,
    source_type: item.sourceType,
    source_app: item.sourceApp ?? null,
    original_text: item.originalText ?? null,
    attachment_url: item.attachmentUrl ?? null,
    image_url: item.imageUrl ?? null,
    extracted_text: item.extractedText ?? null,
    user_context: item.userContext ?? null,
    document_kind: item.documentKind ?? null,
    merchant: item.merchant ?? null,
    amount: item.amount ?? null,
    currency: item.currency ?? null,
    tags: item.tags,
    entities: item.entities,
    created_at: item.createdAt,
    updated_at: item.updatedAt
  };
}

function fromRow(row: CloudItemRow): OneItem {
  return {
    id: row.id,
    title: row.title,
    rawInput: row.raw_input ?? undefined,
    type: row.type,
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
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
