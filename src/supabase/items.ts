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
  tags: string[];
  entities: string[];
  created_at: string;
  updated_at: string;
};

export async function pullCloudItems(): Promise<OneItem[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data as CloudItemRow[]).map(fromRow);
}

export async function upsertCloudItem(item: OneItem, userId: string) {
  if (!supabase) return;
  const { error } = await supabase.from('items').upsert(toRow(item, userId), { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteCloudItem(id: string) {
  if (!supabase) return;
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
    tags: row.tags ?? [],
    entities: row.entities ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
