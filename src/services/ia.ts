import pb from '@/lib/pocketbase/client'
import { AcervoCategoria, LinhaProdutoBrigade, OportunidadeSegmento } from '@/types/tsv'

export interface LeadExtraido {
  contato_nome: string
  contato_email: string
  contato_telefone: string
  contato_cargo: string
  empresa: string
  mensagem_original: string
  aplicacao: string
  segmento: OportunidadeSegmento
}

export interface DocumentoAnalisado {
  titulo: string
  codigo: string
  categoria: AcervoCategoria
  linha_produto: LinhaProdutoBrigade
  resumo: string
  conteudo_texto: string
}

async function postJson(rota: string, body: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/${rota}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: pb.authStore.token,
    },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(data?.error || 'Falha na comunicação com a IA Brigade')
  }
  return data
}

export const iaService = {
  /** Hook extrair-lead: extrai os dados estruturados do e-mail bruto do lead. */
  async extrairLead(emailTexto: string): Promise<LeadExtraido> {
    return postJson('extrair-lead', { email_texto: emailTexto })
  },

  /**
   * Hook analisar-documento: envia o arquivo (PDF/DOCX/PPTX) em multipart e
   * recebe os metadados extraídos pela IA (título, resumo, categoria, linha).
   */
  async analisarDocumento(arquivo: File): Promise<DocumentoAnalisado> {
    const formData = new FormData()
    formData.append('arquivo', arquivo)
    const res = await fetch(
      `${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/analisar-documento`,
      {
        method: 'POST',
        headers: { Authorization: pb.authStore.token },
        body: formData,
      },
    )
    const data = await res.json().catch(() => null)
    if (res.status === 401) {
      throw new Error('Sua sessão expirou. Faça login novamente para analisar o documento.')
    }
    if (res.status === 403) {
      throw new Error('Apenas a TSV (ou administrador) pode analisar documentos do acervo.')
    }
    if (res.status === 503 || res.status === 502) {
      throw new Error(
        data?.error ||
          'A IA Brigade está indisponível ou sem configuração no momento. Tente novamente ou preencha manualmente.',
      )
    }
    if (!res.ok) {
      throw new Error(
        data?.error || 'Falha ao analisar o documento com a IA Brigade (erro no servidor).',
      )
    }
    return data
  },
}
