import pb from '@/lib/pocketbase/client'
import { AppUser, UserRole } from '@/types/tsv'

const COLECAO = '_pb_users_auth_'

const mapear = (rec: any): AppUser => ({
  id: rec.id,
  email: rec.email,
  name: rec.name || '',
  avatar: rec.avatar ? pb.files.getURL(rec, rec.avatar) : undefined,
  role: rec.role as UserRole,
  distribuidor: rec.distribuidor || undefined,
  cargo: rec.cargo || undefined,
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

export const usuarioService = {
  /** Lista todos os usuários (somente admin/tsv na prática; a regra da coleção permite ver todos autenticados). */
  async listar(): Promise<AppUser[]> {
    const recs = await pb.collection(COLECAO).getFullList({ sort: '-created' })
    return recs.map(mapear)
  },

  /**
   * Cria um usuário com papel e distribuidor (somente admin/tsv, regra da coleção).
   * A conta nasce com senha provisória (satisfaça o mínimo do PocketBase) e o
   * admin já envia o link de "definir senha" pela própria tela da Equipe.
   */
  async criar(dados: DadosUsuario, senhaProvisoria?: string): Promise<AppUser> {
    const senha = senhaProvisoria || 'Mudar@2026'
    const rec = await pb.collection(COLECAO).create({
      email: dados.email,
      password: senha,
      passwordConfirm: senha,
      name: dados.name,
      role: dados.role,
      distribuidor: dados.distribuidor || '',
      cargo: dados.cargo || '',
    })
    return mapear(rec)
  },

  /** Edita um usuário existente (nome, e-mail, papel, distribuidor, cargo). */
  async atualizar(id: string, dados: Partial<DadosUsuario>): Promise<AppUser> {
    const corpo: Record<string, unknown> = {}
    if (dados.name !== undefined) corpo.name = dados.name
    if (dados.email !== undefined) corpo.email = dados.email
    if (dados.role !== undefined) corpo.role = dados.role
    if (dados.distribuidor !== undefined) corpo.distribuidor = dados.distribuidor || ''
    if (dados.cargo !== undefined) corpo.cargo = dados.cargo || ''
    const rec = await pb.collection(COLECAO).update(id, corpo)
    return mapear(rec)
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
