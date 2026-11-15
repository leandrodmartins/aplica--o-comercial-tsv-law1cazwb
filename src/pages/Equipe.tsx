import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { usuarioService, DadosUsuario } from '@/services/usuarios'
import { AppUser, ROTULO_PAPEL, UserRole } from '@/types/tsv'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage, extractFieldErrors } from '@/lib/pocketbase/errors'
import { KeyRound, Pencil, Plus, ShieldCheck, Trash2, UserCog } from 'lucide-react'

const COR_POVEL: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  tsv: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  revisor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  vendedor: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
}

interface FormularioUsuario {
  name: string
  email: string
  role: UserRole
  distribuidor: string
  cargo: string
}

const FORMULARIO_VAZIO: FormularioUsuario = {
  name: '',
  email: '',
  role: 'vendedor',
  distribuidor: '',
  cargo: '',
}

export default function Equipe() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [usuarios, setUsuarios] = useState<AppUser[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [enviandoSenha, setEnviandoSenha] = useState<string | null>(null)
  const [erros, setErros] = useState<Record<string, string>>({})

  // Dialog de criar/editar
  const [dialogoAberto, setDialogoAberto] = useState(false)
  const [editando, setEditando] = useState<AppUser | null>(null)
  const [form, setForm] = useState<FormularioUsuario>(FORMULARIO_VAZIO)

  // Dialog de confirmação de envio de link de senha
  const [senhaDialogo, setSenhaDialogo] = useState<AppUser | null>(null)
  const [senhaEnviada, setSenhaEnviada] = useState(false)

  const podeGerenciar = user?.role === 'admin' || user?.role === 'tsv'
  const souAdmin = user?.role === 'admin'

  const carregar = async () => {
    setCarregando(true)
    try {
      setUsuarios(await usuarioService.listar())
    } catch (err) {
      toast({
        title: 'Falha ao carregar usuários',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    if (podeGerenciar) void carregar()
    else setCarregando(false)
  }, [podeGerenciar])

  const aplicarFiltro = useMemo(() => {
    // Admin vê todos os usuários; TSV vê a própria equipe (mesmo distribuidor).
    if (user?.role === 'admin' || !user?.distribuidor) return usuarios
    return usuarios.filter((u) => u.distribuidor === user.distribuidor)
  }, [usuarios, user])

  const abrirCriar = () => {
    setEditando(null)
    setForm(FORMULARIO_VAZIO)
    setErros({})
    setDialogoAberto(true)
  }

  const abrirEditar = (u: AppUser) => {
    setEditando(u)
    setForm({
      name: u.name || '',
      email: u.email || '',
      role: u.role,
      distribuidor: u.distribuidor || '',
      cargo: u.cargo || '',
    })
    setErros({})
    setDialogoAberto(true)
  }

  const salvarUsuario = async () => {
    setSalvando(true)
    setErros({})
    // Edição só trata nome, e-mail, papel, distribuidor e cargo — nunca senha.
    // A criação não define senha: o acesso é pelo e-mail de "definir senha".
    // Erros voltam traduzidos e específicos das rotas dedicadas no servidor.
    try {
      const dados: DadosUsuario = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        distribuidor: form.distribuidor.trim(),
        cargo: form.cargo.trim(),
      }
      if (editando) {
        const atualizado = await usuarioService.atualizar(editando.id, dados)
        toast({
          title: 'Usuário atualizado',
          description: `${atualizado.name || atualizado.email} foi atualizado com sucesso.`,
        })
      } else {
        const criado = await usuarioService.criar(dados)
        setDialogoAberto(false)
        toast({
          title: 'Usuário criado',
          description: `${criado.email} foi criado. Use "Senha" para enviar o e-mail com o link de primeiro acesso.`,
          duration: 10000,
        })
      }
      await carregar()
      if (editando) setDialogoAberto(false)
    } catch (err) {
      setErros(extractFieldErrors(err))
      toast({
        title: editando ? 'Falha ao salvar usuário' : 'Falha ao criar usuário',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const enviarLinkSenha = async (u: AppUser) => {
    setEnviandoSenha(u.id)
    try {
      await usuarioService.enviarResetSenha(u.email)
      setSenhaEnviada(true)
      toast({
        title: 'E-mail enviado',
        description: `Link de definição de senha enviado para ${u.email}.`,
      })
    } catch (err) {
      toast({
        title: 'Falha ao enviar e-mail',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setEnviandoSenha(null)
    }
  }

  const removerUsuario = async (u: AppUser) => {
    if (!confirm(`Remover o usuário ${u.email}? Esta ação não pode ser desfeita.`)) return
    try {
      await usuarioService.remover(u.id)
      toast({ title: 'Usuário removido' })
      await carregar()
    } catch (err) {
      toast({
        title: 'Falha ao remover usuário',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    }
  }

  if (!podeGerenciar) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="py-10 text-center">
            <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">Acesso restrito</p>
            <p className="text-sm text-muted-foreground">
              Somente administradores e TSV podem gerenciar a equipe.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Equipe & Usuários</h1>
          <p className="text-sm text-muted-foreground">
            Inclua usuários, defina o papel (admin, TSV, revisor ou vendedor) e o distribuidor —
            base do isolamento de dados por distribuidor.
          </p>
        </div>
        <Button onClick={abrirCriar}>
          <Plus className="mr-2 h-4 w-4" /> Novo usuário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCog className="h-4 w-4" /> Usuários ({aplicarFiltro.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : aplicarFiltro.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum usuário encontrado.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Nome</th>
                    <th className="pb-2 pr-4 font-medium">E-mail</th>
                    <th className="pb-2 pr-4 font-medium">Papel</th>
                    <th className="pb-2 pr-4 font-medium">Distribuidor</th>
                    <th className="pb-2 pr-4 font-medium">Cargo</th>
                    <th className="pb-2 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {aplicarFiltro.map((u) => (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{u.name || '—'}</td>
                      <td className="py-2 pr-4">{u.email}</td>
                      <td className="py-2 pr-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${COR_POVEL[u.role]}`}
                        >
                          {ROTULO_PAPEL[u.role]}
                        </span>
                      </td>
                      <td className="py-2 pr-4">{u.distribuidor || '—'}</td>
                      <td className="py-2 pr-4">{u.cargo || '—'}</td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => abrirEditar(u)}>
                            <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={enviandoSenha === u.id}
                            onClick={() => {
                              setSenhaDialogo(u)
                              setSenhaEnviada(false)
                            }}
                          >
                            <KeyRound className="mr-1 h-3.5 w-3.5" />
                            {enviandoSenha === u.id ? 'Enviando…' : 'Senha'}
                          </Button>
                          {souAdmin && u.id !== user?.id && (
                            <Button variant="ghost" size="sm" onClick={() => removerUsuario(u)}>
                              <Trash2 className="mr-1 h-3.5 w-3.5" /> Remover
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---- Dialog: criar ou editar usuário ---- */}
      <Dialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar usuário' : 'Novo usuário'}</DialogTitle>
            <DialogDescription>
              {editando
                ? 'Altere os dados do usuário. O e-mail recebe um novo link de confirmação quando mudado.'
                : 'Após criar, use a ação "Senha" para enviar por e-mail o link de primeiro acesso — não há repasse manual de senha.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-foreground">
                Nome
              </Label>
              <Input
                id="nome"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome completo"
              />
              {erros.name && <p className="text-xs text-destructive">{erros.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-foreground">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="usuario@empresa.com.br"
              />
              {erros.email && <p className="text-xs text-destructive">{erros.email}</p>}
              {erros.password && <p className="text-xs text-destructive">{erros.password}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-foreground">Papel</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v as UserRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ROTULO_PAPEL) as UserRole[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        {ROTULO_PAPEL[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dist" className="text-foreground">
                  Distribuidor
                </Label>
                <Input
                  id="dist"
                  value={form.distribuidor}
                  onChange={(e) => setForm({ ...form, distribuidor: e.target.value })}
                  placeholder="Ex.: Brigade SP"
                />
                {erros.distribuidor && (
                  <p className="text-xs text-destructive">{erros.distribuidor}</p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cargo" className="text-foreground">
                Cargo (opcional)
              </Label>
              <Input
                id="cargo"
                value={form.cargo}
                onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                placeholder="Ex.: Vendedor Externo SP"
              />
            </div>
            <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
              O distribuidor é a chave de isolamento: vendedores só veem oportunidades, pacotes e
              arquivos do seu distribuidor. Admin, TSV e revisor veem tudo.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogoAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={salvarUsuario} disabled={salvando || !form.email || !form.name}>
              {salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Criar usuário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Dialog: enviar link de definição de senha por e-mail ---- */}
      <Dialog open={!!senhaDialogo} onOpenChange={(aberto) => !aberto && setSenhaDialogo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar link de senha</DialogTitle>
            <DialogDescription>
              {senhaEnviada
                ? 'Pronto! O e-mail foi enviado.'
                : `Enviaremos para ${senhaDialogo?.email || ''} um e-mail com um link seguro para o próprio usuário definir a senha. Nenhuma senha é exibida ou repassada manualmente.`}
            </DialogDescription>
          </DialogHeader>
          {!senhaEnviada && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setSenhaDialogo(null)}>
                Cancelar
              </Button>
              <Button
                disabled={enviandoSenha !== null}
                onClick={() => senhaDialogo && enviarLinkSenha(senhaDialogo)}
              >
                {enviandoSenha ? 'Enviando…' : 'Enviar e-mail'}
              </Button>
            </DialogFooter>
          )}
          {senhaEnviada && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setSenhaDialogo(null)}>
                Fechar
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
