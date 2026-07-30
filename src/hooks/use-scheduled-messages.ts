import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from './use-auth'
import { useOrganization } from './use-organization'

export interface ScheduledMessage {
  id: string
  contact_id: string
  text: string
  scheduled_for: string
  timezone: string
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled'
  last_error: string | null
}

export function useScheduledMessages(contactId?: string) {
  const { user } = useAuth()
  const { organizationId } = useOrganization()
  const [messages, setMessages] = useState<ScheduledMessage[]>([])

  const fetchMessages = useCallback(async () => {
    if (!contactId) return
    const { data } = await (supabase as any)
      .from('scheduled_messages')
      .select('id, contact_id, text, scheduled_for, timezone, status, last_error')
      .eq('contact_id', contactId)
      .in('status', ['pending', 'processing', 'failed'])
      .order('scheduled_for')
    setMessages((data ?? []) as ScheduledMessage[])
  }, [contactId])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  const schedule = async (text: string, scheduledFor: Date) => {
    if (!user || !organizationId || !contactId) throw new Error('Dados incompletos para agendar')
    if (scheduledFor.getTime() <= Date.now()) throw new Error('Escolha uma data futura')

    const { error } = await (supabase as any).from('scheduled_messages').insert({
      organization_id: organizationId,
      contact_id: contactId,
      created_by: user.id,
      text: text.trim(),
      scheduled_for: scheduledFor.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo',
    })
    if (error) throw error
    toast.success('Mensagem agendada')
    await fetchMessages()
  }

  const cancel = async (id: string) => {
    const { error } = await (supabase as any)
      .from('scheduled_messages')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('status', 'pending')
    if (error) throw error
    toast.success('Agendamento cancelado')
    await fetchMessages()
  }

  return { scheduledMessages: messages, schedule, cancel, refetch: fetchMessages }
}
