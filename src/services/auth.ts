import pb from '@/lib/pocketbase/client'
import { AppUser } from '@/types/tsv'

export const authService = {
  getCurrentUser(): AppUser | null {
    if (!pb.authStore.isValid || !pb.authStore.record) {
      return null
    }
    const rec = pb.authStore.record
    return {
      id: rec.id,
      email: rec.email,
      name: (rec.name as string) || (rec.email as string).split('@')[0],
      avatar: rec.avatar ? pb.files.getURL(rec, rec.avatar as string) : undefined,
      role: (rec.role as 'tsv' | 'vendedor') || 'vendedor',
      distribuidora: rec.distribuidora as string | undefined,
      cargo: rec.cargo as string | undefined,
      created: rec.created as string,
      updated: rec.updated as string,
    }
  },

  isTSV(): boolean {
    const user = this.getCurrentUser()
    return user?.role === 'tsv'
  },

  async login(email: string, pass: string): Promise<AppUser> {
    const authData = await pb.collection('users').authWithPassword(email, pass)
    const rec = authData.record
    return {
      id: rec.id,
      email: rec.email,
      name: (rec.name as string) || (rec.email as string).split('@')[0],
      avatar: rec.avatar ? pb.files.getURL(rec, rec.avatar as string) : undefined,
      role: (rec.role as 'tsv' | 'vendedor') || 'vendedor',
      distribuidora: rec.distribuidora as string | undefined,
      cargo: rec.cargo as string | undefined,
      created: rec.created as string,
      updated: rec.updated as string,
    }
  },

  logout(): void {
    pb.authStore.clear()
  },

  async listarEquipe(): Promise<AppUser[]> {
    const records = await pb.collection('users').getFullList({
      sort: '-created',
    })
    return records.map((rec) => ({
      id: rec.id,
      email: rec.email,
      name: (rec.name as string) || (rec.email as string).split('@')[0],
      avatar: rec.avatar ? pb.files.getURL(rec, rec.avatar as string) : undefined,
      role: (rec.role as 'tsv' | 'vendedor') || 'vendedor',
      distribuidora: rec.distribuidora as string | undefined,
      cargo: rec.cargo as string | undefined,
      created: rec.created as string,
      updated: rec.updated as string,
    }))
  },

  async cadastrarUsuario(dados: {
    email: string
    name: string
    password?: string
    role: 'tsv' | 'vendedor'
    distribuidora?: string
    cargo?: string
  }): Promise<AppUser> {
    const defaultPassword = dados.password || 'Skip@Pass'
    const rec = await pb.collection('users').create({
      email: dados.email,
      name: dados.name,
      password: defaultPassword,
      passwordConfirm: defaultPassword,
      role: dados.role,
      distribuidora: dados.distribuidora,
      cargo: dados.cargo,
      emailVisibility: true,
    })
    return {
      id: rec.id,
      email: rec.email,
      name: (rec.name as string) || (rec.email as string).split('@')[0],
      role: (rec.role as 'tsv' | 'vendedor') || 'vendedor',
      distribuidora: rec.distribuidora as string | undefined,
      cargo: rec.cargo as string | undefined,
      created: rec.created as string,
      updated: rec.updated as string,
    }
  },

  async atualizarUsuario(id: string, dados: Partial<AppUser>): Promise<void> {
    await pb.collection('users').update(id, dados)
  },
}
