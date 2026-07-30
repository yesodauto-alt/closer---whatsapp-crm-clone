import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from './use-auth'
import { useOrganization } from './use-organization'
import type { AppRole } from '@/lib/types'

export interface TeamMemberView {
  id: string
  user_id: string
  is_leader: boolean
  full_name: string | null
  email: string | null
}

export interface TeamView {
  id: string
  name: string
  description: string | null
  color: string
  is_active: boolean
  members: TeamMemberView[]
}

export function useTeams() {
  const { user } = useAuth()
  const { organizationId, canConfigure, loading: organizationLoading } = useOrganization()
  const [teams, setTeams] = useState<TeamView[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTeams = useCallback(async () => {
    if (!organizationId) {
      if (!organizationLoading) setLoading(false)
      return
    }

    setLoading(true)
    const { data: teamRows, error: teamError } = await (supabase as any)
      .from('teams')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name')

    if (teamError) {
      toast.error('Não foi possível carregar as equipes')
      setLoading(false)
      return
    }

    const teamIds = (teamRows ?? []).map((team: any) => team.id)
    if (teamIds.length === 0) {
      setTeams([])
      setLoading(false)
      return
    }

    const { data: memberRows } = await (supabase as any)
      .from('team_members')
      .select('id, team_id, user_id, is_leader')
      .in('team_id', teamIds)

    const userIds = [...new Set((memberRows ?? []).map((member: any) => member.user_id))]
    const { data: profileRows } =
      userIds.length > 0
        ? await (supabase as any)
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds)
        : { data: [] }

    const profiles = new Map((profileRows ?? []).map((profile: any) => [profile.id, profile]))
    setTeams(
      (teamRows ?? []).map((team: any) => ({
        ...team,
        members: (memberRows ?? [])
          .filter((member: any) => member.team_id === team.id)
          .map((member: any) => ({
            id: member.id,
            user_id: member.user_id,
            is_leader: member.is_leader,
            full_name: profiles.get(member.user_id)?.full_name ?? null,
            email: profiles.get(member.user_id)?.email ?? null,
          })),
      })),
    )
    setLoading(false)
  }, [organizationId, organizationLoading])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const createTeam = async (input: { name: string; description?: string; color: string }) => {
    if (!organizationId || !canConfigure) throw new Error('Sem permissão para criar equipes')
    const { error } = await (supabase as any).from('teams').insert({
      organization_id: organizationId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      color: input.color,
    })
    if (error) throw error
    toast.success('Equipe criada')
    await fetchTeams()
  }

  const addExistingMember = async (teamId: string, email: string, isLeader: boolean) => {
    if (!organizationId || !canConfigure) throw new Error('Sem permissão para alterar equipes')
    const { data: profile, error: profileError } = await (supabase as any)
      .from('profiles')
      .select('id')
      .ilike('email', email.trim())
      .maybeSingle()
    if (profileError || !profile) {
      throw new Error('Usuário não encontrado. Cadastre ou convide esse e-mail primeiro.')
    }

    const { error: membershipError } = await (supabase as any)
      .from('organization_members')
      .upsert(
        {
          organization_id: organizationId,
          user_id: profile.id,
          role: isLeader ? 'team_lead' : 'agent',
          is_active: true,
        },
        { onConflict: 'organization_id,user_id' },
      )
    if (membershipError) throw membershipError

    const { error } = await (supabase as any)
      .from('team_members')
      .upsert(
        { team_id: teamId, user_id: profile.id, is_leader: isLeader },
        { onConflict: 'team_id,user_id' },
      )
    if (error) throw error
    toast.success('Usuário vinculado à equipe')
    await fetchTeams()
  }

  const createInvite = async (input: {
    teamId: string
    email: string
    role: Exclude<AppRole, 'super_admin'>
  }) => {
    if (!user || !organizationId || !canConfigure) throw new Error('Sem permissão para convidar')
    const { error } = await supabase.functions.invoke('send-organization-invite', {
      body: {
        organizationId,
        teamId: input.teamId,
        email: input.email.trim().toLowerCase(),
        role: input.role,
        redirectTo: `${window.location.origin}/auth`,
      },
    })
    if (error) throw error
    toast.success('Convite enviado por e-mail')
  }

  const removeMember = async (memberId: string) => {
    if (!canConfigure) throw new Error('Sem permissão para remover')
    const { error } = await (supabase as any).from('team_members').delete().eq('id', memberId)
    if (error) throw error
    toast.success('Usuário removido da equipe')
    await fetchTeams()
  }

  return {
    teams,
    loading,
    canConfigure,
    createTeam,
    addExistingMember,
    createInvite,
    removeMember,
  }
}
