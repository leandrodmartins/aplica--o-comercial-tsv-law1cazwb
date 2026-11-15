import { StatusRevisao } from '@/types/tsv'

/**
 * Governança do PRD (MVP):
 * - Material não aprovado é RASCUNHO e não pode ser enviado externamente.
 * - Somente revisor/admin aprova; vendedor/tsv marcam envio APENAS de aprovado.
 */
export function ehRascunho(status: StatusRevisao | string | undefined): boolean {
  return status !== 'aprovado' && status !== 'enviado'
}

export function podeAprovar(role: string | undefined): boolean {
  return role === 'revisor' || role === 'admin'
}
