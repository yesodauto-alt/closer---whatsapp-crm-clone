import { ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
        <ShieldCheck className="h-6 w-6" />
      </div>
      {!compact && (
        <div>
          <p className="text-lg font-extrabold leading-none tracking-tight">Yesod CRM</p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Inteligência comercial
          </p>
        </div>
      )}
    </div>
  )
}
