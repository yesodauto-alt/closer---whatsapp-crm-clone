import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from './use-auth'
import { useTeams } from './use-teams'

interface Assignment {
  id: string
  contact_id: string
  team_id: string
  assigned_user_id: string | null
}

export function useConversationAssignment(contactId?: string) {
  const { user } = useAuth()
  const { teams, canConfigure } = useTeams()
  const [assignment, setAssignment] = useState<Assignment | null>(null)

  const fetchAssignment = useCallback(async () => {
    if (!contactId) return
    const { data } = await (supabase as any)
      .from('conversation_assignments')
      .select('id, contact_id, team_id, assigned_user_id')
      .eq('contact_id', contactId)
      .maybeSingle()
    setAssignment((data as Assignment | null) ?? null)
  }, [contactId])

  useEffect(() => {
    fetchAssignment()
  }, [fetchAssignment])

  const assignTeam = async (teamId: string) => {
    if (!user || !contactId || !canConfigure) throw new Error('Sem permissão para atribuir')
    const previous = assignment
    const { data, error } = await (supabase as any)
      .from('conversation_assignments')
      .upsert(
        {
          contact_id: contactId,
          team_id: teamId,
          assigned_user_id: null,
          assigned_by: user.id,
          assigned_at: new Date().toISOString(),
        },
        { onConflict: 'contact_id' },
      )
      .select('id, contact_id, team_id, assigned_user_id')
      .single()
    if (error) throw error

    await (supabase as any).from('assignment_history').insert({
      contact_id: contactId,
      from_team_id: previous?.team_id ?? null,
      to_team_id: teamId,
      from_user_id: previous?.assigned_user_id ?? null,
      to_user_id: null,
      changed_by: user.id,
    })
    setAssignment(data as Assignment)
    toast.success('Conversa atribuída à equipe')
  }

  return { teams, assignment, canAssign: canConfigure, assignTeam }
}
