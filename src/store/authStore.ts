/**
 * Store Zustand pour la gestion de l'authentification
 * AVEC support permissions RBAC
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean

  // ===== PERMISSIONS RBAC =====
  permissions: string[]
  role: string
  roleName: string
  isAdmin: boolean
  isSuperAdmin: boolean

  setUser: (user: User | null) => void
  setTokens: (accessToken: string, refreshToken: string) => void
  setAccessToken: (token: string) => void
  login: (user: User, accessToken: string, refreshToken: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void

  // ===== PERMISSIONS METHODS =====
  setPermissions: (permissions: string[], role: string, roleName: string, isAdmin: boolean, isSuperAdmin: boolean) => void
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
}

// Roles avec acces complet (full access sans verification de permissions)
const FULL_ACCESS_ROLES = ['super_admin', 'admin', 'proviseur']

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      // ===== PERMISSIONS RBAC (init) =====
      permissions: [],
      role: '',
      roleName: '',
      isAdmin: false,
      isSuperAdmin: false,

      setUser: (user) => set({ user }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      setAccessToken: (token) => set({ accessToken: token }),

      login: (user, accessToken, refreshToken) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          permissions: [],
          role: '',
          roleName: '',
          isAdmin: false,
          isSuperAdmin: false,
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      // ===== PERMISSIONS METHODS =====

      /**
       * Definit les permissions de l'utilisateur (appele apres getUserPermissions)
       */
      setPermissions: (permissions, role, roleName, isAdmin, isSuperAdmin) =>
        set({
          permissions,
          role,
          roleName,
          isAdmin,
          isSuperAdmin,
        }),

      /**
       * Verifie si l'utilisateur a une permission specifique
       * Super admin / admin / proviseur ont automatiquement toutes les permissions
       */
      hasPermission: (permission) => {
        const state = get()
        // Full access roles bypass
        if (FULL_ACCESS_ROLES.includes(state.role)) return true
        if (state.isSuperAdmin) return true
        // Check specific permission
        return state.permissions.includes(permission) || state.permissions.includes('admin_full')
      },

      /**
       * Verifie si l'utilisateur a AU MOINS UNE des permissions demandees
       */
      hasAnyPermission: (permissions) => {
        const state = get()
        if (FULL_ACCESS_ROLES.includes(state.role)) return true
        if (state.isSuperAdmin) return true
        return permissions.some(p => state.permissions.includes(p) || p === 'admin_full')
      },

      /**
       * Verifie si l'utilisateur a TOUTES les permissions demandees
       */
      hasAllPermissions: (permissions) => {
        const state = get()
        if (FULL_ACCESS_ROLES.includes(state.role)) return true
        if (state.isSuperAdmin) return true
        return permissions.every(p => state.permissions.includes(p) || p === 'admin_full')
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        permissions: state.permissions,
        role: state.role,
        roleName: state.roleName,
        isAdmin: state.isAdmin,
        isSuperAdmin: state.isSuperAdmin,
      }),
    }
  )
)