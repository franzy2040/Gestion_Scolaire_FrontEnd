import { useState, useEffect, useCallback } from 'react'
import {
  FileSearch, Filter, Download, Calendar, User, Activity,
  AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Search, RefreshCw, Eye, Shield, BarChart3, TrendingUp,
  Monitor, Smartphone, Globe, Clock, Users, MousePointerClick,
  ArrowUpRight, ArrowDownRight, FileBarChart, PieChart as PieChartIcon,
  MapPin, Hash
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { adminApi } from '@/services/api'
import { toast } from 'sonner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts'

// ==================== TYPES ====================
interface AuditLog {
  id: number
  user_id?: number
  user_name?: string
  user_email?: string
  action?: string
  entity_type?: string
  entity_id?: number
  entity_name?: string
  details?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at?: string
  severity?: 'info' | 'warning' | 'error' | 'critical'
}

interface PageVisitLog {
  id: number
  visitor_type?: string
  user_id?: number
  user_name?: string
  session_id?: string
  page_path?: string
  page_url?: string
  page_category?: string
  ip_address?: string
  user_agent?: string
  device_type?: string
  browser?: string
  os?: string
  country?: string
  country_code?: string
  city?: string
  region?: string
  latitude?: number
  longitude?: number
  duration_ms?: number
  time_spent_seconds?: number
  status_code?: number
  is_mobile?: boolean
  is_proxy?: boolean
  is_hosting?: boolean
  timestamp?: string
  created_at?: string
}

interface AuditStats {
  total_logs: number
  today_logs: number
  warning_logs: number
  error_logs: number
  critical_logs: number
  top_users: Array<{ user_name: string; count: number }>
  top_actions: Array<{ action: string; count: number }>
  action_breakdown?: Record<string, number>
  user_activity?: Array<{ date: string; count: number }>
  entity_breakdown?: Record<string, number>
  severity_breakdown?: Record<string, number>
}

interface AnalyticsDashboard {
  total_visits_today: number
  total_visits_week: number
  total_visits_month: number
  unique_visitors_today: number
  top_pages: Array<{ page_path: string; priority_score: number; visit_count: number }>
  device_breakdown: Record<string, number>
  browser_breakdown: Record<string, number>
  referrer_breakdown?: Record<string, number>
  visits_by_hour?: Array<{ hour: number; count: number }>
  visits_by_day?: Array<{ day: string; count: number }>
}

const ACTION_LABELS: Record<string, string> = {
  'CREATE': 'Création',
  'UPDATE': 'Modification',
  'DELETE': 'Suppression',
  'LOGIN': 'Connexion',
  'LOGOUT': 'Déconnexion',
  'EXPORT': 'Export',
  'IMPORT': 'Import',
  'APPROVE': 'Approbation',
  'REJECT': 'Rejet',
  'VIEW': 'Consultation',
  'DOWNLOAD': 'Téléchargement',
  'PRINT': 'Impression',
  'TRANSFER': 'Transfert',
  'EXCLUDE': 'Exclusion',
  'REINTEGRATE': 'Réintégration',
  'RESIGN': 'Démission',
  'TWO_FA_ENABLED': '2FA Activé',
  'TWO_FA_DISABLED': '2FA Désactivé',
  'PASSWORD_CHANGE': 'Changement MDP',
  'CALCULATE_AVERAGES': 'Calcul Moyennes',
  'PUBLISH_GRADES': 'Publication Notes',
  'BULK_ENTRY': 'Saisie en Masse',
}

const ENTITY_LABELS: Record<string, string> = {
  'student': 'Élève',
  'teacher': 'Enseignant',
  'grade': 'Note',
  'timetable': 'Emploi du temps',
  'discipline': 'Discipline',
  'budget': 'Budget',
  'expense': 'Dépense',
  'user': 'Utilisateur',
  'class': 'Classe',
  'subject': 'Matière',
  'content': 'Contenu',
  'setting': 'Paramètre',
  'sequence': 'Séquence',
  'student_average': 'Moyenne',
  'farm': 'Ferme',
  'livestock': 'Bétail',
  'employee': 'Employé',
  'inventory': 'Inventaire',
  'purchase': 'Achat',
  'sale': 'Vente',
}

const SEVERITY_CONFIG = {
  info: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle, chartColor: '#3b82f6' },
  warning: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: AlertTriangle, chartColor: '#f59e0b' },
  error: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, chartColor: '#ef4444' },
  critical: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Shield, chartColor: '#8b5cf6' },
}

