import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Calendar, FileText, BarChart3, GraduationCap,
  Shield, Wallet, ArrowRight, Layers, Activity,
  School, Bell, ChevronRight, TrendingUp, LogOut,
  Globe, Menu, X, CalendarCheck, ChevronDown, Lock,
  Newspaper, FileSearch
} from 'lucide-react'
import { useLang } from '@/hooks/useLang'
import { useAuthStore } from '@/store/authStore'
import { schoolApi } from '@/services/api'
import { authService } from '@/services/authService'
import { toast } from 'sonner'

// ==================== PERMISSIONS & ROLES ====================
const MODULE_PERMISSIONS: Record<string, { view: string; features: string[] }> = {
  students: { view: 'students_read', features: ['students_create', 'students_update', 'students_delete'] },
  timetable: { view: 'timetable_read', features: ['timetable_create'] },
  grades: { view: 'grades_read', features: ['grades_create', 'grades_update', 'grades_approve'] },
  statistics: { view: 'bulletins_read', features: ['bulletins_export'] },
  academics: { view: 'grades_read', features: ['grades_approve'] },
  administration: { view: 'users_read', features: ['users_create', 'users_update', 'users_delete', 'admin_full'] },
  budget: { view: 'budget_read', features: ['budget_write', 'budget_approve'] },
  content: { view: 'news_publish', features: ['news_create', 'events_create', 'forum_create'] },
  audit: { view: 'audit_read', features: [] },
  discipline: { view: 'admin_full', features: [] }
}

const FULL_ACCESS_ROLES = ['super_admin', 'admin', 'proviseur']

// ==================== TRANSLATIONS ====================
const t = {
  fr: {
    welcome: "Bienvenue",
    subtitle: "Tableau de bord administratif - Lycee Bilingue de Baleng",
    modules: "Modules disponibles",
    moduleCount: "modules",
    logout: "Deconnexion",
    menu: "Menu",
    academicYear: "Annee scolaire",
    selectYear: "Selectionner une annee",
    currentYear: "Annee en cours",
    year: "Annee",
    noAccess: "Acces refuse",
    noAccessDesc: "Vous n'avez pas les permissions necessaires pour acceder a ce module.",
    module1: { title: "Inscription des eleves", desc: "Ajouter, supprimer et transferer des eleves", features: ["Ajout eleve", "Suppression", "Transfert"], badge: "Gestion" },
    module2: { title: "Emploi du temps", desc: "Planification des cours et gestion des horaires", features: ["Planification", "Horaires", "Salles"], badge: "Planification" },
    module3: { title: "Gestion des notes", desc: "Saisie des notes et impression des bulletins", features: ["Saisie notes", "Bulletins", "Releves"], badge: "Evaluation" },
    module4: { title: "Statistiques & Rapports", desc: "Analyse des performances et rapports detailles", features: ["Statistiques", "Rapports", "Graphiques"], badge: "Analyse" },
    module5: { title: "Academics", desc: "Moyennes, decisions du conseil de classe", features: ["Moyennes", "Conseil", "Decisions"], badge: "Academique" },
    module6: { title: "Administration", desc: "Gestion des utilisateurs, parametres et securite", features: ["Utilisateurs", "Parametres", "Securite"], badge: "Admin" },
    module7: { title: "Gestion Budget / Projet", desc: "Suivi budgetaire et gestion de projets informatiques", features: ["Budget", "Depenses", "Projets"], badge: "Finances" },
    module8: { title: "Contenu & Communication", desc: "Gestion des actualites, evenements et forum", features: ["Actualites", "Evenements", "Forum"], badge: "Communication" },
    module9: { title: "Audit & Logs", desc: "Journal d'activites et traces de securite", features: ["Logs", "Tracabilite", "Rapports"], badge: "Securite" },
    access: "Acceder",
    accessDenied: "Acces restreint",
    recentActivity: "Activite recente",
    stats: { students: "Eleves inscrits", teachers: "Enseignants", classes: "Classes", revenue: "Budget annuel" },
    quickActions: "Actions rapides",
    actions: { newStudent: "Nouvel eleve", newGrade: "Nouvelle note", schedule: "Emploi du temps", report: "Rapport" },
    permissionsLoading: "Chargement des permissions...",
    roleLabel: "Role"
  },
  en: {
    welcome: "Welcome",
    subtitle: "Administrative Dashboard - Baleng Bilingual High School",
    modules: "Available Modules",
    moduleCount: "modules",
    logout: "Logout",
    menu: "Menu",
    academicYear: "Academic Year",
    selectYear: "Select a year",
    currentYear: "Current Year",
    year: "Year",
    noAccess: "Access Denied",
    noAccessDesc: "You do not have the required permissions to access this module.",
    module1: { title: "Student Enrollment", desc: "Add, delete and transfer students", features: ["Add student", "Delete", "Transfer"], badge: "Management" },
    module2: { title: "Timetable", desc: "Course planning and schedule management", features: ["Planning", "Schedules", "Rooms"], badge: "Planning" },
    module3: { title: "Grade Management", desc: "Grade entry and report card printing", features: ["Grade entry", "Report cards", "Transcripts"], badge: "Evaluation" },
    module4: { title: "Statistics & Reports", desc: "Performance analysis and detailed reports", features: ["Statistics", "Reports", "Charts"], badge: "Analysis" },
    module5: { title: "Academics", desc: "Averages, class council decisions", features: ["Averages", "Council", "Decisions"], badge: "Academic" },
    module6: { title: "Administration", desc: "User management, settings and security", features: ["Users", "Settings", "Security"], badge: "Admin" },
    module7: { title: "Budget / Project Management", desc: "Budget tracking and IT project management", features: ["Budget", "Expenses", "Projects"], badge: "Finance" },
    module8: { title: "Content & Communication", desc: "News, events and forum management", features: ["News", "Events", "Forum"], badge: "Communication" },
    module9: { title: "Audit & Logs", desc: "Activity journal and security traces", features: ["Logs", "Traceability", "Reports"], badge: "Security" },
    access: "Access",
    accessDenied: "Restricted Access",
    recentActivity: "Recent Activity",
    stats: { students: "Enrolled Students", teachers: "Teachers", classes: "Classes", revenue: "Annual Budget" },
    quickActions: "Quick Actions",
    actions: { newStudent: "New Student", newGrade: "New Grade", schedule: "Timetable", report: "Report" },
    permissionsLoading: "Loading permissions...",
    roleLabel: "Role"
  }
}

