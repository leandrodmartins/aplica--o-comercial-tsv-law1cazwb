/* Main App Component - Handles routing (using react-router-dom), query client and other providers */
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ReactNode } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import ProtectedLayout from '@/components/ProtectedLayout'

import Login from '@/pages/Login'
import Painel from '@/pages/Painel'
import NovaOportunidade from '@/pages/NovaOportunidade'
import PacoteDetalhes from '@/pages/PacoteDetalhes'
import RevisaoTecnica from '@/pages/RevisaoTecnica'
import AcervoTecnico from '@/pages/AcervoTecnico'
import Equipe from '@/pages/Equipe'
import NotFound from '@/pages/NotFound'

/** Guarda de rota: /equipe só abre para admin/tsv. */
function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useAuth()
  const location = useLocation()
  if (loading) return null
  if (!isAdmin) return <Navigate to="/" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Rota pública de Login */}
          <Route path="/login" element={<Login />} />

          {/* Rotas protegidas dentro do layout comum com Navbar */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Painel />} />
            <Route path="/nova-oportunidade" element={<NovaOportunidade />} />
            <Route path="/pacote/:id" element={<PacoteDetalhes />} />
            <Route path="/revisao" element={<RevisaoTecnica />} />
            <Route path="/acervo" element={<AcervoTecnico />} />
            <Route
              path="/equipe"
              element={
                <RequireAdmin>
                  <Equipe />
                </RequireAdmin>
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
