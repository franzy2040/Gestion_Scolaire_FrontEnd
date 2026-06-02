import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, BookOpen, CalendarDays,
  ShieldAlert, Wallet, Newspaper, FileSearch, Settings, X,
  ChevronRight, LogOut, School, Lock, Search, UserPlus, Upload,
  UsersRound, ArrowLeftRight, History, Ban, BookMarked, Layers,
  GraduationCap as GraduationCap, UserCheck, MessageSquare,
  BarChart3, TrendingUp, Activity, PieChart
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useLang } from '@/hooks/useLang'
import { useMemo } from 'react'
import toast from 'react-hot-toast'

/* ───────────────────────────────────────────────
   Lycée Bilingue de Baleng — DashboardSidebar
   Chaque module a: "Tableau de bord" (1er) + autres menus
   ─────────────────────────────────────────────── */

interface SidebarProps {
  onClose: () => void
  mobile?: boolean
}

const FULL_ACCESS_ROLES = ['super_admin', 'admin', 'proviseur']

const t = {
  fr: {
    schoolShort: 'Lycée Bilingue',
    schoolSub: 'de Baleng',
    dashboard: 'Tableau de bord',
    backToModules: 'Retour aux modules',
    logout: 'Déconnexion',
    logoutSuccess: 'Déconnecté',
    noAccess: 'Accès restreint',
    // Inscription des élèves
    viewStudents: 'Voir les élèves',
    globalSearch: 'Recherche globale',
    createStudent: 'Créer un élève',
    importStudents: 'Importer la liste',
    bulkUpdate: 'Mise à jour groupés',
    socialCases: 'Cas sociaux',
    transferredStudents: 'Élèves transférés',
    formerStudents: 'Anciens élèves',
    expelledStudents: 'Élèves renvoyés',
    // Académique
    specialties: 'Spécialités & Séries',
    levelsClasses: 'Niveaux & Classes',
    assignStudent: "Mettre l'élève en classe",
    classCouncil: 'Conseil de classe',
    // Administration
    settings: 'Paramètres',
    audit: 'Audit & Logs',
    content: 'Contenu',
    // Simples
    timetable: 'Emploi du temps',
    teachers: 'Enseignants',
    grades: 'Notes & Moyennes',
    discipline: 'Discipline',
    budget: 'Budget Scolaire',
  },
  en: {
    schoolShort: 'Bilingual High School',
    schoolSub: 'of Baleng',
    dashboard: 'Dashboard',
    backToModules: 'Back to modules',
    logout: 'Logout',
    logoutSuccess: 'Logged out',
    noAccess: 'Restricted Access',
    viewStudents: 'View Students',
    globalSearch: 'Global Search',
    createStudent: 'Create Student',
    importStudents: 'Import List',
    bulkUpdate: 'Bulk Update',
    socialCases: 'Social Cases',
    transferredStudents: 'Transferred Students',
    formerStudents: 'Former Students',
    expelledStudents: 'Expelled Students',
    specialties: 'Specialties & Series',
    levelsClasses: 'Levels & Classes',
    assignStudent: 'Assign Student to Class',
    classCouncil: 'Class Council',
    settings: 'Settings',
    audit: 'Audit & Logs',
    content: 'Content',
    timetable: 'Timetable',
    teachers: 'Teachers',
    grades: 'Grades & Averages',
    discipline: 'Discipline',
    budget: 'School Budget',
  }
}

interface MenuItem {
  path: string
  label: string
  icon: any
  perm: string
}

interface ModuleMenu {
  id: string
  dashboardPath: string  // Route du "Tableau de bord"
  dashboardPerm: string
  items: MenuItem[]      // Autres menus (sans le dashboard)
}

