import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Construction, Mail, Radio, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type WorkspaceProps = {
  title: string
  description: string
  icon?: ReactNode
  children?: ReactNode
}

export function Workspace({ title, description, icon, children }: WorkspaceProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        {icon && <div className="rounded-xl bg-primary p-2.5 text-primary-foreground">{icon}</div>}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

export function Priorities() {
  const navigate = useNavigate()
  return (
    <Workspace title="Prioridades" description="Atendimentos e oportunidades que precisam de ação agora." icon={<Sparkles className="h-5 w-5" />}>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Sparkles className="mb-4 h-9 w-9 text-muted-foreground" />
          <h2 className="font-semibold">Sua fila está organizada</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">As prioridades serão preenchidas a partir da classificação e da atividade real dos contatos.</p>
          <Button className="mt-5" onClick={() => navigate('/app/conversations')}>Ver conversas <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </CardContent>
      </Card>
    </Workspace>
  )
}

export function Channels() {
  const channels = [
    { name: 'WhatsApp', status: 'Evolution API', icon: <Send className="h-5 w-5" /> },
    { name: 'E-mail', status: 'Disponível para configuração', icon: <Mail className="h-5 w-5" /> },
    { name: 'Telegram', status: 'Disponível para configuração', icon: <Radio className="h-5 w-5" /> },
  ]
  return (
    <Workspace title="Canais" description="Centralize os canais de atendimento da sua organização." icon={<Radio className="h-5 w-5" />}>
      <div className="grid gap-4 md:grid-cols-3">
        {channels.map((channel) => (
          <Card key={channel.name}>
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <div className="rounded-lg bg-muted p-2">{channel.icon}</div>
              <div><CardTitle className="text-base">{channel.name}</CardTitle><p className="mt-1 text-xs text-muted-foreground">{channel.status}</p></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </Workspace>
  )
}

export function ModulePage({ title }: { title: string }) {
  return (
    <Workspace title={title} description={`Área de ${title.toLowerCase()} do Yesod CRM.`} icon={<Construction className="h-5 w-5" />}>
      <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">O módulo está integrado à navegação e será ativado sem interferir na conexão Evolution.</CardContent></Card>
    </Workspace>
  )
}
