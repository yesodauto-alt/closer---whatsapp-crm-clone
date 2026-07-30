import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'

interface Contact {
  id: string
  user_id: string
  remote_jid: string
  push_name: string | null
  ai_agent_id: string | null
  phone_number: string | null
}

export async function handleMessageUpsert(
  supabase: SupabaseClient,
  userId: string,
  contact: Contact,
  text: string,
  instanceName: string,
): Promise<void> {
  if (!contact.ai_agent_id) return

  const { data: agent } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('id', contact.ai_agent_id)
    .eq('is_active', true)
    .maybeSingle()

  if (!agent) return

  try {
    const response = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/openai-agent-response`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          agentId: agent.id,
          contactId: contact.id,
          message: text,
          instanceName,
          phoneNumber: contact.phone_number || contact.remote_jid.split('@')[0],
        }),
      },
    )

    if (!response.ok) {
      console.error('AI agent response failed:', response.status)
    }
  } catch (err) {
    console.error('Error invoking AI agent:', err.message)
  }
}
