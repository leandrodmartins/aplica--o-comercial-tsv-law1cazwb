import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { acervoService } from '@/services/acervo'
import { iaService } from '@/services/ia'
import { AcervoCategoria, AcervoTecnicoItem, LinhaProdutoBrigade } from '@/types/tsv'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import FormularioAcervo, { FormAcervo } from '@/components/acervo/FormularioAcervo'
import {
  BookOpen,
  Download,
  Eye,
  FileText,
  FolderArchive,
  Loader2,
  Search,
  Trash2,
  UploadCloud,
} from 'lucide-react'

const FORM_INICIAL: FormAcervo = {
  titulo: '',
  codigo: '',
  categoria: 'catalogo',
  linha_produto: 'geral_portfolio',
  resumo: '',
  conteudo_texto: '',
}

const CATEGORIA_LABEL: Record<AcervoCategoria, string> = {
  catalogo: 'Catálogo',
  ficha_tecnica: 'Ficha Técnica',
  apresentacao: 'Apresentação',
  manual: 'Manual',
  guia_aplicacao: 'Guia de Aplicação',
}

export default function AcervoTecnico() {
  const { isTSV } = useAuth()
  const [itens, setItens] = useState<AcervoTecnicoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos')
  const [filtroLinha, setFiltroLinha] = useState<string>('todos')

  // Modal de upload / cadastro
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FormAcervo>(FORM_INICIAL)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [analisando, setAnalisando] = useState(false)
  const [erroAnalise, setErroAnalise] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  // Modal de leitura / pré-visualização
  const [itemVisualizar, setItemVisualizar] = useState<AcervoTecnicoItem | null>(null)

  const carregarAcervo = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (filtroCategoria !== 'todos') params.categoria = filtroCategoria
      if (filtroLinha !== 'todos') params.linha_produto = filtroLinha
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroCategoria, filtroLinha])

  const itensFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return itens
    return itens.filter(
      (i) =>
        i.titulo.toLowerCase().includes(q) ||
        (i.codigo || '').toLowerCase().includes(q) ||
        (i.resumo || '').toLowerCase().includes(q),
    )
  }, [itens, busca])

  /** Passo 2: envia o arquivo ao hook analisar-documento e pré-preenche o formulário. */
  const handleAnalisar = async () => {
    if (!arquivo) return
    try {
      setAnalisando(true)
      setErroAnalise(null)
      const analise = await iaService.analisarDocumento(arquivo)
      setForm((f) => ({
        ...f,
        titulo: analise.titulo || f.titulo,
        codigo: analise.codigo || f.codigo,
        resumo: analise.resumo || f.resumo,
        conteudo_texto: analise.conteudo_texto || f.conteudo_texto,
        categoria: analise.categoria || f.categoria,
        linha_produto: analise.linha_produto || f.linha_produto,
      }))
    } catch (err: any) {
      setErroAnalise(err?.message || 'Falha ao analisar o documento com a IA Brigade')
    } finally {
      setAnalisando(false)
    }
  }

  const handleSalvarDocumento = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.titulo.trim()) return
    try {
      setSalvando(true)
      await acervoService.criar({
        titulo: form.titulo.trim(),
        codigo: form.codigo.trim() || undefined,
        categoria: form.categoria,
        linha_produto: form.linha_produto,
        resumo: form.resumo.trim() || undefined,
        conteudo_texto: form.conteudo_texto.trim() || undefined,
        arquivo: arquivo || undefined,
      })
      setModalOpen(false)
      setForm(FORM_INICIAL)
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
              Base de Conhecimento RAG &amp; Consulta
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
              <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                <UploadCloud className="w-4 h-4 mr-2" /> Enviar Novo Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-950 border-slate-800 text-slate-100 max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">Adicionar ao Acervo Técnico</DialogTitle>
                <DialogDescription className="text-slate-400 text-xs">
                  Envie o documento, deixe a IA Brigade analisar e revise os dados antes de salvar.
                  Materiais adicionados ficam disponíveis para citação em propostas e briefings.
                </DialogDescription>
              </DialogHeader>
              <FormularioAcervo
                form={form}
                setField={(campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))}
                arquivo={arquivo}
                setArquivo={setArquivo}
                analisando={analisando}
                erroAnalise={erroAnalise}
                onAnalisar={handleAnalisar}
                salvando={salvando}
                onSubmit={handleSalvarDocumento}
                onCancelar={() => setModalOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por tema, código ou resumo..."
            className="pl-9 bg-slate-950/70 border-slate-800 text-white text-xs"
          />
        </div>
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="w-full sm:w-48 bg-slate-950/70 border-slate-800 text-slate-200 text-xs">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
            <SelectItem value="todos">Todas as categorias</SelectItem>
            {Object.entries(CATEGORIA_LABEL).map(([valor, rotulo]) => (
              <SelectItem key={valor} value={valor}>
                {rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroLinha} onValueChange={setFiltroLinha}>
          <SelectTrigger className="w-full sm:w-52 bg-slate-950/70 border-slate-800 text-slate-200 text-xs">
            <SelectValue placeholder="Linha de produto" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
            <SelectItem value="todos">Todas as linhas</SelectItem>
            <SelectItem value="geral_portfolio">Portfólio Geral</SelectItem>
            <SelectItem value="cameras_360_backeye">Backeye®360</SelectItem>
            <SelectItem value="radar_bsis">Radares BSIS &amp; Predict</SelectItem>
            <SelectItem value="alarmes_bbs_som_branco">bbs-tek® (Som Branco)</SelectItem>
            <SelectItem value="sensores_ultrassonicos">Sensores Ultrassônicos</SelectItem>
            <SelectItem value="mdvr_gravadores">Gravadores MDVR</SelectItem>
            <SelectItem value="ia_deteccao_pedestres">IA Detecção de Pedestres</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Listagem */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando acervo...
        </div>
      ) : itensFiltrados.length === 0 ? (
        <Card className="bg-slate-900/60 border-slate-800 border-dashed">
          <CardContent className="py-12 text-center text-slate-400 text-sm">
            <FolderArchive className="w-8 h-8 mx-auto mb-3 text-slate-600" />
            Nenhum documento encontrado no acervo.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {itensFiltrados.map((item) => (
            <Card key={item.id} className="bg-slate-900/60 border-slate-800 flex flex-col">
              <CardContent className="pt-5 flex flex-col flex-1 gap-3">
                <div className="flex items-start justify-between gap-2">
                  <FileText className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    <Badge
                      variant="outline"
                      className="text-[10px] border-blue-900/50 text-blue-300"
                    >
                      {CATEGORIA_LABEL[item.categoria] || item.categoria}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-slate-700 text-slate-400"
                    >
                      {item.linha_produto}
                    </Badge>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white leading-snug">{item.titulo}</h3>
                  {item.codigo && (
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">{item.codigo}</p>
                  )}
                  {item.resumo && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                      {item.resumo}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 border-t border-slate-800 pt-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-300 hover:text-white text-xs flex-1"
                    onClick={() => setItemVisualizar(item)}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> Visualizar
                  </Button>
                  {item.arquivo && (
                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className="text-slate-300 hover:text-white text-xs"
                    >
                      <a href={item.arquivo} target="_blank" rel="noreferrer">
                        <Download className="w-3.5 h-3.5 mr-1" /> Arquivo
                      </a>
                    </Button>
                  )}
                  {isTSV && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300 text-xs"
                      onClick={() => handleExcluir(item.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de visualização */}
      <Dialog open={!!itemVisualizar} onOpenChange={(open) => !open && setItemVisualizar(null)}>
        <DialogContent className="bg-slate-950 border-slate-800 text-slate-100 max-w-xl max-h-[85vh] overflow-y-auto">
          {itemVisualizar && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2 text-base">
                  <BookOpen className="w-4 h-4 text-blue-400" /> {itemVisualizar.titulo}
                </DialogTitle>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Badge variant="outline" className="text-[10px] border-blue-900/50 text-blue-300">
                    {CATEGORIA_LABEL[itemVisualizar.categoria] || itemVisualizar.categoria}
                  </Badge>
                  {itemVisualizar.codigo && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono border-slate-700 text-slate-400"
                    >
                      {itemVisualizar.codigo}
                    </Badge>
                  )}
                </div>
              </DialogHeader>
              {itemVisualizar.resumo && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Resumo</p>
                  <p className="text-xs text-slate-300 leading-relaxed">{itemVisualizar.resumo}</p>
                </div>
              )}
              {itemVisualizar.conteudo_texto && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                    Conteúdo / Notas técnicas
                  </p>
                  <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono bg-slate-900/70 border border-slate-800 rounded-lg p-3">
                    {itemVisualizar.conteudo_texto}
                  </pre>
                </div>
              )}
              {itemVisualizar.arquivo && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-200 text-xs w-fit"
                >
                  <a href={itemVisualizar.arquivo} target="_blank" rel="noreferrer">
                    <Download className="w-3.5 h-3.5 mr-1" /> Abrir documento original
                  </a>
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
