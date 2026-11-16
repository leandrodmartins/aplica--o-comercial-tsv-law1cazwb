import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { oportunidadeService } from '@/services/oportunidades'
import { Oportunidade, OportunidadeEstado, PAPEIS_SEM_ISOLAMENTO, UserRole } from '@/types/tsv'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  PlusCircle,
  FileText,
  Clock,
  CheckCircle,
  Send,
  Building,
  User,
  AlertCircle,
  Calendar,
  Layers,
  ArrowUpRight,
  XCircle,
} from 'lucide-react'

export default function Painel() {
  // Gestor da operação (admin ou tsv): vê todos os leads e atalho de revisão.
  const { user, isAdmin } = useAuth()
  /** Papéis sem isolamento veem tudo; vendedor (e qualquer outro) filtra pelo seu distribuidor. */
  const semIsolamento = PAPEIS_SEM_ISOLAMENTO.includes(user?.role as UserRole)
  const distribuidorFiltro = semIsolamento ? undefined : user?.distribuidor
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')

  const carregarOportunidades = async () => {
    try {
      setLoading(true)
      // Se for vendedor, a regra PB ou o filtro traz apenas as suas
      const params: any = {}
      if (filtroEstado !== 'todos') {
        params.estado = filtroEstado as OportunidadeEstado
      }
      if (busca.trim()) {
        params.busca = busca.trim()
      }
      const data = await oportunidadeService.listar({ ...params, distribuidor: distribuidorFiltro })
      setOportunidades(data)
    } catch (err) {
      console.error('Erro ao carregar oportunidades:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarOportunidades()
  }, [filtroEstado])

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault()
    carregarOportunidades()
  }

  const getStatusBadge = (estado: OportunidadeEstado) => {
    switch (estado) {
      case 'novo_lead':
        return (
          <Badge className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-800 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" /> Novo Lead
          </Badge>
        )
      case 'em_preparacao':
        return (
          <Badge className="bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-800 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" /> Em Preparação
          </Badge>
        )
      case 'em_revisao':
        return (
          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-400" /> Em Revisão Técnica
          </Badge>
        )
      case 'aprovado':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-400" /> Aprovado TSV
          </Badge>
        )
      case 'enviado':
        return (
          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 flex items-center gap-1">
            <Send className="w-3 h-3 text-blue-400" /> Enviado ao Cliente
          </Badge>
        )
      case 'ganho':
        return (
          <Badge className="bg-emerald-600/10 text-emerald-300 border-emerald-600/20 hover:bg-emerald-600/20 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-300" /> Ganho
          </Badge>
        )
      case 'perdido':
        return (
          <Badge className="bg-red-900/30 text-red-300 border-red-800/40 hover:bg-red-900/40 flex items-center gap-1">
            <XCircle className="w-3 h-3 text-red-300" /> Perdido
          </Badge>
        )
      default:
        return null
    }
  }

  // Contadores
  const contadores = {
    total: oportunidades.length,
    emRevisao: oportunidades.filter((o) => o.estado === 'em_revisao').length,
    aprovados: oportunidades.filter((o) => o.estado === 'aprovado').length,
    enviados: oportunidades.filter((o) => o.estado === 'enviado').length,
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-800/40">
              {isAdmin
                ? 'Visão Geral TSV (Todos os Leads)'
                : `Visão do Distribuidor (${user?.distribuidor || 'Meus Leads'})`}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Painel de Oportunidades Brigade
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Acompanhe a geração de pacotes técnico-comerciais, responsável, estado e próxima ação.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            asChild
            className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 font-medium"
          >
            <Link to="/nova-oportunidade">
              <PlusCircle className="w-4 h-4 mr-2" /> Nova Oportunidade
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-400">Total no Piloto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{contadores.total}</div>
            <p className="text-[11px] text-slate-500 mt-1">Leads registrados</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-amber-400 flex items-center justify-between">
              Em Revisão Técnica
              <AlertCircle className="w-3.5 h-3.5" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">{contadores.emRevisao}</div>
            <p className="text-[11px] text-slate-500 mt-1">Aguardando crivo TSV</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-emerald-400 flex items-center justify-between">
              Aprovados TSV
              <CheckCircle className="w-3.5 h-3.5" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{contadores.aprovados}</div>
            <p className="text-[11px] text-slate-500 mt-1">Prontos para envio</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-blue-400 flex items-center justify-between">
              Enviados ao Lead
              <Send className="w-3.5 h-3.5" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{contadores.enviados}</div>
            <p className="text-[11px] text-slate-500 mt-1">Discovery em andamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-800/80">
        <form onSubmit={handleBuscar} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Buscar por empresa, contato ou aplicação..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 bg-slate-950/70 border-slate-800 text-white placeholder:text-slate-500 text-sm h-9"
          />
        </form>

        <div className="flex items-center gap-3">
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-[180px] bg-slate-950/70 border-slate-800 text-slate-200 text-xs h-9">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
              <SelectItem value="todos">Todos os estados</SelectItem>
              <SelectItem value="rascunho">Rascunho</SelectItem>
              <SelectItem value="em_revisao">Em Revisão</SelectItem>
              <SelectItem value="aprovado">Aprovado TSV</SelectItem>
              <SelectItem value="enviado">Enviado</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={carregarOportunidades}
            className="border-slate-800 bg-slate-950/40 text-slate-300 hover:text-white hover:bg-slate-800 h-9 text-xs"
          >
            Atualizar
          </Button>
        </div>
      </div>

      {/* Leads List */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Consultando oportunidades na base...</p>
        </div>
      ) : oportunidades.length === 0 ? (
        <Card className="bg-slate-900/30 border-dashed border-slate-800 py-12 text-center">
          <CardContent className="space-y-3">
            <Building className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-slate-300">
              Nenhuma oportunidade encontrada
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {busca || filtroEstado !== 'todos'
                ? 'Nenhum resultado corresponde aos filtros aplicados. Tente limpar a busca.'
                : 'Cadastre a primeira oportunidade colando a mensagem recebida do lead Brigade.'}
            </p>
            <Button asChild size="sm" className="mt-2 bg-blue-600 hover:bg-blue-500 text-white">
              <Link to="/nova-oportunidade">
                <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Criar Oportunidade
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {oportunidades.map((op) => (
            <Card
              key={op.id}
              className="bg-slate-900/60 border-slate-800 hover:border-slate-700/80 transition shadow-sm group"
            >
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Informações Centrais */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-bold text-white group-hover:text-blue-400 transition flex items-center gap-1.5">
                        {op.empresa}
                      </span>
                      {getStatusBadge(op.estado)}
                      {op.segmento && (
                        <Badge
                          variant="outline"
                          className="border-slate-700 text-slate-400 text-[10px] capitalize"
                        >
                          {op.segmento.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2">
                      <strong className="text-slate-400 font-medium">Aplicação:</strong>{' '}
                      {op.aplicacao}
                    </p>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <strong className="text-slate-300">{op.contato_nome}</strong>
                        {op.contato_cargo ? ` (${op.contato_cargo})` : ''}
                      </span>

                      <span className="flex items-center gap-1 text-slate-400">
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        Responsável:{' '}
                        <strong className="text-slate-300">
                          {op.expand?.responsavel?.name || 'Vendedor'}
                        </strong>
                        {op.distribuidora ? ` • ${op.distribuidora}` : ''}
                      </span>

                      <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                        <Calendar className="w-3 h-3" />
                        Criado em {new Date(op.created).toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    {/* Próxima Ação Destaque */}
                    <div className="mt-3 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-start gap-2">
                      <Layers className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-semibold text-amber-400">Próxima Ação:</span>{' '}
                        <span className="text-slate-300">{op.proxima_acao}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ações / Botões */}
                  <div className="flex flex-row lg:flex-col gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                    <Button
                      asChild
                      className="bg-blue-600/90 hover:bg-blue-500 text-white text-xs h-9 px-4 font-medium"
                    >
                      <Link to={`/pacote/${op.id}`}>
                        <FileText className="w-3.5 h-3.5 mr-1.5" />
                        Ver Pacote de Preparação
                      </Link>
                    </Button>

                    {isAdmin && op.estado === 'em_revisao' && (
                      <Button
                        asChild
                        variant="outline"
                        className="border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs h-9"
                      >
                        <Link to={`/revisao?oportunidade=${op.id}`}>
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                          Revisar e Aprovar
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
