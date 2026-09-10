import { createClient } from 'npm:@supabase/supabase-js@2';

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
    if (!authorization?.startsWith('Bearer ')) {
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
  } catch (error) {
    console.error('ONE delete-account failed', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Account deletion failed' }),
      { status: 500, headers: corsHeaders }
    );
  }
});

async function deleteUserAttachments(admin: ReturnType<typeof createClient>, userId: string) {
  while (true) {
    const { data, error } = await admin.storage
      .from(BUCKET)
      .list(userId, { limit: 100, offset: 0 });

    if (error) throw error;
    if (!data?.length) return;

    const paths = data
      .filter((entry) => entry.name)
      .map((entry) => `${userId}/${entry.name}`);

    if (!paths.length) return;

    const { error: removeError } = await admin.storage
      .from(BUCKET)
      .remove(paths);
    if (removeError) throw removeError;

    if (data.length < 100) return;
  }
}
