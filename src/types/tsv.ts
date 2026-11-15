export type UserRole = 'admin' | 'tsv' | 'revisor' | 'vendedor'

export const ROTULO_PAPEL: Record<UserRole, string> = {
  admin: 'Administrador',
  tsv: 'TSV',
  revisor: 'Revisor Técnico',
  vendedor: 'Vendedor',
}

/** Papéis que veem dados de todos os distribuidores (sem isolamento). */
export const PAPEIS_SEM_ISOLAMENTO: UserRole[] = ['admin', 'tsv', 'revisor']

export interface AppUser {
  id: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  distribuidor?: string
  cargo?: string
  created: string
  updated: string
}

/**
 * Estados da oportunidade conforme o PRD (MVP):
 * novo_lead → em_preparacao → em_revisao → aprovado → enviado → ganho/perdido.
 */
export type OportunidadeEstado =
  | 'novo_lead'
  | 'em_preparacao'
  | 'em_revisao'
  | 'aprovado'
  | 'enviado'
  | 'ganho'
  | 'perdido'

export const ROTULO_ESTADO: Record<OportunidadeEstado, string> = {
  novo_lead: 'Novo Lead',
  em_preparacao: 'Em Preparação',
  em_revisao: 'Em Revisão',
  aprovado: 'Aprovado',
  enviado: 'Enviado',
  ganho: 'Ganho',
  perdido: 'Perdido',
}

export const ESTADOS_ATIVOS: OportunidadeEstado[] = [
  'novo_lead',
  'em_preparacao',
  'em_revisao',
  'aprovado',
  'enviado',
]

export type OportunidadeSegmento =
  | 'mineracao'
  | 'construcao'
  | 'logistica_rodoviaria'
  | 'onibus_urbano'
  | 'agricola'
  | 'portuario'
  | 'frotas_leves'
  | 'outro'

export interface Oportunidade {
  id: string
  empresa: string
  contato_nome: string
  contato_email?: string
  contato_telefone?: string
  contato_cargo?: string
  mensagem_original: string
  aplicacao: string
  segmento?: OportunidadeSegmento
  estado: OportunidadeEstado
  proxima_acao: string
  proxima_acao_data?: string
  responsavel: string
  criado_por?: string
  distribuidor?: string
  distribuidora?: string // legado (texto livre); usar distribuidor
  created: string
  updated: string
  expand?: {
    responsavel?: AppUser
    criado_por?: AppUser
  }
}

export type StatusRevisao = 'rascunho' | 'em_revisao' | 'aprovado' | 'rejeitado' | 'enviado'

export const ROTULO_STATUS_REVISAO: Record<StatusRevisao, string> = {
  rascunho: 'Rascunho',
  em_revisao: 'Em Revisão',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
  enviado: 'Enviado',
}

export interface PerguntaPriorizada {
  ordem: number
  pergunta: string
  categoria?: string
}

export interface SlideApresentacao {
  titulo: string
  conteudo: string
}

export interface PontoPendente {
  pendencia: string
  resolvido: boolean
}

export interface ReferenciaBrigade {
  codigo?: string
  titulo: string
}

export interface PacotePreparacao {
  id: string
  oportunidade: string
  versao: number
  briefing_contexto?: string
  briefing_hipoteses?: string
  briefing_riscos?: string
  perguntas_priorizadas?: PerguntaPriorizada[]
  minuta_email_assunto?: string
  minuta_email_corpo?: string
  apresentacao_slides?: SlideApresentacao[]
  pontos_pendentes?: PontoPendente[]
  referencias_brigade?: ReferenciaBrigade[]
  status_revisao: StatusRevisao
  notas_revisor?: string
  revisor?: string
  aprovado_em?: string
  enviado_em?: string
  /** Arquivo de apresentação próprio do vendedor (campo file da migração 0005). */
  apresentacao_upload?: string
  apresentacao_upload_nome?: string
  created: string
  updated: string
  expand?: {
    oportunidade?: Oportunidade
    revisor?: AppUser
  }
}

/** Trilha de eventos (quem fez o quê e quando) por oportunidade/pacote. */
export interface EventoTrilha {
  id: string
  oportunidade: string
  pacote?: string
  usuario: string
  acao: string
  detalhe?: string
  created: string
  expand?: {
    usuario?: AppUser
  }
}

export type AcervoCategoria =
  | 'catalogo'
  | 'ficha_tecnica'
  | 'apresentacao'
  | 'manual'
  | 'guia_aplicacao'

export type LinhaProdutoBrigade =
  | 'radar_bsis'
  | 'cameras_360_backeye'
  | 'alarmes_bbs_som_branco'
  | 'sensores_ultrassonicos'
  | 'mdvr_gravadores'
  | 'ia_deteccao_pedestres'
  | 'geral_portfolio'

export interface AcervoTecnicoItem {
  id: string
  titulo: string
  codigo?: string
  categoria: AcervoCategoria
  linha_produto: LinhaProdutoBrigade
  resumo?: string
  conteudo_texto?: string
  arquivo?: string
  ativo: boolean
  created: string
  updated: string
}
