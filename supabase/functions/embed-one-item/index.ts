import { createClient } from 'npm:@supabase/supabase-js@2.115.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

function getPublicClientKey() {
  const direct = Deno.env.get('SUPABASE_PUBLISHABLE_KEY')
  if (direct) return direct

  const publishableKeys = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')
  if (publishableKeys) {
    try {
      const names = JSON.parse(publishableKeys)
      const envName = names.default
      if (envName) {
        const value = Deno.env.get(envName)
        if (value) return value
      }
    } catch {
      // Fall back to the runtime's legacy anon key.
    }
  }
  return Deno.env.get('SUPABASE_ANON_KEY') ?? ''
}

function userClient(authorization: string) {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    getPublicClientKey(),
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authorization } }
    }
  )
}

const model = new Supabase.ai.Session('gte-small')

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const authorization = req.headers.get('Authorization')
  if (!authorization || !/^Bearer \S+$/.test(authorization)) {
    return json({ error: 'authentication_required' }, 401)
  }

  try {
    const supabase = userClient(authorization)
    const { data: authData, error: authError } = await supabase.auth.getUser(authorization.slice(7))
    if (authError || !authData.user) return json({ error: 'authentication_required' }, 401)

    const body = await req.json()
    const itemId = body && typeof body.itemId === 'string' ? body.itemId : ''

    if (!itemId || itemId.length > 128) return json({ error: 'item_id_required' }, 400)

    const { data: item, error: readError } = await supabase
      .from('items')
      .select('id,title,summary,kind,destination,people,raw_input,category,notes,original_text,extracted_text,user_context,document_kind,merchant,amount,currency,tags,entities')
      .eq('id', itemId)
      .eq('user_id', authData.user.id)
      .single()

    if (readError || !item) {
      return json({ error: 'item_not_found' }, 404)
    }

    const content = [
      item.title,
      item.summary,
      item.kind,
      item.destination,
      ...(item.people ?? []),
      item.user_context,
      item.category,
      item.notes,
      item.original_text,
      item.extracted_text,
      item.raw_input,
      item.document_kind,
      item.merchant,
      item.amount != null ? `${item.amount} ${item.currency ?? ''}` : null,
      ...(item.tags ?? []),
      ...(item.entities ?? []),
    ].filter(Boolean).join('\n').slice(0, 12000)

    if (!content.trim()) {
      return json({ embedded: false, reason: 'empty-content' }, 200)
    }

    const output = await model.run(content, { mean_pool: true, normalize: true })
    const embedding = Array.from(output)

    const { data: updated, error: updateError } = await supabase
      .from('items')
      .update({ embedding: JSON.stringify(embedding) })
      .eq('id', itemId)
      .eq('user_id', authData.user.id)
      .select('id')
      .maybeSingle()

    if (updateError) throw updateError
    if (!updated) return json({ error: 'item_not_found' }, 404)

    return json({ embedded: true, itemId }, 200)
  } catch {
    return json({ error: 'embedding_unavailable' }, 500)
  }
})

function json(value: unknown, status: number) {
  return new Response(JSON.stringify(value), { status, headers: corsHeaders })
}
