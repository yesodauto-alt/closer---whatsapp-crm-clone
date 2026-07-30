import { useState } from 'react'
import { useLanguage } from '@/hooks/use-language'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Plus, Users, Crown, Trash2, MessageSquare } from 'lucide-react'

type Role = 'super-admin' | 'admin' | 'leader' | 'agent'

interface TeamMember {
  id: string
  name: string
  email: string
  role: Role
}

interface Team {
  id: string
  name: string
  description: string
  members: TeamMember[]
  conversations: number
}

const roleConfig: Record<Role, { label: string; color: string; icon: typeof Crown }> = {
  'super-admin': { label: 'Super Admin', color: 'bg-purple-500 text-white', icon: Crown },
  admin: { label: 'Admin', color: 'bg-blue-500 text-white', icon: Crown },
  leader: { label: 'Leader', color: 'bg-green-500 text-white', icon: Users },
  agent: { label: 'Agent', color: 'bg-gray-500 text-white', icon: Users },
}

const mockTeams: Team[] = [
  {
    id: '1',
    name: 'Sales Team Alpha',
    description: 'Primary sales team handling new leads and conversions.',
    conversations: 42,
    members: [
      { id: 'm1', name: 'Yesod Admin', email: 'yesod.auto@gmail.com', role: 'super-admin' },
      { id: 'm2', name: 'John Seller', email: 'john@yesod.auto', role: 'leader' },
      { id: 'm3', name: 'Jane Agent', email: 'jane@yesod.auto', role: 'agent' },
    ],
  },
  {
    id: '2',
    name: 'Support Team',
    description: 'Customer support and retention specialists.',
    conversations: 28,
    members: [
      { id: 'm4', name: 'Carlos Manager', email: 'carlos@yesod.auto', role: 'admin' },
      { id: 'm5', name: 'Ana Support', email: 'ana@yesod.auto', role: 'agent' },
    ],
  },
  {
    id: '3',
    name: 'Closing Team',
    description: 'Senior agents focused on closing high-value deals.',
    conversations: 15,
    members: [
      { id: 'm6', name: 'Maria Closer', email: 'maria@yesod.auto', role: 'leader' },
      { id: 'm7', name: 'Pedro Agent', email: 'pedro@yesod.auto', role: 'agent' },
    ],
  },
]

export default function Teams() {
  const { t } = useLanguage()
  const [teams, setTeams] = useState<Team[]>(mockTeams)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', description: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newTeam: Team = {
      id: crypto.randomUUID(),
      name: formData.name,
      description: formData.description,
      members: [],
      conversations: 0,
    }
    setTeams((prev) => [...prev, newTeam])
    setFormData({ name: '', description: '' })
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    setTeams((prev) => prev.filter((team) => team.id !== id))
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 p-6 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-apple min-h-full bg-background">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-foreground">
            {t('teams_title') || 'Teams'}
          </h2>
          <p className="text-muted-foreground mt-2 font-medium text-base">
            {t('teams_desc') || 'Manage teams and conversation assignments'}
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="rounded-full shadow-subtle px-6 h-12 font-semibold"
        >
          <Plus className="mr-2 h-5 w-5" />
          {t('add_team') || 'Add Team'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {teams.map((team) => (
          <Card
            key={team.id}
            className="shadow-subtle border border-border/40 rounded-[2rem] overflow-hidden flex flex-col transition-all duration-300 hover:shadow-elevation"
          >
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="bg-muted p-3 rounded-full">
                    <Users className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg tracking-tight">{team.name}</CardTitle>
                    <CardDescription className="text-xs font-semibold mt-0.5">
                      {team.members.length} {t('members') || 'members'} · {team.conversations}{' '}
                      {t('conversations') || 'conversations'}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(team.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pb-6">
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {team.description}
              </p>
              <div className="space-y-2">
                {team.members.map((member) => {
                  const role = roleConfig[member.role]
                  const RoleIcon = role.icon
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between py-2.5 px-3 -mx-3 rounded-2xl hover:bg-muted transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-border">
                          <AvatarFallback className="bg-muted text-foreground font-semibold text-xs">
                            {member.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-sm text-foreground">{member.name}</p>
                          <p className="text-xs text-muted-foreground font-medium">
                            {member.email}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={`text-[10px] px-2 py-0.5 font-bold rounded-md ${role.color}`}
                      >
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {role.label}
                      </Badge>
                    </div>
                  )
                })}
                {team.members.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4 font-medium">
                    {t('no_members') || 'No members yet'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2rem] p-0 overflow-hidden border-border/60">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="p-6 md:p-8 pb-4 border-b border-border/40 bg-muted/20">
              <DialogTitle className="text-2xl">{t('add_team') || 'Add Team'}</DialogTitle>
              <DialogDescription>
                {t('team_dialog_desc') || 'Create a new team for conversation assignment.'}
              </DialogDescription>
            </DialogHeader>
            <div className="p-6 md:p-8 space-y-6">
              <div className="space-y-3">
                <Label htmlFor="team_name" className="font-semibold">
                  {t('team_name') || 'Team Name'}
                </Label>
                <Input
                  id="team_name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Sales Team Alpha"
                  className="rounded-xl h-12"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="team_desc" className="font-semibold">
                  {t('description') || 'Description'}
                </Label>
                <Input
                  id="team_desc"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Primary sales team"
                  className="rounded-xl h-12"
                />
              </div>
            </div>
            <DialogFooter className="p-6 md:p-8 pt-4 border-t border-border/40 bg-muted/20">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-full"
              >
                {t('cancel') || 'Cancel'}
              </Button>
              <Button type="submit" className="rounded-full px-8 shadow-subtle">
                {t('create_team') || 'Create Team'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
