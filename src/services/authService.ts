/**
 * Service d'authentification
 * Ajout de getUserPermissions pour le système RBAC
 */
import { apiService } from './api'
import type { LoginCredentials, LoginResponse, User } from '../types'

export const authService = {
  login: async (credentials: LoginCredentials) => {
    // apiService.post retourne directement la data (pas de .data)
    return await apiService.post<LoginResponse>('/auth/login', credentials)
  },

  loginWith2FA: async (data: { email: string; password: string; totp_code: string }) => {
    return await apiService.post<LoginResponse>('/auth/login/2fa', data)
  },

  refreshToken: async (refreshToken: string) => {
    return await apiService.post<{ access_token: string }>('/auth/refresh', {
      refresh_token: refreshToken,
    })
  },

  logout: async () => {
    return await apiService.post('/auth/logout')
  },

  getCurrentUser: async () => {
    return await apiService.get<User>('/auth/users/me')
  },

  // ==================== PERMISSIONS RBAC ====================
  /**
   * Récupère les permissions de l'utilisateur connecté
   * Endpoint: GET /auth/me/permissions
   * Retourne: { user_id, email, role, role_name, permissions: string[], is_admin, is_super_admin }
   */
  getUserPermissions: async (): Promise<{
    user_id: number
    email: string
    role: string
    role_name: string
    permissions: string[]
    is_admin: boolean
    is_super_admin: boolean
  }> => {
    return await apiService.get('/auth/me/permissions')
  },

  /**
   * Récupère les permissions d'un utilisateur spécifique (admin only)
   * Endpoint: GET /auth/users/{user_id}/permissions
   */
  getUserPermissionsById: async (userId: number): Promise<{
    user_id: number
    email: string
    role: string
    role_name: string
    permissions: string[]
    is_admin: boolean
    is_super_admin: boolean
  }> => {
    return await apiService.get(`/auth/users/${userId}/permissions`)
  },
  // ==========================================================

  setup2FA: async () => {
    return await apiService.post<{ secret: string; qr_code_uri: string; backup_codes: string[] }>('/auth/2fa/setup')
  },

  enable2FA: async (data: { totp_code: string; secret: string }) => {
    return await apiService.post('/auth/2fa/enable', data)
  },

  disable2FA: async (data: { password: string; totp_code?: string }) => {
    return await apiService.post('/auth/2fa/disable', data)
  },

  updatePassword: async (data: { current_password: string; new_password: string; confirm_password: string }) => {
    return await apiService.put('/auth/users/me/password', data)
  },
}