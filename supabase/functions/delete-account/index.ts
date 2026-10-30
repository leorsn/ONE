import { createClient } from 'npm:@supabase/supabase-js@2.115.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json'
};

const BUCKET = 'one-attachments';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization || !/^Bearer \S+$/.test(authorization)) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Server configuration is incomplete');

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const jwt = authorization.slice('Bearer '.length);
    const { data: userData, error: userError } = await admin.auth.getUser(jwt);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: 'Invalid session' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const userId = userData.user.id;

    await deleteUserAttachments(admin, userId);

    const { error: itemError } = await admin
      .from('items')
      .delete()
      .eq('user_id', userId);
    if (itemError) throw itemError;

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(userId);
    if (deleteUserError) throw deleteUserError;

    return new Response(JSON.stringify({ deleted: true }), {
      status: 200,
      headers: corsHeaders
    });
  } catch {
    // Do not log JWTs, storage paths, personal records or backend error details.
    console.error('NEVER delete-account failed');
    return new Response(
      JSON.stringify({ error: 'account_deletion_failed' }),
      { status: 500, headers: corsHeaders }
    );
  }
});

async function deleteUserAttachments(admin: ReturnType<typeof createClient>, userId: string) {
  await deleteStoragePrefix(admin, userId, 0);
}

async function deleteStoragePrefix(admin: ReturnType<typeof createClient>, prefix: string, depth: number) {
  if (depth > 8) throw new Error('Attachment nesting exceeded the safety limit');
  let previousBatch = '';
  // Always re-list from offset zero after deleting; offset pagination can skip objects.
  // Re-listing also verifies that each removal really took effect before deleting the account.
  for (let batch = 0; batch < 1000; batch++) {
    const { data, error } = await admin.storage
      .from(BUCKET)
      .list(prefix, { limit: 100, offset: 0 });

    if (error) throw error;
    if (!data?.length) return;

    const signature = data.map((entry) => `${entry.id ?? 'folder'}:${entry.name}`).join('|');
    if (signature === previousBatch) throw new Error('Attachment deletion made no progress');

    const folders = data.filter((entry) => entry.id === null && entry.name);
    for (const folder of folders) {
      await deleteStoragePrefix(admin, `${prefix}/${folder.name}`, depth + 1);
    }

    const paths = data
      .filter((entry) => entry.id !== null && entry.name)
      .map((entry) => `${prefix}/${entry.name}`);

    if (paths.length) {
      const { error: removeError } = await admin.storage
        .from(BUCKET)
        .remove(paths);
      if (removeError) throw removeError;
    }

    previousBatch = signature;
  }
  throw new Error('Attachment deletion exceeded the safety limit');
}
