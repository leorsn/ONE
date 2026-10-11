import { supabase } from '@/src/supabase/client';

export async function deleteOneAccount(): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke('delete-account', {
    body: {}
  });

  if (error) return error.message;
  if (!data?.deleted) return data?.error || 'Account deletion could not be confirmed.';

  // Once the server confirms deletion, the irreversible operation has
  // succeeded. Local sign-out is cleanup only and must not turn that success
  // into a false deletion failure that prevents on-device data cleanup.
  await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
  return null;
}
