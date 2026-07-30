import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useIntegration } from '@/hooks/use-integration'
import { Header } from './layout/Header'
import { Sidebar } from './layout/Sidebar'
import { BottomNav } from './layout/BottomNav'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout() {
  const { user, loading: authLoading } = useAuth()
  const { integration, loading: integrationLoading } = useIntegration()
  const location = useLocation()

  if (authLoading || integrationLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />

  const isSetupComplete = integration?.is_setup_completed
  const isOnboardingRoute = location.pathname === '/app/onboarding'

  if (!isSetupComplete && !isOnboardingRoute) {
    return <Navigate to="/app/onboarding" replace />
  }

  if (isSetupComplete && isOnboardingRoute) {
    return <Navigate to="/app" replace />
  }

  if (isOnboardingRoute) {
    return (
      <div className="min-h-screen bg-background w-full overflow-y-auto animate-fade-in flex items-center justify-center p-4">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background w-full">
      <Sidebar />
      <div className="flex flex-col flex-1 relative w-full max-w-full">
        <Header />
        <main className="flex-1 overflow-y-auto w-full pb-20 md:pb-0">
          <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Outlet />
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
