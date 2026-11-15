import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { usuarioService } from '@/services/usuarios'
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
import { ShieldCheck, Lock, CheckCircle2, ArrowRight, AlertTriangle } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import { getErrorMessage } from '@/lib/pocketbase/errors'

/**
 * Página pública aberta pelo link do e-mail de redefinição do PocketBase
 * (#/confirm-password-reset=TOKEN... ou ?token=...). Define a nova senha do
 * usuário autenticado pelo token — o PocketBase autentica o token no cliente.
 */
export default function RedefinirSenha() {
  const { token } = useParams()
  const navigate = useNavigate()

  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [concluido, setConcluido] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // O PocketBase envia o link no formato .../auth/confirm-password-reset/TOKEN.
  // Aqui aceitamos tanto ?token= quanto o token cru vindo da rota.
  const tokenLimpo = token || ''

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!senha || !confirmacao) {
      setErro('Informe a nova senha e a confirmação.')
      return
    }
    if (senha !== confirmacao) {
      setErro('A senha e a confirmação não coincidem.')
      return
    }
    if (senha.length < 8) {
      setErro('A senha deve ter pelo menos 8 caracteres.')
      return
    }
    try {
      setSalvando(true)
      setErro(null)
      // Fluxo nativo: autentica pelo token do e-mail e grava a nova senha.
      await usuarioService.confirmarResetSenha(tokenLimpo, senha)
      setConcluido(true)
    } catch (err) {
      setErro(getErrorMessage(err))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl mb-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-xl text-white">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">TSV Grupo</h1>
          <p className="text-slate-400 text-sm mt-1.5">Definição de nova senha</p>
        </div>

        <Card className="border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-2xl text-slate-100">
          {concluido ? (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-400" /> Senha definida
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Sua nova senha foi salva. Faça login para acessar a plataforma.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                  onClick={() => navigate('/login', { replace: true })}
                >
                  Ir para o login <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </>
          ) : !tokenLimpo ? (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400" /> Link inválido
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Este link de redefinição não contém o token de segurança. Solicite um novo e-mail
                  na tela de login.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>
                  Voltar ao login
                </Button>
              </CardFooter>
            </>
          ) : (
            <form onSubmit={enviar}>
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl text-white">Definir nova senha</CardTitle>
                <CardDescription className="text-slate-400">
                  Crie uma senha com pelo menos 8 caracteres.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {erro && (
                  <Alert
                    variant="destructive"
                    className="bg-red-950/50 border-red-800 text-red-200"
                  >
                    <AlertDescription>{erro}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="nova-senha" className="text-slate-300">
                    Nova senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                      id="nova-senha"
                      type="password"
                      placeholder="••••••••"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="pl-9 bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus:border-blue-500"
                      disabled={salvando}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmar-senha" className="text-slate-300">
                    Confirmar nova senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input
                      id="confirmar-senha"
                      type="password"
                      placeholder="••••••••"
                      value={confirmacao}
                      onChange={(e) => setConfirmacao(e.target.value)}
                      className="pl-9 bg-slate-950/60 border-slate-800 text-white placeholder:text-slate-600 focus:border-blue-500"
                      disabled={salvando}
                      required
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col gap-3">
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                  disabled={salvando}
                >
                  {salvando ? 'Salvando…' : 'Definir nova senha'}
                </Button>
                <Link
                  to="/login"
                  className="text-sm text-slate-400 hover:text-slate-200 underline-offset-4 hover:underline"
                >
                  Voltar ao login
                </Link>
              </CardFooter>
            </form>
          )}
        </Card>

        <div className="mt-8 text-center text-xs text-slate-500">
          <p>Operação Piloto Brigade no Brasil • Hub TSV Grupo</p>
        </div>
      </div>
    </div>
  )
}