// ========== MODULES: "Tableau de bord" + autres menus ==========
// Fonction qui retourne les menus avec les traductions selon la langue
const getModuleMenus = (lang: 'fr' | 'en'): ModuleMenu[] => {
  const txt = t[lang]
  return [
    {
      id: 'students',
      dashboardPath: '/students/dashboard',
      dashboardPerm: 'students_read',
      items: [
        { path: '/students', label: txt.viewStudents, icon: Users, perm: 'students_read' },
        { path: '/students/search', label: txt.globalSearch, icon: Search, perm: 'students_read' },
        { path: '/students/create', label: txt.createStudent, icon: UserPlus, perm: 'students_create' },
        { path: '/students/import', label: txt.importStudents, icon: Upload, perm: 'students_create' },
        { path: '/students/bulk-update', label: txt.bulkUpdate, icon: UsersRound, perm: 'students_update' },
        { path: '/students/social-cases', label: txt.socialCases, icon: BookMarked, perm: 'students_read' },
        { path: '/students/transferred', label: txt.transferredStudents, icon: ArrowLeftRight, perm: 'students_read' },
        { path: '/students/former', label: txt.formerStudents, icon: History, perm: 'students_read' },
        { path: '/students/expelled', label: txt.expelledStudents, icon: Ban, perm: 'students_read' },
      ],
    },
    {
      id: 'timetable',
      dashboardPath: '/timetable/dashboard',
      dashboardPerm: 'timetable_read',
      items: [
        { path: '/teachers', label: txt.teachers, icon: Users, perm: 'timetable_read' },
        { path: '/timetable', label: txt.timetable, icon: CalendarDays, perm: 'timetable_read' },
      ],
    },
    {
      id: 'grades',
      dashboardPath: '/grades/dashboard',
      dashboardPerm: 'grades_read',
      items: [
        { path: '/grades', label: txt.grades, icon: BookOpen, perm: 'grades_read' },
      ],
    },
    {
      id: 'discipline',
      dashboardPath: '/discipline/dashboard',
      dashboardPerm: 'admin_full',
      items: [
        { path: '/discipline', label: txt.discipline, icon: ShieldAlert, perm: 'admin_full' },
      ],
    },
    {
      id: 'academics',
      dashboardPath: '/academics/dashboard',
      dashboardPerm: 'grades_read',
      items: [
        { path: '/academics/specialties', label: txt.specialties, icon: GraduationCap, perm: 'grades_read' },
        { path: '/academics/levels', label: txt.levelsClasses, icon: Layers, perm: 'grades_read' },
        { path: '/academics/assign', label: txt.assignStudent, icon: UserCheck, perm: 'students_update' },
        { path: '/academics/council', label: txt.classCouncil, icon: MessageSquare, perm: 'grades_read' },
      ],
    },
    {
      id: 'administration',
      dashboardPath: '/administration/dashboard',
      dashboardPerm: 'users_read',
      items: [
        { path: '/settings', label: txt.settings, icon: Settings, perm: 'users_read' },
        { path: '/audit', label: txt.audit, icon: FileSearch, perm: 'audit_read' },
        { path: '/content', label: txt.content, icon: Newspaper, perm: 'news_publish' },
      ],
    },
    {
      id: 'budget',
      dashboardPath: '/budget/dashboard',
      dashboardPerm: 'budget_read',
      items: [
        { path: '/budget', label: txt.budget, icon: Wallet, perm: 'budget_read' },
      ],
    },
    {
      id: 'content',
      dashboardPath: '/content/dashboard',
      dashboardPerm: 'news_publish',
      items: [
        { path: '/content', label: txt.content, icon: Newspaper, perm: 'news_publish' },
      ],
    },
    {
      id: 'audit',
      dashboardPath: '/audit/dashboard',
      dashboardPerm: 'audit_read',
      items: [
        { path: '/audit', label: txt.audit, icon: FileSearch, perm: 'audit_read' },
      ],
    },
  ]
}

const ROUTE_TO_MODULE: Record<string, string> = {
  '/admin': 'dashboard',
  '/dashboard': 'dashboard',
  '/students': 'students',
  '/students/dashboard': 'students',
  '/students/search': 'students',
  '/students/create': 'students',
  '/students/import': 'students',
  '/students/bulk-update': 'students',
  '/students/social-cases': 'students',
  '/students/transferred': 'students',
  '/students/former': 'students',
  '/students/expelled': 'students',
  '/timetable': 'timetable',
  '/timetable/dashboard': 'timetable',
  '/teachers': 'timetable',
  '/grades': 'grades',
  '/grades/dashboard': 'grades',
  '/discipline': 'discipline',
  '/discipline/dashboard': 'discipline',
  '/academics': 'academics',
  '/academics/dashboard': 'academics',
  '/academics/specialties': 'academics',
  '/academics/levels': 'academics',
  '/academics/assign': 'academics',
  '/academics/council': 'academics',
  '/settings': 'administration',
  '/administration/dashboard': 'administration',
  '/audit': 'audit',
  '/audit/dashboard': 'audit',
  '/content': 'content',
  '/content/dashboard': 'content',
  '/budget': 'budget',
  '/budget/dashboard': 'budget',
}

