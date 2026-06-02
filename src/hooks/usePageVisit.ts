import { useEffect, useCallback } from 'react'
import axios from 'axios'

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://192.168.0.101:8001/api/v1'

// Client axios dédié pour les endpoints publics (sans intercepteur d'auth qui redirige sur 401)
const publicClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

export interface VisitData {
  page_path: string
  page_category?: string
  duration_ms?: number
}

/**
 * Enregistre une visite de page dans la base de données.
 * Fonctionne avec OU sans authentification.
 */
export function recordPageVisit(pagePath: string, pageCategory: string = 'public') {
  const stored = localStorage.getItem('auth-storage')
  let userId: number | null = null
  let visitorType = 'anonymous'
  let token: string | null = null

  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      const user = parsed.state?.user
      token = parsed.state?.accessToken || null
      if (user?.id) {
        userId = user.id
        visitorType = user.role || 'authenticated'
      }
    } catch (e) {
      // ignore
    }
  }

  // Session ID persistant par navigateur
  let sessionId = localStorage.getItem('visit_session_id')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem('visit_session_id', sessionId)
  }

  // Détection device/browser/OS
  const ua = navigator.userAgent
  const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(ua)
  const browser = ua.includes('Chrome') ? 'Chrome' :
                  ua.includes('Firefox') ? 'Firefox' :
                  ua.includes('Safari') ? 'Safari' :
                  ua.includes('Edge') ? 'Edge' : 'Other'
  const os = ua.includes('Windows') ? 'Windows' :
             ua.includes('Mac') ? 'macOS' :
             ua.includes('Linux') ? 'Linux' :
             ua.includes('Android') ? 'Android' : 'Other'

  const visitData = {
    page_path: pagePath,
    page_category: pageCategory,
    session_id: sessionId,
    user_id: userId,
    visitor_type: visitorType,
    ip_address: null,
    user_agent: ua,
    device_type: isMobile ? 'mobile' : 'desktop',
    browser: browser,
    os: os,
    duration_ms: 0,
    status_code: 200,
    country: null,
    country_code: null,
    region: null,
    city: null,
    postal_code: null,
    latitude: null,
    longitude: null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    isp: null,
    organization: null,
    asn: null,
    is_mobile: isMobile,
    is_proxy: false,
    is_hosting: false,
    session_first_visit: new Date().toISOString(),
    session_last_activity: new Date().toISOString(),
    session_total_duration_ms: 0,
    pages_in_session: 1,
    timestamp: new Date().toISOString(),
  }

  // Headers conditionnels : token uniquement s'il existe
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Envoi silencieux (ne bloque jamais la navigation)
  publicClient.post('/audit/page-visits', visitData, { headers })
    .catch((err) => {
      console.warn('Page visit recording failed:', err.message || err)
    })
}

/**
 * Hook React : enregistre automatiquement la visite au montage du composant
 */
export function usePageVisit(pagePath: string, pageCategory: string = 'public') {
  useEffect(() => {
    recordPageVisit(pagePath, pageCategory)
  }, [pagePath, pageCategory])
}

/**
 * Wrapper pour les clics de navigation : enregistre la visite puis exécute l'action
 */
export function useTrackedNavigation() {
  return useCallback((pagePath: string, pageCategory: string = 'public', callback?: () => void) => {
    recordPageVisit(pagePath, pageCategory)
    if (callback) callback()
  }, [])
}