import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import { LanguageProvider } from '@/hooks/use-language'
import { IntegrationProvider } from '@/hooks/use-integration'

import Layout from './components/Layout'
import DashboardLayout from './components/DashboardLayout'
import Index from './pages/Index'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import Pipeline from './pages/Pipeline'
import Settings from './pages/Settings'
import Chat from './pages/Chat'
import Agents from './pages/Agents'
import NotFound from './pages/NotFound'
import Onboarding from './pages/Onboarding'
import Products from './pages/Products'
import Teams from './pages/Teams'

const App = () => (
  <LanguageProvider>
    <BrowserRouter>
      <AuthProvider>
        <IntegrationProvider>
          <TooltipProvider>
            <Sonner position="top-right" richColors />
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
              </Route>

              <Route path="/app" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="onboarding" element={<Onboarding />} />
                <Route path="pipeline" element={<Pipeline />} />
                <Route path="contacts" element={<Contacts />} />
                <Route path="chat/:id" element={<Chat />} />
                <Route path="agents" element={<Agents />} />
                <Route path="products" element={<Products />} />
                <Route path="teams" element={<Teams />} />
              </Route>

              <Route path="/settings" element={<DashboardLayout />}>
                <Route index element={<Settings />} />
              </Route>

              <Route path="/dashboard" element={<Navigate to="/app" replace />} />
              <Route path="/products" element={<Navigate to="/app/products" replace />} />
              <Route path="/teams" element={<Navigate to="/app/teams" replace />} />
              <Route path="/agents" element={<Navigate to="/app/agents" replace />} />
              <Route path="/chat" element={<Navigate to="/app/contacts" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </IntegrationProvider>
      </AuthProvider>
    </BrowserRouter>
  </LanguageProvider>
)

export default App
