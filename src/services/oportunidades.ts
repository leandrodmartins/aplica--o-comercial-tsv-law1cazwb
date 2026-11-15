import pb from '@/lib/pocketbase/client'
import { Oportunidade, OportunidadeEstado, OportunidadeSegmento } from '@/types/tsv'

export const oportunidadeService = {
  async listar(filtros?: {
    responsavelId?: string
    estado?: OportunidadeEstado
    busca?: string
  }): Promise<Oportunidade[]> {
    const filterParts: string[] = []

    if (filtros?.responsavelId) {
      filterParts.push(`responsavel = '${filtros.responsavelId}'`)
    }

    if (filtros?.estado) {
      filterParts.push(`estado = '${filtros.estado}'`)
    }

    if (filtros?.busca) {
      const q = filtros.busca.replace(/'/g, "\\'")
      filterParts.push(`(empresa ~ '${q}' || contato_nome ~ '${q}' || aplicacao ~ '${q}')`)
    }

    const records = await pb.collection('oportunidades').getFullList({
      filter: filterParts.length > 0 ? filterParts.join(' && ') : undefined,
      sort: '-created',
      expand: 'responsavel,criado_por',
    })

    return records.map((rec) => ({
      id: rec.id,
      empresa: rec.empresa as string,
      contato_nome: rec.contato_nome as string,
      contato_email: rec.contato_email as string | undefined,
      contato_telefone: rec.contato_telefone as string | undefined,
      contato_cargo: rec.contato_cargo as string | undefined,
      mensagem_original: rec.mensagem_original as string,
      aplicacao: rec.aplicacao as string,
      segmento: rec.segmento as OportunidadeSegmento | undefined,
      estado: rec.estado as OportunidadeEstado,
      proxima_acao: rec.proxima_acao as string,
      proxima_acao_data: rec.proxima_acao_data as string | undefined,
      responsavel: rec.responsavel as string,
      criado_por: rec.criado_por as string | undefined,
      distribuidora: rec.distribuidora as string | undefined,
      created: rec.created as string,
      updated: rec.updated as string,
      expand: rec.expand as any,
    }))
  },

  async obterPorId(id: string): Promise<Oportunidade> {
    const rec = await pb.collection('oportunidades').getOne(id, {
      expand: 'responsavel,criado_por',
    })

    return {
      id: rec.id,
      empresa: rec.empresa as string,
      contato_nome: rec.contato_nome as string,
      contato_email: rec.contato_email as string | undefined,
      contato_telefone: rec.contato_telefone as string | undefined,
      contato_cargo: rec.contato_cargo as string | undefined,
      mensagem_original: rec.mensagem_original as string,
      aplicacao: rec.aplicacao as string,
      segmento: rec.segmento as OportunidadeSegmento | undefined,
      estado: rec.estado as OportunidadeEstado,
      proxima_acao: rec.proxima_acao as string,
      proxima_acao_data: rec.proxima_acao_data as string | undefined,
      responsavel: rec.responsavel as string,
      criado_por: rec.criado_por as string | undefined,
      distribuidora: rec.distribuidora as string | undefined,
      created: rec.created as string,
      updated: rec.updated as string,
      expand: rec.expand as any,
    }
  },

  async criar(dados: {
    empresa: string
    contato_nome: string
    contato_email?: string
    contato_telefone?: string
    contato_cargo?: string
    mensagem_original: string
    aplicacao: string
    segmento?: OportunidadeSegmento
    responsavel: string
    proxima_acao?: string
    proxima_acao_data?: string
    distribuidora?: string
  }): Promise<Oportunidade> {
    const authId = pb.authStore.record?.id
    const rec = await pb.collection('oportunidades').create({
      ...dados,
      estado: 'rascunho',
      proxima_acao: dados.proxima_acao || 'Gerar pacote de preparação técnico-comercial com IA',
      criado_por: authId,
    })
    return this.obterPorId(rec.id)
  },

  async atualizar(id: string, dados: Partial<Oportunidade>): Promise<void> {
    await pb.collection('oportunidades').update(id, dados)
  },

  async excluir(id: string): Promise<void> {
    await pb.collection('oportunidades').delete(id)
  },
}
