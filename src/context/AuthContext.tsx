import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { AppUser } from '@/types/tsv'
import { authService } from '@/services/auth'

interface AuthContextType {
  user: AppUser | null
  loading: boolean
  login: (email: string, pass: string) => Promise<AppUser>
  logout: () => void
  refreshUser: () => void
  isTSV: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = () => {
    const currentUser = authService.getCurrentUser()
    setUser(currentUser)
  }

  useEffect(() => {
    refreshUser()
    setLoading(false)
  }, [])

  const login = async (email: string, pass: string) => {
    const loggedUser = await authService.login(email, pass)
    setUser(loggedUser)
    return loggedUser
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
        isTSV: user?.role === 'tsv',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
