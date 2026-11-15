import { ClientResponseError } from 'pocketbase'

export type FieldErrors = Record<string, string>

/** Traduções PT-BR para as mensagens de validação cruas do PocketBase. */
const TRADUCOES: { teste: RegExp; mensagem: string }[] = [
  {
    teste: /values don'?t match/i,
    mensagem: 'A senha e a confirmação não coincidem.',
  },
  { teste: /another record with the same/i, mensagem: 'Já existe um usuário com esse e-mail.' },
  { teste: /failed to create record/i, mensagem: 'Não foi possível criar o usuário.' },
  { teste: /failed to update record/i, mensagem: 'Não foi possível salvar as alterações.' },
  { teste: /value is required/i, mensagem: 'Preencha os campos obrigatórios.' },
  { teste: /cannot be blank/i, mensagem: 'Preencha os campos obrigatórios.' },
  { teste: /must be a valid email/i, mensagem: 'Informe um e-mail válido.' },
  { teste: /insufficient permissions/i, mensagem: 'Você não tem permissão para esta ação.' },
]

/**
 * Converte um erro da API em mensagens por campo, traduzindo o texto cru do
 * PocketBase para PT-BR quando conhecido.
 */
export function extractFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ClientResponseError)) return {}
  const data = error.response?.data
  if (!data || typeof data !== 'object') return {}
  const errors: FieldErrors = {}
  for (const [field, detail] of Object.entries(data)) {
    if (
      detail &&
      typeof detail === 'object' &&
      'message' in detail &&
      typeof (detail as { message: unknown }).message === 'string'
    ) {
      const msg = (detail as { message: string }).message
      errors[field] = traduzir(msg)
    }
  }
  return errors
}

/**
 * Mensagem de erro pronta para exibir, em PT-BR. Traduz as respostas cruas do
 * PocketBase (ex.: "Values don't match.") para frases claras.
 */
export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ClientResponseError)) {
    return error instanceof Error
      ? traduzir(error.message)
      : 'Ocorreu um erro inesperado. Tente novamente.'
  }
  const status = error.status
  const msgs = Object.values(extractFieldErrors(error))
  if (msgs.length > 0) return msgs.join(' ')
  if (status === 400) return 'Dados inválidos. Verifique os campos e tente novamente.'
  if (status === 403) return 'Você não tem permissão para esta ação.'
  if (status === 404) return 'Registro não encontrado.'
  if (status === 0) return 'Falha de conexão com o servidor. Verifique sua internet.'
  return traduzir(error.message || 'Ocorreu um erro inesperado. Tente novamente.')
}

function traduzir(msg: string): string {
  for (const { teste, mensagem } of TRADUCOES) {
    if (teste.test(msg)) return mensagem
  }
  return msg
}
