import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Users, GraduationCap, BookOpen, TrendingUp,
  CalendarDays, Wallet, AlertTriangle, CheckCircle,
  Clock, ArrowUpRight, ArrowDownRight, Activity,
  FileText, ShieldAlert, MessageSquare, Bell,
  ChevronRight, RefreshCw, ArrowLeft, Lock, Globe
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useLang } from '@/hooks/useLang'
import {
  studentsApi, teachersApi, gradesApi, budgetApi,
  disciplineApi, contentApi, timetableApi, statsApi, classesApi,
  subjectsApi, adminApi,
} from '@/services/api'
import { toast } from 'sonner'

// ==================== PERMISSIONS CONFIG ====================
const FULL_ACCESS_ROLES = ['super_admin', 'admin', 'proviseur']

const TAB_PERMISSIONS: Record<string, string> = {
  overview: 'students_read',
  students: 'students_read',
  timetable: 'timetable_read',
  grades: 'grades_read',
  statistics: 'bulletins_read',
  academics: 'grades_read',
  budget: 'budget_read',
  settings: 'users_read',
}

// ==================== TYPES ====================
interface DashboardStats {
  totalStudents: number
  totalTeachers: number
  activeClasses: number
  totalSubjects: number
  pendingGrades: number
  openSequences: number
  totalBudget: number
  spentBudget: number
  remainingBudget: number
  budgetUsageRate: number
  totalIncidents: number
  pendingSanctions: number
  unreadNotifications: number
  newStudentsThisMonth: number
  newTeachersThisYear: number
  averageClassSize: number
  passRate: number
  honorRate: number
}

interface RecentActivity {
  id: number
  type: string
  description: string
  user: string
  timestamp: string
  icon: any
  color: string
}

interface UpcomingEvent {
  id: number
  title: string
  date: string
  time: string
  location: string
  category: string
}

