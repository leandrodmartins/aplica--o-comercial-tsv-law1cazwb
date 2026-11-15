import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ShieldCheck, Lock, Mail, ArrowRight, UserCheck, CheckCircle2 } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as any)?.from?.pathname || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Informe o e-mail e a senha')
      return
    }

    try {
      setLoading(true)
      setError(null)
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err: any) {
      setError(err?.message || 'Falha ao autenticar. Verifique o e-mail e a senha.')
    } finally {
      setLoading(false)
    }
  }

  const handleFillDemo = (tipo: 'tsv' | 'vendedor') => {
    if (tipo === 'tsv') {
      setEmail('flavio.zanotta@brigade-electronics.com')
      setPassword('Skip@Pass')
    } else {
      setEmail('carlos.vendedor@distribuidor.com.br')
      setPassword('Skip@Pass')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Decorative background grid and glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl mb-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-xl text-white">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            TSV Grupo{' '}
            <span className="text-amber-500 text-sm font-semibold uppercase px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
              Piloto Brigade
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1.5">
            Assistente Comercial Inteligente de Segurança Veicular
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-2xl text-slate-100">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-white">Acesse sua conta</CardTitle>
            <CardDescription className="text-slate-400">
              Entre com suas credenciais de distribuidor ou TSV Grupo
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-950/50 border-red-800 text-red-200">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  E-mail corporativo
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.nome@distribuidor.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus:border-blue-500"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus:border-blue-500"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Botões de acesso rápido para testes de perfil */}
              <div className="pt-2">
                <p className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" /> Perfis de demonstração do
                  piloto:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleFillDemo('tsv')}
                    className="flex flex-col items-start p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition text-left"
                  >
                    <span className="font-semibold text-blue-400 flex items-center gap-1">
                      TSV Gestor <CheckCircle2 className="w-3 h-3 text-blue-400" />
                    </span>
                    <span className="text-[11px] text-slate-400 truncate w-full">
                      Vê todas as oportunidades
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFillDemo('vendedor')}
                    className="flex flex-col items-start p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition text-left"
                  >
                    <span className="font-semibold text-amber-400 flex items-center gap-1">
                      Vendedor <CheckCircle2 className="w-3 h-3 text-amber-400" />
                    </span>
                    <span className="text-[11px] text-slate-400 truncate w-full">
                      Vê apenas os seus leads
                    </span>
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 shadow-lg shadow-blue-600/20"
                disabled={loading}
              >
                {loading ? (
                  'Acessando...'
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Entrar na Plataforma <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-slate-500 space-y-1">
          <p>Operação Piloto Brigade no Brasil • Hub TSV Grupo</p>
          <p>Aprovação técnica obrigatória antes de envios externos</p>
        </div>
      </div>
    </div>
  )
}
