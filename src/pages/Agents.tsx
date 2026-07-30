import { useState } from 'react'
import { useAgents } from '@/hooks/use-agents'
import { useLanguage } from '@/hooks/use-language'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Edit2, Loader2 } from 'lucide-react'
import { AIAgent } from '@/lib/types'

export default function Agents() {
  const {
    agents,
    loading,
    createAgent,
    updateAgent,
    deleteAgent,
    toggleAgentStatus,
    canConfigure,
  } = useAgents()
  const { t } = useLanguage()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    system_prompt: '',
    provider: 'openai' as const,
    model: 'gpt-4.1-mini' as const,
    agent_type: 'custom' as const,
    color: '#6366f1',
    tone: '',
    objectives: '',
    restrictions: '',
    knowledge_base_enabled: false,
    team_id: null,
    is_active: true,
  })

  const handleOpenDialog = (agent?: AIAgent) => {
    if (agent) {
      setEditingAgent(agent)
      setFormData({
        name: agent.name,
        description: agent.description || '',
        system_prompt: agent.system_prompt,
        provider: 'openai',
        model: agent.model,
        agent_type: agent.agent_type,
        color: agent.color,
        tone: agent.tone || '',
        objectives: agent.objectives || '',
        restrictions: agent.restrictions || '',
        knowledge_base_enabled: agent.knowledge_base_enabled,
        team_id: agent.team_id,
        is_active: agent.is_active,
      })
    } else {
      setEditingAgent(null)
      setFormData({
        name: '',
        description: '',
        system_prompt: t('default_system_prompt'),
        provider: 'openai',
        model: 'gpt-4.1-mini',
        agent_type: 'custom',
        color: '#6366f1',
        tone: '',
        objectives: '',
        restrictions: '',
        knowledge_base_enabled: false,
        team_id: null,
        is_active: true,
      })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (editingAgent) {
        await updateAgent(editingAgent.id, formData)
      } else {
        await createAgent(formData)
      }
      setIsDialogOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            {t('agents_title')}
          </h2>
          <p className="text-muted-foreground mt-2 font-medium text-base">{t('agents_desc')}</p>
        </div>
        {canConfigure && <Button
          onClick={() => handleOpenDialog()}
          className="rounded-full shadow-subtle px-6 h-12 font-semibold"
        >
          <Plus className="mr-2 h-5 w-5" />
          {t('create_agent')}
        </Button>}
      </div>

      {loading ? (
        <div className="flex justify-center p-24">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground/50" />
        </div>
      ) : agents.length === 0 ? (
        <Card className="border-dashed border-border bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-20 text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">{t('no_agents_title')}</h3>
            <p className="text-muted-foreground max-w-sm mb-6">{t('no_agents_desc')}</p>
            {canConfigure && <Button onClick={() => handleOpenDialog()} variant="outline" className="rounded-full">
              {t('create_agent')}
            </Button>}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Card
              key={agent.id}
              className="shadow-subtle border border-border/40 rounded-xl overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-elevation"
            >
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div>
                      <CardTitle className="text-lg tracking-tight line-clamp-1">
                        {agent.name}
                      </CardTitle>
                      <CardDescription className="text-xs font-semibold mt-0.5 uppercase tracking-wider">
                        {agent.is_active ? t('active') : t('inactive')}
                      </CardDescription>
                    </div>
                  </div>
                  {canConfigure && <Switch
                    checked={agent.is_active}
                    onCheckedChange={() => toggleAgentStatus(agent.id, agent.is_active)}
                  />}
                </div>
              </CardHeader>
              <CardContent className="flex-1 pb-6">
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                  {agent.description || t('no_description')}
                </p>
                <div className="mt-4 p-3 bg-muted/50 rounded-xl border border-border/50">
                  <p className="text-xs font-mono text-muted-foreground line-clamp-2 leading-relaxed opacity-70">
                    {agent.system_prompt}
                  </p>
                </div>
              </CardContent>
              {canConfigure && <div className="border-t border-border/40 bg-muted/10 p-4 flex justify-end gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full font-semibold"
                  onClick={() => handleOpenDialog(agent)}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  {t('edit')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => deleteAgent(agent.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-xl p-0 overflow-hidden border-border/60">
          <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[90vh]">
            <DialogHeader className="p-6 md:p-8 pb-4 border-b border-border/40 bg-muted/20">
              <DialogTitle className="text-2xl">
                {editingAgent ? t('edit_agent') : t('create_agent')}
              </DialogTitle>
              <DialogDescription>{t('agent_dialog_desc')}</DialogDescription>
            </DialogHeader>
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
              <div className="space-y-3">
                <Label htmlFor="name" className="font-semibold">
                  {t('agent_name')}
                </Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('agent_name_placeholder')}
                  className="rounded-xl h-12"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="description" className="font-semibold">
                  {t('description')}
                </Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('agent_desc_placeholder')}
                  className="rounded-xl h-12"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <Label className="font-semibold">Função</Label>
                  <Select
                    value={formData.agent_type}
                    onValueChange={(value: typeof formData.agent_type) =>
                      setFormData({ ...formData, agent_type: value })
                    }
                  >
                    <SelectTrigger className="rounded-xl h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="sales">Vendas</SelectItem>
                      <SelectItem value="sdr">SDR / Prospecção</SelectItem>
                      <SelectItem value="support">Suporte</SelectItem>
                      <SelectItem value="administrative">Administrativo</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="font-semibold">Modelo OpenAI</Label>
                  <Select
                    value={formData.model}
                    onValueChange={(value: typeof formData.model) =>
                      setFormData({ ...formData, model: value })
                    }
                  >
                    <SelectTrigger className="rounded-xl h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4.1-mini">GPT-4.1 mini</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4o mini</SelectItem>
                      <SelectItem value="gpt-4.1">GPT-4.1</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o (legado)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">
                A chave OpenAI é configurada uma única vez nos secrets do servidor e nunca fica
                exposta nesta tela.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <Label htmlFor="tone" className="font-semibold">Tom de voz</Label>
                  <Input
                    id="tone"
                    value={formData.tone}
                    onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                    placeholder="Consultivo, direto, cordial..."
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="color" className="font-semibold">Cor</Label>
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="rounded-xl h-12 p-2"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="objectives" className="font-semibold">Objetivos</Label>
                <Textarea
                  id="objectives"
                  value={formData.objectives}
                  onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                  className="rounded-xl min-h-[90px]"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="restrictions" className="font-semibold">Restrições</Label>
                <Textarea
                  id="restrictions"
                  value={formData.restrictions}
                  onChange={(e) => setFormData({ ...formData, restrictions: e.target.value })}
                  className="rounded-xl min-h-[90px]"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="prompt" className="font-semibold">
                  {t('system_prompt')}
                </Label>
                <Textarea
                  id="prompt"
                  required
                  value={formData.system_prompt}
                  onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                  placeholder={t('system_prompt_placeholder')}
                  className="rounded-xl min-h-[160px] resize-none font-mono text-sm leading-relaxed p-4"
                />
                <p className="text-[11px] text-muted-foreground font-medium">
                  {t('system_prompt_help')}
                </p>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border border-border/60">
                <div className="space-y-0.5">
                  <Label className="font-semibold">{t('agent_status')}</Label>
                  <p className="text-xs text-muted-foreground">{t('agent_status_help')}</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-2xl border border-border/60">
                <div className="space-y-0.5">
                  <Label className="font-semibold">Base de conhecimento</Label>
                  <p className="text-xs text-muted-foreground">
                    Permitir que este agente consulte documentos autorizados.
                  </p>
                </div>
                <Switch
                  checked={formData.knowledge_base_enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, knowledge_base_enabled: checked })
                  }
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
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full px-8 shadow-subtle"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingAgent ? t('save_changes') : t('create_agent')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
