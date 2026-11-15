import pb from '@/lib/pocketbase/client'
import { EventoTrilha } from '@/types/tsv'

const COLECAO = 'eventos_trilha'

export const trilhaService = {
  /** Lista os eventos de uma oportunidade (e, opcionalmente, de um pacote específico). */
  async listarPorOportunidade(oportunidadeId: string, pacoteId?: string): Promise<EventoTrilha[]> {
    let filtro = `oportunidade = '${oportunidadeId}'`
    if (pacoteId) filtro += ` && pacote = '${pacoteId}'`
    const recs = await pb.collection(COLECAO).getFullList({
      filter: filtro,
      sort: '-created',
      expand: 'usuario',
    })
    return recs.map(trilhaService.mapear)
  },

  /** Registra um evento na trilha (uso local pelo cliente para ações diretas de UI). */
  async registrar(dados: {
    oportunidade: string
    pacote?: string
    acao: string
    detalhe?: string
  }): Promise<void> {
    await pb.collection(COLECAO).create({
      oportunidade: dados.oportunidade,
      pacote: dados.pacote || '',
      usuario: pb.authStore.record?.id,
      acao: dados.acao,
      detalhe: dados.detalhe || '',
    })
  },

  mapear(rec: any): EventoTrilha {
    return {
      id: rec.id,
      oportunidade: rec.oportunidade,
      pacote: rec.pacote || undefined,
      usuario: rec.usuario,
      acao: rec.acao,
      detalhe: rec.detalhe || undefined,
      created: rec.created,
      expand: {
        usuario: rec.expand?.usuario
          ? {
              id: rec.expand.usuario.id,
              email: rec.expand.usuario.email,
              name: rec.expand.usuario.name || '',
              role: rec.expand.usuario.role,
              distribuidor: rec.expand.usuario.distribuidor || undefined,
              created: rec.expand.usuario.created,
              updated: rec.expand.usuario.updated,
            }
          : undefined,
      },
    }
  },
}

/** Formata "22/11/2026 14:32" a partir do created do PocketBase. */
export function formatarQuando(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