export default function DashboardSidebar({ onClose, mobile }: SidebarProps) {
  const location = useLocation()
  const { user, logout, permissions, role, roleName } = useAuthStore()
  const { lang } = useLang()
  const txt = t[lang]

  const userRole = role || ''
  const hasFullAccess = FULL_ACCESS_ROLES.includes(userRole)

  const userPermissions = useMemo(() => {
    if (hasFullAccess) return ['all']
    return permissions || []
  }, [permissions, hasFullAccess])

  const checkPermission = (permission: string): boolean => {
    if (hasFullAccess) return true
    return userPermissions.includes(permission) || userPermissions.includes('admin_full')
  }

  const currentModule = useMemo(() => {
    const path = location.pathname
    if (ROUTE_TO_MODULE[path]) return ROUTE_TO_MODULE[path]
    for (const [route, mod] of Object.entries(ROUTE_TO_MODULE)) {
      if (path.startsWith(route + '/')) return mod
    }
    return 'dashboard'
  }, [location.pathname])

  // Sur /admin : tous les modules
  // Sur module : "Tableau de bord" + items du module
  const visibleItems = useMemo(() => {
    if (location.pathname === '/admin') {
      return getModuleMenus(lang)
        .filter(mod => checkPermission(mod.dashboardPerm))
        .map(mod => ({
          path: mod.dashboardPath,
          label: mod.items[0]?.label || mod.id,
          icon: mod.items[0]?.icon || LayoutDashboard,
          perm: mod.dashboardPerm,
          isDashboard: true,
        }))
    }

    const moduleMenu = getModuleMenus(lang).find(m => m.id === currentModule)
    if (!moduleMenu) return []

    const items: { path: string; label: string; icon: any; perm: string; isDashboard?: boolean }[] = []

    // 1. TABLEAU DE BORD (premier, toujours)
    if (checkPermission(moduleMenu.dashboardPerm)) {
      items.push({
        path: moduleMenu.dashboardPath,
        label: txt.dashboard,
        icon: BarChart3,
        perm: moduleMenu.dashboardPerm,
        isDashboard: true,
      })
    }

    // 2. AUTRES MENUS
    moduleMenu.items.forEach(item => {
      if (checkPermission(item.perm)) {
        items.push({ ...item, isDashboard: false })
      }
    })

    return items
  }, [currentModule, userPermissions, hasFullAccess, location.pathname, lang])

  const onLogout = () => {
    logout()
    toast.success(txt.logoutSuccess)
  }

  return (
    <div className="flex flex-col h-full bg-school-blue text-white">
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <School className="h-7 w-7 text-school-gold" />
          <div>
            <span className="font-bold text-sm">{txt.schoolShort}</span>
            <span className="block text-[10px] text-school-gold">{txt.schoolSub}</span>
          </div>
        </div>
        {mobile && (
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* User Info */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-school-gold flex items-center justify-center text-school-blue font-bold text-sm">
            {(user as any)?.first_name?.[0]}{(user as any)?.last_name?.[0]}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{(user as any)?.first_name} {(user as any)?.last_name}</p>
            <p className="text-xs text-white/60 truncate">{roleName || userRole}</p>
          </div>
        </div>
      </div>

      {/* Bouton retour (visible seulement si pas sur /admin) */}
      {location.pathname !== '/admin' && (
        <div className="px-4 py-2 border-b border-white/10">
          <NavLink
            to="/admin"
            onClick={onClose}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            <span>{txt.backToModules}</span>
          </NavLink>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {visibleItems.map((item, index) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          const isDashboard = item.isDashboard

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className={`flex-shrink-0 ${isDashboard ? 'h-5 w-5 text-school-gold' : 'h-5 w-5'}`} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="h-4 w-4" />}
            </NavLink>
          )
        })}

        {visibleItems.length === 0 && (
          <div className="px-3 py-4 text-center">
            <Lock className="h-8 w-8 text-white/30 mx-auto mb-2" />
            <p className="text-xs text-white/50">{txt.noAccess}</p>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition"
        >
          <LogOut className="h-5 w-5" />
          <span>{txt.logout}</span>
        </button>
      </div>
    </div>
  )
}