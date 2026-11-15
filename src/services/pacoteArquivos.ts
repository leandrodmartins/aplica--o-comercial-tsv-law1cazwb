import pb from '@/lib/pocketbase/client'
import { AppUser } from '@/types/tsv'

/** Registro de um arquivo do gestor (coleção pacote_arquivos, migração 0006). */
export interface PacoteArquivo {
  id: string
  pacote: string
  enviado_por: string
  enviado_por_nome?: string
  nome: string
  tipo?: string
  tamanho: number
  url: string
  created: string
  updated: string
}

const COLECAO = 'pacote_arquivos'
export const TAMANHO_MAXIMO = 50 * 1024 * 1024 // 50 MB

/** Formatos aceitos no upload: apresentações, documentos, planilhas e imagens. */
export const EXTENSOES_ACEITAS = [
  'pptx',
  'ppt',
  'pdf',
  'docx',
  'xlsx',
  'xls',
  'doc',
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
]

export function validarArquivo(arquivo: File): string | null {
  const ext = arquivo.name.split('.').pop()?.toLowerCase() || ''
  if (!EXTENSOES_ACEITAS.includes(ext)) {
    return 'Formato não aceito. Envie pptx, ppt, pdf, docx, xlsx, doc, xls ou imagem (jpg, png, webp, gif).'
  }
  if (arquivo.size > TAMANHO_MAXIMO) {
    return 'Arquivo muito grande. O limite é 50 MB.'
  }
  return null
}

function mapear(rec: any, expandido?: AppUser): PacoteArquivo {
  return {
    id: rec.id,
    pacote: rec.pacote as string,
    enviado_por: rec.enviado_por as string,
    enviado_por_nome: expandido?.name,
    nome: (rec.nome as string) || '',
    tipo: (rec.tipo as string) || undefined,
    tamanho: Number(rec.tamanho ?? 0),
    url: rec.arquivo ? pb.files.getURL(rec, rec.arquivo as string) : '',
    created: rec.created as string,
    updated: rec.updated as string,
  }
}

export const pacoteArquivosService = {
  async listar(pacoteId: string): Promise<PacoteArquivo[]> {
    const registros = await pb.collection(COLECAO).getFullList({
      filter: `pacote = '${pacoteId}'`,
      sort: '-created',
      expand: 'enviado_por',
    })
    return registros.map((rec) =>
      mapear(rec, (rec.expand?.enviado_por as AppUser | undefined) ?? undefined),
    )
  },

  /** Somente TSV (regra da coleção no backend valida o papel). */
  async enviar(pacoteId: string, arquivo: File, usuario: AppUser): Promise<PacoteArquivo> {
    const formData = new FormData()
    formData.append('pacote', pacoteId)
    formData.append('nome', arquivo.name)
    formData.append('tipo', arquivo.type || 'application/octet-stream')
    formData.append('tamanho', String(arquivo.size))
    formData.append('enviado_por', usuario.id)
    formData.append('arquivo', arquivo)

    const rec = await pb.collection(COLECAO).create(formData)
    return mapear(rec, usuario)
  },

  async excluir(id: string): Promise<void> {
    await pb.collection(COLECAO).delete(id)
  },

  /** Dispara o download do arquivo para o navegador (vendedor e TSV). */
  baixar(arquivo: PacoteArquivo): void {
    const a = document.createElement('a')
    a.href = arquivo.url
    a.download = arquivo.nome || 'arquivo'
    a.rel = 'noreferrer'
    document.body.appendChild(a)
    a.click()
    a.remove()
  },
}
