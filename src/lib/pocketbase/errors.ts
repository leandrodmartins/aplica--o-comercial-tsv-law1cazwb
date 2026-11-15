import { ClientResponseError } from 'pocketbase'

export type FieldErrors = Record<string, string>

/** Traduções para códigos de validação nativos do PocketBase. */
const TRADUCOES: Record<string, string> = {
  validation_values_mismatch: 'A senha e a confirmação não coincidem.',
  validation_values_not_unique: 'Este valor já está em uso.',
  validation_invalid_email: 'E-mail inválido.',
  validation_required: 'Campo obrigatório.',
  validation_length_out_of_range: 'Valor fora do tamanho permitido.',
  validation_min_text_length: 'Valor muito curto.',
  validation_is_email: 'E-mail inválido.',
}

function traduzir(texto: string): string {
  const t = TRADUCOES[texto.trim()]
  return t || texto
}

export function extractFieldErrors(error: unknown): FieldErrors {
  if (error instanceof ClientResponseError) {
    const data = error.response?.data
    if (data && typeof data === 'object') {
      const errors: FieldErrors = {}
      for (const [field, detail] of Object.entries(data)) {
        if (
          detail &&
          typeof detail === 'object' &&
          'message' in detail &&
          typeof (detail as { message: unknown }).message === 'string'
        ) {
          const cru = (detail as { message: string }).message
          const codigo = (detail as { code?: unknown }).code
          const codigoStr = typeof codigo === 'string' ? codigo : ''
          errors[field] = (codigoStr && TRADUCOES[codigoStr]) || traduzir(cru) || cru
        }
      }
      return errors
    }
  }
  // Erros devolvidos pelas rotas dedicadas do pb_hooks (formato cruto {status,message,data})
  const qualquer = error as { status?: number; data?: unknown; message?: string } | null
  if (
    qualquer &&
    typeof qualquer === 'object' &&
    qualquer.data &&
    typeof qualquer.data === 'object'
  ) {
    const errors: FieldErrors = {}
    for (const [field, detail] of Object.entries(qualquer.data as Record<string, unknown>)) {
      if (
        detail &&
        typeof detail === 'object' &&
        'message' in (detail as Record<string, unknown>)
      ) {
        const cru = String((detail as { message: unknown }).message ?? '')
        const codigo = (detail as { code?: unknown }).code
        const codigoStr = typeof codigo === 'string' ? codigo : ''
        errors[field] = (codigoStr && TRADUCOES[codigoStr]) || cru
      }
    }
    return errors
  }
  return {}
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ClientResponseError) {
    const msgs = Object.values(extractFieldErrors(error))
    if (msgs.length > 0) return msgs.join(' ')
    const geral = error.response?.message
    if (typeof geral === 'string' && geral) return traduzir(geral)
    return error.message || 'Erro inesperado.'
  }
  // Formato das rotas dedicadas do pb_hooks
  const qualquer = error as { status?: number; data?: unknown; message?: string } | null
  if (
    qualquer &&
    typeof qualquer === 'object' &&
    qualquer.data &&
    typeof qualquer.data === 'object'
  ) {
    const msgs = Object.values(extractFieldErrors(qualquer))
    if (msgs.length > 0) return msgs.join(' ')
  }
  return error instanceof Error ? error.message : 'Erro inesperado.'
}
