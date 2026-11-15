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

export const usuarioService = {
  /** Lista todos os usuários (somente admin/tsv; a regra da coleção permite ver todos autenticados). */
  async listar(): Promise<AppUser[]> {
    const recs = await pb.collection(COLECAO).getFullList({ sort: '-created' })
    return recs.map(mapear)
  },

  /**
   * Cria um usuário com papel e distribuidor (somente admin/tsv, regra da coleção).
   * A senha inicial é gerada pelo serviço e devolvida ao admin para repasse.
   */
  async criar(dados: {
    email: string
    name: string
    role: UserRole
    distribuidor?: string
    cargo?: string
    senha?: string
  }): Promise<{ usuario: AppUser; senhaInicial: string }> {
    const senhaInicial = dados.senha || gerarSenha()
    const rec = await pb.collection(COLECAO).create({
      email: dados.email,
      password: senhaInicial,
      passwordConfirm: senhaInicial,
      verified: true,
      name: dados.name,
      role: dados.role,
      distribuidor: dados.distribuidor || '',
      cargo: dados.cargo || '',
    })
    return { usuario: mapear(rec), senhaInicial }
  },

  async atualizar(
    id: string,
    dados: Partial<{ name: string; role: UserRole; distribuidor: string; cargo: string }>,
  ): Promise<AppUser> {
    const rec = await pb.collection(COLECAO).update(id, dados)
    return mapear(rec)
  },

  async redefinirSenha(id: string, novaSenha: string): Promise<void> {
    await pb.collection(COLECAO).update(id, { password: novaSenha, passwordConfirm: novaSenha })
  },

  async remover(id: string): Promise<void> {
    await pb.collection(COLECAO).delete(id)
  },
}

/** Gera uma senha inicial legível (sem caracteres ambíguos). */
export function gerarSenha(): string {
  const alfabeto = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const especial = '!@#$%&*'
  let senha = ''
  for (let i = 0; i < 10; i++) {
    senha += alfabeto.charAt(Math.floor(Math.random() * alfabeto.length))
  }
  senha += especial.charAt(Math.floor(Math.random() * especial.length))
  senha += '1'
  return senha
}

export function gerarSenhaTemporaria(): string {
  return `Trocar@${gerarSenha()}`
}
