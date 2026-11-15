import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { oportunidadeService } from '@/services/oportunidades'
import { pacoteService } from '@/services/pacotes'
import GerenciadorArquivos from '@/components/pacotes/GerenciadorArquivos'
import { montarPromptApresentacao } from '@/lib/promptApresentacao'
import { Oportunidade, PacotePreparacao } from '@/types/tsv'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  Sparkles,
  FileCheck2,
  Mail,
  Presentation,
  HelpCircle,
  AlertTriangle,
  BookOpen,
  ArrowLeft,
  RefreshCw,
  Send,
  Building,
  User,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Download,
  Upload,
} from 'lucide-react'

export default function PacoteDetalhes() {
  const { id } = useParams<{ id: string }>()
  const { user, isTSV } = useAuth()
  const navigate = useNavigate()

  const [oportunidade, setOportunidade] = useState<Oportunidade | null>(null)
  const [pacote, setPacote] = useState<PacotePreparacao | null>(null)
  const [loading, setLoading] = useState(true)
  const [gerando, setGerando] = useState(false)
  const [marcandoEnviado, setMarcandoEnviado] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [copiadoPrompt, setCopiadoPrompt] = useState(false)
  const [gerandoPptx, setGerandoPptx] = useState(false)
  /** Incrementa a cada geração — remonta o gestor de arquivos para o .pptx gerado aparecer. */
  const [versaoGerador, setVersaoGerador] = useState(0)

  const carregarDados = async () => {
    if (!id) return
    try {
      setLoading(true)
      const op = await oportunidadeService.obterPorId(id)
      setOportunidade(op)
      const pac = await pacoteService.obterPorOportunidade(id)
      setPacote(pac)
    } catch (err) {
      console.error('Erro ao carregar pacote:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [id])

  const handleGerarOuRegerar = async () => {
    if (!id) return
    try {
      setGerando(true)
      await pacoteService.gerarComIA(id)
      await carregarDados()
    } catch (err: any) {
      alert(err.message || 'Falha ao acionar a IA para geração do pacote')
    } finally {
      setGerando(false)
    }
  }

  const handleCopiarEmail = () => {
    if (!pacote?.minuta_email_corpo) return
    // Remove tags HTML para copiar texto limpo
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = pacote.minuta_email_corpo
    const textOnly = `${pacote.minuta_email_assunto ? `Assunto: ${pacote.minuta_email_assunto}\n\n` : ''}${tempDiv.textContent || tempDiv.innerText || ''}`
    navigator.clipboard.writeText(textOnly)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const handleGerarPptx = async () => {
    if (!pacote) return
    try {
      setGerandoPptx(true)
      // O hook server-side registra o arquivo gerado no gestor de arquivos do pacote;
      // incrementar versaoGerador remonta o gerenciador para ele aparecer na lista.
      setVersaoGerador((v) => v + 1)
      const { blob, filename } = await pacoteService.baixarPptx(pacote.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err.message || 'Falha ao baixar a apresentação PowerPoint')
    } finally {
      setGerandoPptx(false)
    }
  }

  const promptApresentacao =
    oportunidade && pacote ? montarPromptApresentacao(oportunidade, pacote) : ''

  const handleCopiarPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptApresentacao)
      setCopiadoPrompt(true)
      setTimeout(() => setCopiadoPrompt(false), 2000)
    } catch (err: any) {
      console.error('Erro ao copiar o prompt:', err)
      alert('Não foi possível copiar o prompt. Selecione o texto manualmente.')
    }
  }

  const handleMarcarEnviado = async () => {
    if (!pacote) return
    try {
      setMarcandoEnviado(true)
      await pacoteService.revisarPacote({
        pacote_id: pacote.id,
        acao: 'marcar_enviado',
      })
      await carregarDados()
    } catch (err: any) {
      alert(err.message || 'Falha ao registrar envio')
    } finally {
      setMarcandoEnviado(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs">Carregando pacote e referências técnicas Brigade...</p>
      </div>
    )
  }

  if (!oportunidade) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-slate-400">Oportunidade não encontrada.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/">Voltar ao Painel</Link>
        </Button>
      </div>
    )
  }

  const status = pacote?.status_revisao || 'rascunho'

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-900"
          >
            <Link to="/">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Oportunidade</span>
              <span className="text-xs text-slate-600">•</span>
              <span className="text-xs font-semibold text-blue-400">{oportunidade.empresa}</span>
              {pacote && (
                <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-300">
                  v{pacote.versao}
                </Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Pacote de Preparação Técnico-Comercial
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGerarOuRegerar}
            disabled={gerando}
            className="border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${gerando ? 'animate-spin' : ''}`} />
            {pacote ? 'Regerar com IA' : 'Gerar com IA'}
          </Button>

          {isTSV && (
            <Button
              asChild
              size="sm"
              className="bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-md shadow-amber-600/20"
            >
              <Link to={`/revisao?oportunidade=${oportunidade.id}`}>
                <FileCheck2 className="w-3.5 h-3.5 mr-1.5" />
                Painel de Revisão Técnica TSV
              </Link>
            </Button>
          )}

          {status === 'aprovado' && (
            <Button
              size="sm"
              onClick={handleMarcarEnviado}
              disabled={marcandoEnviado}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Marcar como Enviado ao Lead
            </Button>
          )}
        </div>
      </div>

      {/* Meta Bar: Responsável, Estado e Próxima Ação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            Responsável
          </span>
          <p className="text-xs font-semibold text-white flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-400" />
            {oportunidade.expand?.responsavel?.name || 'Vendedor'}
            <span className="text-slate-400 font-normal">
              ({oportunidade.distribuidora || 'Distribuidor'})
            </span>
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            Estado do Pacote
          </span>
          <div className="flex items-center gap-2">
            {status === 'rascunho' && (
              <Badge className="bg-slate-800 text-slate-300 border-slate-700">Rascunho</Badge>
            )}
            {status === 'em_revisao' && (
              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                Aguardando Revisão Técnica TSV
              </Badge>
            )}
            {status === 'aprovado' && (
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                Aprovado para Envio
              </Badge>
            )}
            {status === 'enviado' && (
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                Enviado ao Cliente
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">
            Próxima Ação
          </span>
          <p
            className="text-xs text-amber-300 font-medium truncate"
            title={oportunidade.proxima_acao}
          >
            {oportunidade.proxima_acao}
          </p>
        </div>
      </div>

      {/* Aviso de Governança / Aprovação Humana Obrigatória */}
      <Alert className="bg-slate-900/80 border-amber-500/30 text-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <AlertDescription className="text-xs leading-relaxed">
          <strong>Aprovação Humana Obrigatória:</strong> As orientações e minutas geradas pela IA
          devem ser conferidas e validadas por um revisor técnico designado da TSV antes de qualquer
          envio externo ao cliente.
        </AlertDescription>
      </Alert>

      {/* Se ainda não tiver pacote gerado */}
      {!pacote ? (
        <Card className="bg-slate-900/40 border-dashed border-slate-800 py-12 text-center">
          <CardContent className="space-y-4">
            <Sparkles className="w-12 h-12 text-amber-400 mx-auto" />
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-semibold text-white">Nenhum pacote gerado ainda</h3>
              <p className="text-xs text-slate-400">
                Clique abaixo para que o Agente Nativo Brigade analise a mensagem do lead e elabore
                o briefing completo, perguntas e minuta com base no acervo técnico.
              </p>
            </div>
            <Button
              onClick={handleGerarOuRegerar}
              disabled={gerando}
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium"
            >
              <Sparkles className="w-4 h-4 mr-2 text-amber-300" />
              {gerando ? 'Consultando Acervo e Gerando...' : 'Gerar Pacote com IA Brigade'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Tabs com o Pacote Completo */
        <Tabs defaultValue="briefing" className="space-y-4">
          <TabsList className="bg-slate-900 border border-slate-800 p-1 flex-wrap h-auto">
            <TabsTrigger
              value="briefing"
              className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <BookOpen className="w-3.5 h-3.5 mr-1.5" /> Briefing de Discovery
            </TabsTrigger>

            <TabsTrigger
              value="perguntas"
              className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <HelpCircle className="w-3.5 h-3.5 mr-1.5" /> Perguntas Priorizadas
            </TabsTrigger>

            <TabsTrigger
              value="minuta"
              className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Mail className="w-3.5 h-3.5 mr-1.5" /> Minuta de E-mail
            </TabsTrigger>

            <TabsTrigger
              value="apresentacao"
              className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Presentation className="w-3.5 h-3.5 mr-1.5" /> Apresentação Padronizada
            </TabsTrigger>

            <TabsTrigger
              value="referencias"
              className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <FileCheck2 className="w-3.5 h-3.5 mr-1.5" /> Referências Brigade & Pendências
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: BRIEFING DE DISCOVERY */}
          <TabsContent value="briefing" className="space-y-4">
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader>
                <CardTitle className="text-base text-white flex items-center justify-between">
                  <span>Contexto Operacional e Hipóteses do Lead</span>
                  <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                    Aplicação: {oportunidade.aplicacao}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Fundamentação estruturada para a reunião de discovery com o cliente.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 text-sm">
                {/* Contexto */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                    1. Contexto & Fatos Identificados
                  </h4>
                  <div
                    className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 text-slate-300 leading-relaxed text-xs space-y-2"
                    dangerouslySetInnerHTML={{
                      __html: pacote.briefing_contexto || '<p>Sem contexto informado.</p>',
                    }}
                  />
                </div>

                {/* Hipóteses */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                    2. Hipóteses Técnicas Brigade
                  </h4>
                  <div
                    className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 text-slate-300 leading-relaxed text-xs space-y-2"
                    dangerouslySetInnerHTML={{
                      __html: pacote.briefing_hipoteses || '<p>Sem hipóteses informadas.</p>',
                    }}
                  />
                </div>

                {/* Riscos */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-red-400">
                    3. Riscos Operacionais & O que Investigar
                  </h4>
                  <div
                    className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/80 text-slate-300 leading-relaxed text-xs space-y-2"
                    dangerouslySetInnerHTML={{
                      __html: pacote.briefing_riscos || '<p>Sem riscos sinalizados.</p>',
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: PERGUNTAS PRIORIZADAS */}
          <TabsContent value="perguntas" className="space-y-4">
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader>
                <CardTitle className="text-base text-white">
                  Perguntas Objetivas de Discovery
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Perguntas priorizadas para o vendedor conduzir durante o primeiro contato ou
                  visita técnica.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pacote.perguntas_priorizadas && pacote.perguntas_priorizadas.length > 0 ? (
                  pacote.perguntas_priorizadas.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-start gap-3"
                    >
                      <span className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {p.ordem || idx + 1}
                      </span>
                      <div className="space-y-1 flex-1">
                        <p className="text-xs font-medium text-slate-200">{p.pergunta}</p>
                        {p.categoria && (
                          <span className="inline-block text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                            {p.categoria}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">Nenhuma pergunta formulada no pacote.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: MINUTA DE E-MAIL */}
          <TabsContent value="minuta" className="space-y-4">
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base text-white">Minuta de E-mail Comercial</CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Primeira resposta pronta com fundamentação e convite para discovery.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopiarEmail}
                  className="border-slate-800 text-xs bg-slate-950 text-slate-300 hover:text-white"
                >
                  {copiado ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1.5" /> Copiar Texto
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/90 text-xs space-y-1">
                  <span className="text-slate-500 font-medium">Assunto:</span>
                  <p className="text-white font-medium">
                    {pacote.minuta_email_assunto || 'Sem assunto'}
                  </p>
                </div>

                <div
                  className="p-5 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-200 text-xs leading-relaxed space-y-3 font-mono"
                  dangerouslySetInnerHTML={{
                    __html: pacote.minuta_email_corpo || '<p>Sem corpo de e-mail.</p>',
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: GESTOR DE ARQUIVOS DA APRESENTAÇÃO */}
          <TabsContent value="apresentacao" className="space-y-4">
            {/* Prompt pronto para colar em chat de IA externo */}
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <Presentation className="w-4 h-4 text-amber-400" />
                    Prompt da Apresentação — copie e cole em qualquer chat de IA
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Prompt montado com o contexto completo do pacote (lead, aplicação, briefing,
                    perguntas e referências Brigade). Cole no ChatGPT, Gemini ou Claude para gerar
                    os slides — ou use o botão "Gerar .pptx" do gestor abaixo.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopiarPrompt}
                  className="border-slate-800 text-xs bg-slate-950 text-slate-300 hover:text-white shrink-0"
                >
                  {copiadoPrompt ? (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 mr-1.5" /> Copiar prompt
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <textarea
                  readOnly
                  value={promptApresentacao}
                  rows={10}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/70 p-3 font-mono text-[11px] leading-relaxed text-slate-300 resize-y focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                />
              </CardContent>
            </Card>

            <GerenciadorArquivos
              pacoteId={pacote.id}
              onGerarPptx={handleGerarPptx}
              gerandoPptx={gerandoPptx}
              versaoArquivos={versaoGerador}
            />
            {pacote.apresentacao_slides && pacote.apresentacao_slides.length > 0 && (
              <Card className="bg-slate-900/60 border-slate-800"></Card>
            )}
          </TabsContent>

          {/* TAB 5: REFERÊNCIAS BRIGADE E PENDÊNCIAS */}
          <TabsContent value="referencias" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Referências ao Acervo */}
              <Card className="bg-slate-900/60 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-sm text-white flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    Documentos Oficiais Brigade Citados
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Materiais do acervo técnico que sustentam as recomendações.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pacote.referencias_brigade && pacote.referencias_brigade.length > 0 ? (
                    pacote.referencias_brigade.map((ref, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="text-slate-200 font-medium">{ref.titulo}</p>
                          {ref.codigo && (
                            <span className="text-[10px] text-amber-400 font-mono">
                              {ref.codigo}
                            </span>
                          )}
                        </div>
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400"
                        >
                          <Link to="/acervo" title="Ver no acervo">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">Nenhuma referência catalogada.</p>
                  )}
                </CardContent>
              </Card>

              {/* Pontos Pendentes de Revisão */}
              <Card className="bg-slate-900/60 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-sm text-white flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Pontos Pendentes de Revisão Técnica
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Itens que o revisor da TSV deve checar antes da liberação.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pacote.pontos_pendentes && pacote.pontos_pendentes.length > 0 ? (
                    pacote.pontos_pendentes.map((pt, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start gap-2 text-xs"
                      >
                        {pt.resolvido ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        )}
                        <p
                          className={`text-xs ${pt.resolvido ? 'line-through text-slate-500' : 'text-slate-300'}`}
                        >
                          {pt.pendencia}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">Nenhum ponto pendente sinalizado.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