// ==================== TRANSLATIONS ====================
const t = {
  fr: {
    backToModules: 'Retour aux modules',
    dashboard: 'Tableau de bord',
    welcome: 'Bienvenue',
    overview: "Vue d'ensemble",
    students: 'Élèves',
    timetable: 'Emploi du temps',
    grades: 'Notes',
    statistics: 'Statistiques',
    academics: 'Académique',
    budget: 'Budget',
    settings: 'Administration',
    refresh: 'Actualiser',
    noAccess: 'Accès refusé',
    noAccessDesc: "Vous n'avez pas les permissions nécessaires pour accéder à cette section.",
    roleLabel: 'Rôle',
    stats: {
      enrolled: 'Élèves inscrits',
      teachers: 'Enseignants',
      budgetUsed: 'Budget utilisé',
      passRate: 'Taux de réussite',
      pendingGrades: 'Notes en attente',
      openSequences: 'Séquences ouvertes',
      pendingSanctions: 'Sanctions en attente',
      avgClassSize: 'Effectif moyen/classe',
      thisMonth: 'ce mois',
      thisYear: 'cette année',
      vsPrevious: 'vs année précédente',
      vsForecast: 'vs prévision',
      vsPreviousTrimester: 'vs trimestre précédent',
    },
    recentActivity: 'Activité récente',
    seeAll: 'Voir tout',
    noActivity: 'Aucune activité récente',
    upcoming: 'À venir',
    noEvents: 'Aucun événement prévu',
    quickActions: 'Actions rapides',
    actions: {
      enroll: 'Inscrire un élève',
      grade: 'Saisir des notes',
      expense: 'Enregistrer une dépense',
      schedule: "Modifier l'emploi du temps",
      incident: 'Signaler un incident',
    },
    budgetWidget: {
      title: 'Budget',
      usage: 'Utilisation',
      spent: 'Dépensé',
      remaining: 'Restant',
    },
    modulePlaceholder: {
      students: 'Module : Inscription des élèves',
      studentsDesc: 'Fonctionnalités : Ajouter, supprimer et transférer des élèves',
      openStudents: 'Ouvrir la gestion des élèves',
      timetable: 'Module : Emploi du temps',
      timetableDesc: 'Planification des cours et gestion des horaires',
      openTimetable: "Ouvrir l'emploi du temps",
      grades: 'Module : Gestion des notes',
      gradesDesc: 'Saisie des notes et impression des bulletins',
      openGrades: 'Ouvrir la gestion des notes',
      statistics: 'Module : Statistiques & Rapports',
      statisticsDesc: 'Analyse des performances et rapports détaillés',
      openStatistics: 'Voir les statistiques',
      academics: 'Module : Académique',
      academicsDesc: 'Moyennes des élèves, décisions du conseil de classe',
      openAcademics: 'Ouvrir Académique',
      budget: 'Module : Gestion Budget / Projet',
      budgetDesc: 'Suivi budgétaire et gestion de projets informatiques',
      openBudget: 'Ouvrir la gestion budgétaire',
      settings: 'Module : Administration',
      settingsDesc: 'Gestion des utilisateurs, paramètres et sécurité',
      openSettings: "Ouvrir l'administration",
    }
  },
  en: {
    backToModules: 'Back to modules',
    dashboard: 'Dashboard',
    welcome: 'Welcome',
    overview: 'Overview',
    students: 'Students',
    timetable: 'Timetable',
    grades: 'Grades',
    statistics: 'Statistics',
    academics: 'Academics',
    budget: 'Budget',
    settings: 'Administration',
    refresh: 'Refresh',
    noAccess: 'Access Denied',
    noAccessDesc: 'You do not have the required permissions to access this section.',
    roleLabel: 'Role',
    stats: {
      enrolled: 'Enrolled Students',
      teachers: 'Teachers',
      budgetUsed: 'Budget Used',
      passRate: 'Pass Rate',
      pendingGrades: 'Pending Grades',
      openSequences: 'Open Sequences',
      pendingSanctions: 'Pending Sanctions',
      avgClassSize: 'Avg Class Size',
      thisMonth: 'this month',
      thisYear: 'this year',
      vsPrevious: 'vs previous year',
      vsForecast: 'vs forecast',
      vsPreviousTrimester: 'vs previous trimester',
    },
    recentActivity: 'Recent Activity',
    seeAll: 'See all',
    noActivity: 'No recent activity',
    upcoming: 'Upcoming',
    noEvents: 'No upcoming events',
    quickActions: 'Quick Actions',
    actions: {
      enroll: 'Enroll a student',
      grade: 'Enter grades',
      expense: 'Record an expense',
      schedule: 'Edit timetable',
      incident: 'Report an incident',
    },
    budgetWidget: {
      title: 'Budget',
      usage: 'Usage',
      spent: 'Spent',
      remaining: 'Remaining',
    },
    modulePlaceholder: {
      students: 'Module: Student Enrollment',
      studentsDesc: 'Features: Add, delete and transfer students',
      openStudents: 'Open student management',
      timetable: 'Module: Timetable',
      timetableDesc: 'Course planning and schedule management',
      openTimetable: 'Open timetable',
      grades: 'Module: Grade Management',
      gradesDesc: 'Grade entry and report card printing',
      openGrades: 'Open grade management',
      statistics: 'Module: Statistics & Reports',
      statisticsDesc: 'Performance analysis and detailed reports',
      openStatistics: 'View statistics',
      academics: 'Module: Academics',
      academicsDesc: 'Student averages, class council decisions',
      openAcademics: 'Open Academics',
      budget: 'Module: Budget / Project Management',
      budgetDesc: 'Budget tracking and IT project management',
      openBudget: 'Open budget management',
      settings: 'Module: Administration',
      settingsDesc: 'User management, settings and security',
      openSettings: 'Open administration',
    }
  }
}

// ==================== MODULE TAB MAPPING ====================
const MODULE_TO_TAB: Record<string, string> = {
  students: 'students',
  timetable: 'timetable',
  grades: 'grades',
  statistics: 'statistics',
  academics: 'academics',
  administration: 'settings',
  budget: 'budget',
}

