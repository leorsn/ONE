import { supabase } from '@/src/supabase/client';

export async function deleteOneAccount(): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke('delete-account', {
    body: {}
  });

  if (error) return error.message;
  if (!data?.deleted) return data?.error || 'Account deletion could not be confirmed.';

  const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
  return signOutError?.message ?? null;
}
