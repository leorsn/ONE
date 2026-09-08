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
    const body = await req.json()
    const query = typeof body.query === 'string' ? body.query.trim() : ''

    if (!query) {
      return new Response(JSON.stringify({ error: 'query is required' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    const threshold =
      typeof body.threshold === 'number'
        ? Math.min(0.95, Math.max(0.2, body.threshold))
        : 0.52
    const count =
      typeof body.count === 'number'
        ? Math.min(30, Math.max(1, Math.round(body.count)))
        : 12

    const output = await model.run(query.slice(0, 4000), {
      mean_pool: true,
      normalize: true,
    })

    const { data, error } = await supabase.rpc('match_one_items', {
      query_embedding: Array.from(output),
      match_threshold: threshold,
      match_count: count,
    })

    if (error) throw error

    return new Response(JSON.stringify({ matches: data ?? [] }), {
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
