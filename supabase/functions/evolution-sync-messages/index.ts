import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { evolutionFetch, jsonResponse, errorResponse } from '../_shared/evolution-api.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

interface SyncRequest {
  instanceName: string
  userId: string
  remoteJid: string
  contactId: string
  page?: number
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { instanceName, userId, remoteJid, contactId, page }: SyncRequest = await req.json()

    if (!instanceName || !userId || !remoteJid || !contactId) {
      return errorResponse('instanceName, userId, remoteJid, and contactId are required', 400)
    }

    const queryParams = new URLSearchParams({
      page: String(page ?? 1),
      limit: '50',
    })

    const { data, error, status } = await evolutionFetch(
      `/message/getMessages/${instanceName}?${queryParams.toString()}`,
      {
        method: 'POST',
        body: { where: { key: { remoteJid } } },
      },
    )

    if (error) {
      return errorResponse(error, status)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const messages = data?.messages ?? (Array.isArray(data) ? data : [])
    let synced = 0

    for (const msg of messages) {
      const messageId = msg?.key?.id
      if (!messageId) continue

      const text = msg?.message?.conversation || msg?.message?.extendedTextMessage?.text || ''

      const { error: upsertError } = await supabase.from('whatsapp_messages').upsert(
        {
          user_id: userId,
          contact_id: contactId,
          message_id: messageId,
          from_me: msg?.key?.fromMe ?? false,
          text,
          type: 'text',
          timestamp: msg?.messageTimestamp
            ? new Date(Number(msg.messageTimestamp) * 1000).toISOString()
            : new Date().toISOString(),
          raw: msg,
        },
        { onConflict: 'message_id' },
      )

      if (!upsertError) synced++
    }

    return jsonResponse({ success: true, synced, total: messages.length })
  } catch (err) {
    return errorResponse(err.message || 'Internal server error', 500)
  }
})
