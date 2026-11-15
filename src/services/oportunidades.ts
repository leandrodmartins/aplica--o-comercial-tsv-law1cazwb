import pb from '@/lib/pocketbase/client'
import { AppUser, Oportunidade, OportunidadeEstado, OportunidadeSegmento } from '@/types/tsv'

export interface OportunidadeCriar {
  empresa: string
  contato_nome: string
  contato_email?: string
  contato_telefone?: string
  contato_cargo?: string
  mensagem_original: string
  aplicacao: string
  segmento?: OportunidadeSegmento
  estado?: OportunidadeEstado
  proxima_acao?: string
  responsavel?: string
}

export const oportunidadeService = {
  /**
   * Lista oportunidades visíveis ao usuário atual.
   * O isolamento primário é a listRule da coleção (servidor); aqui mantemos um
   * filtro defensivo extra no cliente.
   */
  async listar(): Promise<Oportunidade[]> {
    const recs = await pb.collection('oportunidades').getFullList({
      sort: '-updated',
      expand: 'responsavel,criado_por',
    })
    return recs.map((r: any) => oportunidadeService.mapear(r))
  },

  async obter(id: string): Promise<Oportunidade> {
    const rec = await pb.collection('oportunidades').getOne(id, {
      expand: 'responsavel,criado_por',
    })
    return oportunidadeService.mapear(rec)
  },

  async criar(dados: OportunidadeCriar): Promise<Oportunidade> {
    const rec = await pb.collection('oportunidades').create({
      empresa: dados.empresa,
      contato_nome: dados.contato_nome,
      contato_email: dados.contato_email || '',
      contato_telefone: dados.contato_telefone || '',
      contato_cargo: dados.contato_cargo || '',
      mensagem_original: dados.mensagem_original || '',
      aplicacao: dados.aplicacao,
      segmento: dados.segmento || 'outro',
      estado: dados.estado || 'novo_lead',
      proxima_acao: dados.proxima_acao || '',
      responsavel: dados.responsavel || pb.authStore.record?.id,
      distribuidor: pb.authStore.record?.distribuidor || '',
    })
    return oportunidadeService.mapear(rec)
  },

  /** Atualiza campos editáveis (estado, próxima ação etc.) com registro na trilha de eventos. */
  async atualizarEstado(
    id: string,
    estado: OportunidadeEstado,
    detalhe?: string,
  ): Promise<Oportunidade> {
    const rec = await pb.collection('oportunidades').update(id, {
      estado,
      ...(detalhe ? {} : {}),
    })
    // Registro na trilha (falha não bloqueia a atualização)
    try {
      await pb.collection('eventos_trilha').create({
        oportunidade: id,
        usuario: pb.authStore.record?.id,
        acao: `Estado alterado para "${estado}"`,
        detalhe: detalhe || '',
      })
    } catch {
      /* trilha é best-effort */
    }
    return oportunidadeService.mapear(rec)
  },

  mapear(rec: any): Oportunidade {
    return {
      id: rec.id,
      empresa: rec.empresa,
      contato_nome: rec.contato_nome,
      contato_email: rec.contato_email || undefined,
      contato_telefone: rec.contato_telefone || undefined,
      contato_cargo: rec.contato_cargo || undefined,
      mensagem_original: rec.mensagem_original || '',
      aplicacao: rec.aplicacao,
      segmento: rec.segmento || 'outro',
      estado: rec.estado as OportunidadeEstado,
      proxima_acao: rec.proxima_acao || '',
      proxima_acao_data: rec.proxima_acao_data || undefined,
      responsavel: rec.responsavel,
      criado_por: rec.criado_por || undefined,
      distribuidor: rec.distribuidor || undefined,
      distribuidora: rec.distribuidora || undefined,
      created: rec.created,
      updated: rec.updated,
      expand: {
        responsavel: rec.expand?.responsavel
          ? {
              id: rec.expand.responsavel.id,
              email: rec.expand.responsavel.email,
              name: rec.expand.responsavel.name || '',
              role: rec.expand.responsavel.role,
              distribuidor: rec.expand.responsavel.distribuidor || undefined,
              created: rec.expand.responsavel.created,
              updated: rec.expand.responsavel.updated,
            }
          : undefined,
        criado_por: rec.expand?.criado_por
          ? {
              id: rec.expand.criado_por.id,
              email: rec.expand.criado_por.email,
              name: rec.expand.criado_por.name || '',
              role: rec.expand.criado_por.role,
              distribuidor: rec.expand.criado_por.distribuidor || undefined,
              created: rec.expand.criado_por.created,
              updated: rec.expand.criado_por.updated,
            }
          : undefined,
      },
    }
  },
}

export type { AppUser }
