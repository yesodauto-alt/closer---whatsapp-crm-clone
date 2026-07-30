import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { evolutionFetch, jsonResponse, errorResponse } from '../_shared/evolution-api.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { instanceName, number, text, userId, contactId } = await req.json()

    if (!instanceName || !number || !text) {
      return errorResponse('instanceName, number, and text are required', 400)
    }

    const cleanNumber = number.replace(/\D/g, '')

    const { data, error, status } = await evolutionFetch(`/message/sendText/${instanceName}`, {
      method: 'POST',
      body: {
        number: cleanNumber,
        textMessage: { text },
      },
    })

    if (error) {
      return errorResponse(error, status)
    }

    if (userId && contactId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      )
      const messageId = data?.key?.id || `sent-${Date.now()}`
      await supabase.from('whatsapp_messages').upsert(
        {
          user_id: userId,
          contact_id: contactId,
          message_id: messageId,
          from_me: true,
          text,
          type: 'text',
          timestamp: new Date().toISOString(),
          raw: data,
        },
        { onConflict: 'message_id' },
      )
    }

    return jsonResponse({ success: true, data })
  } catch (err) {
    return errorResponse(err.message || 'Internal server error', 500)
  }
})
