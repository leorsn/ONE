import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

function getPublicClientKey() {
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
      // Fall back to legacy anon key.
    }
  }
  return Deno.env.get('SUPABASE_ANON_KEY') ?? ''
}

function userClient(req: Request) {
  const authorization = req.headers.get('Authorization')
  if (!authorization) throw new Error('Missing Authorization header')

  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    getPublicClientKey(),
    { global: { headers: { Authorization: authorization } } }
  )
}

const model = new Supabase.ai.Session('gte-small')

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = userClient(req)
    const { itemId } = await req.json()

    if (!itemId || typeof itemId !== 'string') {
      return new Response(JSON.stringify({ error: 'itemId is required' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    const { data: item, error: readError } = await supabase
      .from('items')
      .select('id,title,summary,kind,destination,people,raw_input,category,notes,original_text,extracted_text,user_context,document_kind,merchant,amount,currency,tags,entities')
      .eq('id', itemId)
      .single()

    if (readError || !item) {
      return new Response(JSON.stringify({ error: 'Item not found' }), {
        status: 404,
        headers: corsHeaders,
      })
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
      return new Response(JSON.stringify({ embedded: false, reason: 'empty-content' }), {
        status: 200,
        headers: corsHeaders,
      })
    }

    const output = await model.run(content, { mean_pool: true, normalize: true })
    const embedding = Array.from(output)

    const { error: updateError } = await supabase
      .from('items')
      .update({ embedding: JSON.stringify(embedding) })
      .eq('id', itemId)

    if (updateError) throw updateError

    return new Response(JSON.stringify({ embedded: true, itemId }), {
      status: 200,
      headers: corsHeaders,
    })
  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 400,
      headers: corsHeaders,
    })
  }
})
