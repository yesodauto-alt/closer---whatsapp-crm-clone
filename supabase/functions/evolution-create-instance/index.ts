import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import {
  evolutionFetch,
  jsonResponse,
  errorResponse,
  getEvolutionConfig,
} from '../_shared/evolution-api.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { instanceName, userId } = await req.json()

    if (!instanceName || !userId) {
      return errorResponse('instanceName and userId are required', 400)
    }

    const { data, error, status } = await evolutionFetch('/instance/create', {
      method: 'POST',
      body: {
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      },
    })

    if (error) {
      return errorResponse(error, status)
    }

    const config = getEvolutionConfig()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: existing } = await supabase
      .from('user_integrations')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('user_integrations')
        .update({
          instance_name: instanceName,
          evolution_api_url: config.baseUrl,
          evolution_api_key: config.apiKey,
          status: 'CONNECTING',
          is_setup_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      await supabase.from('user_integrations').insert({
        user_id: userId,
        instance_name: instanceName,
        evolution_api_url: config.baseUrl,
        evolution_api_key: config.apiKey,
        status: 'CONNECTING',
        is_setup_completed: true,
      })
    }

    return jsonResponse({ success: true, data })
  } catch (err) {
    return errorResponse(err.message || 'Internal server error', 500)
  }
})
