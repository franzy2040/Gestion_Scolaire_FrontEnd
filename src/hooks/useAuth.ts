/**
 * Hook personnalisé pour l'authentification
 * AVEC remplissage des permissions RBAC dans authStore + DEBUG LOGS
 */
import { useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, login, logout, setLoading, setPermissions } = useAuthStore()

  const handleLogin = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      console.log('[useAuth] 🔑 Tentative login...', email)
      const response = await authService.login({ email, password })
      console.log('[useAuth] 📥 Réponse login:', response)

      // Si 2FA requis
      if ('requires_2fa' in response && response.requires_2fa) {
        console.log('[useAuth] 🔒 2FA requis')
        return { requires2FA: true, email }
      }

      // === RÉCUPÉRER LES PERMISSIONS APRÈS LOGIN ===
      let permissions: string[] = []
      let role = ''
      let roleName = ''
      let isAdmin = false
      let isSuperAdmin = false

      try {
        console.log('[useAuth] 🔍 Appel getUserPermissions...')
        const permData = await authService.getUserPermissions()
        console.log('[useAuth] ✅ Permissions reçues:', permData)

        permissions = permData.permissions || []
        role = permData.role || ''
        roleName = permData.role_name || ''
        isAdmin = permData.is_admin || false
        isSuperAdmin = permData.is_super_admin || false
      } catch (permErr: any) {
        console.error('[useAuth] ❌ Erreur getUserPermissions:', permErr?.response?.status, permErr?.response?.data || permErr.message)
        // Fallback: extraire le rôle du user retourné par login
        role = response.user?.role || ''
        roleName = response.user?.role_name || ''
        isAdmin = role === 'admin' || role === 'super_admin'
        isSuperAdmin = role === 'super_admin'
        console.log('[useAuth] ⚠️ Fallback role depuis user:', role)
      }

      console.log('[useAuth] 📝 setPermissions appelé avec:', { permissions, role, roleName, isAdmin, isSuperAdmin })

      // Stocker les permissions dans authStore
      setPermissions(permissions, role, roleName, isAdmin, isSuperAdmin)

      // Login dans le store (user + tokens)
      login(response.user, response.access_token, response.refresh_token)

      console.log('[useAuth] ✅ Login terminé, authStore mis à jour')

      toast.success('Connexion réussie!')
      return { success: true }
    } catch (error: any) {
      console.error('[useAuth] ❌ Erreur login:', error?.response?.data || error.message)
      const msg = error?.response?.data?.detail || 'Échec de la connexion'
      toast.error(msg)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [login, setLoading, setPermissions])

  const handleLogin2FA = useCallback(async (email: string, password: string, totpCode: string) => {
    setLoading(true)
    try {
      console.log('[useAuth] 🔑 Tentative login 2FA...')
      const response = await authService.loginWith2FA({ email, password, totp_code: totpCode })
      console.log('[useAuth] 📥 Réponse login 2FA:', response)

      let permissions: string[] = []
      let role = ''
      let roleName = ''
      let isAdmin = false
      let isSuperAdmin = false

      try {
        console.log('[useAuth] 🔍 Appel getUserPermissions après 2FA...')
        const permData = await authService.getUserPermissions()
        console.log('[useAuth] ✅ Permissions reçues (2FA):', permData)

        permissions = permData.permissions || []
        role = permData.role || ''
        roleName = permData.role_name || ''
        isAdmin = permData.is_admin || false
        isSuperAdmin = permData.is_super_admin || false
      } catch (permErr: any) {
        console.error('[useAuth] ❌ Erreur getUserPermissions 2FA:', permErr?.response?.status, permErr?.response?.data || permErr.message)
        role = response.user?.role || ''
        roleName = response.user?.role_name || ''
        isAdmin = role === 'admin' || role === 'super_admin'
        isSuperAdmin = role === 'super_admin'
      }

      setPermissions(permissions, role, roleName, isAdmin, isSuperAdmin)
      login(response.user, response.access_token, response.refresh_token)

      toast.success('Connexion réussie!')
      return { success: true }
    } catch (error: any) {
      console.error('[useAuth] ❌ Erreur login 2FA:', error?.response?.data || error.message)
      const msg = error?.response?.data?.detail || 'Code 2FA invalide'
      toast.error(msg)
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [login, setLoading, setPermissions])

  const handleLogout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // Ignorer les erreurs de logout
    }
    logout()
    toast.success('Déconnexion réussie')
  }, [logout])

  // Utilise les méthodes du authStore pour les permissions
  const hasPermission = useCallback((permission: string) => {
    return useAuthStore.getState().hasPermission(permission)
  }, [])

  const hasAnyPermission = useCallback((permissions: string[]) => {
    return useAuthStore.getState().hasAnyPermission(permissions)
  }, [])

  const hasAllPermissions = useCallback((permissions: string[]) => {
    return useAuthStore.getState().hasAllPermissions(permissions)
  }, [])

  const isAdmin = useAuthStore.getState().isAdmin
  const isSuperAdmin = useAuthStore.getState().isSuperAdmin
  const isTeacher = user?.role_name === 'enseignant'
  const isParent = user?.role_name === 'parent'

  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    isSuperAdmin,
    isTeacher,
    isParent,
    handleLogin,
    handleLogin2FA,
    handleLogout,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  }
}