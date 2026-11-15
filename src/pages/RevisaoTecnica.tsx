import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { oportunidadeService } from '@/services/oportunidades'
import { pacoteService } from '@/services/pacotes'
import { Oportunidade, PacotePreparacao, PontoPendente } from '@/types/tsv'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import {
  FileCheck2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building,
  User,
  Save,
  ArrowRight,
  ShieldCheck,
  Send,
  Calendar,
} from 'lucide-react'

export default function RevisaoTecnica() {
  const { user, isTSV } = useAuth()
  const [searchParams] = useSearchParams()
  const oportunidadeParam = searchParams.get('oportunidade')

  const [oportunidadesEmRevisao, setOportunidadesEmRevisao] = useState<Oportunidade[]>([])
  const [oportunidadeSelecionada, setOportunidadeSelecionada] = useState<Oportunidade | null>(null)
  const [pacote, setPacote] = useState<PacotePreparacao | null>(null)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Estados editáveis do pacote
  const [pontosPendentes, setPontosPendentes] = useState<PontoPendente[]>([])
  const [minutaEmailAssunto, setMinutaEmailAssunto] = useState('')
  const [minutaEmailCorpo, setMinutaEmailCorpo] = useState('')
  const [notasRevisor, setNotasRevisor] = useState('')

  const carregarOportunidadesRevisao = async () => {
    try {
      setLoading(true)
      // Lista oportunidades em estado 'em_revisao' ou todas se for TSV
      const ops = await oportunidadeService.listar()
      const pendentes = ops.filter(
        (o) => o.estado === 'em_revisao' || o.estado === 'rascunho' || o.id === oportunidadeParam,
      )
      setOportunidadesEmRevisao(pendentes.length > 0 ? pendentes : ops)

      // Seleciona uma oportunidade inicial
      let selecionada =
        pendentes.find((o) => o.id === oportunidadeParam) || pendentes[0] || ops[0] || null
      if (selecionada) {
        setOportunidadeSelecionada(selecionada)
        await carregarPacote(selecionada.id)
      }
    } catch (e) {
      console.error('Erro ao listar para revisão:', e)
    } finally {
      setLoading(false)
    }
  }

  const carregarPacote = async (opId: string) => {
    try {
      const pac = await pacoteService.obterPorOportunidade(opId)
      setPacote(pac)
      if (pac) {
        setPontosPendentes(pac.pontos_pendentes || [])
        setMinutaEmailAssunto(pac.minuta_email_assunto || '')
        setMinutaEmailCorpo(pac.minuta_email_corpo || '')
        setNotasRevisor(pac.notas_revisor || '')
      } else {
        setPontosPendentes([])
        setMinutaEmailAssunto('')
        setMinutaEmailCorpo('')
        setNotasRevisor('')
      }
    } catch (e) {
      console.error('Erro ao obter pacote:', e)
    }
  }

  useEffect(() => {
    carregarOportunidadesRevisao()
  }, [oportunidadeParam])

  const handleSelecionarOp = async (op: Oportunidade) => {
    setOportunidadeSelecionada(op)
    setSucessoMsg(null)
    setErrorMsg(null)
    await carregarPacote(op.id)
  }

  const togglePendente = (index: number) => {
    const novos = [...pontosPendentes]
    novos[index].resolvido = !novos[index].resolvido
    setPontosPendentes(novos)
  }

  const handleSalvarEdicoes = async () => {
    if (!pacote) return
    try {
      setSalvando(true)
      setErrorMsg(null)
      await pacoteService.revisarPacote({
        pacote_id: pacote.id,
        acao: 'salvar_edicao',
        pontos_pendentes: pontosPendentes,
        minuta_email_assunto: minutaEmailAssunto,
        minuta_email_corpo: minutaEmailCorpo,
        notas_revisor: notasRevisor,
      })
      setSucessoMsg('Alterações salvas no pacote com sucesso!')
      await carregarPacote(pacote.oportunidade)
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao salvar edição')
    } finally {
      setSalvando(false)
    }
  }

  const handleAprovar = async () => {
    if (!pacote) return
    if (!isTSV) {
      setErrorMsg('Apenas revisores da TSV possuem autorização para aprovação técnica.')
      return
    }

    // Conferir se há pendências não resolvidas e avisar
    const naoResolvidas = pontosPendentes.filter((p) => !p.resolvido).length
    if (naoResolvidas > 0) {
      const confirmacao = window.confirm(
        `Atenção: ainda existem ${naoResolvidas} ponto(s) pendente(s) não marcados como resolvidos. Deseja aprovar mesmo assim?`,
      )
      if (!confirmacao) return
    }

    try {
      setSalvando(true)
      setErrorMsg(null)
      await pacoteService.revisarPacote({
        pacote_id: pacote.id,
        acao: 'aprovar',
        pontos_pendentes: pontosPendentes,
        minuta_email_assunto: minutaEmailAssunto,
        minuta_email_corpo: minutaEmailCorpo,
        notas_revisor: notasRevisor || 'Pacote conferido e aprovado tecnicamente pela TSV Grupo.',
      })
      setSucessoMsg(
        'Pacote aprovado com sucesso! A oportunidade foi atualizada para "Aprovado TSV".',
      )
      await carregarOportunidadesRevisao()
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao aprovar pacote')
    } finally {
      setSalvando(false)
    }
  }

  const handleRejeitar = async () => {
    if (!pacote) return
    if (!isTSV) {
      setErrorMsg('Apenas revisores da TSV possuem autorização técnica.')
      return
    }
    const motivo = prompt('Informe os pontos a serem corrigidos pelo vendedor ou IA:')
    if (!motivo) return

    try {
      setSalvando(true)
      await pacoteService.revisarPacote({
        pacote_id: pacote.id,
        acao: 'rejeitar',
        notas_revisor: motivo,
      })
      setSucessoMsg('Pacote devolvido para ajustes.')
      await carregarOportunidadesRevisao()
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao rejeitar')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs font-semibold">
              Fluxo Obrigatório de Qualidade
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-amber-400" /> Revisão Técnica e Aprovação TSV
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Conferência dos pontos pendentes, calibração da minuta e liberação formal de materiais
            antes do envio ao cliente.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isTSV && (
            <Badge variant="outline" className="border-amber-500/30 text-amber-300 text-xs p-2">
              Modo Visualizador: Apenas a TSV pode emitir aprovação final
            </Badge>
          )}
        </div>
      </div>

      {sucessoMsg && (
        <Alert className="bg-emerald-950/60 border-emerald-800 text-emerald-200">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <AlertDescription className="text-xs">{sucessoMsg}</AlertDescription>
        </Alert>
      )}

      {errorMsg && (
        <Alert variant="destructive" className="bg-red-950/60 border-red-800 text-red-200">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
        </Alert>
      )}

      {/* Grid: Lista de Oportunidades à esquerda + Painel de Revisão à direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna 1: Oportunidades pendentes (4 colunas) */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Fila de Oportunidades ({oportunidadesEmRevisao.length})
          </h3>

          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {oportunidadesEmRevisao.map((op) => {
              const isSelected = oportunidadeSelecionada?.id === op.id
              return (
                <div
                  key={op.id}
                  onClick={() => handleSelecionarOp(op)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition text-left space-y-2 ${
                    isSelected
                      ? 'bg-slate-900 border-blue-500/60 shadow-md ring-1 ring-blue-500/30'
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white truncate max-w-[180px]">
                      {op.empresa}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${
                        op.estado === 'em_revisao'
                          ? 'border-amber-500/40 text-amber-400'
                          : op.estado === 'aprovado'
                            ? 'border-emerald-500/40 text-emerald-400'
                            : 'border-slate-700 text-slate-400'
                      }`}
                    >
                      {op.estado.replace('_', ' ')}
                    </Badge>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-1">{op.aplicacao}</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" /> {op.expand?.responsavel?.name || 'Vendedor'}
                    </span>
                    <span>{new Date(op.created).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Coluna 2: Formulário e Painel de Aprovação (8 colunas) */}
        <div className="lg:col-span-8 space-y-6">
          {oportunidadeSelecionada && (
            <Card className="bg-slate-900/60 border-slate-800 text-slate-100">
              <CardHeader className="border-b border-slate-800/80 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      {oportunidadeSelecionada.empresa}
                      {pacote?.status_revisao === 'aprovado' && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                          Aprovado TSV
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400 mt-0.5">
                      Contato: {oportunidadeSelecionada.contato_nome} • Aplicação:{' '}
                      {oportunidadeSelecionada.aplicacao}
                    </CardDescription>
                  </div>

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-xs text-slate-300 hover:text-white"
                  >
                    <Link to={`/pacote/${oportunidadeSelecionada.id}`}>
                      Ver Pacote Integral <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* 1. Checklist de Pontos Pendentes */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Checklist de Validação Técnica
                    </Label>
                    <span className="text-[11px] text-slate-400">
                      Marque os itens conferidos com o catálogo Brigade
                    </span>
                  </div>

                  {pontosPendentes.length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                      Nenhum ponto pendente cadastrado para este pacote.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {pontosPendentes.map((pt, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border flex items-start gap-3 transition ${
                            pt.resolvido
                              ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                              : 'bg-slate-950/70 border-slate-800 text-slate-200'
                          }`}
                        >
                          <Checkbox
                            id={`pt-${idx}`}
                            checked={pt.resolvido}
                            onCheckedChange={() => togglePendente(idx)}
                            className="mt-0.5 border-slate-700 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                          />
                          <label
                            htmlFor={`pt-${idx}`}
                            className={`text-xs cursor-pointer flex-1 leading-relaxed ${
                              pt.resolvido ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {pt.pendencia}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Ajuste Fino da Minuta de E-mail */}
                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase tracking-wider text-blue-400">
                    Ajuste da Minuta de E-mail para o Lead
                  </Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Assunto do E-mail..."
                      value={minutaEmailAssunto}
                      onChange={(e) => setMinutaEmailAssunto(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-xs text-white"
                    />
                    <Textarea
                      rows={5}
                      placeholder="Corpo do e-mail..."
                      value={minutaEmailCorpo}
                      onChange={(e) => setMinutaEmailCorpo(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-xs text-white font-mono leading-relaxed"
                    />
                  </div>
                </div>

                {/* 3. Parecer do Revisor */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Notas e Parecer da Revisão Técnica TSV
                  </Label>
                  <Textarea
                    rows={3}
                    placeholder="Registre observações técnicas para o distribuidor (ex: confirmar se há suporte para câmera 360 no para-choque dianteiro)..."
                    value={notasRevisor}
                    onChange={(e) => setNotasRevisor(e.target.value)}
                    className="bg-slate-950 border-slate-800 text-xs text-white"
                  />
                </div>
              </CardContent>

              <CardFooter className="border-t border-slate-800/80 p-4 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSalvarEdicoes}
                  disabled={salvando}
                  className="border-slate-800 text-slate-300 hover:text-white text-xs"
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" /> Salvar Edições
                </Button>

                {isTSV ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRejeitar}
                      disabled={salvando}
                      className="bg-red-900/60 hover:bg-red-800 text-white text-xs"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1.5" /> Devolver para Ajuste
                    </Button>

                    <Button
                      size="sm"
                      onClick={handleAprovar}
                      disabled={salvando}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-md shadow-emerald-600/20"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Aprovar Pacote Tecnico
                    </Button>
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-400">
                    * Pacote em análise pela equipe técnica TSV Grupo.
                  </p>
                )}
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
