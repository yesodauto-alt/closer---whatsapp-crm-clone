import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '@/hooks/use-language'
import {
  Bot,
  Columns,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings as SettingsIcon,
  ShieldCheck,
  UserRoundCog,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOrganization } from '@/hooks/use-organization'

export function Sidebar() {
  const location = useLocation()
  const { t } = useLanguage()
  const { role, organization } = useOrganization()

  const navItems = [
    { name: 'Dashboard', path: '/app', icon: LayoutDashboard },
    { name: 'Conversas', path: '/app/contacts', icon: MessageSquare },
    { name: t('pipeline_nav') || 'Pipeline', path: '/app/pipeline', icon: Columns },
    { name: 'Produtos', path: '/app/products', icon: Package },
    { name: 'Equipes', path: '/app/teams', icon: Users },
    { name: 'Agentes de IA', path: '/app/agents', icon: Bot },
    { name: t('settings_nav') || 'Settings', path: '/settings', icon: SettingsIcon },
  ]

  return (
    <aside className="hidden w-64 flex-col border-r border-border bg-background md:flex z-20">
      <div className="flex flex-col pt-7 pb-5 px-7">
        <div className="flex items-center gap-3 py-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-extrabold tracking-tight">Yesod CRM</p>
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {role === 'super_admin' ? 'Super Admin' : role || organization?.name || 'CRM'}
            </p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-2 p-5">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/app' && location.pathname.startsWith(item.path))
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-[15px] font-semibold transition-all duration-300',
                isActive
                  ? 'bg-card text-foreground shadow-subtle border border-border'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent',
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="m-5 flex items-center gap-3 rounded-2xl border border-border bg-muted/30 p-3">
        <UserRoundCog className="h-5 w-5 text-muted-foreground" />
        <div className="min-w-0 text-xs">
          <p className="truncate font-semibold">{organization?.name || 'Yesod CRM'}</p>
          <p className="truncate text-muted-foreground">Acesso por hierarquia</p>
        </div>
      </div>
    </aside>
  )
}
