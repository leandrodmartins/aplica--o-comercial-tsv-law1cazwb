import { ClientResponseError } from 'pocketbase'

export type FieldErrors = Record<string, string>

/**
 * Tradução apenas para códigos de validação CONHECIDOS do PocketBase.
 * Qualquer outro erro volta com o motivo real do backend (response.message),
 * nunca com uma mensagem genérica que esconde a causa.
 */
const CODIGOS_EM_PT: Record<string, string> = {
  validation_values_mismatch: 'A senha e a confirmação não coincidem.',
  validation_values_mismatch_email: 'Os e-mails não coincidem.',
  validation_required: 'Preencha os campos obrigatórios.',
  validation_is_email: 'Informe um e-mail válido.',
  validation_not_unique: 'Este valor já está em uso.',
  validation_too_short: 'Valor muito curto.',
  validation_too_long: 'Valor muito longo.',
  validation_length_out_of_range: 'Tamanho fora do intervalo permitido.',
  validation_invalid_credentials: 'Credenciais inválidas.',
  validation_token_invalid_or_expired: 'Token inválido ou expirado.',
}

const mensagemDoDetalhe = (detail: unknown): string => {
  if (!detail || typeof detail !== 'object') return ''
  const d = detail as { code?: unknown; message?: unknown }
  if (typeof d.code === 'string' && CODIGOS_EM_PT[d.code]) {
    return CODIGOS_EM_PT[d.code]
  }
  return typeof d.message === 'string' ? d.message : ''
}

export function extractFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ClientResponseError)) return {}
  const data = error.response?.data
  if (!data || typeof data !== 'object') return {}
  const errors: FieldErrors = {}
  for (const [field, detail] of Object.entries(data)) {
    const msg = mensagemDoDetalhe(detail)
    if (msg) errors[field] = msg
  }
  return errors
}

export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ClientResponseError)) {
    return error instanceof Error ? error.message : 'Ocorreu um erro inesperado.'
  }
  const msgs = Object.values(extractFieldErrors(error))
  if (msgs.length > 0) return msgs.join(' ')
  // Erro não é de validação de formulário: mostra o motivo real do PocketBase
  // (ex.: "Failed to send password reset email."), não uma frase genérica.
  const motivo = error.response?.message || error.message
  return motivo || 'Ocorreu um erro inesperado.'
}