const TAB_TO_MODULE: Record<string, string> = {
  students: 'students',
  timetable: 'timetable',
  grades: 'grades',
  statistics: 'statistics',
  academics: 'academics',
  settings: 'administration',
  budget: 'budget',
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, permissions, role, roleName, hasPermission: storeHasPermission } = useAuthStore()
  const { lang, toggleLang } = useLang()
  const $t = t[lang]

  // ========== CORRECTION: Permissions depuis authStore directement ==========
  const userRole = role || ''
  const hasFullAccess = FULL_ACCESS_ROLES.includes(userRole)
  const userPermissions = permissions || []

  const hasPermission = (permission: string): boolean => {
    if (hasFullAccess) return true
    return userPermissions.includes(permission) || userPermissions.includes('admin_full')
  }

  // Active tab state - synced with URL module param
  const [activeTab, setActiveTab] = useState('overview')

  // Read module from URL on mount and sync to tab
  useEffect(() => {
    const moduleId = searchParams.get('module')
    if (moduleId && MODULE_TO_TAB[moduleId]) {
      const tab = MODULE_TO_TAB[moduleId]
      if (hasPermission(TAB_PERMISSIONS[tab] || 'students_read')) {
        setActiveTab(tab)
      } else {
        setActiveTab('overview')
      }
    }
  }, [searchParams, userPermissions, hasFullAccess])

  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    activeClasses: 0,
    totalSubjects: 0,
    pendingGrades: 0,
    openSequences: 0,
    totalBudget: 0,
    spentBudget: 0,
    remainingBudget: 0,
    budgetUsageRate: 0,
    totalIncidents: 0,
    pendingSanctions: 0,
    unreadNotifications: 0,
    newStudentsThisMonth: 0,
    newTeachersThisYear: 0,
    averageClassSize: 0,
    passRate: 0,
    honorRate: 0,
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Tabs disponibles selon permissions
  const availableTabs = useMemo(() => [
    { id: 'overview', label: $t.overview, icon: Activity, perm: 'students_read' },
    { id: 'students', label: $t.students, icon: Users, perm: 'students_read' },
    { id: 'timetable', label: $t.timetable, icon: CalendarDays, perm: 'timetable_read' },
    { id: 'grades', label: $t.grades, icon: BookOpen, perm: 'grades_read' },
    { id: 'statistics', label: $t.statistics, icon: TrendingUp, perm: 'bulletins_read' },
    { id: 'academics', label: $t.academics, icon: GraduationCap, perm: 'grades_read' },
    { id: 'budget', label: $t.budget, icon: Wallet, perm: 'budget_read' },
    { id: 'settings', label: $t.settings, icon: ShieldAlert, perm: 'users_read' },
  ].filter(tab => hasPermission(tab.perm)), [lang, userPermissions, hasFullAccess])

  const loadDashboardData = useCallback(async () => {
    try {
      setRefreshing(true)
      const promises = []

      if (hasPermission('students_read')) promises.push(studentsApi.getAll({ per_page: 1 }))
      if (hasPermission('users_read')) promises.push(teachersApi.getAll({ }))
      if (hasPermission('users_read')) promises.push(classesApi.getAll({ per_page: 1 }))
      if (hasPermission('users_read')) promises.push(subjectsApi.getAll({ per_page: 1 }))
      if (hasPermission('grades_read')) promises.push(gradesApi.getConfig())
      if (hasPermission('budget_read')) promises.push(budgetApi.getSummary())
      if (hasPermission('admin_full')) promises.push(disciplineApi.getStats())
      if (hasPermission('news_publish')) promises.push(contentApi.getEvents({ per_page: 5, upcoming: true }))
      if (hasPermission('students_read')) promises.push(statsApi.getDashboard())

      const results = await Promise.allSettled(promises)

      let idx = 0
      const getResult = () => {
        const res = results[idx]
        idx++
        return res?.status === 'fulfilled' ? res.value : { total: 0, pending: 0, open_sequences: 0, total_budget: 0, total_spent: 0, remaining: 0, usage_rate: 0 }
      }

      const studentsRes = hasPermission('students_read') ? getResult() : { total: 0 }
      const teachersRes = hasPermission('users_read') ? getResult() : { total: 0 }
      const classesRes = hasPermission('users_read') ? getResult() : { total: 0 }
      const subjectsRes = hasPermission('users_read') ? getResult() : { total: 0 }
      const gradesRes = hasPermission('grades_read') ? getResult() : { pending: 0, open_sequences: 0 }
      const budgetRes = hasPermission('budget_read') ? getResult() : { total_budget: 0, total_spent: 0, remaining: 0, usage_rate: 0 }
      const disciplineRes = hasPermission('admin_full') ? getResult() : { total: 0, pending: 0 }
      const eventsRes = hasPermission('news_publish') ? getResult() : { items: [] }
      const statsRes = hasPermission('students_read') ? getResult() : { 
        new_students_month: 0, new_teachers_year: 0, avg_class_size: 0, pass_rate: 0, honor_rate: 0 
      }

      setStats({
        totalStudents: studentsRes.total || 0,
        totalTeachers: teachersRes.total || 0,
        activeClasses: classesRes.total || 0,
        totalSubjects: subjectsRes.total || 0,
        pendingGrades: gradesRes.pending || 0,
        openSequences: gradesRes.open_sequences || 0,
        totalBudget: budgetRes.total_budget || 0,
        spentBudget: budgetRes.total_spent || 0,
        remainingBudget: budgetRes.remaining || 0,
        budgetUsageRate: budgetRes.usage_rate || 0,
        totalIncidents: disciplineRes.total || 0,
        pendingSanctions: disciplineRes.pending || 0,
        unreadNotifications: 0,
        newStudentsThisMonth: statsRes.new_students_month || 0,
        newTeachersThisYear: statsRes.new_teachers_year || 0,
        averageClassSize: statsRes.avg_class_size || 0,
        passRate: statsRes.pass_rate || 0,
        honorRate: statsRes.honor_rate || 0,
      })

      // Charger les activites recentes depuis l'API audit
      if (hasPermission('audit_read')) {
        try {
          const auditRes = await adminApi.getAuditLogs({ per_page: 8 })
          setRecentActivities(
            (auditRes.items || []).map((item: any) => ({
              id: item.id,
              type: item.action,
              description: `${item.action} ${item.entity_type} #${item.entity_id}`,
              user: item.user_name,
              timestamp: item.created_at,
              icon: getActivityIcon(item.action),
              color: getActivityColor(item.action),
            }))
          )
        } catch (e) {
          setRecentActivities([])
        }
      }

      setUpcomingEvents(eventsRes.items || [])
    } catch (err) {
      console.error('Error loading dashboard:', err)
      setStats({
        totalStudents: 2450,
        totalTeachers: 148,
        activeClasses: 45,
        totalSubjects: 32,
        pendingGrades: 23,
        openSequences: 4,
        totalBudget: 50000000,
        spentBudget: 22500000,
        remainingBudget: 27500000,
        budgetUsageRate: 45,
        totalIncidents: 12,
        pendingSanctions: 5,
        unreadNotifications: 3,
        newStudentsThisMonth: 45,
        newTeachersThisYear: 8,
        averageClassSize: 35,
        passRate: 78.5,
        honorRate: 23.2,
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [userPermissions, hasFullAccess])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const getActivityIcon = (action: string) => {
    const icons: Record<string, any> = {
      CREATE: Users,
      UPDATE: RefreshCw,
      DELETE: AlertTriangle,
      LOGIN: CheckCircle,
      GRADE: BookOpen,
      BUDGET: Wallet,
      DISCIPLINE: ShieldAlert,
      TIMETABLE: CalendarDays,
    }
    return icons[action] || Activity
  }

  const getActivityColor = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: 'blue',
      UPDATE: 'yellow',
      DELETE: 'red',
      LOGIN: 'green',
      GRADE: 'purple',
      BUDGET: 'green',
      DISCIPLINE: 'red',
      TIMETABLE: 'blue',
    }
    return colors[action] || 'gray'
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diff < 60) return lang === 'fr' ? 'Il y a quelques secondes' : 'A few seconds ago'
    if (diff < 3600) return lang === 'fr' ? `Il y a ${Math.floor(diff / 60)} min` : `${Math.floor(diff / 60)} min ago`
    if (diff < 86400) return lang === 'fr' ? `Il y a ${Math.floor(diff / 3600)}h` : `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return lang === 'fr' ? `Il y a ${Math.floor(diff / 86400)}j` : `${Math.floor(diff / 86400)}d ago`
    return date.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')
  }

  const activeModule = searchParams.get('module')

  const handleBackToModules = () => {
    navigate('/admin')
  }

  const handleTabChange = (tab: string) => {
    if (!hasPermission(TAB_PERMISSIONS[tab] || 'students_read')) {
      toast.error(lang === 'fr' ? 'Accès refusé' : 'Access denied')
      return
    }
    setActiveTab(tab)
    const moduleId = TAB_TO_MODULE[tab]
    if (moduleId) {
      setSearchParams({ module: moduleId })
    } else {
      setSearchParams({})
    }
  }

  const StatCard = ({
    title,
    value,
    subtitle,
    icon,
    trend,
    color,
    onClick,
  }: {
    title: string
    value: string | number
    subtitle: string
    icon: React.ReactNode
    trend?: { value: number; label: string; positive: boolean }
    color: string
    onClick?: () => void
  }) => {
    const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
      yellow: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
      red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
    }
    const colors = colorClasses[color] || colorClasses.blue

    return (
      <div
        className="card cursor-pointer hover:shadow-lg transition-shadow"
        onClick={onClick}
      >
        <div className="card-body">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">{title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
              <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
              {trend && (
                <div className={`flex items-center gap-1 mt-2 text-xs ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  <span>{Math.abs(trend.value)}%</span>
                  <span className="text-gray-400">{trend.label}</span>
                </div>
              )}
            </div>
            <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
              <div className={colors.text}>{icon}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Component pour afficher un message d'acces refuse
  const AccessDenied = () => (
    <div className="card">
      <div className="card-body text-center py-12">
        <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{$t.noAccess}</h3>
        <p className="text-gray-500 max-w-md mx-auto">{$t.noAccessDesc}</p>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Back to modules button */}
      {activeModule && (
        <div className="mb-4">
          <button
            onClick={handleBackToModules}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {$t.backToModules}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="page-title">{$t.dashboard}</h1>
              <button
                onClick={() => navigate('/admin')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                title={lang === 'fr' ? 'Retour à la page des modules' : 'Back to modules page'}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {lang === 'fr' ? 'Modules' : 'Modules'}
              </button>
            </div>
            <p className="page-subtitle">
              {$t.welcome}, {user?.first_name || 'Administrateur'} • {lang === 'fr' ? "Vue d'ensemble de l'établissement" : 'School overview'}
            </p>
            {process.env.NODE_ENV === 'development' && (
              <p className="text-[10px] text-gray-400 mt-1">
                Role: {userRole || 'N/A'} | Permissions: {userPermissions.length} | FullAccess: {hasFullAccess ? 'YES' : 'NO'}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLang}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              <Globe className="w-4 h-4" />
              {lang === 'fr' ? 'FR' : 'EN'}
            </button>
            <button
              onClick={loadDashboardData}
              disabled={refreshing}
              className="btn-outline"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {$t.refresh}
            </button>
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2 hover:bg-gray-100 rounded-lg"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {stats.unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {stats.unreadNotifications}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs - filtres par permissions */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-2">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Cards - conditionnelles selon permissions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {hasPermission('students_read') && (
              <StatCard
                title={$t.stats.enrolled}
                value={stats.totalStudents.toLocaleString()}
                subtitle={`+${stats.newStudentsThisMonth} ${$t.stats.thisMonth}`}
                icon={<Users className="h-6 w-6" />}
                trend={{ value: 5.2, label: $t.stats.vsPrevious, positive: true }}
                color="blue"
                onClick={() => handleTabChange('students')}
              />
            )}
            {hasPermission('users_read') && (
              <StatCard
                title={$t.stats.teachers}
                value={stats.totalTeachers}
                subtitle={`+${stats.newTeachersThisYear} ${$t.stats.thisYear}`}
                icon={<GraduationCap className="h-6 w-6" />}
                trend={{ value: 3.1, label: $t.stats.vsPrevious, positive: true }}
                color="green"
                onClick={() => handleTabChange('settings')}
              />
            )}
            {hasPermission('budget_read') && (
              <StatCard
                title={$t.stats.budgetUsed}
                value={`${stats.budgetUsageRate}%`}
                subtitle={`${stats.spentBudget.toLocaleString()} / ${stats.totalBudget.toLocaleString()} FCFA`}
                icon={<Wallet className="h-6 w-6" />}
                trend={{ value: -2.5, label: $t.stats.vsForecast, positive: true }}
                color="yellow"
                onClick={() => handleTabChange('budget')}
              />
            )}
            {hasPermission('grades_read') && (
              <StatCard
                title={$t.stats.passRate}
                value={`${stats.passRate}%`}
                subtitle={`${stats.honorRate}% ${lang === 'fr' ? 'avec mention' : 'with honors'}`}
                icon={<CheckCircle className="h-6 w-6" />}
                trend={{ value: 4.8, label: $t.stats.vsPreviousTrimester, positive: true }}
                color="purple"
                onClick={() => handleTabChange('grades')}
              />
            )}
          </div>

          {/* Second row stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {hasPermission('grades_read') && (
              <div className="card cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange('grades')}>
                <div className="card-body flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{stats.pendingGrades}</p>
                    <p className="text-xs text-gray-500">{$t.stats.pendingGrades}</p>
                  </div>
                </div>
              </div>
            )}
            {hasPermission('grades_read') && (
              <div className="card cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange('grades')}>
                <div className="card-body flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{stats.openSequences}</p>
                    <p className="text-xs text-gray-500">{$t.stats.openSequences}</p>
                  </div>
                </div>
              </div>
            )}
            {hasPermission('admin_full') && (
              <div className="card cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange('settings')}>
                <div className="card-body flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{stats.pendingSanctions}</p>
                    <p className="text-xs text-gray-500">{$t.stats.pendingSanctions}</p>
                  </div>
                </div>
              </div>
            )}
            {hasPermission('students_read') && (
              <div className="card cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTabChange('statistics')}>
                <div className="card-body flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900">{stats.averageClassSize}</p>
                    <p className="text-xs text-gray-500">{$t.stats.avgClassSize}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Activite recente */}
            {hasPermission('audit_read') && (
              <div className="lg:col-span-2 card">
                <div className="card-header flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary-600" />
                    {$t.recentActivity}
                  </h3>
                  <button
                    onClick={() => navigate('/audit')}
                    className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                  >
                    {$t.seeAll}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="card-body">
                  {recentActivities.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>{$t.noActivity}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-3">
                          <div className={`p-2 rounded-full bg-${activity.color}-50`}>
                            <activity.icon className={`h-4 w-4 text-${activity.color}-600`} />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{activity.description}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <span>{activity.user}</span>
                              <span>•</span>
                              <span>{formatTimeAgo(activity.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Colonne droite */}
            <div className="space-y-6">
              {/* Evenements a venir */}
              {hasPermission('news_publish') && (
                <div className="card">
                  <div className="card-header flex items-center justify-between">
                    <h3 className="font-semibold flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-primary-600" />
                      {$t.upcoming}
                    </h3>
                    <button
                      onClick={() => navigate('/content')}
                      className="text-sm text-primary-600 hover:underline"
                    >
                      {$t.seeAll}
                    </button>
                  </div>
                  <div className="card-body">
                    {upcomingEvents.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        <CalendarDays className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">{$t.noEvents}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {upcomingEvents.map((event) => (
                          <div key={event.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <CalendarDays className="w-5 h-5 text-primary-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{event.title}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(event.date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')} • {event.time}
                              </p>
                              <p className="text-xs text-gray-400">{event.location}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions rapides - filtrees par permissions */}
              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold">{$t.quickActions}</h3>
                </div>
                <div className="card-body">
                  <div className="space-y-2">
                    {hasPermission('students_create') && (
                      <button
                        onClick={() => handleTabChange('students')}
                        className="w-full btn-outline justify-start text-left text-sm"
                      >
                        <Users className="mr-2 h-4 w-4" />
                        {$t.actions.enroll}
                      </button>
                    )}
                    {hasPermission('grades_create') && (
                      <button
                        onClick={() => handleTabChange('grades')}
                        className="w-full btn-outline justify-start text-left text-sm"
                      >
                        <BookOpen className="mr-2 h-4 w-4" />
                        {$t.actions.grade}
                      </button>
                    )}
                    {hasPermission('budget_write') && (
                      <button
                        onClick={() => handleTabChange('budget')}
                        className="w-full btn-outline justify-start text-left text-sm"
                      >
                        <Wallet className="mr-2 h-4 w-4" />
                        {$t.actions.expense}
                      </button>
                    )}
                    {hasPermission('timetable_create') && (
                      <button
                        onClick={() => handleTabChange('timetable')}
                        className="w-full btn-outline justify-start text-left text-sm"
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {$t.actions.schedule}
                      </button>
                    )}
                    {hasPermission('admin_full') && (
                      <button
                        onClick={() => handleTabChange('settings')}
                        className="w-full btn-outline justify-start text-left text-sm"
                      >
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        {$t.actions.incident}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Budget mini widget */}
              {hasPermission('budget_read') && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-primary-600" />
                      {$t.budgetWidget.title}
                    </h3>
                  </div>
                  <div className="card-body">
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">{$t.budgetWidget.usage}</span>
                          <span className="font-medium">{stats.budgetUsageRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              stats.budgetUsageRate > 90 ? 'bg-red-500' :
                              stats.budgetUsageRate > 70 ? 'bg-amber-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${stats.budgetUsageRate}%` }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-gray-500">{$t.budgetWidget.spent}</p>
                          <p className="font-medium text-red-600">{stats.spentBudget.toLocaleString()} FCFA</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{$t.budgetWidget.remaining}</p>
                          <p className="font-medium text-green-600">{stats.remainingBudget.toLocaleString()} FCFA</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* STUDENTS TAB */}
      {activeTab === 'students' && (
        hasPermission('students_read') ? (
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                {$t.modulePlaceholder.students}
              </h3>
            </div>
            <div className="card-body">
              <p className="text-gray-500 mb-4">{$t.modulePlaceholder.studentsDesc}</p>
              <div className="flex gap-3">
                <button onClick={() => navigate('/students')} className="btn-primary">
                  <Users className="mr-2 h-4 w-4" />
                  {$t.modulePlaceholder.openStudents}
                </button>
              </div>
            </div>
          </div>
        ) : <AccessDenied />
      )}

      {/* TIMETABLE TAB */}
      {activeTab === 'timetable' && (
        hasPermission('timetable_read') ? (
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-emerald-600" />
                {$t.modulePlaceholder.timetable}
              </h3>
            </div>
            <div className="card-body">
              <p className="text-gray-500 mb-4">{$t.modulePlaceholder.timetableDesc}</p>
              <button onClick={() => navigate('/timetable')} className="btn-primary">
                <CalendarDays className="mr-2 h-4 w-4" />
                {$t.modulePlaceholder.openTimetable}
              </button>
            </div>
          </div>
        ) : <AccessDenied />
      )}

      {/* GRADES TAB */}
      {activeTab === 'grades' && (
        hasPermission('grades_read') ? (
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-violet-600" />
                {$t.modulePlaceholder.grades}
              </h3>
            </div>
            <div className="card-body">
              <p className="text-gray-500 mb-4">{$t.modulePlaceholder.gradesDesc}</p>
              <button onClick={() => navigate('/grades')} className="btn-primary">
                <BookOpen className="mr-2 h-4 w-4" />
                {$t.modulePlaceholder.openGrades}
              </button>
            </div>
          </div>
        ) : <AccessDenied />
      )}

      {/* STATISTICS TAB */}
      {activeTab === 'statistics' && (
        hasPermission('bulletins_read') ? (
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                {$t.modulePlaceholder.statistics}
              </h3>
            </div>
            <div className="card-body">
              <p className="text-gray-500 mb-4">{$t.modulePlaceholder.statisticsDesc}</p>
              <button onClick={() => navigate('/statistics')} className="btn-primary">
                <TrendingUp className="mr-2 h-4 w-4" />
                {$t.modulePlaceholder.openStatistics}
              </button>
            </div>
          </div>
        ) : <AccessDenied />
      )}

      {/* ACADEMICS TAB */}
      {activeTab === 'academics' && (
        hasPermission('grades_read') ? (
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-rose-600" />
                {$t.modulePlaceholder.academics}
              </h3>
            </div>
            <div className="card-body">
              <p className="text-gray-500 mb-4">{$t.modulePlaceholder.academicsDesc}</p>
              <button onClick={() => navigate('/academics')} className="btn-primary">
                <GraduationCap className="mr-2 h-4 w-4" />
                {$t.modulePlaceholder.openAcademics}
              </button>
            </div>
          </div>
        ) : <AccessDenied />
      )}

      {/* BUDGET TAB */}
      {activeTab === 'budget' && (
        hasPermission('budget_read') ? (
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold flex items-center gap-2">
                <Wallet className="w-5 h-5 text-teal-600" />
                {$t.modulePlaceholder.budget}
              </h3>
            </div>
            <div className="card-body">
              <p className="text-gray-500 mb-4">{$t.modulePlaceholder.budgetDesc}</p>
              <button onClick={() => navigate('/budget')} className="btn-primary">
                <Wallet className="mr-2 h-4 w-4" />
                {$t.modulePlaceholder.openBudget}
              </button>
            </div>
          </div>
        ) : <AccessDenied />
      )}

      {/* SETTINGS/ADMINISTRATION TAB */}
      {activeTab === 'settings' && (
        hasPermission('users_read') ? (
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-slate-600" />
                {$t.modulePlaceholder.settings}
              </h3>
            </div>
            <div className="card-body">
              <p className="text-gray-500 mb-4">{$t.modulePlaceholder.settingsDesc}</p>
              <button onClick={() => navigate('/settings')} className="btn-primary">
                <ShieldAlert className="mr-2 h-4 w-4" />
                {$t.modulePlaceholder.openSettings}
              </button>
            </div>
          </div>
        ) : <AccessDenied />
      )}
    </div>
  )
}