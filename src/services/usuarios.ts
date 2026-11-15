import pb from '@/lib/pocketbase/client'
import { AppUser, UserRole } from '@/types/tsv'

const COLECAO = '_pb_users_auth_'

const mapear = (rec: any): AppUser => ({
  id: rec.id,
  email: rec.email,
  name: rec.name || '',
  avatar: rec.avatar ? pb.files.getURL(rec, rec.avatar) : undefined,
  role: (rec.role ?? rec.getString?.('role')) as UserRole,
  distribuidor: (rec.distribuidor ?? rec.getString?.('distribuidor')) || undefined,
  cargo: (rec.cargo ?? rec.getString?.('cargo')) || undefined,
  created: rec.created,
  updated: rec.updated,
})

/** Dados usados tanto na criação quanto na edição de um usuário. */
export interface DadosUsuario {
  name: string
  email: string
  role: UserRole
  distribuidor?: string
  cargo?: string
}

/** Resposta crua das rotas dedicadas do backend (pb_hooks). */
interface RespostaCrua {
  status?: number
  message?: string
  data?: Record<string, unknown>
  id?: string
  email?: string
  name?: string
  role?: string
  distribuidor?: string
  cargo?: string
  created?: string
  updated?: string
}

/** Faz a chamada e devolve a resposta crua (status + body) sem tradução. */
async function chamarRota(
  caminho: string,
  corpo: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  try {
    return (await pb.send(caminho, {
      method: 'POST',
      headers: { Authorization: pb.authStore.token },
      body: JSON.stringify(corpo),
    })) as Record<string, unknown>
  } catch (err) {
    const e = err as { status?: number; data?: unknown; message?: string }
    const erro = new Error() as Error & { status?: number; data?: unknown }
    erro.status = e?.status
    erro.data = e?.data
    erro.message =
      e?.message ||
      (e?.status ? `Erro ${e.status} do servidor.` : 'Falha de rede ao contatar o servidor.')
    throw erro
  }
}

export const usuarioService = {
  /** Lista todos os usuários (somente admin/tsv na prática; a regra da coleção permite ver todos autenticados). */
  async listar(): Promise<AppUser[]> {
    const recs = await pb.collection(COLECAO).getFullList({ sort: '-created' })
    return recs.map(mapear)
  },

  /**
   * Cria um usuário com senha provisória aleatória gerada no servidor (ninguém
   * a conhece). O primeiro acesso é feito pelo e-mail de "definir senha" (link
   * enviado pela ação "Senha"). A validação (duplicidade de e-mail, campos)
   * acontece toda no servidor — erros em português e específicos.
   */
  async criar(dados: DadosUsuario): Promise<AppUser> {
    const resultado = await chamarRota('/backend/v1/usuarios-equipe/criar', {
      name: dados.name,
      email: dados.email,
      role: dados.role,
      distribuidor: dados.distribuidor || '',
      cargo: dados.cargo || '',
    })
    return mapear(resultado)
  },

  /** Edita um usuário existente (nome, e-mail, papel, distribuidor, cargo) — nunca senha. */
  async atualizar(id: string, dados: Partial<DadosUsuario>): Promise<AppUser> {
    const corpo: Record<string, unknown> = { id }
    if (dados.name !== undefined) corpo.name = dados.name
    if (dados.email !== undefined) corpo.email = dados.email
    if (dados.role !== undefined) corpo.role = dados.role
    if (dados.distribuidor !== undefined) corpo.distribuidor = dados.distribuidor || ''
    if (dados.cargo !== undefined) corpo.cargo = dados.cargo || ''
    const resultado = await chamarRota('/backend/v1/usuarios-equipe/atualizar', corpo)
    return mapear(resultado)
  },

  /**
   * Envia por e-mail o link nativo de redefinição de senha do PocketBase
   * (requestPasswordReset). O próprio usuário define a senha pelo link — sem
   * repasse manual de senha pela tela.
   */
  async enviarResetSenha(email: string): Promise<void> {
    await pb.collection(COLECAO).requestPasswordReset(email)
  },

  /** Confirma a redefinição com o token recebido por e-mail (página de redefinição). */
  async confirmarResetSenha(token: string, novaSenha: string): Promise<void> {
    await pb.collection(COLECAO).confirmPasswordReset(token, novaSenha, novaSenha)
  },

  async remover(id: string): Promise<void> {
    await pb.collection(COLECAO).delete(id)
  },
}
