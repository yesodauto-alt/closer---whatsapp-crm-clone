import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { evolutionFetch, jsonResponse, errorResponse } from '../_shared/evolution-api.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { instanceName, userId } = await req.json()

    if (!instanceName) {
      return errorResponse('instanceName is required', 400)
    }

    const { data, error, status } = await evolutionFetch(`/instance/logout/${instanceName}`, {
      method: 'DELETE',
    })

    if (error) {
      return errorResponse(error, status)
    }

    if (userId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      )
      await supabase
        .from('user_integrations')
        .update({
          status: 'DISCONNECTED',
          is_setup_completed: false,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
    }

    return jsonResponse({ success: true, data })
  } catch (err) {
    return errorResponse(err.message || 'Internal server error', 500)
  }
})
