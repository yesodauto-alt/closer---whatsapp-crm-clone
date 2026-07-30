import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { evolutionFetch, jsonResponse, errorResponse } from '../_shared/evolution-api.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

interface EvolutionContact {
  id?: string
  pushName?: string
  profilePictureUrl?: string
  number?: string
  jid?: string
  name?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { instanceName, userId } = await req.json()

    if (!instanceName || !userId) {
      return errorResponse('instanceName and userId are required', 400)
    }

    const { data, error, status } = await evolutionFetch(`/chat/whatsappNumbers/${instanceName}`, {
      method: 'GET',
    })

    if (error) {
      return errorResponse(error, status)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const contacts: EvolutionContact[] = Array.isArray(data) ? data : (data?.contacts ?? [])
    let synced = 0

    for (const contact of contacts) {
      const remoteJid = contact.jid || contact.id || ''
      const phoneNumber = contact.number || remoteJid.split('@')[0] || ''

      if (!remoteJid) continue

      const { error: upsertError } = await supabase.from('whatsapp_contacts').upsert(
        {
          user_id: userId,
          remote_jid: remoteJid,
          push_name: contact.pushName || contact.name || null,
          profile_picture_url: contact.profilePictureUrl || null,
          phone_number: phoneNumber || null,
        },
        { onConflict: 'user_id,remote_jid' },
      )

      if (!upsertError) synced++
    }

    return jsonResponse({ success: true, synced, total: contacts.length })
  } catch (err) {
    return errorResponse(err.message || 'Internal server error', 500)
  }
})
