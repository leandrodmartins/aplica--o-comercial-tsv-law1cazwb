import pb from '@/lib/pocketbase/client'
import {
  Oportunidade,
  OportunidadeEstado,
  OportunidadeSegmento,
  PacotePreparacao,
  StatusRevisao,
} from '@/types/tsv'

// A coleção real do backend é 'pacotes' (migração 0005 acrescentou o campo
// apresentacao_upload, tipo file, mimeTypes pptx/ppt/pdf, até 50 MB).
const COLECAO = 'pacotes'

export const pacoteService = {
  async obterPorOportunidade(oportunidadeId: string): Promise<PacotePreparacao | null> {
    const registros = await pb
      .collection(COLECAO)
      .getFullList({ filter: `oportunidade = '${oportunidadeId}'`, sort: '-created' })
    if (registros.length === 0) return null
    return pacoteService.mapear(registros[0])
  },

  /** Upload da apresentação própria do vendedor (campo apresentacao_upload, migração 0005). */
  async enviarApresentacao(pacoteId: string, arquivo: File): Promise<PacotePreparacao> {
    const formData = new FormData()
    formData.append('apresentacao_upload', arquivo)

    const rec = await pb.collection(COLECAO).update(pacoteId, formData)
    return pacoteService.mapear(rec)
  },

  /**
   * Hook gerar-pptx: POST /backend/v1/gerar-pptx com { pacote_id }.
   * Retorna o arquivo .pptx como Blob.
   *
   * Usa fetch() nativo em vez de pb.send(): o SDK PocketBase não suporta
   * responseType='blob' (a opção desconhecida vira query string e a resposta
   * binária é tratada como JSON, corrompendo o download). O token de auth vai
   * no header Authorization, como o hook exigiria via e.auth.
   */
  async baixarPptx(pacoteId: string): Promise<{ blob: Blob; filename: string }> {
    const token = pb.authStore.token
    if (!token) throw new Error('Sessão expirada. Faça login novamente.')

    const base = pb.buildURL('')
    const resposta = await fetch(`${base}backend/v1/gerar-pptx`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
      body: JSON.stringify({ pacote_id: pacoteId }),
    })

    if (!resposta.ok) {
      let detalhe = `HTTP ${resposta.status}`
      try {
        const texto = await resposta.text()
        const json = JSON.parse(texto) as { error?: string }
        if (json.error) detalhe = json.error
      } catch (_) {
        // corpo não-JSON: mantém o status HTTP
      }
      throw new Error(detalhe)
    }

    const blob = await resposta.blob()
    if (blob.size === 0) throw new Error('Resposta vazia do servidor ao gerar o arquivo.')

    // O hook envia Content-Disposition attachment; aproveitamos o nome, com fallback.
    const disposition = resposta.headers.get('Content-Disposition') || ''
    const match = /filename="?([^";]+)"?/i.exec(disposition)
    const filename = match?.[1] || `Apresentacao-Brigade-${pacoteId.slice(0, 8)}.pptx`
    return { blob, filename }
  },

  /** Hook comercial_brigade: POST /backend/v1/gerar-pacote */
  async gerarComIA(oportunidadeId: string): Promise<PacotePreparacao> {
    const rec = await pb.send('backend/v1/gerar-pacote', {
      method: 'POST',
      body: { oportunidade_id: oportunidadeId },
    })
    return pacoteService.mapear(rec as any)
  },

  /** Hook comercial_brigade: POST /backend/v1/revisar-pacote */
  async revisarPacote(dados: {
    pacote_id: string
    acao: 'aprovar' | 'rejeitar' | 'salvar_edicao' | 'marcar_enviado'
    notas_revisor?: string
    pontos_pendentes?: PacotePreparacao['pontos_pendentes']
    minuta_email_assunto?: string
    minuta_email_corpo?: string
  }): Promise<PacotePreparacao> {
    const rec = await pb.send('backend/v1/revisar-pacote', {
      method: 'POST',
      body: dados,
    })
    return pacoteService.mapear(rec as any)
  },

  mapear(rec: any): PacotePreparacao {
    return {
      id: rec.id,
      oportunidade: rec.oportunidade as string,
      versao: Number(rec.versao ?? 1),
      briefing_contexto: rec.briefing_contexto ?? '',
      briefing_hipoteses: rec.briefing_hipoteses ?? '',
      briefing_riscos: rec.briefing_riscos ?? '',
      perguntas_priorizadas: (rec.perguntas_priorizadas ??
        []) as PacotePreparacao['perguntas_priorizadas'],
      minuta_email_assunto: rec.minuta_email_assunto ?? '',
      minuta_email_corpo: rec.minuta_email_corpo ?? '',
      apresentacao_slides: (rec.apresentacao_slides ??
        []) as PacotePreparacao['apresentacao_slides'],
      apresentacao_upload: rec.apresentacao_upload
        ? pb.files.getURL(rec, rec.apresentacao_upload)
        : undefined,
      // O nome do arquivo original é o próprio valor do campo file no PocketBase.
      apresentacao_upload_nome: rec.apresentacao_upload || undefined,
      pontos_pendentes: (rec.pontos_pendentes ?? []) as PacotePreparacao['pontos_pendentes'],
      referencias_brigade: (rec.referencias_brigade ??
        []) as PacotePreparacao['referencias_brigade'],
      status_revisao: rec.status_revisao as StatusRevisao,
      revisor: rec.revisor ?? undefined,
      notas_revisor: rec.notas_revisor ?? undefined,
      aprovado_em: rec.aprovado_em ?? undefined,
      enviado_em: rec.enviado_em ?? undefined,
      created: rec.created,
      updated: rec.updated,
    }
  },
}

export type { Oportunidade, OportunidadeEstado, OportunidadeSegmento }
