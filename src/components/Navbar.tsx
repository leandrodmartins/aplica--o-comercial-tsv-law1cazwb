import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ROTULO_PAPEL } from '@/types/tsv'
import {
  LayoutDashboard,
  PlusCircle,
  FileCheck2,
  FolderArchive,
  Users,
  LogOut,
  Building2,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'
import ThemeToggle from '@/components/ThemeToggle'
import iconeTsv from '@/assets/tsv-4364f.png'

export default function Navbar() {
  const { user, logout, isTSV, isAdmin } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { label: 'Painel', path: '/', icon: LayoutDashboard },
    { label: 'Nova Oportunidade', path: '/nova-oportunidade', icon: PlusCircle },
    { label: 'Revisão Técnica', path: '/revisao', icon: FileCheck2 },
    { label: 'Acervo Técnico', path: '/acervo', icon: FolderArchive },
    ...(isAdmin ? [{ label: 'Equipe', path: '/equipe', icon: Users }] : []),
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md text-slate-100">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-500/30 dark:bg-blue-100/90 dark:border-blue-300/40 group-hover:bg-blue-600/30 dark:group-hover:bg-blue-200 dark:[&>img]:mix-blend-multiply transition">
              <img src={iconeTsv} alt="TSV Grupo" className="w-5 h-5 object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">TSV Grupo</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Brigade
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none">
                Assistente Comercial Inteligente
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* User profile & actions */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {user && (
            <div className="flex items-center gap-2.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-right">
                <p className="text-xs font-medium text-white leading-tight">{user.name}</p>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 h-4 border-none font-semibold ${
                      isTSV ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {ROTULO_PAPEL[user.role] || user.role}
                  </Badge>
                  {user.distribuidor && (
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px] flex items-center gap-0.5">
                      <Building2 className="w-2.5 h-2.5" /> {user.distribuidor}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-950/20"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 py-3 space-y-3">
          {user && (
            <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-slate-400">
                  {user.email} • {isTSV ? 'TSV' : 'Vendedor'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-xs text-red-400"
              >
                Sair
              </Button>
            </div>
          )}
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-400 font-semibold'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}
