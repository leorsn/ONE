import { supabase } from '@/src/supabase/client';

export async function ensureOneProfile(userId: string) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('profiles')
    .upsert({ user_id: userId, updated_at: now }, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function markProfileSynced(userId: string) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('profiles')
    .update({ updated_at: now, last_sync_at: now })
    .eq('user_id', userId);
  if (error) throw error;
}
