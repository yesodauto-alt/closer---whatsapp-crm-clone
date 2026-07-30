import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '@/hooks/use-language'
import {
  Bot,
  Columns,
  Contact,
  FileText,
  Flame,
  LifeBuoy,
  LayoutDashboard,
  MessageSquare,
  Package,
  Radio,
  Settings as SettingsIcon,
  ShieldCheck,
  User,
  Users,
  Workflow,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOrganization } from '@/hooks/use-organization'

export function Sidebar() {
  const location = useLocation()
  const { t } = useLanguage()
  const { role, organization } = useOrganization()

  const navItems = [
    { name: 'Dashboard', path: '/app', icon: LayoutDashboard, roles: ['super_admin', 'admin'] },
    { name: 'Prioridades', path: '/app/priorities', icon: Flame },
    { name: 'Conversas', path: '/app/conversations', icon: MessageSquare },
    { name: 'Contatos', path: '/app/contacts', icon: Contact },
    { name: 'Canais', path: '/app/channels', icon: Radio, roles: ['super_admin', 'admin'] },
    { name: t('pipeline_nav') || 'Pipeline', path: '/app/pipeline', icon: Columns },
    { name: 'Produtos', path: '/app/products', icon: Package, roles: ['super_admin', 'admin'] },
    { name: 'Equipes', path: '/app/teams', icon: Users, roles: ['super_admin', 'admin'] },
    { name: 'Suporte', path: '/app/support', icon: LifeBuoy },
    { name: 'IA Assistente', path: '/app/agents', icon: Bot },
    { name: 'Automações', path: '/app/automations', icon: Workflow, roles: ['super_admin', 'admin'] },
    { name: 'Templates', path: '/app/templates', icon: FileText },
    { name: 'Configurações', path: '/settings', icon: SettingsIcon, roles: ['super_admin'] },
    { name: 'Perfil', path: '/app/profile', icon: User },
  ].filter((item) => !item.roles || (role && item.roles.includes(role)))

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar md:flex z-20">
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-3 py-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight">Yesod CRM</p>
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {role === 'super_admin' ? 'Super Admin' : role || organization?.name || 'CRM'}
            </p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/app' && location.pathname.startsWith(item.path))
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-border p-4 text-xs text-muted-foreground">
        <p className="truncate font-semibold text-foreground">{organization?.name || 'Yesod CRM'}</p>
        <p className="truncate">Inteligência comercial</p>
      </div>
    </aside>
  )
}
