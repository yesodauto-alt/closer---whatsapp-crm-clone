import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useLanguage } from '@/hooks/use-language'
import {
  LayoutDashboard,
  Users,
  Package,
  Building2,
  Columns,
  Bot,
  Settings as SettingsIcon,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export function BottomNav() {
  const location = useLocation()
  const { t } = useLanguage()
  const [moreOpen, setMoreOpen] = useState(false)

  const mainItems = [
    { name: t('overview_nav') || 'Overview', path: '/app', icon: LayoutDashboard },
    { name: t('contacts_nav') || 'Contacts', path: '/app/contacts', icon: Users },
    { name: t('products_nav') || 'Products', path: '/app/products', icon: Package },
    { name: t('teams_nav') || 'Teams', path: '/app/teams', icon: Building2 },
  ]

  const moreItems = [
    { name: t('pipeline_nav') || 'Pipeline', path: '/app/pipeline', icon: Columns },
    { name: 'AI Agents', path: '/app/agents', icon: Bot },
    { name: t('settings_nav') || 'Settings', path: '/settings', icon: SettingsIcon },
  ]

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/app' && location.pathname.startsWith(path))

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-background px-2 py-2 md:hidden">
      {mainItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={cn(
            'flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-semibold transition-colors',
            isActive(item.path) ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          <item.icon className="h-5 w-5" />
          {item.name}
        </Link>
      ))}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetTrigger asChild>
          <button className="flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-semibold text-muted-foreground transition-colors">
            <Menu className="h-5 w-5" />
            {t('more') || 'More'}
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-[2rem] p-6">
          <SheetHeader className="pb-4">
            <SheetTitle>{t('more') || 'More'}</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 mt-2">
            {moreItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[15px] font-semibold transition-all',
                  isActive(item.path)
                    ? 'bg-card text-foreground border border-border shadow-subtle'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}
