import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import {
  PacoteArquivo,
  pacoteArquivosService,
  TAMANHO_MAXIMO,
  validarArquivo,
} from '@/services/pacoteArquivos'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Upload,
  Download,
  FileText,
  FileSpreadsheet,
  FileImage,
  Presentation,
  File as FileIcon,
  Trash2,
  Loader2,
  FolderOpen,
} from 'lucide-react'

/** Formata bytes em KB/MB legíveis. */
function formatarTamanho(bytes: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatarData(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return (
    d.toLocaleDateString('pt-BR') +
    ' ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  )
}

function iconePorTipo(arquivo: PacoteArquivo) {
  const tipo = (arquivo.tipo || '').toLowerCase()
  const nome = arquivo.nome.toLowerCase()
  if (tipo.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/.test(nome)) {
    return <FileImage className="w-4 h-4 text-violet-400 shrink-0" />
  }
  if (tipo.includes('spreadsheet') || tipo.includes('excel') || /\.(xlsx?|csv)$/.test(nome)) {
    return <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
  }
  if (tipo.includes('presentation') || tipo.includes('powerpoint') || /\.(pptx?|ppt)$/.test(nome)) {
    return <Presentation className="w-4 h-4 text-amber-400 shrink-0" />
  }
  if (tipo.includes('pdf') || tipo.includes('word') || /\.(pdf|docx?|txt)$/.test(nome)) {
    return <FileText className="w-4 h-4 text-blue-400 shrink-0" />
  }
  return <FileIcon className="w-4 h-4 text-slate-400 shrink-0" />
}

interface Props {
  pacoteId: string
  /** Regerar .pptx do pacote (IA) — somente TSV; futuro: geração sob demanda por IA. */
  onGerarPptx?: () => void
  gerandoPptx?: boolean
  /** Incrementado pelo pai quando um arquivo é gerado/registrado fora daqui — remonta a lista. */
  versaoArquivos?: number
}

/**
 * Gestor de arquivos estilo Google Drive da apresentação do pacote:
 * lista de arquivos com nome/tamanho/data/quem enviou, download para todos,
 * upload para admin, TSV e revisor técnico. Exclusão e gerar .pptx ficam
 * com o gestor da operação (admin/tsv). Vendedor só visualiza e baixa.
 */
export default function GerenciadorArquivos({
  pacoteId,
  onGerarPptx,
  gerandoPptx,
  versaoArquivos = 0,
}: Props) {
  // Gestor da operação (admin ou tsv): gera .pptx e exclui arquivos do pacote.
  const { user, isAdmin } = useAuth()
  // Upload liberado para admin, tsv e revisor técnico (createRule da coleção
  // pacote_arquivos já aceita os três papéis — migração 0007).
  const podeEnviar = isAdmin || user?.role === 'revisor'
  const [arquivos, setArquivos] = useState<PacoteArquivo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [baixandoId, setBaixandoId] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const carregar = async () => {
    try {
      setCarregando(true)
      setErro(null)
      setArquivos(await pacoteArquivosService.listar(pacoteId))
    } catch (err: any) {
      console.error('Erro ao carregar arquivos do pacote:', err)
      setErro(err.message || 'Falha ao carregar os arquivos.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacoteId])

  // O .pptx gerado é gravado server-side no gestor de arquivos; quando o pai
  // avisa (versaoArquivos), recarrega a lista para ele aparecer.
  useEffect(() => {
    if (versaoArquivos > 0) carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versaoArquivos])

  const handleSelecionar = async (f: File | undefined) => {
    if (!f || !user) return
    const problema = validarArquivo(f)
    if (problema) {
      setErro(problema)
      return
    }
    try {
      setEnviando(true)
      setErro(null)
      await pacoteArquivosService.enviar(pacoteId, f, user)
      await carregar()
    } catch (err: any) {
      console.error('Erro no upload:', err)
      setErro(err.message || 'Falha ao enviar o arquivo.')
    } finally {
      setEnviando(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleBaixar = (arquivo: PacoteArquivo) => {
    try {
      setBaixandoId(arquivo.id)
      pacoteArquivosService.baixar(arquivo)
    } finally {
      setTimeout(() => setBaixandoId(null), 600)
    }
  }

  const handleExcluir = async (arquivo: PacoteArquivo) => {
    if (!confirm(`Excluir o arquivo "${arquivo.nome}"?`)) return
    try {
      await pacoteArquivosService.excluir(arquivo.id)
      await carregar()
    } catch (err: any) {
      console.error('Erro ao excluir:', err)
      setErro(err.message || 'Falha ao excluir o arquivo.')
    }
  }

  return (
    <Card className="bg-slate-900/60 border-slate-800">
      <CardHeader>
        <CardTitle className="text-base text-white flex items-center justify-between flex-wrap gap-2">
          <span className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-blue-400" />
            Arquivos da Apresentação
          </span>
          <span className="flex items-center gap-2 flex-wrap">
            {isAdmin && onGerarPptx && (
              <Button
                size="sm"
                variant="outline"
                onClick={onGerarPptx}
                disabled={gerandoPptx}
                className="border-slate-800 bg-slate-950 text-slate-300 hover:text-white text-xs"
              >
                {gerandoPptx ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Presentation className="w-3.5 h-3.5 mr-1.5" />
                )}
                {gerandoPptx ? 'Gerando .pptx...' : 'Gerar .pptx (IA)'}
              </Button>
            )}
            {podeEnviar && (
              <Button
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={enviando}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-md shadow-blue-600/20"
              >
                {enviando ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                )}
                {enviando ? 'Enviando...' : 'Enviar arquivo'}
              </Button>
            )}
            <input
              ref={inputRef}
              type="file"
              accept=".pptx,.ppt,.pdf,.docx,.xlsx,.xls,.doc,image/*"
              className="hidden"
              onChange={(e) => handleSelecionar(e.target.files?.[0])}
            />
          </span>
        </CardTitle>
        <CardDescription className="text-xs text-slate-400">
          {isAdmin
            ? 'Gestor de arquivos do pacote: envie apresentações, documentos, planilhas e imagens (até 50 MB). O vendedor pode visualizar e baixar.'
            : podeEnviar
              ? 'Envie apresentações, documentos, planilhas e imagens (até 50 MB). O vendedor pode visualizar e baixar.'
              : 'Arquivos disponibilizados pela TSV. Você pode visualizar e baixar cada um deles.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-2">
        {erro && (
          <div className="text-xs text-red-300 bg-red-950/40 border border-red-900/50 rounded-lg p-2.5">
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="py-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
            Carregando arquivos...
          </div>
        ) : arquivos.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
            {isAdmin
              ? 'Nenhum arquivo enviado ainda. Use "Enviar arquivo" para adicionar apresentações e documentos.'
              : podeEnviar
                ? 'Nenhum arquivo enviado ainda. Use "Enviar arquivo" para adicionar apresentações e documentos.'
                : 'Nenhum arquivo disponibilizado pela TSV ainda.'}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-800 overflow-hidden divide-y divide-slate-800/80">
            {arquivos.map((arquivo) => (
              <div
                key={arquivo.id}
                className="flex items-center gap-3 px-3 py-2.5 bg-slate-950/60 hover:bg-slate-900/80 transition-colors"
              >
                {iconePorTipo(arquivo)}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-200 truncate" title={arquivo.nome}>
                    {arquivo.nome}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {formatarTamanho(arquivo.tamanho)} • {formatarData(arquivo.created)}
                    {arquivo.enviado_por_nome ? ` • enviado por ${arquivo.enviado_por_nome}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {isAdmin && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-slate-500 hover:text-red-400"
                      onClick={() => handleExcluir(arquivo)}
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 border-slate-800 bg-slate-950 text-slate-300 hover:text-white text-[11px]"
                    onClick={() => handleBaixar(arquivo)}
                    disabled={baixandoId === arquivo.id}
                  >
                    {baixandoId === arquivo.id ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Download className="w-3 h-3 mr-1" />
                    )}
                    Baixar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {podeEnviar && (
          <p className="text-[10px] text-slate-600 pt-1">
            Formatos aceitos: pptx, ppt, pdf, docx, xlsx, doc, xls, jpg, png, webp, gif — até{' '}
            {formatarTamanho(TAMANHO_MAXIMO)}.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
