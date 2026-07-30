import { createClient } from '@supabase/supabase-js'

const allowedModels = new Set(['gpt-4.1-mini', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4o'])
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const publishableKey = Deno.env.get('SUPABASE_ANON_KEY')
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  const authorization = request.headers.get('Authorization')
  if (!supabaseUrl || !publishableKey || !authorization) return json({ error: 'Unauthorized' }, 401)
  if (!openaiKey) return json({ error: 'OPENAI_API_KEY não configurada' }, 503)

  const db = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
  })
  const {
    data: { user },
  } = await db.auth.getUser()
  if (!user) return json({ error: 'Unauthorized' }, 401)

  const body = await request.json().catch(() => ({}))
  const agentId = String(body.agentId || '')
  const contactId = body.contactId ? String(body.contactId) : null
  const input = String(body.input || '').trim()
  if (!agentId || !input) return json({ error: 'agentId e input são obrigatórios' }, 400)

  const { data: agent, error: agentError } = await db
    .from('ai_agents')
    .select(
      'id, organization_id, name, system_prompt, model, tone, objectives, restrictions, is_active',
    )
    .eq('id', agentId)
    .single()
  if (agentError || !agent) return json({ error: 'Agente não encontrado' }, 404)
  if (!agent.is_active) return json({ error: 'Agente inativo' }, 409)
  if (!allowedModels.has(agent.model)) return json({ error: 'Modelo não permitido' }, 400)

  const instructions = [
    agent.system_prompt,
    agent.tone ? `Tom de voz: ${agent.tone}` : '',
    agent.objectives ? `Objetivos: ${agent.objectives}` : '',
    agent.restrictions ? `Restrições obrigatórias: ${agent.restrictions}` : '',
    'Não invente informações. Quando não souber, informe claramente e encaminhe para atendimento humano.',
  ]
    .filter(Boolean)
    .join('\n\n')

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: agent.model,
      instructions,
      input,
    }),
  })
  const payload = await response.json().catch(() => ({}))
  const output =
    payload.output_text ||
    payload.output
      ?.flatMap((item: any) => item.content ?? [])
      .filter((content: any) => content.type === 'output_text')
      .map((content: any) => content.text)
      .join('\n') ||
    ''

  await db.from('ai_agent_runs').insert({
    organization_id: agent.organization_id,
    agent_id: agent.id,
    contact_id: contactId,
    requested_by: user.id,
    model: agent.model,
    input_text: input,
    output_text: response.ok ? output : null,
    input_tokens: payload.usage?.input_tokens ?? null,
    output_tokens: payload.usage?.output_tokens ?? null,
    status: response.ok ? 'completed' : 'failed',
    error: response.ok ? null : payload.error?.message || `OpenAI HTTP ${response.status}`,
  })

  if (!response.ok) {
    return json({ error: payload.error?.message || 'Falha ao consultar a OpenAI' }, 502)
  }
  return json({ output, model: agent.model, usage: payload.usage ?? null })
})
