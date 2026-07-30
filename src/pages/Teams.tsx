import { useState } from 'react'
import { Crown, Loader2, MailPlus, Plus, Trash2, UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useTeams } from '@/hooks/use-teams'

export default function Teams() {
  const { teams, loading, canConfigure, createTeam, addExistingMember, createInvite, removeMember } =
    useTeams()
  const [teamDialog, setTeamDialog] = useState(false)
  const [memberTeamId, setMemberTeamId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [teamForm, setTeamForm] = useState({ name: '', description: '', color: '#6366f1' })
  const [memberForm, setMemberForm] = useState({ email: '', isLeader: false, invite: false })

  const saveTeam = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      await createTeam(teamForm)
      setTeamDialog(false)
      setTeamForm({ name: '', description: '', color: '#6366f1' })
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível criar a equipe')
    } finally {
      setSaving(false)
    }
  }

  const saveMember = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!memberTeamId) return
    setSaving(true)
    try {
      if (memberForm.invite) {
        await createInvite({
          teamId: memberTeamId,
          email: memberForm.email,
          role: memberForm.isLeader ? 'team_lead' : 'agent',
        })
      } else {
        await addExistingMember(memberTeamId, memberForm.email, memberForm.isLeader)
      }
      setMemberTeamId(null)
      setMemberForm({ email: '', isLeader: false, invite: false })
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível adicionar o usuário')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto min-h-full max-w-7xl space-y-8 p-6 md:p-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipes</h1>
          <p className="mt-1 text-muted-foreground">
            Organize responsáveis e limite o acesso às conversas atribuídas.
          </p>
        </div>
        {canConfigure && (
          <Button className="rounded-full" onClick={() => setTeamDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova equipe
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : teams.length === 0 ? (
        <Card className="rounded-3xl border-dashed">
          <CardContent className="flex flex-col items-center py-20 text-center">
            <Users className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="font-semibold">Nenhuma equipe cadastrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {teams.map((team) => (
            <Card key={team.id} className="overflow-hidden rounded-3xl border-border/60">
              <div className="h-2" style={{ backgroundColor: team.color }} />
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>{team.name}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {team.description || 'Sem descrição'}
                  </p>
                </div>
                <Badge variant="secondary">{team.members.length} membros</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {team.members.length === 0 ? (
                  <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                    Nenhum usuário vinculado.
                  </p>
                ) : (
                  team.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-2xl bg-muted/40 p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {(member.full_name || member.email || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {member.full_name || member.email || 'Usuário'}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {member.is_leader && (
                          <Badge className="gap-1">
                            <Crown className="h-3 w-3" />
                            Líder
                          </Badge>
                        )}
                        {canConfigure && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              removeMember(member.id).catch(() =>
                                toast.error('Não foi possível remover o usuário'),
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {canConfigure && (
                  <Button
                    variant="outline"
                    className="mt-3 w-full rounded-xl"
                    onClick={() => setMemberTeamId(team.id)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Adicionar usuário
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={teamDialog} onOpenChange={setTeamDialog}>
        <DialogContent className="rounded-3xl">
          <form onSubmit={saveTeam}>
            <DialogHeader>
              <DialogTitle>Nova equipe</DialogTitle>
              <DialogDescription>Crie uma área responsável pelas conversas atribuídas.</DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-6">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  required
                  value={teamForm.name}
                  onChange={(event) => setTeamForm({ ...teamForm, name: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={teamForm.description}
                  onChange={(event) =>
                    setTeamForm({ ...teamForm, description: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <Input
                  type="color"
                  value={teamForm.color}
                  onChange={(event) => setTeamForm({ ...teamForm, color: event.target.value })}
                  className="h-12 p-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setTeamDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar equipe
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(memberTeamId)} onOpenChange={(value) => !value && setMemberTeamId(null)}>
        <DialogContent className="rounded-3xl">
          <form onSubmit={saveMember}>
            <DialogHeader>
              <DialogTitle>Adicionar usuário</DialogTitle>
              <DialogDescription>
                Vincule uma conta existente ou registre um convite por e-mail.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-6">
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  required
                  value={memberForm.email}
                  onChange={(event) =>
                    setMemberForm({ ...memberForm, email: event.target.value })
                  }
                />
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-4">
                <div>
                  <p className="font-semibold">Líder do time</p>
                  <p className="text-xs text-muted-foreground">Pode distribuir conversas.</p>
                </div>
                <Switch
                  checked={memberForm.isLeader}
                  onCheckedChange={(isLeader) => setMemberForm({ ...memberForm, isLeader })}
                />
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-muted/40 p-4">
                <div>
                  <p className="flex items-center gap-2 font-semibold">
                    <MailPlus className="h-4 w-4" />
                    Registrar convite
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Use quando a pessoa ainda não tem uma conta.
                  </p>
                </div>
                <Switch
                  checked={memberForm.invite}
                  onCheckedChange={(invite) => setMemberForm({ ...memberForm, invite })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setMemberTeamId(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Adicionar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