const COLORS = ['#1e3a8a', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function AuditPage() {
  const { user } = useAuthStore()

  // ─── LOGS STATE ───
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [logsExpanded, setLogsExpanded] = useState(true)
  const [logsDisplayLimit, setLogsDisplayLimit] = useState(10)

  // ─── PAGE VISITS STATE ───
  const [pageVisits, setPageVisits] = useState<PageVisitLog[]>([])
  const [pageVisitTotal, setPageVisitTotal] = useState(0)
  const [pageVisitPage, setPageVisitPage] = useState(1)
  const [pageVisitPerPage] = useState(20)

  // ─── ANALYTICS STATE ───
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null)

  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [perPage] = useState(20)
  const [total, setTotal] = useState(0)

  // ─── FILTERS ───
  const [filters, setFilters] = useState({
    user_id: '',
    action: '',
    entity_type: '',
    severity: '',
    date_from: '',
    date_to: '',
    search: '',
  })

  // ─── PAGE VISIT FILTERS ───
  const [visitFilters, setVisitFilters] = useState({
    user_id: '',
    page_category: '',
    visitor_type: '',
    device_type: '',
    country: '',
    city: '',
    date_from: '',
    date_to: '',
    search: '',
  })

  const [showFilters, setShowFilters] = useState(false)
  const [showVisitFilters, setShowVisitFilters] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [selectedVisit, setSelectedVisit] = useState<PageVisitLog | null>(null)
  const [activeView, setActiveView] = useState<'logs' | 'page_visits' | 'analytics'>('logs')
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'7' | '30' | '90'>('30')

  // ─── LOAD LOGS ───
  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = { page, per_page: perPage }
      if (filters.action) params.action = filters.action
      if (filters.entity_type) params.entity_type = filters.entity_type
      if (filters.severity) params.severity = filters.severity
      if (filters.date_from) params.date_from = filters.date_from
      if (filters.date_to) params.date_to = filters.date_to
      if (filters.user_id) params.user_id = parseInt(filters.user_id)
      if (filters.search) params.search = filters.search

      const response = await adminApi.getAuditLogs(params)
      setLogs(response?.data || [])
      setTotal(response?.total || 0)
    } catch (err) {
      toast.error('Erreur lors du chargement des logs')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, perPage, filters])

  // ─── LOAD PAGE VISITS ───
  const loadPageVisits = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = { 
        page: pageVisitPage, 
        per_page: pageVisitPerPage 
      }
      if (visitFilters.user_id) params.user_id = parseInt(visitFilters.user_id)
      if (visitFilters.page_category) params.page_category = visitFilters.page_category
      if (visitFilters.visitor_type) params.visitor_type = visitFilters.visitor_type
      if (visitFilters.device_type) params.device_type = visitFilters.device_type
      if (visitFilters.country) params.country = visitFilters.country
      if (visitFilters.city) params.city = visitFilters.city
      if (visitFilters.date_from) params.date_from = visitFilters.date_from
      if (visitFilters.date_to) params.date_to = visitFilters.date_to
      if (visitFilters.search) params.search = visitFilters.search

      const response = await adminApi.getPageVisits(params)
      setPageVisits(response?.data || [])
      setPageVisitTotal(response?.total || 0)
    } catch (err) {
      toast.error('Erreur lors du chargement des visites')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [pageVisitPage, pageVisitPerPage, visitFilters])

  const loadStats = useCallback(async () => {
    try {
      const response = await adminApi.getAuditStatistics(parseInt(analyticsPeriod))
      setStats(response)
    } catch (err) {
      console.error('Error loading stats:', err)
      setStats({
        total_logs: total,
        today_logs: 0,
        warning_logs: 0,
        error_logs: 0,
        critical_logs: 0,
        top_users: [],
        top_actions: [],
      })
    }
  }, [total, analyticsPeriod])

  const loadAnalytics = useCallback(async () => {
    try {
      const response = await adminApi.getAnalyticsDashboard()
      setAnalytics(response)
    } catch (err) {
      console.error('Error loading analytics:', err)
    }
  }, [])

  // ─── EFFECTS ───
  useEffect(() => {
    if (activeView === 'logs') {
      loadLogs()
    } else if (activeView === 'page_visits') {
      loadPageVisits()
    } else if (activeView === 'analytics') {
      loadStats()
      loadAnalytics()
    }
  }, [activeView, loadLogs, loadPageVisits, loadStats, loadAnalytics])

  // Auto-refresh analytics every 30 seconds when visible
  useEffect(() => {
    if (activeView !== 'analytics') return
    const interval = setInterval(() => {
      loadStats()
      loadAnalytics()
    }, 30000)
    return () => clearInterval(interval)
  }, [activeView, loadStats, loadAnalytics])

  const handleExport = async () => {
    try {
      const dataStr = JSON.stringify({ 
        logs, 
        page_visits: pageVisits,
        stats, 
        analytics, 
        exported_at: new Date().toISOString() 
      }, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit_export_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Export JSON réussi')
    } catch (err) {
      toast.error("Erreur lors de l'export")
    }
  }

  const clearFilters = () => {
    setFilters({ user_id: '', action: '', entity_type: '', severity: '', date_from: '', date_to: '', search: '' })
    setPage(1)
  }

  const clearVisitFilters = () => {
    setVisitFilters({ user_id: '', page_category: '', visitor_type: '', device_type: '', country: '', city: '', date_from: '', date_to: '', search: '' })
    setPageVisitPage(1)
  }

  const getSeverityBadge = (severity: string) => {
    const config = SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.info
    const IconComponent = config.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <IconComponent className="w-3 h-3" />
        {severity?.toUpperCase() || 'INFO'}
      </span>
    )
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  // Prepare chart data from stats
  const actionChartData = stats?.action_breakdown
    ? Object.entries(stats.action_breakdown).map(([action, count]) => ({
        name: ACTION_LABELS[action] || action,
        value: count,
        raw: action,
      }))
    : stats?.top_actions?.map((a) => ({
        name: ACTION_LABELS[a.action] || a.action,
        value: a.count,
        raw: a.action,
      })) || []

  const userChartData = stats?.top_users?.map((u) => ({
    name: u.user_name,
    value: u.count,
  })) || []

  const severityChartData = stats?.severity_breakdown
    ? Object.entries(stats.severity_breakdown).map(([sev, count]) => ({
        name: sev.toUpperCase(),
        value: count,
        color: SEVERITY_CONFIG[sev as keyof typeof SEVERITY_CONFIG]?.chartColor || '#6b7280',
      }))
    : [
        { name: 'INFO', value: (total || 0) - (stats?.warning_logs || 0) - (stats?.error_logs || 0) - (stats?.critical_logs || 0), color: '#3b82f6' },
        { name: 'WARNING', value: stats?.warning_logs || 0, color: '#f59e0b' },
        { name: 'ERROR', value: stats?.error_logs || 0, color: '#ef4444' },
        { name: 'CRITICAL', value: stats?.critical_logs || 0, color: '#8b5cf6' },
      ]

  const visitsTrendData = analytics?.visits_by_day || [
    { day: 'Lun', count: analytics?.total_visits_week ? Math.round(analytics.total_visits_week / 7) : 0 },
    { day: 'Mar', count: analytics?.total_visits_week ? Math.round(analytics.total_visits_week / 7) : 0 },
    { day: 'Mer', count: analytics?.total_visits_week ? Math.round(analytics.total_visits_week / 7) : 0 },
    { day: 'Jeu', count: analytics?.total_visits_week ? Math.round(analytics.total_visits_week / 7) : 0 },
    { day: 'Ven', count: analytics?.total_visits_week ? Math.round(analytics.total_visits_week / 7) : 0 },
    { day: 'Sam', count: analytics?.total_visits_week ? Math.round(analytics.total_visits_week / 7 * 0.5) : 0 },
    { day: 'Dim', count: analytics?.total_visits_week ? Math.round(analytics.total_visits_week / 7 * 0.3) : 0 },
  ]

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title flex items-center gap-3">
              <FileSearch className="h-7 w-7 text-primary-600" />
              Journal d'Audit & Analytics
            </h1>
            <p className="page-subtitle">
              Traçabilité complète et analytics de la plateforme
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1 mr-2">
              <button onClick={() => setActiveView('logs')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeView === 'logs' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'}`}>
                <FileSearch className="w-4 h-4 inline mr-1" />Logs
              </button>
              <button onClick={() => setActiveView('page_visits')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeView === 'page_visits' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'}`}>
                <MousePointerClick className="w-4 h-4 inline mr-1" />Visites
              </button>
              <button onClick={() => setActiveView('analytics')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeView === 'analytics' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'}`}>
                <BarChart3 className="w-4 h-4 inline mr-1" />Analytics
              </button>
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className="btn-outline">
              <Filter className="mr-2 h-4 w-4" />Filtres
            </button>
            <button onClick={handleExport} className="btn-outline">
              <Download className="mr-2 h-4 w-4" />Exporter
            </button>
            <button onClick={() => { 
              if (activeView === 'logs') loadLogs(); 
              else if (activeView === 'page_visits') loadPageVisits();
              else { loadStats(); loadAnalytics(); }
            }} className="btn-outline">
              <RefreshCw className="mr-2 h-4 w-4" />Actualiser
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats - Always visible */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_logs || total || 0}</p>
              <p className="text-sm text-gray-500">Total logs</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <MousePointerClick className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{analytics?.total_visits_today || 0}</p>
              <p className="text-sm text-gray-500">Visites aujourd'hui</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.warning_logs || 0}</p>
              <p className="text-sm text-gray-500">Avertissements</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{(stats?.error_logs || 0) + (stats?.critical_logs || 0)}</p>
              <p className="text-sm text-gray-500">Erreurs + Critiques</p>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== PAGE VISITS VIEW ==================== */}
      {activeView === 'page_visits' && (
        <>
          {/* Page Visit Filters */}
          {showFilters && (
            <div className="card mb-6">
              <div className="card-body">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="label">Catégorie</label>
                    <select value={visitFilters.page_category} onChange={(e) => setVisitFilters({ ...visitFilters, page_category: e.target.value })} className="input">
                      <option value="">Toutes</option>
                      <option value="home">Accueil</option>
                      <option value="dashboard">Tableau de bord</option>
                      <option value="students">Élèves</option>
                      <option value="teachers">Enseignants</option>
                      <option value="grades">Notes</option>
                      <option value="timetable">Emploi du temps</option>
                      <option value="budget">Budget</option>
                      <option value="admin">Administration</option>
                      <option value="login">Connexion</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Type visiteur</label>
                    <select value={visitFilters.visitor_type} onChange={(e) => setVisitFilters({ ...visitFilters, visitor_type: e.target.value })} className="input">
                      <option value="">Tous</option>
                      <option value="authenticated">Authentifié</option>
                      <option value="anonymous">Anonyme</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Appareil</label>
                    <select value={visitFilters.device_type} onChange={(e) => setVisitFilters({ ...visitFilters, device_type: e.target.value })} className="input">
                      <option value="">Tous</option>
                      <option value="desktop">Desktop</option>
                      <option value="mobile">Mobile</option>
                      <option value="tablet">Tablette</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Pays</label>
                    <input type="text" placeholder="Ex: Cameroun" value={visitFilters.country} onChange={(e) => setVisitFilters({ ...visitFilters, country: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Ville</label>
                    <input type="text" placeholder="Ex: Bafoussam" value={visitFilters.city} onChange={(e) => setVisitFilters({ ...visitFilters, city: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Date début</label>
                    <input type="date" value={visitFilters.date_from} onChange={(e) => setVisitFilters({ ...visitFilters, date_from: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Date fin</label>
                    <input type="date" value={visitFilters.date_to} onChange={(e) => setVisitFilters({ ...visitFilters, date_to: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Recherche</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="text" placeholder="Page, IP, session..." value={visitFilters.search} onChange={(e) => setVisitFilters({ ...visitFilters, search: e.target.value })} className="input pl-10" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={clearVisitFilters} className="btn-outline">Réinitialiser</button>
                  <button onClick={() => { setPageVisitPage(1); loadPageVisits() }} className="btn-primary">Appliquer</button>
                </div>
              </div>
            </div>
          )}

          {/* Page Visits Table */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <MousePointerClick className="w-5 h-5 text-primary-600" />
                  Visites de pages
                </h3>
                <p className="text-sm text-gray-500">{pageVisitTotal} visites trouvées</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Page</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Visiteur</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Appareil</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Localisation</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Durée</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">IP</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                        <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-gray-300" />
                        Chargement...
                      </td>
                    </tr>
                  ) : pageVisits.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                        <MousePointerClick className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>Aucune visite trouvée</p>
                      </td>
                    </tr>
                  ) : (
                    pageVisits.map((visit) => (
                      <tr key={visit.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(visit.timestamp)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-xs">
                            <p className="text-sm font-medium text-gray-900 truncate" title={visit.page_path || visit.page_url}>
                              {visit.page_path || visit.page_url || '-'}
                            </p>
                            <p className="text-xs text-gray-500">{visit.page_category || 'other'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{visit.user_name || visit.visitor_type || 'Anonyme'}</p>
                              <p className="text-xs text-gray-500">ID: {visit.user_id || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {visit.device_type?.toLowerCase() === 'mobile' ? (
                              <Smartphone className="w-4 h-4 text-gray-400" />
                            ) : (
                              <Monitor className="w-4 h-4 text-gray-400" />
                            )}
                            <div>
                              <p className="text-sm text-gray-700">{visit.device_type || '-'}</p>
                              <p className="text-xs text-gray-500">{visit.browser || '-'} / {visit.os || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-700">{visit.city || '-'}</p>
                              <p className="text-xs text-gray-500">{visit.country || '-'} {visit.country_code || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDuration(visit.duration_ms)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">
                          {visit.ip_address || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setSelectedVisit(visit)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600" title="Voir détails">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pageVisitTotal > pageVisitPerPage && (
              <div className="card-footer flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Affichage de {(pageVisitPage - 1) * pageVisitPerPage + 1} à {Math.min(pageVisitPage * pageVisitPerPage, pageVisitTotal)} sur {pageVisitTotal}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPageVisitPage(Math.max(1, pageVisitPage - 1))} disabled={pageVisitPage === 1} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50">Précédent</button>
                  <span className="text-sm text-gray-600">Page {pageVisitPage} / {Math.ceil(pageVisitTotal / pageVisitPerPage)}</span>
                  <button onClick={() => setPageVisitPage(Math.min(Math.ceil(pageVisitTotal / pageVisitPerPage), pageVisitPage + 1))} disabled={pageVisitPage >= Math.ceil(pageVisitTotal / pageVisitPerPage)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50">Suivant</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ==================== LOGS VIEW ==================== */}
      {activeView === 'logs' && (
        <>
          {/* Filters Panel */}
          {showFilters && (
            <div className="card mb-6">
              <div className="card-body">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Action</label>
                    <select value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })} className="input">
                      <option value="">Toutes</option>
                      {Object.entries(ACTION_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Type d'entité</label>
                    <select value={filters.entity_type} onChange={(e) => setFilters({ ...filters, entity_type: e.target.value })} className="input">
                      <option value="">Toutes</option>
                      {Object.entries(ENTITY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Sévérité</label>
                    <select value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })} className="input">
                      <option value="">Toutes</option>
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Date début</label>
                    <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Date fin</label>
                    <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Recherche</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="text" placeholder="Utilisateur, action..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="input pl-10" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={clearFilters} className="btn-outline">Réinitialiser</button>
                  <button onClick={() => { setPage(1); loadLogs() }} className="btn-primary">Appliquer</button>
                </div>
              </div>
            </div>
          )}

          {/* Logs Table - Collapsible with 10 items limit */}
          <div className="card">
            <div 
              className="card-header flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setLogsExpanded(!logsExpanded)}
            >
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">Historique des actions</h3>
                <p className="text-sm text-gray-500">{total} entrées trouvées</p>
              </div>
              <button className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                {logsExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>

            {logsExpanded && (
              <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Utilisateur</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Entité</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sévérité</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Détails</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                        <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-gray-300" />
                        Chargement...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                        <FileSearch className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p>Aucun log trouvé</p>
                      </td>
                    </tr>
                  ) : (
                    logs.slice(0, logsDisplayLimit).map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(log.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{log.user_name || 'Système'}</p>
                              <p className="text-xs text-gray-500">{log.user_email || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {ACTION_LABELS[log.action || ''] || log.action || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {ENTITY_LABELS[log.entity_type || ''] || log.entity_type || '-'}
                          {log.entity_id ? <span className="text-gray-400 ml-1">#{log.entity_id}</span> : null}
                        </td>
                        <td className="px-4 py-3">
                          {getSeverityBadge(log.severity || 'info')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                          {log.entity_name || '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => setSelectedLog(log)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600" title="Voir détails">
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

                {/* Show More / Show Less */}
                {logs.length > 10 && (
                  <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-center">
                    <button
                      onClick={() => setLogsDisplayLimit(logsDisplayLimit === 10 ? logs.length : 10)}
                      className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                    >
                      {logsDisplayLimit === 10 ? (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Afficher plus ({logs.length - 10} restants)
                        </>
                      ) : (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Réduire
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Pagination */}
                {total > perPage && (
                  <div className="card-footer flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Affichage de {(page - 1) * perPage + 1} à {Math.min(page * perPage, total)} sur {total}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50">Précédent</button>
                  <span className="text-sm text-gray-600">Page {page} / {Math.ceil(total / perPage)}</span>
                  <button onClick={() => setPage(Math.min(Math.ceil(total / perPage), page + 1))} disabled={page >= Math.ceil(total / perPage)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50">Suivant</button>
                </div>
              </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* ==================== ANALYTICS VIEW ==================== */}
      {activeView === 'analytics' && (
        <div className="space-y-6">
          {/* Period selector */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              Tableau de bord analytics
            </h2>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { value: '7', label: '7 jours' },
                { value: '30', label: '30 jours' },
                { value: '90', label: '90 jours' },
              ].map((p) => (
                <button
                  key={p.value}
                  onClick={() => setAnalyticsPeriod(p.value as any)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    analyticsPeriod === p.value ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visit Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card border-l-4 border-l-green-500">
              <div className="card-body">
                <p className="text-sm text-gray-500 mb-1">Visites aujourd'hui</p>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-bold text-gray-900">{analytics?.total_visits_today || 0}</p>
                  <ArrowUpRight className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-xs text-gray-400 mt-1">{analytics?.unique_visitors_today || 0} visiteurs uniques</p>
              </div>
            </div>
            <div className="card border-l-4 border-l-blue-500">
              <div className="card-body">
                <p className="text-sm text-gray-500 mb-1">Cette semaine</p>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-bold text-gray-900">{analytics?.total_visits_week || 0}</p>
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-xs text-gray-400 mt-1">~{Math.round((analytics?.total_visits_week || 0) / 7)}/jour</p>
              </div>
            </div>
            <div className="card border-l-4 border-l-indigo-500">
              <div className="card-body">
                <p className="text-sm text-gray-500 mb-1">Ce mois</p>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-bold text-gray-900">{analytics?.total_visits_month || 0}</p>
                  <TrendingUp className="w-5 h-5 text-indigo-500" />
                </div>
                <p className="text-xs text-gray-400 mt-1">~{Math.round((analytics?.total_visits_month || 0) / 30)}/jour</p>
              </div>
            </div>
            <div className="card border-l-4 border-l-purple-500">
              <div className="card-body">
                <p className="text-sm text-gray-500 mb-1">Taux de rebond</p>
                <div className="flex items-end justify-between">
                  <p className="text-3xl font-bold text-gray-900">
                    {analytics?.total_visits_today && analytics?.unique_visitors_today
                      ? Math.round(((analytics.total_visits_today - analytics.unique_visitors_today) / analytics.total_visits_today) * 100)
                      : 0}%
                  </p>
                  <ArrowDownRight className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-xs text-gray-400 mt-1">Visites multiples</p>
              </div>
            </div>
          </div>

          {/* Charts Row 1: Actions + Users */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Actions Bar Chart */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileBarChart className="w-5 h-5 text-primary-600" />
                  Actions les plus fréquentes
                </h3>
              </div>
              <div className="card-body">
                {actionChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={actionChartData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#1e3a8a" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-gray-400">
                    <FileBarChart className="w-12 h-12 mb-2" />
                    <p>Aucune donnée d'action</p>
                  </div>
                )}
              </div>
            </div>

            {/* Users Activity Bar Chart */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-600" />
                  Utilisateurs les plus actifs
                </h3>
              </div>
              <div className="card-body">
                {userChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={userChartData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex flex-col items-center justify-center text-gray-400">
                    <Users className="w-12 h-12 mb-2" />
                    <p>Aucune donnée utilisateur</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Charts Row 2: Severity Pie + Visits Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Severity Distribution */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-primary-600" />
                  Répartition par sévérité
                </h3>
              </div>
              <div className="card-body flex items-center justify-center">
                {severityChartData.some((d) => d.value > 0) ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={severityChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, value }) => (value > 0 ? `${name}: ${value}` : '')}
                      >
                        {severityChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex flex-col items-center justify-center text-gray-400">
                    <PieChartIcon className="w-12 h-12 mb-2" />
                    <p>Aucune donnée de sévérité</p>
                  </div>
                )}
              </div>
            </div>

            {/* Visits Trend */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary-600" />
                  Tendance des visites
                </h3>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={visitsTrendData}>
                    <defs>
                      <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke="#1e3a8a" fillOpacity={1} fill="url(#colorVisits)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Device & Browser Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Breakdown */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-primary-600" />
                  Appareils
                </h3>
              </div>
              <div className="card-body">
                {analytics?.device_breakdown && Object.entries(analytics.device_breakdown).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(analytics.device_breakdown).map(([device, count], idx) => (
                      <div key={device} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS[idx % COLORS.length] + '20' }}>
                          {device.toLowerCase().includes('mobile') ? <Smartphone className="w-4 h-4" style={{ color: COLORS[idx % COLORS.length] }} /> : <Monitor className="w-4 h-4" style={{ color: COLORS[idx % COLORS.length] }} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize text-gray-700">{device}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (count / (analytics.total_visits_week || 1)) * 100)}%`, backgroundColor: COLORS[idx % COLORS.length] }} />
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 w-10 text-right">
                          {Math.round((count / (analytics.total_visits_week || 1)) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <Monitor className="w-12 h-12 mb-2" />
                    <p>Aucune donnée d'appareil</p>
                  </div>
                )}
              </div>
            </div>

            {/* Browser Breakdown */}
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary-600" />
                  Navigateurs
                </h3>
              </div>
              <div className="card-body">
                {analytics?.browser_breakdown && Object.entries(analytics.browser_breakdown).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(analytics.browser_breakdown).map(([browser, count], idx) => (
                      <div key={browser} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS[idx % COLORS.length] + '20' }}>
                          <Globe className="w-4 h-4" style={{ color: COLORS[idx % COLORS.length] }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">{browser}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (count / (analytics.total_visits_week || 1)) * 100)}%`, backgroundColor: COLORS[idx % COLORS.length] }} />
                          </div>
                        </div>
                        <span className="text-xs text-gray-500 w-10 text-right">
                          {Math.round((count / (analytics.total_visits_week || 1)) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <Globe className="w-12 h-12 mb-2" />
                    <p>Aucune donnée de navigateur</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Pages */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-600" />
                Pages les plus visitées
              </h3>
            </div>
            <div className="card-body">
              {analytics?.top_pages && analytics.top_pages.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="pb-2">Rang</th>
                        <th className="pb-2">Page</th>
                        <th className="pb-2 text-right">Visites</th>
                        <th className="pb-2 text-right">Score priorité</th>
                        <th className="pb-2">Graphique</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {analytics.top_pages.map((p, idx) => {
                        const maxVisits = analytics.top_pages[0]?.visit_count || 1
                        return (
                          <tr key={idx}>
                            <td className="py-3 text-gray-500 font-mono">#{idx + 1}</td>
                            <td className="py-3 text-gray-700 font-medium">{p.page_path}</td>
                            <td className="py-3 text-right font-medium">{p.visit_count}</td>
                            <td className="py-3 text-right text-gray-500">{p.priority_score?.toFixed(2)}</td>
                            <td className="py-3 w-32">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="h-2 rounded-full bg-primary-500" style={{ width: `${Math.min(100, (p.visit_count / maxVisits) * 100)}%` }} />
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <TrendingUp className="w-12 h-12 mb-2" />
                  <p>Aucune donnée de page visitée</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== LOG DETAIL MODAL ==================== */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full animate-bounce-in max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Détails du log #{selectedLog.id}</h3>
                <p className="text-sm text-gray-500">{formatDate(selectedLog.created_at)}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Utilisateur</label>
                  <p className="text-sm font-medium">{selectedLog.user_name || 'Système'}</p>
                  <p className="text-xs text-gray-500">{selectedLog.user_email || ''} {selectedLog.user_id ? `(ID: ${selectedLog.user_id})` : ''}</p>
                </div>
                <div>
                  <label className="label">Action</label>
                  <p className="text-sm font-medium">{ACTION_LABELS[selectedLog.action || ''] || selectedLog.action || 'N/A'}</p>
                </div>
                <div>
                  <label className="label">Entité</label>
                  <p className="text-sm font-medium">{ENTITY_LABELS[selectedLog.entity_type || ''] || selectedLog.entity_type || '-'}</p>
                  <p className="text-xs text-gray-500">ID: {selectedLog.entity_id || '-'} — {selectedLog.entity_name || ''}</p>
                </div>
                <div>
                  <label className="label">Sévérité</label>
                  <div className="mt-1">{getSeverityBadge(selectedLog.severity || 'info')}</div>
                </div>
              </div>
              <div>
                <label className="label">Détails techniques</label>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                  <p><strong>IP:</strong> {selectedLog.ip_address || '-'}</p>
                  <p><strong>User-Agent:</strong> {selectedLog.user_agent || '-'}</p>
                  <p className="mt-2"><strong>Payload:</strong></p>
                  <pre className="mt-1 text-gray-600">{JSON.stringify(selectedLog.details || {}, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PAGE VISIT DETAIL MODAL ==================== */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedVisit(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full animate-bounce-in max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Détails de la visite #{selectedVisit.id}</h3>
                <p className="text-sm text-gray-500">{formatDate(selectedVisit.timestamp)}</p>
              </div>
              <button onClick={() => setSelectedVisit(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Page</label>
                  <p className="text-sm font-medium">{selectedVisit.page_path || selectedVisit.page_url || '-'}</p>
                  <p className="text-xs text-gray-500">Catégorie: {selectedVisit.page_category || 'other'}</p>
                </div>
                <div>
                  <label className="label">Visiteur</label>
                  <p className="text-sm font-medium">{selectedVisit.user_name || selectedVisit.visitor_type || 'Anonyme'}</p>
                  <p className="text-xs text-gray-500">ID: {selectedVisit.user_id || 'N/A'} | Session: {selectedVisit.session_id?.substring(0, 8) || '-'}...</p>
                </div>
                <div>
                  <label className="label">Appareil</label>
                  <p className="text-sm font-medium">{selectedVisit.device_type || '-'}</p>
                  <p className="text-xs text-gray-500">{selectedVisit.browser || '-'} / {selectedVisit.os || '-'}</p>
                </div>
                <div>
                  <label className="label">Durée</label>
                  <p className="text-sm font-medium">{formatDuration(selectedVisit.duration_ms)}</p>
                  <p className="text-xs text-gray-500">Status: {selectedVisit.status_code || 200}</p>
                </div>
                <div>
                  <label className="label">Localisation</label>
                  <p className="text-sm font-medium">{selectedVisit.city || '-'}, {selectedVisit.country || '-'}</p>
                  <p className="text-xs text-gray-500">{selectedVisit.region || '-'} | {selectedVisit.country_code || '-'}</p>
                </div>
                <div>
                  <label className="label">IP</label>
                  <p className="text-sm font-medium font-mono">{selectedVisit.ip_address || '-'}</p>
                  <p className="text-xs text-gray-500">
                    {selectedVisit.is_mobile ? 'Mobile ' : ''}
                    {selectedVisit.is_proxy ? 'Proxy ' : ''}
                    {selectedVisit.is_hosting ? 'Hosting' : ''}
                  </p>
                </div>
              </div>
              {selectedVisit.latitude && selectedVisit.longitude && (
                <div>
                  <label className="label">Coordonnées GPS</label>
                  <p className="text-sm font-medium font-mono">{selectedVisit.latitude}, {selectedVisit.longitude}</p>
                </div>
              )}
              <div>
                <label className="label">User-Agent</label>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
                  <p>{selectedVisit.user_agent || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}