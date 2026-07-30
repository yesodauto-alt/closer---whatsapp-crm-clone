import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const allowedRoles = new Set(['admin', 'team_lead', 'agent'])

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authorization = request.headers.get('Authorization')
    if (!authorization) throw new Error('Sessão obrigatória')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    })
    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: authData, error: authError } = await userClient.auth.getUser()
    if (authError || !authData.user) throw new Error('Sessão inválida')

    const body = await request.json()
    const email = String(body.email ?? '').trim().toLowerCase()
    const organizationId = String(body.organizationId ?? '')
    const teamId = String(body.teamId ?? '')
    const role = String(body.role ?? 'agent')
    if (!email || !organizationId || !teamId || !allowedRoles.has(role)) {
      throw new Error('Dados do convite inválidos')
    }

    const { data: membership } = await userClient
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', authData.user.id)
      .eq('is_active', true)
      .maybeSingle()
    if (!membership || !['super_admin', 'admin'].includes(membership.role)) {
      throw new Error('Sem permissão para convidar usuários')
    }

    const { data: team } = await userClient
      .from('teams')
      .select('id')
      .eq('id', teamId)
      .eq('organization_id', organizationId)
      .maybeSingle()
    if (!team) throw new Error('Equipe inválida')

    const { error: inviteError } = await adminClient.from('organization_invites').insert({
      organization_id: organizationId,
      team_id: teamId,
      email,
      role,
      invited_by: authData.user.id,
    })
    if (inviteError) throw inviteError

    const { error: emailError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: typeof body.redirectTo === 'string' ? body.redirectTo : undefined,
      data: { organization_id: organizationId, team_id: teamId, role },
    })
    if (emailError && !emailError.message.toLowerCase().includes('already been registered')) {
      throw emailError
    }

    return Response.json(
      { success: true, existingUser: Boolean(emailError) },
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Falha ao enviar convite' },
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
