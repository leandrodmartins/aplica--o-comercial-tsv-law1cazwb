import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { authService } from '@/services/auth'
import { AppUser, UserRole } from '@/types/tsv'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Users, UserPlus, Building, Mail, Briefcase, ShieldCheck, CheckCircle2 } from 'lucide-react'

export default function Equipe() {
  const { isTSV } = useAuth()
  const [usuarios, setUsuarios] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)

  // Modal Novo Usuário
  const [modalOpen, setModalOpen] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('vendedor')
  const [distribuidora, setDistribuidora] = useState('')
  const [cargo, setCargo] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregarEquipe = async () => {
    try {
      setLoading(true)
      const lista = await authService.listarEquipe()
      setUsuarios(lista)
    } catch (e) {
      console.error('Erro ao listar equipe:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarEquipe()
  }, [])

  const handleCadastrar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim() || !email.trim()) return

    try {
      setSalvando(true)
      await authService.cadastrarUsuario({
        name: nome.trim(),
        email: email.trim(),
        role,
        distribuidora: distribuidora.trim() || undefined,
        cargo: cargo.trim() || undefined,
        password: 'Skip@Pass',
      })

      setModalOpen(false)
      setNome('')
      setEmail('')
      setDistribuidora('')
      setCargo('')
      await carregarEquipe()
    } catch (err: any) {
      alert(err.message || 'Falha ao cadastrar vendedor')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900/40">
              Gestão de Acessos & Papéis
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" /> Equipe e Distribuidores Brigade
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Controle os vendedores e revisores participantes do piloto Brigade no Brasil.
          </p>
        </div>

        {isTSV && (
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs">
                <UserPlus className="w-4 h-4 mr-2" /> Novo Vendedor / Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-md">
              <form onSubmit={handleCadastrar}>
                <DialogHeader>
                  <DialogTitle className="text-white">Cadastrar Membro na Equipe</DialogTitle>
                  <DialogDescription className="text-slate-400 text-xs">
                    Vendedores verão apenas suas oportunidades atribuídas. Membros TSV terão acesso
                    a todas as oportunidades e aprovação técnica.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 text-xs">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Nome Completo *</Label>
                    <Input
                      placeholder="Ex: Carlos Oliveira"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-300">E-mail Corporativo *</Label>
                    <Input
                      type="email"
                      placeholder="carlos@distribuidor.com.br"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Papel na Plataforma</Label>
                    <Select value={role} onValueChange={(val) => setRole(val as UserRole)}>
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                        <SelectItem value="vendedor">Vendedor (Vê apenas seus leads)</SelectItem>
                        <SelectItem value="tsv">
                          TSV Gestor (Vê todos os leads e aprova pacotes)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Distribuidora / Empresa</Label>
                    <Input
                      placeholder="Ex: MegaDist Segurança Veicular"
                      value={distribuidora}
                      onChange={(e) => setDistribuidora(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Cargo / Função</Label>
                    <Input
                      placeholder="Ex: Consultor Comercial Sênior"
                      value={cargo}
                      onChange={(e) => setCargo(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-xs"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={salvando}
                    className="bg-blue-600 hover:bg-blue-500 text-white"
                  >
                    {salvando ? 'Salvando...' : 'Cadastrar Membro'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Lista da Equipe */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Carregando usuários da equipe...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {usuarios.map((usr) => (
            <Card key={usr.id} className="bg-slate-900/60 border-slate-800">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-semibold uppercase ${
                      usr.role === 'tsv'
                        ? 'border-blue-500/40 text-blue-400 bg-blue-500/10'
                        : 'border-amber-500/40 text-amber-400 bg-amber-500/10'
                    }`}
                  >
                    {usr.role === 'tsv' ? 'TSV Aprovador' : 'Vendedor Parceiro'}
                  </Badge>
                  <span className="text-[10px] text-slate-500">
                    Desde {new Date(usr.created).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <CardTitle className="text-base text-white mt-2">{usr.name}</CardTitle>
                <CardDescription className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3 text-slate-500" /> {usr.email}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2 pt-0 pb-4 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-slate-500" />
                  <span>{usr.distribuidora || 'TSV Grupo'}</span>
                </div>

                {usr.cargo && (
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                    <span>{usr.cargo}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
