import { supabase } from '@/src/supabase/client';

export type SemanticMatch = {
  itemId: string;
  similarity: number;
};

export async function refreshItemEmbedding(itemId: string) {
  const { data, error } = await supabase.functions.invoke('embed-one-item', {
    body: { itemId }
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
}

export async function searchSemantically(
  query: string,
  options: { threshold?: number; count?: number } = {}
): Promise<SemanticMatch[]> {
  const { data, error } = await supabase.functions.invoke('semantic-search', {
    body: {
      query,
      threshold: options.threshold ?? 0.52,
      count: options.count ?? 12
    }
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return (data?.matches ?? []).map((match: { item_id: string; similarity: number }) => ({
    itemId: match.item_id,
    similarity: match.similarity
  }));
}
