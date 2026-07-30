import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { evolutionFetch, jsonResponse, errorResponse } from '../_shared/evolution-api.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { instanceName } = await req.json()

    if (!instanceName) {
      return errorResponse('instanceName is required', 400)
    }

    const { data, error, status } = await evolutionFetch(`/instance/connect/${instanceName}`, {
      method: 'GET',
    })

    if (error) {
      return errorResponse(error, status)
    }

    return jsonResponse({ success: true, data })
  } catch (err) {
    return errorResponse(err.message || 'Internal server error', 500)
  }
})
