import { useAuth } from '@/hooks/use-auth'
import { useIntegration } from '@/hooks/use-integration'
import { useLanguage } from '@/hooks/use-language'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, Moon, Search, Settings, ShieldCheck, Sun } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export function Header() {
  const { user, signOut } = useAuth()
  const { integration } = useIntegration()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme') === 'dark'
    setDark(saved)
    document.documentElement.classList.toggle('dark', saved)
  }, [])

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const getStatusColor = (status?: string) => {
    if (status === 'CONNECTED') return 'bg-primary'
    if (status === 'WAITING_QR') return 'bg-blue-500 animate-pulse'
    return 'bg-muted-foreground'
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-md md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="flex items-center md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-extrabold">Yesod CRM</span>
          </div>
        </div>
        <div className="relative hidden w-full max-w-md md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-10 bg-background pl-9 shadow-sm" placeholder="Buscar contatos, conversas e produtos..." />
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-foreground bg-muted/50 px-3 py-2 rounded-full border border-border">
          <div className={cn('h-2.5 w-2.5 rounded-full', getStatusColor(integration?.status))} />
          <span className="hidden sm:inline-block tracking-tight uppercase">
            {integration?.status === 'CONNECTED'
              ? t('connected')
              : integration?.status === 'WAITING_QR'
                ? t('waiting_qr')
                : t('disconnected')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <Button variant="ghost" size="icon" className="rounded-full" onClick={toggleTheme}>
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <Avatar className="h-9 w-9 border border-border cursor-pointer">
              <AvatarFallback className="bg-muted text-foreground font-bold text-sm">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-60 rounded-2xl shadow-elevation border border-border p-2"
          >
            <div className="px-4 py-3 mb-1 text-[13px] font-semibold text-muted-foreground truncate border-b border-border">
              {user?.email}
            </div>
            <DropdownMenuItem
              asChild
              className="rounded-xl cursor-pointer my-1 focus:bg-muted py-2.5"
            >
              <Link to="/settings" className="flex items-center gap-3 font-semibold">
                <Settings className="h-4 w-4 text-muted-foreground" /> {t('settings_nav')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 rounded-xl flex items-center gap-3 font-semibold py-2.5"
            >
              <LogOut className="h-4 w-4" /> {t('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
