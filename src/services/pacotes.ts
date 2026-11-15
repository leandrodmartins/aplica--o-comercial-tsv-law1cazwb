import pb from '@/lib/pocketbase/client'
import { PacotePreparacao, StatusRevisao } from '@/types/tsv'

export const pacoteService = {
  async obterPorOportunidade(oportunidadeId: string): Promise<PacotePreparacao | null> {
    try {
      const records = await pb.collection('pacotes').getList(1, 1, {
        filter: `oportunidade = '${oportunidadeId}'`,
        sort: '-created',
        expand: 'oportunidade,revisor',
      })

      if (records.items.length === 0) return null
      const rec = records.items[0]

      return {
        id: rec.id,
        oportunidade: rec.oportunidade as string,
        versao: rec.versao as number,
        briefing_contexto: rec.briefing_contexto as string | undefined,
        briefing_hipoteses: rec.briefing_hipoteses as string | undefined,
        briefing_riscos: rec.briefing_riscos as string | undefined,
        perguntas_priorizadas: rec.perguntas_priorizadas
          ? typeof rec.perguntas_priorizadas === 'string'
            ? JSON.parse(rec.perguntas_priorizadas)
            : rec.perguntas_priorizadas
          : [],
        minuta_email_assunto: rec.minuta_email_assunto as string | undefined,
        minuta_email_corpo: rec.minuta_email_corpo as string | undefined,
        apresentacao_slides: rec.apresentacao_slides
          ? typeof rec.apresentacao_slides === 'string'
            ? JSON.parse(rec.apresentacao_slides)
            : rec.apresentacao_slides
          : [],
        pontos_pendentes: rec.pontos_pendentes
          ? typeof rec.pontos_pendentes === 'string'
            ? JSON.parse(rec.pontos_pendentes)
            : rec.pontos_pendentes
          : [],
        referencias_brigade: rec.referencias_brigade
          ? typeof rec.referencias_brigade === 'string'
            ? JSON.parse(rec.referencias_brigade)
            : rec.referencias_brigade
          : [],
        status_revisao: rec.status_revisao as StatusRevisao,
        notas_revisor: rec.notas_revisor as string | undefined,
        revisor: rec.revisor as string | undefined,
        aprovado_em: rec.aprovado_em as string | undefined,
        enviado_em: rec.enviado_em as string | undefined,
        created: rec.created as string,
        updated: rec.updated as string,
        expand: rec.expand as any,
      }
    } catch (_) {
      return null
    }
  },

  async gerarComIA(
    oportunidadeId: string,
  ): Promise<{ sucesso: boolean; pacote_id: string; versao: number }> {
    const res = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/gerar-pacote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: pb.authStore.token,
      },
      body: JSON.stringify({ oportunidade_id: oportunidadeId }),
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Falha ao acionar a IA para geração do pacote')
    }

    return data
  },

  async revisarPacote(params: {
    pacote_id: string
    acao: 'aprovar' | 'rejeitar' | 'salvar_edicao' | 'marcar_enviado'
    notas_revisor?: string
    pontos_pendentes?: any[]
    minuta_email_corpo?: string
    minuta_email_assunto?: string
  }): Promise<{ sucesso: boolean; status_revisao: string; estado_oportunidade?: string }> {
    const res = await fetch(`${import.meta.env.VITE_POCKETBASE_URL}/backend/v1/revisar-pacote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: pb.authStore.token,
      },
      body: JSON.stringify(params),
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Falha ao processar revisão do pacote')
    }

    return data
  },
}
