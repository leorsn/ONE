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
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'invalid_body' }, 400)
    const query = typeof body.query === 'string' ? body.query.trim() : ''

    if (!query) {
      return json({ error: 'query_required' }, 400)
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

    return json({ matches: data ?? [] }, 200)
  } catch {
    return json({ error: 'semantic_search_unavailable' }, 500)
  }
})

function json(value: unknown, status: number) {
  return new Response(JSON.stringify(value), { status, headers: corsHeaders })
}
