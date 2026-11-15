import pb from '@/lib/pocketbase/client'
import { AppUser, UserRole } from '@/types/tsv'

export interface CredenciaisLogin {
  email: string
  password: string
}

export const authService = {
  async login(credenciais: CredenciaisLogin, _lembreMe?: boolean): Promise<AppUser> {
    const auth = await pb
      .collection('users')
      .authWithPassword(credenciais.email, credenciais.password)
    return authService.mapear(auth.record)
  },

  /** Envia o e-mail de recuperação (via SMTP configurado no Skip Cloud). */
  async recuperar(email: string): Promise<void> {
    await pb.collection('users').requestPasswordReset(email)
  },

  logout() {
    pb.authStore.clear()
  },

  /** Usuário logado atualmente (do authStore do PocketBase), ou null. */
  obterUsuarioAtual(): AppUser | null {
    if (!pb.authStore.isValid) return null
    return authService.mapear(pb.authStore.record)
  },

  /** Atualiza o perfil do próprio usuário (nome, cargo). Papel/distribuidor só via Equipe (admin). */
  async atualizarPerfil(
    id: string,
    dados: Partial<{ name: string; cargo: string }>,
  ): Promise<AppUser> {
    const rec = await pb.collection('users').update(id, dados)
    return authService.mapear(rec)
  },

  mapear(rec: any): AppUser {
    return {
      id: rec.id,
      email: rec.email,
      name: rec.name || '',
      avatar: rec.avatar ? pb.files.getURL(rec, rec.avatar) : undefined,
      role: rec.role as UserRole,
      distribuidor: rec.distribuidor || undefined,
      cargo: rec.cargo || undefined,
      created: rec.created,
      updated: rec.updated,
    }
  },
}