const ALL_MODULES = [
  { id: 'students', icon: Users, color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50', textColor: 'text-blue-600', borderColor: 'border-blue-200', hoverBorder: 'hover:border-blue-400', transKey: 'module1', route: '/students' },
  { id: 'timetable', icon: Calendar, color: 'from-emerald-500 to-emerald-600', bgColor: 'bg-emerald-50', textColor: 'text-emerald-600', borderColor: 'border-emerald-200', hoverBorder: 'hover:border-emerald-400', transKey: 'module2', route: '/timetable' },
  { id: 'grades', icon: FileText, color: 'from-violet-500 to-violet-600', bgColor: 'bg-violet-50', textColor: 'text-violet-600', borderColor: 'border-violet-200', hoverBorder: 'hover:border-violet-400', transKey: 'module3', route: '/grades' },
  { id: 'statistics', icon: BarChart3, color: 'from-amber-500 to-amber-600', bgColor: 'bg-amber-50', textColor: 'text-amber-600', borderColor: 'border-amber-200', hoverBorder: 'hover:border-amber-400', transKey: 'module4', route: '/discipline' },
  { id: 'academics', icon: GraduationCap, color: 'from-rose-500 to-rose-600', bgColor: 'bg-rose-50', textColor: 'text-rose-600', borderColor: 'border-rose-200', hoverBorder: 'hover:border-rose-400', transKey: 'module5', route: '/academics/specialties' },
  { id: 'administration', icon: Shield, color: 'from-slate-500 to-slate-600', bgColor: 'bg-slate-50', textColor: 'text-slate-600', borderColor: 'border-slate-200', hoverBorder: 'hover:border-slate-400', transKey: 'module6', route: '/settings' },
  { id: 'budget', icon: Wallet, color: 'from-teal-500 to-teal-600', bgColor: 'bg-teal-50', textColor: 'text-teal-600', borderColor: 'border-teal-200', hoverBorder: 'hover:border-teal-400', transKey: 'module7', route: '/budget' },
  { id: 'content', icon: Newspaper, color: 'from-indigo-500 to-indigo-600', bgColor: 'bg-indigo-50', textColor: 'text-indigo-600', borderColor: 'border-indigo-200', hoverBorder: 'hover:border-indigo-400', transKey: 'module8', route: '/content' },
  { id: 'audit', icon: FileSearch, color: 'from-cyan-500 to-cyan-600', bgColor: 'bg-cyan-50', textColor: 'text-cyan-600', borderColor: 'border-cyan-200', hoverBorder: 'hover:border-cyan-400', transKey: 'module9', route: '/audit' }
]

const STATS = [
  { icon: Users, labelKey: 'students', value: '1,247', color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: School, labelKey: 'teachers', value: '68', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: Layers, labelKey: 'classes', value: '32', color: 'text-violet-600', bg: 'bg-violet-50' },
  { icon: Wallet, labelKey: 'revenue', value: '45M FCFA', color: 'text-teal-600', bg: 'bg-teal-50' }
]

const ACTIVITIES = [
  { icon: Users, text: 'Nouvel eleve inscrit : Jean-Pierre M.', time: '2 min', color: 'text-blue-500' },
  { icon: FileText, text: 'Bulletins du 2eme trimestre publies', time: '15 min', color: 'text-violet-500' },
  { icon: Calendar, text: 'Emploi du temps mis a jour', time: '1h', color: 'text-emerald-500' },
  { icon: Wallet, text: 'Nouvelle depense : 250,000 FCFA', time: '2h', color: 'text-teal-500' }
]

interface AcademicYear {
  id: number
  label: string
  start_date: string
  end_date: string
  is_current: boolean
}

const ACADEMIC_YEAR_KEY = 'lybibal-academic-year'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { user, logout, permissions: storePermissions, role: storeRole, setPermissions } = useAuthStore()
  const { lang, toggleLang } = useLang()
  const $t = t[lang]

  const [hoveredModule, setHoveredModule] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // ========== PERMISSIONS STATE (local + store fallback) ==========
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [userRole, setUserRole] = useState('')
  const [permissionsLoading, setPermissionsLoading] = useState(true)

  // Academic years state
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null)
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false)
  const [yearsLoading, setYearsLoading] = useState(true)

  // ========== CHARGER LES PERMISSIONS (depuis authStore OU API) ==========
  useEffect(() => {
    const loadPermissions = async () => {
      setPermissionsLoading(true)

      // 1. Essayer d'abord le authStore (si déjà rempli par useAuth.ts)
      if (storePermissions && storePermissions.length > 0) {
        console.log('[Dashboard] ✅ Permissions depuis authStore:', storePermissions)
        setUserPermissions(storePermissions)
        setUserRole(storeRole || '')
        setPermissionsLoading(false)
        return
      }

      // 2. Fallback: fetch depuis l'API directement
      try {
        console.log('[Dashboard] 🔍 authStore vide, fetch depuis API...')
        const permData = await authService.getUserPermissions()
        console.log('[Dashboard] ✅ Permissions API:', permData)

        const perms = permData.permissions || []
        const role = permData.role || ''

        setUserPermissions(perms)
        setUserRole(role)

        // Mettre à jour authStore aussi
        setPermissions(
          perms,
          role,
          permData.role_name || '',
          permData.is_admin || false,
          permData.is_super_admin || false
        )
      } catch (err: any) {
        console.error('[Dashboard] ❌ Erreur fetch permissions:', err?.response?.status, err?.response?.data || err.message)
        setUserPermissions([])
        setUserRole('')
      } finally {
        setPermissionsLoading(false)
      }
    }

    loadPermissions()
  }, [storePermissions, storeRole, setPermissions])

  const hasFullAccess = FULL_ACCESS_ROLES.includes(userRole)

  const canAccessModule = (moduleId: string): boolean => {
    if (hasFullAccess) return true
    const perms = MODULE_PERMISSIONS[moduleId]
    if (!perms) return false
    return userPermissions.includes(perms.view) || userPermissions.includes('admin_full')
  }

  const hasPermission = (permission: string): boolean => {
    if (hasFullAccess) return true
    return userPermissions.includes(permission) || userPermissions.includes('admin_full')
  }

  const visibleModules = useMemo(() => {
    return ALL_MODULES.filter(module => canAccessModule(module.id))
  }, [userPermissions, hasFullAccess])

  // Load academic years
  useEffect(() => {
    const loadAcademicYears = async () => {
      try {
        const schoolsRes = await schoolApi.getSchools()
        const schools = Array.isArray(schoolsRes) ? schoolsRes : schoolsRes?.data || []

        if (schools.length > 0) {
          const schoolId = schools[0].id
          const yearsRes = await schoolApi.getAcademicYears(schoolId)
          const years = Array.isArray(yearsRes) ? yearsRes : yearsRes?.data || []

          if (years.length > 0) {
            setAcademicYears(years)
            const storedYearId = localStorage.getItem(ACADEMIC_YEAR_KEY)
            if (storedYearId) {
              const found = years.find((y: AcademicYear) => y.id.toString() === storedYearId)
              if (found) {
                setSelectedYear(found)
              } else {
                const current = years.find((y: AcademicYear) => y.is_current) || years[0]
                setSelectedYear(current)
                localStorage.setItem(ACADEMIC_YEAR_KEY, current.id.toString())
              }
            } else {
              const current = years.find((y: AcademicYear) => y.is_current) || years[0]
              setSelectedYear(current)
              localStorage.setItem(ACADEMIC_YEAR_KEY, current.id.toString())
            }
          }
        } else {
          const currentYear = new Date().getFullYear()
          const defaultYears: AcademicYear[] = [
            { id: 1, label: `${currentYear}-${currentYear + 1}`, start_date: `${currentYear}-09-01`, end_date: `${currentYear + 1}-06-30`, is_current: true },
            { id: 2, label: `${currentYear - 1}-${currentYear}`, start_date: `${currentYear - 1}-09-01`, end_date: `${currentYear}-06-30`, is_current: false }
          ]
          setAcademicYears(defaultYears)
          setSelectedYear(defaultYears[0])
          localStorage.setItem(ACADEMIC_YEAR_KEY, defaultYears[0].id.toString())
        }
      } catch (err) {
        console.error('Error loading academic years:', err)
        const currentYear = new Date().getFullYear()
        const defaultYears: AcademicYear[] = [
          { id: 1, label: `${currentYear}-${currentYear + 1}`, start_date: `${currentYear}-09-01`, end_date: `${currentYear + 1}-06-30`, is_current: true },
          { id: 2, label: `${currentYear - 1}-${currentYear}`, start_date: `${currentYear - 1}-09-01`, end_date: `${currentYear}-06-30`, is_current: false }
        ]
        setAcademicYears(defaultYears)
        setSelectedYear(defaultYears[0])
        localStorage.setItem(ACADEMIC_YEAR_KEY, defaultYears[0].id.toString())
      } finally {
        setYearsLoading(false)
      }
    }

    loadAcademicYears()
  }, [])

  // Clock timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setYearDropdownOpen(false)
    if (yearDropdownOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [yearDropdownOpen])

  const formatDate = () => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    return currentTime.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', options)
  }

  const handleYearSelect = (year: AcademicYear) => {
    setSelectedYear(year)
    setYearDropdownOpen(false)
    localStorage.setItem(ACADEMIC_YEAR_KEY, year.id.toString())
    toast.success(lang === 'fr' ? `Annee scolaire "${year.label}" selectionnee` : `Academic year "${year.label}" selected`)
    window.dispatchEvent(new CustomEvent('lybibal-year-change', { detail: year }))
  }

  const handleModuleClick = (moduleId: string) => {
    if (!canAccessModule(moduleId)) {
      toast.error(lang === 'fr' ? 'Acces refuse' : 'Access denied')
      return
    }
    const module = ALL_MODULES.find(m => m.id === moduleId)
    if (module) navigate(module.route)
  }

  const handleLogout = () => {
    logout()
    localStorage.removeItem(ACADEMIC_YEAR_KEY)
    navigate('/login')
  }

  const getRoleDisplayName = (role: string): string => {
    const names: Record<string, { fr: string; en: string }> = {
      super_admin: { fr: 'Super Administrateur', en: 'Super Administrator' },
      admin: { fr: 'Administrateur', en: 'Administrator' },
      proviseur: { fr: 'Proviseur', en: 'Principal' },
      censeur: { fr: 'Censeur', en: 'Censor' },
      surveillant_general: { fr: 'Surveillant General', en: 'General Supervisor' },
      comptable_matiere: { fr: 'Comptable Matiere', en: 'Accountant' },
      intendante: { fr: 'Intendante', en: 'Bursar' },
      enseignant: { fr: 'Enseignant', en: 'Teacher' },
      parent: { fr: 'Parent', en: 'Parent' },
      eleve: { fr: 'Eleve', en: 'Student' }
    }
    return names[role]?.[lang] || role
  }

  // Loading state
  if (permissionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{$t.permissionsLoading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                <School className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">LYBIBAL</h1>
                <p className="text-xs text-gray-500">{lang === 'fr' ? 'Administration' : 'Administration'}</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <div className="relative">
                <button onClick={(e) => { e.stopPropagation(); setYearDropdownOpen(!yearDropdownOpen) }}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 transition-colors">
                  <CalendarCheck className="w-4 h-4" />
                  <span className="max-w-[150px] truncate">
                    {yearsLoading ? (lang === 'fr' ? 'Chargement...' : 'Loading...') : selectedYear ? `${$t.academicYear}: ${selectedYear.label}` : $t.selectYear}
                  </span>
                  {selectedYear?.is_current && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">{lang === 'fr' ? 'Actif' : 'Active'}</span>}
                  <ChevronDown className={`w-4 h-4 transition-transform ${yearDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {yearDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{$t.academicYear}</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {academicYears.map((year) => (
                        <button key={year.id} onClick={(e) => { e.stopPropagation(); handleYearSelect(year) }}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-50 transition-colors ${selectedYear?.id === year.id ? 'bg-blue-50 border-l-3 border-blue-500' : 'border-l-3 border-transparent'}`}>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">{year.label}</span>
                              {year.is_current && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">{lang === 'fr' ? 'Actuel' : 'Current'}</span>}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{new Date(year.start_date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')} → {new Date(year.end_date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')}</p>
                          </div>
                          {selectedYear?.id === year.id && <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0"><svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></div>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="w-px h-6 bg-gray-200" />
              <div className="flex items-center gap-2 text-sm text-gray-500"><Calendar className="w-4 h-4" /><span>{formatDate()}</span></div>
              <button onClick={toggleLang} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"><Globe className="w-4 h-4" />{lang === 'fr' ? 'FR' : 'EN'}</button>
              <button className="p-2 hover:bg-gray-100 rounded-lg relative"><Bell className="w-5 h-5 text-gray-600" /><span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span></button>
              <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">{(user as any)?.first_name?.[0]}{(user as any)?.last_name?.[0]}</span>
                </div>
                <div className="hidden lg:block">
                  <span className="text-sm font-medium text-gray-700 block">{(user as any)?.first_name} {(user as any)?.last_name}</span>
                  <span className="text-xs text-gray-500">{getRoleDisplayName(userRole)}</span>
                </div>
              </div>
              <button onClick={handleLogout} className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600 transition-colors" title={$t.logout}><LogOut className="w-5 h-5" /></button>
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 hover:bg-gray-100 rounded-lg">{mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}</button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{$t.welcome}, <span className="text-blue-600">{(user as any)?.first_name || 'Admin'}</span></h2>
              <p className="text-gray-500 mt-1">{$t.subtitle}</p>
              {selectedYear && (
                <div className="flex items-center gap-2 mt-2">
                  <CalendarCheck className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-blue-600 font-medium">{lang === 'fr' ? 'Annee scolaire active' : 'Active academic year'}: {selectedYear.label}{selectedYear.is_current && <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">{lang === 'fr' ? 'Actuelle' : 'Current'}</span>}</span>
                </div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">{$t.roleLabel}: <span className="font-medium text-gray-700">{getRoleDisplayName(userRole)}</span></span>
                {hasFullAccess && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full">FULL ACCESS</span>}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {lang === 'fr' 
                  ? "Sélectionnez l'un des modules pour gérer les apprenants, les notes, les bulletins scolaires, etc..." 
                  : "Select one of the modules to manage learners, grades, report cards, etc..."}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm"><Activity className="w-4 h-4 text-green-500" /><span className="text-sm text-gray-600">{lang === 'fr' ? 'Systeme operationnel' : 'System operational'}</span></div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STATS.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}><stat.icon className={`w-6 h-6 ${stat.color}`} /></div>
                <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
              </div>
              <p className="text-sm text-gray-500 mt-3">{$t.stats[stat.labelKey as keyof typeof $t.stats]}</p>
            </div>
          ))}
        </div>

        {/* Modules Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><Layers className="w-4 h-4 text-blue-600" /></div>
              <div><h3 className="text-lg font-bold text-gray-900">{$t.modules}</h3><p className="text-sm text-gray-500">{visibleModules.length} {$t.moduleCount}</p></div>
            </div>
          </div>

          {visibleModules.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{$t.noAccess}</h3>
              <p className="text-gray-500">{$t.noAccessDesc}</p>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left text-xs text-gray-500 font-mono">
                <p><strong>Debug:</strong></p>
                <p>userRole: {userRole || 'EMPTY'}</p>
                <p>permissions count: {userPermissions.length}</p>
                <p>storePermissions: {storePermissions?.length || 0}</p>
                <p>storeRole: {storeRole || 'EMPTY'}</p>
                <p>hasFullAccess: {hasFullAccess ? 'YES' : 'NO'}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {visibleModules.map((module) => {
                const modTrans = $t[module.transKey as keyof typeof $t] as any
                const Icon = module.icon
                const isHovered = hoveredModule === module.id
                const modulePerms = MODULE_PERMISSIONS[module.id]
                const visibleFeatures = hasFullAccess ? modTrans.features : modTrans.features.filter((_: string, idx: number) => {
                  if (!modulePerms) return false
                  return idx < modulePerms.features.length && hasPermission(modulePerms.features[idx])
                })
                return (
                  <div key={module.id} onMouseEnter={() => setHoveredModule(module.id)} onMouseLeave={() => setHoveredModule(null)} onClick={() => handleModuleClick(module.id)}
                    className={`group relative bg-white rounded-2xl border-2 ${module.borderColor} ${module.hoverBorder} shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden ${isHovered ? 'scale-[1.02] -translate-y-1' : ''}`}>
                    <div className={`h-1.5 w-full bg-gradient-to-r ${module.color}`} />
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-14 h-14 ${module.bgColor} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className={`w-7 h-7 ${module.textColor}`} />
                        </div>
                        <span className={`px-3 py-1 ${module.bgColor} ${module.textColor} rounded-full text-xs font-semibold`}>{modTrans.badge}</span>
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-gray-800">{modTrans.title}</h4>
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{modTrans.desc}</p>
                      <div className="flex flex-wrap gap-2 mb-5">
                        {visibleFeatures.map((feat: string, idx: number) => (
                          <span key={idx} className={`px-2.5 py-1 ${module.bgColor} ${module.textColor} rounded-md text-xs font-medium`}>{feat}</span>
                        ))}
                      </div>
                      <div className={`flex items-center justify-between pt-4 border-t border-gray-100 ${isHovered ? module.textColor : 'text-gray-400'} transition-colors`}>
                        <span className="text-sm font-semibold">{$t.access}</span>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isHovered ? module.bgColor : 'bg-gray-100'} transition-colors`}>
                          <ArrowRight className={`w-4 h-4 ${isHovered ? module.textColor : 'text-gray-400'}`} />
                        </div>
                      </div>
                    </div>
                    <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none`} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center"><Activity className="w-4 h-4 text-amber-600" /></div>
              <h3 className="text-lg font-bold text-gray-900">{$t.recentActivity}</h3>
            </div>
            <div className="space-y-4">
              {ACTIVITIES.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0"><activity.icon className={`w-5 h-5 ${activity.color}`} /></div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{activity.text}</p><p className="text-xs text-gray-400">{activity.time}</p></div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><TrendingUp className="w-4 h-4 text-blue-600" /></div>
              <h3 className="text-lg font-bold text-gray-900">{$t.quickActions}</h3>
            </div>
            <div className="space-y-3">
              {[
                { icon: Users, label: $t.actions.newStudent, color: 'blue', moduleId: 'students', perm: 'students_create' },
                { icon: FileText, label: $t.actions.newGrade, color: 'violet', moduleId: 'grades', perm: 'grades_create' },
                { icon: Calendar, label: $t.actions.schedule, color: 'emerald', moduleId: 'timetable', perm: 'timetable_create' },
                { icon: BarChart3, label: $t.actions.report, color: 'amber', moduleId: 'statistics', perm: 'bulletins_export' }
              ].filter(action => hasPermission(action.perm)).map((action, index) => (
                <button key={index} onClick={() => handleModuleClick(action.moduleId)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group">
                  <div className={`w-10 h-10 bg-${action.color}-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <action.icon className={`w-5 h-5 text-${action.color}-600`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 flex-1 text-left">{action.label}</span>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2"><School className="w-5 h-5 text-blue-600" /><span className="text-sm font-semibold text-gray-900">LYBIBAL</span><span className="text-sm text-gray-500">- Lycee Bilingue de Baleng</span></div>
            <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} - {lang === 'fr' ? 'Tous droits reserves' : 'All rights reserved'}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}