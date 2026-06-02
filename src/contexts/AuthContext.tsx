import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '@/services/api'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hasPermission: (module: string, action: 'read' | 'write' | 'delete' | 'export' | 'import') => boolean
  isSuperAdmin: boolean
  isAdmin: boolean
  isTeacher: boolean
  isSecretary: boolean
  isAccountant: boolean
  isReadonly: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token')
      if (token) {
        try {
          const userData = await authApi.me()
          setUser(userData)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('user')
        }
      }
      setIsLoading(false)
    }
    initAuth()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    localStorage.setItem('access_token', response.access_token)
    localStorage.setItem('user', JSON.stringify(response.user))
    setUser(response.user)
  }, [])

  const logout = useCallback(() => {
    authApi.logout().catch(() => {})
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    setUser(null)
    window.location.href = '/login'
  }, [])

  const hasPermission = useCallback((module: string, action: 'read' | 'write' | 'delete' | 'export' | 'import') => {
    if (!user) return false
    if (user.role === 'superadmin') return true

    const permissions = JSON.parse(localStorage.getItem('permissions') || '[]')
    const perm = permissions.find((p: any) => p.role === user.role && p.module === module)
    if (!perm) return false

    switch (action) {
      case 'read': return perm.can_read
      case 'write': return perm.can_write
      case 'delete': return perm.can_delete
      case 'export': return perm.can_export
      case 'import': return perm.can_import
      default: return false
    }
  }, [user])

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasPermission,
    isSuperAdmin: user?.role === 'superadmin',
    isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
    isTeacher: user?.role === 'teacher',
    isSecretary: user?.role === 'secretary',
    isAccountant: user?.role === 'accountant',
    isReadonly: user?.role === 'readonly',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
