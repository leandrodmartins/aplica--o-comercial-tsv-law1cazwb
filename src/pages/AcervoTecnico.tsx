import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { acervoService } from '@/services/acervo'
import { AcervoCategoria, AcervoTecnicoItem, LinhaProdutoBrigade } from '@/types/tsv'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  FolderArchive,
  Search,
  UploadCloud,
  FileText,
  Download,
  BookOpen,
  CheckCircle2,
  Filter,
  Trash2,
  Eye,
  File,
} from 'lucide-react'

export default function AcervoTecnico() {
  const { isTSV } = useAuth()
  const [itens, setItens] = useState<AcervoTecnicoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos')
  const [filtroLinha, setFiltroLinha] = useState<string>('todos')

  // Modal de Upload / Cadastro
  const [modalOpen, setModalOpen] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [codigo, setCodigo] = useState('')
  const [categoria, setCategoria] = useState<AcervoCategoria>('catalogo')
  const [linhaProduto, setLinhaProduto] = useState<LinhaProdutoBrigade>('geral_portfolio')
  const [resumo, setResumo] = useState('')
  const [conteudoTexto, setConteudoTexto] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [salvando, setSalvando] = useState(false)

  // Modal de Leitura / Pré-visualização
  const [itemVisualizar, setItemVisualizar] = useState<AcervoTecnicoItem | null>(null)

  const carregarAcervo = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (filtroCategoria !== 'todos') params.categoria = filtroCategoria as AcervoCategoria
      if (filtroLinha !== 'todos') params.linha_produto = filtroLinha as LinhaProdutoBrigade
      if (busca.trim()) params.busca = busca.trim()

      const data = await acervoService.listar(params)
      setItens(data)
    } catch (e) {
      console.error('Erro ao carregar acervo técnico:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarAcervo()
  }, [filtroCategoria, filtroLinha])

  const handleSalvarDocumento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim()) return

    try {
      setSalvando(true)
      await acervoService.criar({
        titulo: titulo.trim(),
        codigo: codigo.trim() || undefined,
        categoria,
        linha_produto: linhaProduto,
        resumo: resumo.trim() || undefined,
        conteudo_texto: conteudoTexto.trim() || undefined,
        arquivo: arquivo || undefined,
      })

      setModalOpen(false)
      setTitulo('')
      setCodigo('')
      setResumo('')
      setConteudoTexto('')
      setArquivo(null)
      await carregarAcervo()
    } catch (err: any) {
      alert(err.message || 'Falha ao salvar documento no acervo')
    } finally {
      setSalvando(false)
    }
  }

  const handleExcluir = async (id: string) => {
    if (!confirm('Deseja realmente remover este documento do acervo técnico?')) return
    try {
      await acervoService.excluir(id)
      await carregarAcervo()
    } catch (err: any) {
      alert(err.message || 'Falha ao excluir')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900/40">
              Base de Conhecimento RAG & Consulta
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FolderArchive className="w-6 h-6 text-blue-400" /> Acervo Técnico Brigade
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Catálogos, fichas e manuais oficiais Brigade que sustentam as respostas do assistente
            comercial.
          </p>
        </div>

        {isTSV && (
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs">
                <UploadCloud className="w-4 h-4 mr-2" /> Enviar Novo Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-lg">
              <form onSubmit={handleSalvarDocumento}>
                <DialogHeader>
                  <DialogTitle className="text-white">Adicionar ao Acervo Técnico</DialogTitle>
                  <DialogDescription className="text-slate-400 text-xs">
                    Materiais adicionados ficam imediatamente disponíveis para a IA Brigade citar em
                    propostas e briefings.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 text-xs">
                  <div className="space-y-1.5">
                    <Label htmlFor="docTitulo" className="text-slate-300">
                      Título do Documento *
                    </Label>
                    <Input
                      id="docTitulo"
                      placeholder="Ex: Ficha Técnica Radar Predict BSIS 2024"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="docCodigo" className="text-slate-300">
                        Código / Referência
                      </Label>
                      <Input
                        id="docCodigo"
                        placeholder="Ex: FT-RADAR-2024"
                        value={codigo}
                        onChange={(e) => setCodigo(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-slate-300">Categoria</Label>
                      <Select
                        value={categoria}
                        onValueChange={(val) => setCategoria(val as AcervoCategoria)}
                      >
                        <SelectTrigger className="bg-slate-950 border-slate-800 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                          <SelectItem value="catalogo">Catálogo Comercial</SelectItem>
                          <SelectItem value="ficha_tecnica">Ficha Técnica</SelectItem>
                          <SelectItem value="apresentacao">Apresentação</SelectItem>
                          <SelectItem value="manual">Manual de Instalação</SelectItem>
                          <SelectItem value="guia_aplicacao">Guia de Aplicação</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Linha de Solução Brigade</Label>
                    <Select
                      value={linhaProduto}
                      onValueChange={(val) => setLinhaProduto(val as LinhaProdutoBrigade)}
                    >
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                        <SelectItem value="geral_portfolio">Portfólio Geral Brigade</SelectItem>
                        <SelectItem value="cameras_360_backeye">
                          Backeye®360 (Câmeras Panorâmicas)
                        </SelectItem>
                        <SelectItem value="radar_bsis">Radares Ativos BSIS & Predict</SelectItem>
                        <SelectItem value="alarmes_bbs_som_branco">
                          bbs-tek® (Alarmes de Som Branco)
                        </SelectItem>
                        <SelectItem value="sensores_ultrassonicos">
                          Sensores Ultrassônicos
                        </SelectItem>
                        <SelectItem value="mdvr_gravadores">Gravadores Digitais MDVR</SelectItem>
                        <SelectItem value="ia_deteccao_pedestres">
                          IA Detecção Ativa de Pedestres
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="docResumo" className="text-slate-300">
                      Resumo Executivo para a IA
                    </Label>
                    <Textarea
                      id="docResumo"
                      rows={2}
                      placeholder="Breve descrição dos benefícios e especificações chave..."
                      value={resumo}
                      onChange={(e) => setResumo(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="docConteudo" className="text-slate-300">
                      Conteúdo Textual / Notas Técnicas
                    </Label>
                    <Textarea
                      id="docConteudo"
                      rows={4}
                      placeholder="Cole especificações, normas atendidas (IP69K, UNECE R151) e diretrizes..."
                      value={conteudoTexto}
                      onChange={(e) => setConteudoTexto(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Arquivo Anexo (PDF, DOCX, PPTX)</Label>
                    <Input
                      type="file"
                      onChange={(e) => setArquivo(e.target.files?.[0] || null)}
                      className="bg-slate-950 border-slate-800 text-xs text-slate-400 file:bg-slate-800 file:text-slate-200 file:border-0 file:rounded file:px-2 file:py-1 file:mr-2 file:text-xs"
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
                    {salvando ? 'Salvando...' : 'Adicionar ao Acervo'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Buscar por título, código ou palavra-chave..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 bg-slate-950/70 border-slate-800 text-white text-xs h-9"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger className="w-[150px] bg-slate-950/70 border-slate-800 text-slate-200 text-xs h-9">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
              <SelectItem value="todos">Todas Categorias</SelectItem>
              <SelectItem value="catalogo">Catálogo</SelectItem>
              <SelectItem value="ficha_tecnica">Ficha Técnica</SelectItem>
              <SelectItem value="apresentacao">Apresentação</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="guia_aplicacao">Guia de Aplicação</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={carregarAcervo}
            className="border-slate-800 text-xs bg-slate-950/40 text-slate-300 hover:text-white h-9"
          >
            Filtrar
          </Button>
        </div>
      </div>

      {/* Grid de Documentos */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Carregando acervo técnico...</p>
        </div>
      ) : itens.length === 0 ? (
        <Card className="bg-slate-900/40 border-dashed border-slate-800 py-12 text-center">
          <CardContent className="space-y-3">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-white">Nenhum documento encontrado</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Envie catálogos, fichas e manuais para enriquecer a base técnica da IA Brigade.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {itens.map((doc) => (
            <Card
              key={doc.id}
              className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase border-blue-500/30 text-blue-400 font-semibold"
                  >
                    {doc.categoria.replace('_', ' ')}
                  </Badge>
                  {doc.codigo && (
                    <span className="text-[10px] text-amber-400 font-mono font-medium px-1.5 py-0.5 rounded bg-amber-500/10">
                      {doc.codigo}
                    </span>
                  )}
                </div>
                <CardTitle className="text-sm text-white line-clamp-2 mt-2 leading-tight">
                  {doc.titulo}
                </CardTitle>
                <CardDescription className="text-xs text-slate-400 line-clamp-2 mt-1">
                  {doc.resumo || 'Sem resumo cadastrado.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0 pb-4">
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                  <span className="capitalize">{doc.linha_produto.replace(/_/g, ' ')}</span>
                  <span>{new Date(doc.created).toLocaleDateString('pt-BR')}</span>
                </div>
              </CardContent>

              <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setItemVisualizar(doc)}
                  className="text-xs text-slate-300 hover:text-white h-8"
                >
                  <Eye className="w-3.5 h-3.5 mr-1 text-blue-400" /> Detalhes & Conteúdo
                </Button>

                <div className="flex items-center gap-1">
                  {doc.arquivo ? (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="border-slate-800 text-xs text-slate-300 hover:text-white h-8"
                    >
                      <a href={doc.arquivo} target="_blank" rel="noreferrer" download>
                        <Download className="w-3.5 h-3.5 mr-1" /> Arquivo
                      </a>
                    </Button>
                  ) : null}

                  {isTSV && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleExcluir(doc.id)}
                      className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-950/20"
                      title="Excluir do acervo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Pré-visualização do Documento */}
      {itemVisualizar && (
        <Dialog open={!!itemVisualizar} onOpenChange={() => setItemVisualizar(null)}>
          <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-[10px] border-blue-500/30 text-blue-400 uppercase"
                >
                  {itemVisualizar.categoria}
                </Badge>
                {itemVisualizar.codigo && (
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    {itemVisualizar.codigo}
                  </span>
                )}
              </div>
              <DialogTitle className="text-lg text-white mt-1">{itemVisualizar.titulo}</DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Linha: {itemVisualizar.linha_produto.replace(/_/g, ' ')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              {itemVisualizar.resumo && (
                <div className="space-y-1">
                  <Label className="text-slate-400 font-semibold uppercase text-[10px]">
                    Resumo
                  </Label>
                  <p className="text-slate-200 p-3 rounded-lg bg-slate-950 border border-slate-800 leading-relaxed">
                    {itemVisualizar.resumo}
                  </p>
                </div>
              )}

              {itemVisualizar.conteudo_texto && (
                <div className="space-y-1">
                  <Label className="text-slate-400 font-semibold uppercase text-[10px]">
                    Especificações Técnicas e Diretrizes
                  </Label>
                  <pre className="text-slate-300 p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                    {itemVisualizar.conteudo_texto}
                  </pre>
                </div>
              )}

              {itemVisualizar.arquivo && (
                <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <File className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-slate-200">Arquivo original anexado</span>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-8"
                  >
                    <a href={itemVisualizar.arquivo} target="_blank" rel="noreferrer" download>
                      <Download className="w-3.5 h-3.5 mr-1" /> Baixar Anexo
                    </a>
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setItemVisualizar(null)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
