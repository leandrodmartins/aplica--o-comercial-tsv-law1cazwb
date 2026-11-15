export type UserRole = 'tsv' | 'vendedor'

export interface AppUser {
  id: string
  email: string
  name: string
  avatar?: string
  role: UserRole
  distribuidora?: string
  cargo?: string
  created: string
  updated: string
}

export type OportunidadeEstado = 'rascunho' | 'em_revisao' | 'aprovado' | 'enviado'

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
  distribuidora?: string
  created: string
  updated: string
  expand?: {
    responsavel?: AppUser
    criado_por?: AppUser
  }
}

export type StatusRevisao = 'rascunho' | 'em_revisao' | 'aprovado' | 'rejeitado' | 'enviado'

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
  created: string
  updated: string
  expand?: {
    oportunidade?: Oportunidade
    revisor?: AppUser
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
