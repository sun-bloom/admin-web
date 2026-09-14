import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { AdminUser } from '@/types'
import { API_BASE_URL, authApi } from '@/lib/api'

type AuthError = 'offline' | null

interface AuthContextType {
  user: AdminUser | null
  isLoading: boolean
  authError: AuthError
  lastMeStatus: number | null
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => void
  retry: () => Promise<void>
  isDevMode: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState<AuthError>(null)
  const [lastMeStatus, setLastMeStatus] = useState<number | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      validateToken(token)
    } else {
      setIsLoading(false)
    }
  }, [])

  const validateToken = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })

      if (response.ok) {
        const data = await response.json()
        const nextUser = (data?.user ?? data) as AdminUser
        setUser(nextUser)
        setAuthError(null)
        setLastMeStatus(response.status)
      } else {
        setLastMeStatus(response.status)
        // Only clear token on explicit auth failure.
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('admin_token')
          setAuthError(null)
        } else {
          setAuthError('offline')
        }
        setUser(null)
      }
    } catch (error) {
      // Network / server unreachable: keep token, mark offline.
      setUser(null)
      setAuthError('offline')
      setLastMeStatus(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const result = await authApi.login(email, password)
    if (!result) {
      throw new Error('Login failed')
    }

    setUser(result.user)
    setAuthError(null)
  }

  const loginWithGoogle = async () => {
    const result = await authApi.loginWithGoogle()
    if (!result) {
      throw new Error('Google Login failed')
    }

    setUser(result.user)
    setAuthError(null)
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    setUser(null)
    setAuthError(null)
  }

  const retry = async () => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      setAuthError(null)
      setUser(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    await validateToken(token)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, authError, lastMeStatus, login, loginWithGoogle, logout, retry, isDevMode: false }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
