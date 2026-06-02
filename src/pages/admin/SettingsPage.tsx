import { useState, useEffect, useCallback } from 'react'
import {
  Settings, Save, School, Users, Calendar, Bell, Shield,
  Mail, Globe, Palette, Database, Upload, CheckCircle, X,
  ChevronRight, Lock, Eye, EyeOff, RefreshCw, AlertTriangle,
  Plus, Trash2, Edit2, Search, Filter, UserPlus, KeyRound,
  ShieldCheck, ShieldOff, Smartphone, GraduationCap, BookOpen,
  ChevronDown, ChevronUp, Building2, GraduationCap as AcademicIcon,
  ToggleLeft, ToggleRight, FileText, Award, Wallet, Activity,
  FolderOpen, PenTool, Megaphone, UserCog, CalendarDays, Check,
  Ban, Unlock, Search as SearchIcon, StickyNote, Newspaper,
  MessageSquare, BarChart3, LayoutDashboard, MapPin, Phone
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { adminApi, authApi, schoolApi, apiService } from '@/services/api'
import { toast } from 'sonner'

// ==================== TYPES ====================
interface SchoolSettings {
  id: number
  name: string
  short_name: string
  address: string
  city: string
  country: string
  phone: string
  email: string
  website: string
  logo_url?: string
  founded_year: number
  director_name: string
  director_email: string
  accreditation_number: string
  tax_id: string
  bank_name: string
  bank_account: string
  bank_iban: string
  currency: string
  language: string
  timezone: string
  academic_year_start: string
  academic_year_end: string
  terms_count: number
  sequences_per_term: number
  grading_scale: number
  pass_threshold: number
  honor_threshold: number
  email_notifications: boolean
  sms_notifications: boolean
  auto_backup: boolean
  backup_frequency: string
  maintenance_mode: boolean
}

interface AcademicYear {
  id: number
  label: string
  start_date: string
  end_date: string
  is_current: boolean
  school_id: number
  grading_scale?: number
  pass_threshold?: number
  honor_threshold?: number
  terms_count?: number
  sequences_per_term?: number
}

interface School {
  id: number
  name: string
  short_name: string
  address?: string
  city?: string
  country?: string
  phone?: string
  email?: string
  website?: string
  logo_url?: string
  founded_year?: number
  director_name?: string
  director_email?: string
  accreditation_number?: string
  tax_id?: string
  bank_name?: string
  bank_account?: string
  bank_iban?: string
  status: string
  created_at?: string
}

interface Role {
  id: number
  name: string
  description?: string
  is_system: boolean
}

interface Permission {
  id: number
  name: string
  code: string
  description?: string
  module: string
  submodule?: string
}

interface AppUser {
  id: number
  first_name: string
  last_name: string
  email: string
  phone?: string
  matricule?: string
  role_id?: number
  role_name?: string
  school_id?: number
  school_name?: string
  academic_year_id?: number
  academic_year_label?: string
  status: string
  is_2fa_enabled?: boolean
  created_at?: string
}

const CURRENCIES = [
  { code: 'XAF', label: 'FCFA (XAF)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'USD', label: 'Dollar US (USD)' },
]

const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'Anglais' },
  { code: 'fr-en', label: 'Bilingue FR/EN' },
]

const TIMEZONES = [
  { code: 'Africa/Douala', label: 'Douala (WAT)' },
  { code: 'Africa/Lagos', label: 'Lagos (WAT)' },
  { code: 'UTC', label: 'UTC' },
]

const BACKUP_FREQUENCIES = [
  { code: 'daily', label: 'Quotidien' },
  { code: 'weekly', label: 'Hebdomadaire' },
  { code: 'monthly', label: 'Mensuel' },
]

const USER_STATUSES = [
  { value: 'active', label: 'Actif', color: 'bg-green-100 text-green-700' },
  { value: 'inactive', label: 'Inactif', color: 'bg-gray-100 text-gray-700' },
  { value: 'suspended', label: 'Suspendu', color: 'bg-red-100 text-red-700' },
]

function generateMatricule(roleName?: string): string {
  const prefix = 'lbb'
  const roleCode = roleName ? roleName.substring(0, 2).toUpperCase() : 'XX'
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4)
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `${prefix}${roleCode}${timestamp}${random}`
}

const PERMISSION_MODULES = [
  {
    id: 'users',
    label: 'Utilisateurs',
    icon: Users,
    permissions: [
      { code: 'users_create', label: 'Creer des utilisateurs' },
      { code: 'users_read', label: 'Voir les utilisateurs' },
      { code: 'users_update', label: 'Modifier les utilisateurs' },
      { code: 'users_delete', label: 'Supprimer les utilisateurs' },
    ]
  },
  {
    id: 'students',
    label: 'Eleves',
    icon: Users,
    permissions: [
      { code: 'students_create', label: 'Creer des eleves' },
      { code: 'students_read', label: 'Voir les eleves' },
      { code: 'students_update', label: 'Modifier les eleves' },
      { code: 'students_delete', label: 'Supprimer des eleves' },
    ]
  },
  {
    id: 'grades',
    label: 'Notes & Bulletins',
    icon: Award,
    permissions: [
      { code: 'grades_create', label: 'Creer des notes' },
      { code: 'grades_read', label: 'Voir les notes' },
      { code: 'grades_update', label: 'Modifier les notes' },
      { code: 'grades_approve', label: 'Approuver les notes' },
      { code: 'bulletins_read', label: 'Voir les bulletins' },
      { code: 'bulletins_export', label: 'Exporter les bulletins' },
    ]
  },
  {
    id: 'timetable',
    label: 'Emploi du temps',
    icon: CalendarDays,
    permissions: [
      { code: 'timetable_read', label: "Voir l'emploi du temps" },
      { code: 'timetable_create', label: "Creer l'emploi du temps" },
    ]
  },
  {
    id: 'content',
    label: 'Contenu Public',
    icon: Newspaper,
    permissions: [
      { code: 'news_create', label: 'Creer des actualites' },
      { code: 'news_publish', label: 'Publier des actualites' },
      { code: 'events_create', label: 'Creer des evenements' },
      { code: 'forum_create', label: 'Creer dans le forum' },
    ]
  },
  {
    id: 'budget',
    label: 'Budget',
    icon: Wallet,
    permissions: [
      { code: 'budget_read', label: 'Voir le budget' },
      { code: 'budget_write', label: 'Modifier le budget' },
      { code: 'budget_approve', label: 'Approuver le budget' },
    ]
  },
  {
    id: 'audit',
    label: 'Audit & Logs',
    icon: Activity,
    permissions: [
      { code: 'audit_read', label: "Voir les logs d'audit" },
    ]
  },
  {
    id: 'admin',
    label: 'Administration',
    icon: Shield,
    permissions: [
      { code: 'admin_full', label: 'Acces complet admin' },
    ]
  },
]

const TABS = [
  { id: 'general', label: 'General', icon: School },
  { id: 'academic', label: 'Academique', icon: GraduationCap },
  { id: 'users', label: 'Utilisateurs', icon: Users },
  { id: 'permissions', label: 'Permissions', icon: ShieldCheck },
  { id: 'schools', label: 'Etablissements', icon: Building2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Securite', icon: Shield },
  { id: 'appearance', label: 'Apparence', icon: Palette },
  { id: 'system', label: 'Systeme', icon: Database },
]

function validatePassword(password: string): { valid: boolean; message: string } {
  if (password.length < 6) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins 6 caracteres' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins une minuscule' }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins une majuscule' }
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins un chiffre' }
  }
  if (!/[@$!%*?&+#-]/.test(password)) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins un caractere special (@$!%*?&+#-)' }
  }
  return { valid: true, message: '' }
}

function getLogoUrl(logoPath?: string): string {
  if (!logoPath) return ''
  if (logoPath.startsWith('http')) return logoPath
  const baseUrl = 'http://192.168.0.101:8001'
  return `${baseUrl}${logoPath.startsWith('/') ? logoPath : `/${logoPath}`}`
}

function handleApiError(error: any, fallbackMessage: string = 'Une erreur est survenue'): string {
  if (error?.response?.status === 403) {
    const detail = error?.response?.data?.detail || "Accès refusé. Vous n'avez pas les permissions nécessaires."
    return detail
  }
  return error?.response?.data?.detail || error?.message || fallbackMessage
}

export default function SettingsPage() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('general')
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SchoolSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<Partial<SchoolSettings>>({})
  const [schoolId, setSchoolId] = useState<number | null>(null)
  const [currentAcademicYear, setCurrentAcademicYear] = useState<AcademicYear | null>(null)
  const [schools, setSchools] = useState<School[]>([])
  const [schoolsLoading, setSchoolsLoading] = useState(false)
  const [showSchoolModal, setShowSchoolModal] = useState(false)
  const [editingSchool, setEditingSchool] = useState<School | null>(null)
  const [schoolFormData, setSchoolFormData] = useState<Partial<School>>({
    name: '', short_name: '', address: '', city: '', country: 'Cameroun',
    phone: '', email: '', website: '', founded_year: new Date().getFullYear(),
    director_name: '', director_email: '', accreditation_number: '', tax_id: '',
    bank_name: '', bank_account: '', bank_iban: '', status: 'active'
  })
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [academicYearsLoading, setAcademicYearsLoading] = useState(false)
  const [showAcademicYearModal, setShowAcademicYearModal] = useState(false)
  const [editingAcademicYear, setEditingAcademicYear] = useState<AcademicYear | null>(null)
  const [academicYearFormData, setAcademicYearFormData] = useState({
    label: '', start_date: '', end_date: '', is_current: false, school_id: 0,
    grading_scale: 20, pass_threshold: 10, honor_threshold: 12, terms_count: 3, sequences_per_term: 2,
  })
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    current_password: '', new_password: '', confirm_password: '',
  })
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [users, setUsers] = useState<AppUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [userPage, setUserPage] = useState(1)
  const [userTotal, setUserTotal] = useState(0)
  const [showUserModal, setShowUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [userFormData, setUserFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '', password: '',
    role_id: '', school_id: '', academic_year_id: '', matricule: '', status: 'active',
  })
  const [userFormErrors, setUserFormErrors] = useState<Record<string, string>>({})
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<AppUser | null>(null)
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<number | null>(null)
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [permissionsLoading, setPermissionsLoading] = useState(false)
  const [savingPermissions, setSavingPermissions] = useState(false)
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    users: true, students: true, grades: true, timetable: true,
    content: true, budget: true, audit: true, admin: true
  })
  const [permissionSearch, setPermissionSearch] = useState('')
  const [hasUnsavedPermissions, setHasUnsavedPermissions] = useState(false)
  const [step1Expanded, setStep1Expanded] = useState(true)
  const [userPermissionSearch, setUserPermissionSearch] = useState('')
  const [pendingPermissions, setPendingPermissions] = useState<Record<string, boolean>>({})
  const [twoFAStatus, setTwoFAStatus] = useState<{ enabled: boolean; method?: string } | null>(null)
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [twoFASetup, setTwoFASetup] = useState<{ secret: string; qr_code: string; uri: string } | null>(null)
  const [twoFACode, setTwoFACode] = useState('')
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false)
  const [accessDeniedMessage, setAccessDeniedMessage] = useState('')

  const loadSettings = useCallback(async () => {
    setLoading(true)
    try {
      const schoolsRes = await schoolApi.getSchools()
      const schoolsList = Array.isArray(schoolsRes) ? schoolsRes : schoolsRes?.data || []
      if (schoolsList.length > 0) {
        const school = schoolsList[0]
        setSchoolId(school.id)
        const mappedSettings: Partial<SchoolSettings> = {
          id: school.id,
          name: school.name || 'Lycee Bilingue de Baleng',
          short_name: school.short_name || 'LYBIBAL',
          address: school.address || '',
          city: school.city || 'Baleng',
          country: school.country || 'Cameroun',
          phone: school.phone || '',
          email: school.email || '',
          website: school.website || '',
          logo_url: school.logo_url,
          founded_year: school.founded_year || new Date().getFullYear(),
          director_name: school.director_name || '',
          director_email: school.director_email || '',
          accreditation_number: school.accreditation_number || '',
          tax_id: school.tax_id || '',
          bank_name: school.bank_name || '',
          bank_account: school.bank_account || '',
          bank_iban: school.bank_iban || '',
          currency: 'XAF', language: 'fr-en', timezone: 'Africa/Douala',
          academic_year_start: `${new Date().getFullYear()}-09-01`,
          academic_year_end: `${new Date().getFullYear() + 1}-06-30`,
          terms_count: 3, sequences_per_term: 2,
          grading_scale: 20, pass_threshold: 10, honor_threshold: 12,
          email_notifications: true, sms_notifications: false,
          auto_backup: true, backup_frequency: 'weekly', maintenance_mode: false,
        }
        setSettings(mappedSettings as SchoolSettings)
        setFormData(mappedSettings)
        await loadCurrentAcademicYear(school.id)
      } else {
        throw new Error('No school found')
      }
    } catch (err) {
      console.error('Error loading settings:', err)
      const defaultSettings: Partial<SchoolSettings> = {
        name: 'Lycee Bilingue de Baleng', short_name: 'LYBIBAL',
        address: '', city: 'Baleng', country: 'Cameroun',
        phone: '', email: '', website: '',
        founded_year: new Date().getFullYear(),
        director_name: '', director_email: '',
        accreditation_number: '', tax_id: '',
        bank_name: '', bank_account: '', bank_iban: '',
        currency: 'XAF', language: 'fr-en', timezone: 'Africa/Douala',
        academic_year_start: `${new Date().getFullYear()}-09-01`,
        academic_year_end: `${new Date().getFullYear() + 1}-06-30`,
        terms_count: 3, sequences_per_term: 2,
        grading_scale: 20, pass_threshold: 10, honor_threshold: 12,
        email_notifications: true, sms_notifications: false,
        auto_backup: true, backup_frequency: 'weekly', maintenance_mode: false,
      }
      setSettings(defaultSettings as SchoolSettings)
      setFormData(defaultSettings)
      toast.warning('Aucune ecole trouvee en base, valeurs par defaut chargees')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadCurrentAcademicYear = useCallback(async (sid: number) => {
    try {
      const year = await schoolApi.getCurrentAcademicYear(sid)
      if (year) {
        setCurrentAcademicYear(year)
        setFormData(prev => ({
          ...prev,
          academic_year_start: year.start_date || prev.academic_year_start,
          academic_year_end: year.end_date || prev.academic_year_end,
          terms_count: year.terms_count || prev.terms_count,
          sequences_per_term: year.sequences_per_term || prev.sequences_per_term,
          grading_scale: year.grading_scale || prev.grading_scale,
          pass_threshold: year.pass_threshold ? Number(year.pass_threshold) : prev.pass_threshold,
          honor_threshold: year.honor_threshold ? Number(year.honor_threshold) : prev.honor_threshold,
        }))
      }
    } catch (err) {
      console.warn('No current academic year found:', err)
    }
  }, [])

  const loadSchools = useCallback(async () => {
    setSchoolsLoading(true)
    try {
      const res = await schoolApi.getSchools()
      setSchools(Array.isArray(res) ? res : res?.data || [])
    } catch (err) {
      console.error('Error loading schools:', err)
      setSchools([])
    } finally {
      setSchoolsLoading(false)
    }
  }, [])

  const loadAcademicYears = useCallback(async () => {
    setAcademicYearsLoading(true)
    try {
      if (!schoolId) return;
      const res = await schoolApi.getAcademicYears(schoolId);
      setAcademicYears(Array.isArray(res) ? res : res?.data || [])
    } catch (err) {
      console.error('Error loading academic years:', err)
      setAcademicYears([])
    } finally {
      setAcademicYearsLoading(false)
    }
  }, [schoolId])

  const loadUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      const res = await authApi.getUsers({
        page: userPage, per_page: 20,
        search: userSearch || undefined,
      })
      setUsers(res?.data || [])
      setUserTotal(res?.total || 0)
    } catch (err: any) {
      const errorMsg = handleApiError(err, 'Erreur chargement utilisateurs')
      if (err?.response?.status === 403) {
        setAccessDeniedMessage(errorMsg)
        setShowAccessDeniedModal(true)
      } else {
        toast.error(errorMsg)
      }
    } finally {
      setUsersLoading(false)
    }
  }, [userPage, userSearch])

  const loadRoles = useCallback(async () => {
    try {
      const res = await adminApi.getRoles()
      setRoles(Array.isArray(res) ? res : res?.data || [])
    } catch (err: any) {
      const errorMsg = handleApiError(err, 'Erreur chargement roles')
      if (err?.response?.status === 403) {
        setAccessDeniedMessage(errorMsg)
        setShowAccessDeniedModal(true)
      }
      console.error('Error loading roles:', err)
      setRoles([])
    }
  }, [])

  const loadPermissions = useCallback(async () => {
    setPermissionsLoading(true)
    try {
      let res
      try {
        res = await adminApi.getPermissions()
      } catch (adminErr: any) {
        console.warn('adminApi.getPermissions failed, trying schoolApi:', adminErr?.message || adminErr)
        try {
          res = await schoolApi.getPermissions()
        } catch (schoolErr: any) {
          console.warn('schoolApi.getPermissions also failed:', schoolErr?.message || schoolErr)
          throw schoolErr
        }
      }
      const perms = Array.isArray(res) ? res : res?.data || []
      setPermissions(perms)
    } catch (err: any) {
      const errorMsg = handleApiError(err, 'Erreur chargement permissions')
      if (err?.response?.status === 403) {
        setAccessDeniedMessage(errorMsg)
        setShowAccessDeniedModal(true)
      }
      console.error('Error loading permissions - using static fallback:', err?.message || err)
      const staticPermissions: Permission[] = PERMISSION_MODULES.flatMap(m =>
        m.permissions.map(p => ({
          id: 0, name: p.label, code: p.code, description: p.label,
          module: m.id, submodule: undefined
        }))
      )
      setPermissions(staticPermissions)
      toast.info('Permissions chargees depuis la configuration locale')
    } finally {
      setPermissionsLoading(false)
    }
  }, [])

  const loadUserPermissions = useCallback(async (userId: number) => {
    setPermissionsLoading(true)
    try {
      const res = await authApi.getUserPermissions(userId)
      const perms = res?.permissions || []
      setUserPermissions(perms)
      const pending: Record<string, boolean> = {}
      perms.forEach((code: string) => { pending[code] = true })
      setPendingPermissions(pending)
      setHasUnsavedPermissions(false)
    } catch (err: any) {
      const errorMsg = handleApiError(err, 'Erreur chargement permissions utilisateur')
      if (err?.response?.status === 403) {
        setAccessDeniedMessage(errorMsg)
        setShowAccessDeniedModal(true)
      }
      console.error('Error loading user permissions:', err)
      setUserPermissions([])
      setPendingPermissions({})
    } finally {
      setPermissionsLoading(false)
    }
  }, [])

  const load2FAStatus = useCallback(async () => {
    try {
      const res = await authApi.get2FAStatus()
      setTwoFAStatus(res)
    } catch (err) {
      console.error('2FA status error', err)
    }
  }, [])

  useEffect(() => { loadSettings() }, [loadSettings])
  useEffect(() => { loadSchools() }, [loadSchools])
  useEffect(() => { if (schoolId) loadAcademicYears() }, [schoolId, loadAcademicYears])

  useEffect(() => {
    if (activeTab === 'users') { loadUsers(); loadRoles() }
  }, [activeTab, loadUsers, loadRoles])
  useEffect(() => { if (activeTab === 'security') load2FAStatus() }, [activeTab, load2FAStatus])
  useEffect(() => {
    if (activeTab === 'permissions') { loadRoles(); loadPermissions() }
  }, [activeTab, loadRoles, loadPermissions])

  useEffect(() => {
    if (selectedUserForPermissions) {
      loadUserPermissions(selectedUserForPermissions.id)
      setSelectedRoleForPermissions(selectedUserForPermissions.role_id || null)
    }
  }, [selectedUserForPermissions, loadUserPermissions])

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingSchool) {
        await schoolApi.updateSchool(editingSchool.id, schoolFormData)
        toast.success('Etablissement mis a jour')
      } else {
        await schoolApi.createSchool(schoolFormData)
        toast.success('Etablissement cree')
      }
      setShowSchoolModal(false)
      setEditingSchool(null)
      loadSchools()
      loadSettings()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur lors de la sauvegarde')
    }
  }

  const handleDeleteSchool = async (id: number) => {
    if (!confirm('Supprimer cet etablissement ?')) return
    try {
      await schoolApi.deleteSchool(id)
      toast.success('Etablissement supprime')
      loadSchools()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur suppression')
    }
  }

  const openEditSchool = (s: School) => {
    setEditingSchool(s)
    setSchoolFormData({
      name: s.name || '', short_name: s.short_name || '',
      address: s.address || '', city: s.city || '', country: s.country || '',
      phone: s.phone || '', email: s.email || '', website: s.website || '',
      founded_year: s.founded_year || new Date().getFullYear(),
      director_name: s.director_name || '', director_email: s.director_email || '',
      accreditation_number: s.accreditation_number || '', tax_id: s.tax_id || '',
      bank_name: s.bank_name || '', bank_account: s.bank_account || '',
      bank_iban: s.bank_iban || '', status: s.status || 'active', logo_url: s.logo_url
    })
    setShowSchoolModal(true)
  }

  const openCreateSchool = () => {
    setEditingSchool(null)
    setSchoolFormData({
      name: '', short_name: '', address: '', city: '', country: 'Cameroun',
      phone: '', email: '', website: '', founded_year: new Date().getFullYear(),
      director_name: '', director_email: '', accreditation_number: '', tax_id: '',
      bank_name: '', bank_account: '', bank_iban: '', status: 'active'
    })
    setShowSchoolModal(true)
  }

  const handleSaveAcademicYear = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...academicYearFormData, school_id: academicYearFormData.school_id || schoolId }
      if (!payload.school_id) { toast.error("ID de l'ecole requis"); return }
      if (editingAcademicYear) {
        await schoolApi.updateAcademicYear(payload.school_id, editingAcademicYear.id, payload)
        toast.success('Annee scolaire mise a jour')
      } else {
        await schoolApi.createAcademicYear(payload.school_id, payload)
        toast.success('Annee scolaire creee')
      }
      setShowAcademicYearModal(false)
      setEditingAcademicYear(null)
      loadAcademicYears()
      if (schoolId) loadCurrentAcademicYear(schoolId)
    } catch (err: any) {
      console.error('Erreur sauvegarde annee scolaire:', err)
      toast.error(err?.response?.data?.detail || err?.message || 'Erreur lors de la sauvegarde')
    }
  }

  const handleDeleteAcademicYear = async (id: number) => {
    if (!confirm('Supprimer cette annee scolaire ?')) return
    try {
      if (!schoolId) { toast.error("ID de l'ecole requis"); return }
      await schoolApi.deleteAcademicYear(schoolId, id)
      toast.success('Annee scolaire supprimee')
      loadAcademicYears()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur suppression')
    }
  }

  const handleSetCurrentAcademicYear = async (id: number) => {
    try {
      if (!schoolId) { toast.error("ID de l'ecole requis"); return }
      await schoolApi.setCurrentAcademicYear(schoolId, id)
      toast.success('Annee scolaire active mise a jour')
      loadAcademicYears()
      loadCurrentAcademicYear(schoolId)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur')
    }
  }

  const openEditAcademicYear = (y: AcademicYear) => {
    setEditingAcademicYear(y)
    setAcademicYearFormData({
      label: y.label, start_date: y.start_date, end_date: y.end_date,
      is_current: y.is_current, school_id: y.school_id,
      grading_scale: y.grading_scale || 20,
      pass_threshold: y.pass_threshold || 10,
      honor_threshold: y.honor_threshold || 12,
      terms_count: y.terms_count || 3,
      sequences_per_term: y.sequences_per_term || 2,
    })
    setShowAcademicYearModal(true)
  }

  const openCreateAcademicYear = () => {
    setEditingAcademicYear(null)
    setAcademicYearFormData({
      label: '', start_date: '', end_date: '', is_current: false,
      school_id: schoolId || 0,
      grading_scale: 20, pass_threshold: 10, honor_threshold: 12,
      terms_count: 3, sequences_per_term: 2,
    })
    setShowAcademicYearModal(true)
  }

  const handleSave = async () => {
    if (!schoolId) { toast.error('Aucune ecole selectionnee'); return }
    setSaving(true)
    try {
      const updatePayload = {
        name: formData.name, short_name: formData.short_name,
        address: formData.address, city: formData.city, country: formData.country,
        phone: formData.phone, email: formData.email, website: formData.website,
        founded_year: formData.founded_year,
        director_name: formData.director_name, director_email: formData.director_email,
        accreditation_number: formData.accreditation_number, tax_id: formData.tax_id,
        bank_name: formData.bank_name, bank_account: formData.bank_account, bank_iban: formData.bank_iban,
      }
      await schoolApi.updateSchool(schoolId, updatePayload)

      if (currentAcademicYear) {
        await schoolApi.updateAcademicYear(schoolId, currentAcademicYear.id, {
          start_date: formData.academic_year_start,
          end_date: formData.academic_year_end,
          terms_count: formData.terms_count,
          sequences_per_term: formData.sequences_per_term,
          grading_scale: formData.grading_scale,
          pass_threshold: formData.pass_threshold,
          honor_threshold: formData.honor_threshold,
        })
      }

      toast.success('Parametres sauvegardes')
      loadSettings()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const validation = validatePassword(passwordData.new_password)
    if (!validation.valid) { setPasswordError(validation.message); return }
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('Les mots de passe ne correspondent pas')
      return
    }
    try {
      await authApi.changePassword(passwordData.current_password, passwordData.new_password)
      toast.success('Mot de passe change')
      setShowPasswordModal(false)
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
      setPasswordError('')
    } catch (err: any) {
      setPasswordError(err?.response?.data?.detail || 'Erreur lors du changement')
    }
  }

  const validateUserForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!userFormData.first_name.trim()) errors.first_name = 'Prenom requis'
    if (!userFormData.last_name.trim()) errors.last_name = 'Nom requis'
    if (!userFormData.email.trim()) errors.email = 'Email requis'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userFormData.email)) errors.email = 'Email invalide'
    if (!editingUser) {
      const pwdValidation = validatePassword(userFormData.password)
      if (!pwdValidation.valid) errors.password = pwdValidation.message
    } else if (userFormData.password && userFormData.password.trim().length > 0) {
      const pwdValidation = validatePassword(userFormData.password)
      if (!pwdValidation.valid) errors.password = pwdValidation.message
    }
    if (!userFormData.role_id) errors.role_id = 'Role requis'
    if (!userFormData.school_id) errors.school_id = 'Ecole requise'
    if (!userFormData.academic_year_id) errors.academic_year_id = 'Annee scolaire requise'
    if (!userFormData.matricule || userFormData.matricule.length < 9) {
      errors.matricule = 'Matricule requis (min 9 caracteres)'
    }
    setUserFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleRoleChange = (roleId: string) => {
    const selectedRole = roles.find(r => r.id.toString() === roleId)
    const newMatricule = generateMatricule(selectedRole?.name)
    setUserFormData(prev => ({ ...prev, role_id: roleId, matricule: newMatricule }))
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateUserForm()) return
    try {
      await authApi.createUser({
        first_name: userFormData.first_name, last_name: userFormData.last_name,
        email: userFormData.email, phone: userFormData.phone,
        password: userFormData.password,
        role_id: parseInt(userFormData.role_id),
        school_id: parseInt(userFormData.school_id),
        academic_year_id: parseInt(userFormData.academic_year_id),
        matricule: userFormData.matricule, status: userFormData.status,
      })
      toast.success('Utilisateur cree')
      setShowUserModal(false)
      resetUserForm()
      loadUsers()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur creation')
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    const errors: Record<string, string> = {}
    if (!userFormData.first_name.trim()) errors.first_name = 'Prenom requis'
    if (!userFormData.last_name.trim()) errors.last_name = 'Nom requis'
    if (!userFormData.email.trim()) errors.email = 'Email requis'
    if (!userFormData.role_id) errors.role_id = 'Role requis'
    if (!userFormData.school_id) errors.school_id = 'Ecole requise'
    if (!userFormData.academic_year_id) errors.academic_year_id = 'Annee scolaire requise'
    setUserFormErrors(errors)
    if (Object.keys(errors).length > 0) return
    try {
      const updatePayload: any = {
        first_name: userFormData.first_name, last_name: userFormData.last_name,
        email: userFormData.email, phone: userFormData.phone, status: userFormData.status,
        role_id: parseInt(userFormData.role_id),
        school_id: parseInt(userFormData.school_id),
        academic_year_id: parseInt(userFormData.academic_year_id),
      }
      if (userFormData.password && userFormData.password.trim().length > 0) {
        updatePayload.password = userFormData.password
      }
      await authApi.updateUser(editingUser.id, updatePayload)
      toast.success('Utilisateur mis a jour')
      setShowUserModal(false)
      setEditingUser(null)
      loadUsers()
    } catch (err: any) {
      const errorMsg = handleApiError(err, 'Erreur mise a jour')
      if (err?.response?.status === 403) {
        setAccessDeniedMessage(errorMsg)
        setShowAccessDeniedModal(true)
      } else {
        toast.error(errorMsg)
      }
    }
  }

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Supprimer cet utilisateur ?')) return
    try {
      await authApi.deleteUser(id)
      toast.success('Utilisateur supprime')
      loadUsers()
    } catch (err: any) {
      const errorMsg = handleApiError(err, 'Erreur suppression')
      if (err?.response?.status === 403) {
        setAccessDeniedMessage(errorMsg)
        setShowAccessDeniedModal(true)
      } else {
        toast.error(errorMsg)
      }
    }
  }

  const handleToggleUserStatus = async (u: AppUser) => {
    const newStatus = u.status === 'active' ? 'inactive' : 'active'
    try {
      await authApi.updateUser(u.id, { status: newStatus })
      toast.success(`Utilisateur ${newStatus === 'active' ? 'active' : 'desactive'}`)
      loadUsers()
    } catch (err: any) {
      const errorMsg = handleApiError(err, 'Erreur')
      if (err?.response?.status === 403) {
        setAccessDeniedMessage(errorMsg)
        setShowAccessDeniedModal(true)
      } else {
        toast.error(errorMsg)
      }
    }
  }

  const handleToggleUser2FA = async (u: AppUser) => {
    try {
      if (u.is_2fa_enabled) {
        await authApi.adminDisable2FA(u.id)
        toast.success('2FA desactive pour cet utilisateur')
      } else {
        await authApi.adminEnable2FA(u.id)
        toast.success('2FA active pour cet utilisateur')
      }
      loadUsers()
    } catch (err: any) {
      const errorMsg = handleApiError(err, 'Erreur 2FA')
      if (err?.response?.status === 403) {
        setAccessDeniedMessage(errorMsg)
        setShowAccessDeniedModal(true)
      } else {
        toast.error(errorMsg)
      }
    }
  }

  const openEditUser = (u: AppUser) => {
    setEditingUser(u)
    if (academicYears.length === 0 && schoolId) loadAcademicYears()
    setUserFormData({
      first_name: u.first_name, last_name: u.last_name,
      email: u.email, phone: u.phone || '', password: '',
      role_id: u.role_id?.toString() || '',
      school_id: u.school_id?.toString() || '',
      academic_year_id: u.academic_year_id?.toString() || '',
      matricule: u.matricule || '', status: u.status,
    })
    setUserFormErrors({})
    setShowUserModal(true)
  }

  const openCreateUser = () => {
    setEditingUser(null)
    resetUserForm()
    setShowUserModal(true)
  }

  const resetUserForm = () => {
    setUserFormData({
      first_name: '', last_name: '', email: '', phone: '', password: '',
      role_id: '', school_id: '', academic_year_id: '', matricule: '', status: 'active'
    })
    setUserFormErrors({})
  }

  const handleTogglePendingPermission = (permissionCode: string) => {
    setPendingPermissions(prev => {
      const newState = { ...prev, [permissionCode]: !prev[permissionCode] }
      setHasUnsavedPermissions(true)
      return newState
    })
  }

  const handleSavePermissions = async () => {
    if (!selectedUserForPermissions) return
    setSavingPermissions(true)
    try {
      const grantedPermissions = Object.entries(pendingPermissions)
        .filter(([, granted]) => granted)
        .map(([code]) => code)
      await adminApi.updateUserPermissions(selectedUserForPermissions.id, { permissions: grantedPermissions })
      setUserPermissions(grantedPermissions)
      setHasUnsavedPermissions(false)
      toast.success('Permissions sauvegardees')
    } catch (err: any) {
      const errorMsg = handleApiError(err, 'Erreur sauvegarde permissions')
      if (err?.response?.status === 403) {
        setAccessDeniedMessage(errorMsg)
        setShowAccessDeniedModal(true)
      } else {
        toast.error(errorMsg)
      }
    } finally {
      setSavingPermissions(false)
    }
  }

  const handleSelectUserForPermissions = (u: AppUser) => {
    setSelectedUserForPermissions(u)
    setHasUnsavedPermissions(false)
  }

  const isPermissionGranted = (permissionCode: string): boolean => {
    return pendingPermissions[permissionCode] || false
  }

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }))
  }

  const getModuleProgress = (moduleId: string): { total: number; granted: number } => {
    const module = PERMISSION_MODULES.find(m => m.id === moduleId)
    if (!module) return { total: 0, granted: 0 }
    const total = module.permissions.length
    const granted = module.permissions.filter(p => pendingPermissions[p.code]).length
    return { total, granted }
  }

  const handleSetup2FA = async () => {
    try {
      const res = await authApi.setup2FA()
      setTwoFASetup(res)
      setShow2FAModal(true)
    } catch (err) {
      toast.error('Erreur setup 2FA')
    }
  }

  const handleEnable2FA = async () => {
    try {
      await authApi.enable2FA({ code: twoFACode })
      toast.success('2FA active')
      setShow2FAModal(false)
      setTwoFACode('')
      load2FAStatus()
    } catch (err) {
      toast.error('Code invalide')
    }
  }

  const handleDisable2FA = async () => {
    if (!confirm('Desactiver la 2FA ?')) return
    try {
      await authApi.disable2FA({ password: passwordData.current_password })
      toast.success('2FA desactive')
      load2FAStatus()
    } catch (err) {
      toast.error('Erreur desactivation')
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const currentSchoolId = schoolId || settings?.id || schools[0]?.id
    if (!currentSchoolId) {
      toast.error("Aucune ecole selectionnee. Veuillez d'abord creer une ecole.")
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez selectionner une image (PNG, JPG, SVG)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas depasser 5 Mo")
      return
    }
    try {
      setSaving(true)
      const result = await schoolApi.uploadLogo(file, currentSchoolId)
      const logoUrl = result.full_url || result.logo_url
      toast.success('Logo mis a jour avec succes')
      setSettings(prev => prev ? { ...prev, logo_url: logoUrl } : null)
      setFormData(prev => ({ ...prev, logo_url: logoUrl }))
      loadSettings()
    } catch (err: any) {
      console.error('Logo upload error:', err)
      toast.error(err?.response?.data?.detail || err?.message || 'Erreur lors du telechargement du logo')
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = USER_STATUSES.find(s => s.value === status)
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig?.color || 'bg-gray-100 text-gray-700'}`}>
        {statusConfig?.label || status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const logoDisplayUrl = getLogoUrl(settings?.logo_url)

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title flex items-center gap-3">
              <Settings className="h-7 w-7 text-primary-600" />
              Parametres de l'etablissement
            </h1>
            <p className="page-subtitle">
              Configuration generale du Lycee Bilingue de Baleng
            </p>
          </div>
          {activeTab !== 'users' && activeTab !== 'permissions' && activeTab !== 'schools' && (
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? (
                <><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Sauvegarde...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" />Sauvegarder</>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-body p-2">
              <nav className="space-y-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    <ChevronRight className={`w-4 h-4 ml-auto ${activeTab === tab.id ? 'text-primary-500' : 'text-gray-400'}`} />
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="card mt-4">
            <div className="card-body text-center">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3 overflow-hidden">
                {logoDisplayUrl ? (
                  <img 
                    src={logoDisplayUrl} 
                    alt="Logo" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                ) : (
                  <School className="w-10 h-10 text-primary-600" />
                )}
              </div>
              <h3 className="font-semibold text-gray-900">{settings?.name}</h3>
              <p className="text-sm text-gray-500">{settings?.short_name}</p>
              <label className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-xs font-medium cursor-pointer hover:bg-primary-100">
                <Upload className="w-3 h-3" />
                Changer le logo
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">

          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold flex items-center gap-2">
                    <School className="w-5 h-5 text-primary-600" />
                    Informations de l'etablissement
                  </h3>
                </div>
                <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="label">Nom complet *</label>
                    <input value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Nom court *</label>
                    <input value={formData.short_name || ''} onChange={(e) => setFormData({ ...formData, short_name: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Annee de fondation</label>
                    <input type="number" value={formData.founded_year || ''} onChange={(e) => setFormData({ ...formData, founded_year: parseInt(e.target.value) })} className="input" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Adresse</label>
                    <input value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Ville</label>
                    <input value={formData.city || ''} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Pays</label>
                    <input value={formData.country || ''} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Telephone</label>
                    <input value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Email</label>
                    <input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Site web</label>
                    <input value={formData.website || ''} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className="input" placeholder="https://" />
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold flex items-center gap-2"><Users className="w-5 h-5 text-primary-600" />Direction</h3>
                </div>
                <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Nom du directeur</label>
                    <input value={formData.director_name || ''} onChange={(e) => setFormData({ ...formData, director_name: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Email du directeur</label>
                    <input type="email" value={formData.director_email || ''} onChange={(e) => setFormData({ ...formData, director_email: e.target.value })} className="input" />
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold flex items-center gap-2"><Globe className="w-5 h-5 text-primary-600" />Informations legales</h3>
                </div>
                <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Numero d'agrement</label>
                    <input value={formData.accreditation_number || ''} onChange={(e) => setFormData({ ...formData, accreditation_number: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Numero fiscal</label>
                    <input value={formData.tax_id || ''} onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })} className="input" />
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold flex items-center gap-2"><Database className="w-5 h-5 text-primary-600" />Informations bancaires</h3>
                </div>
                <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Banque</label>
                    <input value={formData.bank_name || ''} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Numero de compte</label>
                    <input value={formData.bank_account || ''} onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })} className="input" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">IBAN</label>
                    <input value={formData.bank_iban || ''} onChange={(e) => setFormData({ ...formData, bank_iban: e.target.value })} className="input" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'academic' && (
            <div className="space-y-6">
              {currentAcademicYear && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Annee scolaire active : {currentAcademicYear.label}</p>
                    <p className="text-sm text-green-600">{currentAcademicYear.start_date} &rarr; {currentAcademicYear.end_date}</p>
                  </div>
                </div>
              )}

              <div className="card">
                <div className="card-header flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-primary-600" />
                    Annees scolaires
                  </h3>
                  <button onClick={openCreateAcademicYear} className="btn-primary text-sm">
                    <Plus className="w-4 h-4 mr-1" />Nouvelle annee
                  </button>
                </div>
                <div className="card-body">
                  {academicYearsLoading ? (
                    <div className="text-center py-4"><RefreshCw className="w-6 h-6 animate-spin text-gray-300 mx-auto" /></div>
                  ) : academicYears.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Aucune annee scolaire configuree</p>
                  ) : (
                    <div className="space-y-2">
                      {academicYears.map((year) => (
                        <div key={year.id} className={`flex items-center justify-between p-3 rounded-lg ${year.is_current ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                          <div className="flex items-center gap-3">
                            <BookOpen className="w-5 h-5 text-primary-600" />
                            <div>
                              <p className="font-medium text-sm">{year.label}</p>
                              <p className="text-xs text-gray-500">{year.start_date} &rarr; {year.end_date}</p>
                              <p className="text-xs text-gray-400">
                                Echelle: {year.grading_scale || 20} | Passage: {year.pass_threshold || 10} | TH: {year.honor_threshold || 12}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {year.is_current && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>
                            )}
                            <button onClick={() => openEditAcademicYear(year)} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteAcademicYear(year.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold flex items-center gap-2"><Calendar className="w-5 h-5 text-primary-600" />Configuration academique</h3>
                </div>
                <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Debut annee scolaire</label>
                    <input type="date" value={formData.academic_year_start || ''} onChange={(e) => setFormData({ ...formData, academic_year_start: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Fin annee scolaire</label>
                    <input type="date" value={formData.academic_year_end || ''} onChange={(e) => setFormData({ ...formData, academic_year_end: e.target.value })} className="input" />
                  </div>
                  <div>
                    <label className="label">Nombre de trimestres</label>
                    <select value={formData.terms_count || 3} onChange={(e) => setFormData({ ...formData, terms_count: parseInt(e.target.value) })} className="input">
                      <option value={2}>2 (Semestres)</option>
                      <option value={3}>3 (Trimestres)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Sequences par trimestre</label>
                    <select value={formData.sequences_per_term || 2} onChange={(e) => setFormData({ ...formData, sequences_per_term: parseInt(e.target.value) })} className="input">
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="font-semibold flex items-center gap-2"><CheckCircle className="w-5 h-5 text-primary-600" />Bareme de notation</h3>
                </div>
                <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Echelle maximale</label>
                    <select value={formData.grading_scale || 20} onChange={(e) => setFormData({ ...formData, grading_scale: parseInt(e.target.value) })} className="input">
                      <option value={20}>20</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Seuil de passage</label>
                    <input type="number" step="0.5" value={formData.pass_threshold || 10} onChange={(e) => setFormData({ ...formData, pass_threshold: parseFloat(e.target.value) })} className="input" />
                  </div>
                  <div>
                    <label className="label">Seuil tableau d'honneur</label>
                    <input type="number" step="0.5" value={formData.honor_threshold || 12} onChange={(e) => setFormData({ ...formData, honor_threshold: parseFloat(e.target.value) })} className="input" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" placeholder="Rechercher..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="input pl-10 w-64" />
                </div>
                <button onClick={openCreateUser} className="btn-primary">
                  <UserPlus className="mr-2 h-4 w-4" />Nouvel utilisateur
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {usersLoading ? (
                  <div className="col-span-full text-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-gray-300 mx-auto" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-gray-500">Aucun utilisateur</div>
                ) : (
                  users.map((u) => (
                    <div key={u.id} className="card hover:shadow-md transition-shadow">
                      <div className="card-body p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                              <span className="text-sm font-bold text-primary-600">{u.first_name[0]}{u.last_name[0]}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate">{u.first_name} {u.last_name}</p>
                              <p className="text-xs text-gray-500 truncate">{u.email}</p>
                              <p className="text-xs font-mono text-gray-400">{u.matricule || '-'}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {getStatusBadge(u.status)}
                            <span className="text-xs text-gray-500">{u.role_name || '-'}</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1"><School className="w-3 h-3" />{u.school_name || '-'}</span>
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{u.academic_year_label || '-'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleToggleUser2FA(u)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title={u.is_2fa_enabled ? 'Desactiver 2FA' : 'Activer 2FA'}>
                                {u.is_2fa_enabled ? <ShieldCheck className="w-4 h-4 text-green-500" /> : <ShieldOff className="w-4 h-4 text-gray-300" />}
                              </button>
                              <button onClick={() => handleToggleUserStatus(u)} className={`p-1.5 hover:bg-gray-100 rounded-lg ${u.status === 'active' ? 'text-green-600' : 'text-gray-400'}`} title={u.status === 'active' ? 'Desactiver' : 'Activer'}>
                                {u.status === 'active' ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                              </button>
                              <button onClick={() => openEditUser(u)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500" title="Modifier"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {userTotal > 20 && (
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Total: {userTotal}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1} className="px-3 py-1 border rounded-lg disabled:opacity-50">Precedent</button>
                    <span>Page {userPage}</span>
                    <button onClick={() => setUserPage(p => p + 1)} disabled={userPage * 20 >= userTotal} className="px-3 py-1 border rounded-lg disabled:opacity-50">Suivant</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <div className="card">
                <button onClick={() => setStep1Expanded(!step1Expanded)} className="w-full card-header flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary-600" />
                    Etape 1 : Selectionner un utilisateur
                    {selectedUserForPermissions && (
                      <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs">{selectedUserForPermissions.first_name} {selectedUserForPermissions.last_name}</span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{users.length} utilisateurs</span>
                    {step1Expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </button>
                {step1Expanded && (
                  <div className="card-body">
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="text" placeholder="Rechercher un utilisateur..." value={userPermissionSearch} onChange={(e) => setUserPermissionSearch(e.target.value)} className="input pl-10 w-full" />
                    </div>
                    {usersLoading ? (
                      <div className="text-center py-4"><RefreshCw className="w-6 h-6 animate-spin text-gray-300 mx-auto" /></div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                        {users.filter(u => {
                          if (!userPermissionSearch) return true
                          const search = userPermissionSearch.toLowerCase()
                          return u.first_name.toLowerCase().includes(search) || u.last_name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search) || (u.matricule || '').toLowerCase().includes(search) || (u.role_name || '').toLowerCase().includes(search)
                        }).map((u) => (
                          <button key={u.id} onClick={() => { handleSelectUserForPermissions(u); setStep1Expanded(false) }} className={`flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${selectedUserForPermissions?.id === u.id ? 'bg-primary-50 border-2 border-primary-300 shadow-sm' : 'bg-gray-50 hover:bg-gray-100 border border-transparent'}`}>
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                              <span className="text-sm font-bold text-primary-600">{u.first_name[0]}{u.last_name[0]}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm text-gray-900 truncate">{u.first_name} {u.last_name}</p>
                              <p className="text-xs text-gray-500 truncate">{u.email}</p>
                              <p className="text-xs text-primary-600">{u.role_name || 'Sans role'}</p>
                            </div>
                            {selectedUserForPermissions?.id === u.id && <CheckCircle className="w-5 h-5 text-primary-600 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedUserForPermissions && (
                <div className="card">
                  <div className="card-header flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-primary-600" />
                        Etape 2 : Permissions de {selectedUserForPermissions.first_name} {selectedUserForPermissions.last_name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">Cochez les permissions a accorder, puis cliquez sur "Enregistrer"</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasUnsavedPermissions && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">Modifications non sauvegardees</span>
                      )}
                      <button onClick={handleSavePermissions} disabled={savingPermissions || !hasUnsavedPermissions} className="btn-primary">
                        {savingPermissions ? <><RefreshCw className="w-4 h-4 mr-1 animate-spin" />Enregistrement...</> : <><Save className="w-4 h-4 mr-1" />Enregistrer</>}
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="text" placeholder="Rechercher une permission..." value={permissionSearch} onChange={(e) => setPermissionSearch(e.target.value)} className="input pl-10 w-full" />
                    </div>
                    {permissionsLoading ? (
                      <div className="text-center py-8"><RefreshCw className="w-6 h-6 animate-spin text-gray-300 mx-auto" /></div>
                    ) : (
                      <div className="space-y-3">
                        {PERMISSION_MODULES.map((module) => {
                          const progress = getModuleProgress(module.id)
                          const filteredPerms = module.permissions.filter(p => permissionSearch === '' || p.label.toLowerCase().includes(permissionSearch.toLowerCase()) || p.code.toLowerCase().includes(permissionSearch.toLowerCase()))
                          if (filteredPerms.length === 0) return null
                          return (
                            <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden">
                              <button onClick={() => toggleModule(module.id)} className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div className="flex items-center gap-2">
                                  <module.icon className="w-4 h-4 text-primary-600" />
                                  <span className="font-medium text-sm">{module.label}</span>
                                  <span className="text-xs text-gray-400">({progress.granted}/{progress.total})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: progress.total > 0 ? `${(progress.granted / progress.total) * 100}%` : '0%' }} />
                                  </div>
                                  {expandedModules[module.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </div>
                              </button>
                              {expandedModules[module.id] && (
                                <div className="p-3 space-y-2">
                                  {filteredPerms.map((perm) => {
                                    const granted = isPermissionGranted(perm.code)
                                    return (
                                      <div key={perm.code} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                          <button onClick={() => handleTogglePendingPermission(perm.code)} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${granted ? 'bg-primary-600 border-primary-600' : 'border-gray-300 hover:border-primary-400'}`}>
                                            {granted && <Check className="w-3 h-3 text-white" />}
                                          </button>
                                          <span className="text-sm text-gray-700">{perm.label}</span>
                                        </div>
                                        <code className="text-xs text-gray-400 font-mono">{perm.code}</code>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'schools' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2"><Building2 className="w-5 h-5 text-primary-600" />Etablissements scolaires</h3>
                <button onClick={openCreateSchool} className="btn-primary"><Plus className="w-4 h-4 mr-1" />Nouvel etablissement</button>
              </div>
              {schoolsLoading ? (
                <div className="text-center py-8"><RefreshCw className="w-6 h-6 animate-spin text-gray-300 mx-auto" /></div>
              ) : schools.length === 0 ? (
                <div className="card"><div className="card-body text-center py-8"><Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">Aucun etablissement configure</p></div></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {schools.map((school) => (
                    <div key={school.id} className="card">
                      <div className="card-body">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center"><School className="w-6 h-6 text-primary-600" /></div>
                            <div><h4 className="font-semibold text-gray-900">{school.name}</h4><p className="text-sm text-gray-500">{school.short_name}</p></div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEditSchool(school)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteSchool(school.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <div className="mt-3 space-y-1 text-sm text-gray-600">
                          <p className="flex items-center gap-2"><MapPin className="w-3 h-3" />{school.address}, {school.city}, {school.country}</p>
                          <p className="flex items-center gap-2"><Phone className="w-3 h-3" />{school.phone || 'N/A'}</p>
                          <p className="flex items-center gap-2"><Mail className="w-3 h-3" />{school.email || 'N/A'}</p>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${school.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{school.status === 'active' ? 'Actif' : 'Inactif'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="card">
                <div className="card-header flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2"><AcademicIcon className="w-5 h-5 text-primary-600" />Annees scolaires</h3>
                  <button onClick={openCreateAcademicYear} className="btn-primary text-sm"><Plus className="w-4 h-4 mr-1" />Nouvelle annee</button>
                </div>
                <div className="card-body">
                  {academicYearsLoading ? (
                    <div className="text-center py-4"><RefreshCw className="w-6 h-6 animate-spin text-gray-300 mx-auto" /></div>
                  ) : academicYears.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Aucune annee scolaire configuree</p>
                  ) : (
                    <div className="space-y-2">
                      {academicYears.map((year) => (
                        <div key={year.id} className={`flex items-center justify-between p-3 rounded-lg ${year.is_current ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                          <div className="flex items-center gap-3">
                            <BookOpen className="w-5 h-5 text-primary-600" />
                            <div>
                              <p className="font-medium text-sm">{year.label}</p>
                              <p className="text-xs text-gray-500">{year.start_date} &rarr; {year.end_date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {year.is_current ? (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>
                            ) : (
                              <button onClick={() => handleSetCurrentAcademicYear(year.id)} className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded-full text-xs font-medium hover:bg-primary-100">Definir active</button>
                            )}
                            <button onClick={() => openEditAcademicYear(year)} className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-500"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteAcademicYear(year.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-header"><h3 className="font-semibold flex items-center gap-2"><Bell className="w-5 h-5 text-primary-600" />Preferences</h3></div>
                <div className="card-body space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div><p className="font-medium">Notifications par email</p><p className="text-sm text-gray-500">Envoyer les alertes par email</p></div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={formData.email_notifications ?? true} onChange={(e) => setFormData({ ...formData, email_notifications: e.target.checked })} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div><p className="font-medium">Notifications SMS</p><p className="text-sm text-gray-500">Alertes urgentes par SMS</p></div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={formData.sms_notifications ?? false} onChange={(e) => setFormData({ ...formData, sms_notifications: e.target.checked })} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-header"><h3 className="font-semibold flex items-center gap-2"><Lock className="w-5 h-5 text-primary-600" />Mot de passe</h3></div>
                <div className="card-body">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center"><KeyRound className="w-5 h-5 text-primary-600" /></div>
                      <div><p className="font-medium">Changer le mot de passe</p><p className="text-sm text-gray-500">Mettez a jour votre mot de passe</p></div>
                    </div>
                    <button onClick={() => setShowPasswordModal(true)} className="btn-outline">Modifier</button>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><h3 className="font-semibold flex items-center gap-2"><Smartphone className="w-5 h-5 text-primary-600" />2FA</h3></div>
                <div className="card-body">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        {twoFAStatus?.enabled ? <ShieldCheck className="w-5 h-5 text-green-600" /> : <ShieldOff className="w-5 h-5 text-gray-400" />}
                      </div>
                      <div><p className="font-medium">{twoFAStatus?.enabled ? '2FA Active' : '2FA Desactive'}</p><p className="text-sm text-gray-500">{twoFAStatus?.enabled ? 'Compte protege' : 'Activez la 2FA'}</p></div>
                    </div>
                    {twoFAStatus?.enabled ? (
                      <button onClick={handleDisable2FA} className="btn-outline text-red-600 border-red-200 hover:bg-red-50">Desactiver</button>
                    ) : (
                      <button onClick={handleSetup2FA} className="btn-primary">Activer</button>
                    )}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><h3 className="font-semibold flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-primary-600" />Mode maintenance</h3></div>
                <div className="card-body">
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div><p className="font-medium text-red-700">Mode maintenance</p><p className="text-sm text-red-600">Rendre le site inaccessible aux non-admin</p></div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={formData.maintenance_mode ?? false} onChange={(e) => setFormData({ ...formData, maintenance_mode: e.target.checked })} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-header"><h3 className="font-semibold flex items-center gap-2"><Palette className="w-5 h-5 text-primary-600" />Localisation</h3></div>
                <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Langue</label>
                    <select value={formData.language || 'fr-en'} onChange={(e) => setFormData({ ...formData, language: e.target.value })} className="input">
                      {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Fuseau horaire</label>
                    <select value={formData.timezone || 'Africa/Douala'} onChange={(e) => setFormData({ ...formData, timezone: e.target.value })} className="input">
                      {TIMEZONES.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Devise</label>
                    <select value={formData.currency || 'XAF'} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} className="input">
                      {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="card">
                <div className="card-header"><h3 className="font-semibold flex items-center gap-2"><Database className="w-5 h-5 text-primary-600" />Sauvegardes</h3></div>
                <div className="card-body space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div><p className="font-medium">Sauvegarde automatique</p><p className="text-sm text-gray-500">Sauvegardes regulieres de la BD</p></div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={formData.auto_backup ?? true} onChange={(e) => setFormData({ ...formData, auto_backup: e.target.checked })} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  <div>
                    <label className="label">Frequence</label>
                    <select value={formData.backup_frequency || 'weekly'} onChange={(e) => setFormData({ ...formData, backup_frequency: e.target.value })} className="input">
                      {BACKUP_FREQUENCIES.map((f) => <option key={f.code} value={f.code}>{f.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Access Denied Modal */}
      {showAccessDeniedModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAccessDeniedModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-bounce-in">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Ban className="w-4 h-4 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-700">Accès refusé</h3>
              </div>
              <button onClick={() => setShowAccessDeniedModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{accessDeniedMessage}</p>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Veuillez contacter votre administrateur système pour obtenir les permissions nécessaires.
              </p>
              <div className="flex justify-end mt-4">
                <button onClick={() => setShowAccessDeniedModal(false)} className="btn-primary">
                  Compris
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowPasswordModal(false); setPasswordError('') }} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-bounce-in">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Changer le mot de passe</h3>
              <button onClick={() => { setShowPasswordModal(false); setPasswordError('') }} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />{passwordError}
                </div>
              )}
              <div><label className="label">Mot de passe actuel</label><input type="password" required value={passwordData.current_password} onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })} className="input" /></div>
              <div>
                <label className="label">Nouveau mot de passe</label>
                <div className="relative">
                  <input type={showNewPassword ? 'text' : 'password'} required value={passwordData.new_password} onChange={(e) => { setPasswordData({ ...passwordData, new_password: e.target.value }); setPasswordError('') }} className="input pr-10" />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Min 6 caracteres, majuscule, minuscule, chiffre, caractere special</p>
              </div>
              <div><label className="label">Confirmer</label><input type="password" required value={passwordData.confirm_password} onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })} className="input" /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowPasswordModal(false); setPasswordError('') }} className="btn-outline">Annuler</button>
                <button type="submit" className="btn-primary">Changer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User CRUD Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowUserModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-bounce-in">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingUser ? 'Modifier' : 'Nouvel'} Utilisateur</h3>
              <button onClick={() => setShowUserModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="label">Matricule <span className="text-xs text-gray-400">(Auto-genere)</span></label>
                <div className="flex items-center gap-2">
                  <input value={userFormData.matricule} readOnly className="input bg-gray-50 text-gray-600 font-mono" placeholder="Selectionnez un role..." />
                  {!editingUser && userFormData.matricule && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
                </div>
                {userFormErrors.matricule && <p className="text-xs text-red-500 mt-1">{userFormErrors.matricule}</p>}
                <p className="text-xs text-gray-400 mt-1">Format: lbb + code role + identifiant unique (min 9 caracteres)</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Prenom *</label><input required value={userFormData.first_name} onChange={(e) => setUserFormData({ ...userFormData, first_name: e.target.value })} className="input" />{userFormErrors.first_name && <p className="text-xs text-red-500 mt-1">{userFormErrors.first_name}</p>}</div>
                <div><label className="label">Nom *</label><input required value={userFormData.last_name} onChange={(e) => setUserFormData({ ...userFormData, last_name: e.target.value })} className="input" />{userFormErrors.last_name && <p className="text-xs text-red-500 mt-1">{userFormErrors.last_name}</p>}</div>
              </div>
              <div><label className="label">Email *</label><input type="email" required value={userFormData.email} onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })} className="input" />{userFormErrors.email && <p className="text-xs text-red-500 mt-1">{userFormErrors.email}</p>}</div>
              <div><label className="label">Telephone</label><input value={userFormData.phone} onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })} className="input" /></div>
              <div>
                <label className="label">{editingUser ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *'}</label>
                <div className="relative">
                  <input type={showNewPassword ? 'text' : 'password'} required={!editingUser} value={userFormData.password} onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })} className="input pr-10" />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
                {userFormErrors.password && <p className="text-xs text-red-500 mt-1">{userFormErrors.password}</p>}
                <p className="text-xs text-gray-500 mt-1">Min 6 caracteres, 1 majuscule, 1 minuscule, 1 chiffre, 1 special (@$!%*?&+#-)</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Role *</label>
                  <select required value={userFormData.role_id} onChange={(e) => handleRoleChange(e.target.value)} className="input">
                    <option value="">Selectionner...</option>
                    {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                  </select>
                  {userFormErrors.role_id && <p className="text-xs text-red-500 mt-1">{userFormErrors.role_id}</p>}
                </div>
                <div>
                  <label className="label">Statut</label>
                  <select value={userFormData.status} onChange={(e) => setUserFormData({ ...userFormData, status: e.target.value })} className="input">
                    {USER_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Ecole *</label>
                  <select required value={userFormData.school_id} onChange={(e) => setUserFormData({ ...userFormData, school_id: e.target.value })} className="input">
                    <option value="">Selectionner...</option>
                    {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
                  </select>
                  {userFormErrors.school_id && <p className="text-xs text-red-500 mt-1">{userFormErrors.school_id}</p>}
                </div>
                <div>
                  <label className="label">Annee scolaire *</label>
                  <select required value={userFormData.academic_year_id} onChange={(e) => setUserFormData({ ...userFormData, academic_year_id: e.target.value })} className="input">
                    <option value="">Selectionner...</option>
                    {academicYears.map((year) => <option key={year.id} value={year.id}>{year.label}</option>)}
                  </select>
                  {userFormErrors.academic_year_id && <p className="text-xs text-red-500 mt-1">{userFormErrors.academic_year_id}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowUserModal(false)} className="btn-outline">Annuler</button>
                <button type="submit" className="btn-primary">{editingUser ? 'Mettre a jour' : 'Creer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* School Modal */}
      {showSchoolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSchoolModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-bounce-in">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingSchool ? 'Modifier' : 'Nouvel'} Etablissement</h3>
              <button onClick={() => setShowSchoolModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSaveSchool} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Nom *</label><input required value={schoolFormData.name || ''} onChange={(e) => setSchoolFormData({ ...schoolFormData, name: e.target.value })} className="input" /></div>
                <div><label className="label">Nom court *</label><input required value={schoolFormData.short_name || ''} onChange={(e) => setSchoolFormData({ ...schoolFormData, short_name: e.target.value })} className="input" /></div>
              </div>
              <div><label className="label">Adresse</label><input value={schoolFormData.address || ''} onChange={(e) => setSchoolFormData({ ...schoolFormData, address: e.target.value })} className="input" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Ville</label><input value={schoolFormData.city || ''} onChange={(e) => setSchoolFormData({ ...schoolFormData, city: e.target.value })} className="input" /></div>
                <div><label className="label">Pays</label><input value={schoolFormData.country || ''} onChange={(e) => setSchoolFormData({ ...schoolFormData, country: e.target.value })} className="input" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Telephone</label><input value={schoolFormData.phone || ''} onChange={(e) => setSchoolFormData({ ...schoolFormData, phone: e.target.value })} className="input" /></div>
                <div><label className="label">Email</label><input type="email" value={schoolFormData.email || ''} onChange={(e) => setSchoolFormData({ ...schoolFormData, email: e.target.value })} className="input" /></div>
              </div>
              <div><label className="label">Site web</label><input value={schoolFormData.website || ''} onChange={(e) => setSchoolFormData({ ...schoolFormData, website: e.target.value })} className="input" placeholder="https://" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Annee de fondation</label><input type="number" value={schoolFormData.founded_year || ''} onChange={(e) => setSchoolFormData({ ...schoolFormData, founded_year: parseInt(e.target.value) })} className="input" /></div>
                <div>
                  <label className="label">Statut</label>
                  <select value={schoolFormData.status || 'active'} onChange={(e) => setSchoolFormData({ ...schoolFormData, status: e.target.value })} className="input">
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Directeur</label><input value={schoolFormData.director_name || ''} onChange={(e) => setSchoolFormData({ ...schoolFormData, director_name: e.target.value })} className="input" /></div>
                <div><label className="label">Email directeur</label><input type="email" value={schoolFormData.director_email || ''} onChange={(e) => setSchoolFormData({ ...schoolFormData, director_email: e.target.value })} className="input" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">N° agrement</label><input value={schoolFormData.accreditation_number || ''} onChange={(e) => setSchoolFormData({ ...schoolFormData, accreditation_number: e.target.value })} className="input" /></div>
                <div><label className="label">N° fiscal</label><input value={schoolFormData.tax_id || ''} onChange={(e) => setSchoolFormData({ ...schoolFormData, tax_id: e.target.value })} className="input" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Banque</label><input value={schoolFormData.bank_name || ''} onChange={(e) => setSchoolFormData({ ...schoolFormData, bank_name: e.target.value })} className="input" /></div>
                <div><label className="label">N° compte</label><input value={schoolFormData.bank_account || ''} onChange={(e) => setSchoolFormData({ ...schoolFormData, bank_account: e.target.value })} className="input" /></div>
              </div>
              <div><label className="label">IBAN</label><input value={schoolFormData.bank_iban || ''} onChange={(e) => setSchoolFormData({ ...schoolFormData, bank_iban: e.target.value })} className="input" /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowSchoolModal(false)} className="btn-outline">Annuler</button>
                <button type="submit" className="btn-primary">{editingSchool ? 'Mettre a jour' : 'Creer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Academic Year Modal */}
      {showAcademicYearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAcademicYearModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-bounce-in">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingAcademicYear ? 'Modifier' : 'Nouvelle'} Annee Scolaire</h3>
              <button onClick={() => setShowAcademicYearModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSaveAcademicYear} className="p-6 space-y-4">
              <div><label className="label">Libelle *</label><input required value={academicYearFormData.label} onChange={(e) => setAcademicYearFormData({ ...academicYearFormData, label: e.target.value })} className="input" placeholder="Ex: 2025-2026" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Date debut *</label><input type="date" required value={academicYearFormData.start_date} onChange={(e) => setAcademicYearFormData({ ...academicYearFormData, start_date: e.target.value })} className="input" /></div>
                <div><label className="label">Date fin *</label><input type="date" required value={academicYearFormData.end_date} onChange={(e) => setAcademicYearFormData({ ...academicYearFormData, end_date: e.target.value })} className="input" /></div>
              </div>
              <div>
                <label className="label">Ecole</label>
                <select value={academicYearFormData.school_id} onChange={(e) => setAcademicYearFormData({ ...academicYearFormData, school_id: parseInt(e.target.value) })} className="input">
                  {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
                </select>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary-600" />Configuration academique</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Echelle maximale</label>
                    <select value={academicYearFormData.grading_scale} onChange={(e) => setAcademicYearFormData({ ...academicYearFormData, grading_scale: parseInt(e.target.value) })} className="input">
                      <option value={20}>20</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Seuil de passage</label>
                    <input type="number" step="0.5" value={academicYearFormData.pass_threshold} onChange={(e) => setAcademicYearFormData({ ...academicYearFormData, pass_threshold: parseFloat(e.target.value) })} className="input" />
                  </div>
                  <div>
                    <label className="label">Seuil tableau d'honneur</label>
                    <input type="number" step="0.5" value={academicYearFormData.honor_threshold} onChange={(e) => setAcademicYearFormData({ ...academicYearFormData, honor_threshold: parseFloat(e.target.value) })} className="input" />
                  </div>
                  <div>
                    <label className="label">Trimestres</label>
                    <select value={academicYearFormData.terms_count} onChange={(e) => setAcademicYearFormData({ ...academicYearFormData, terms_count: parseInt(e.target.value) })} className="input">
                      <option value={2}>2 (Semestres)</option>
                      <option value={3}>3 (Trimestres)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Sequences/trimestre</label>
                    <select value={academicYearFormData.sequences_per_term} onChange={(e) => setAcademicYearFormData({ ...academicYearFormData, sequences_per_term: parseInt(e.target.value) })} className="input">
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <input type="checkbox" id="is_current" checked={academicYearFormData.is_current} onChange={(e) => setAcademicYearFormData({ ...academicYearFormData, is_current: e.target.checked })} className="w-4 h-4 text-primary-600 rounded" />
                <label htmlFor="is_current" className="text-sm font-medium">Definir comme annee scolaire active</label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAcademicYearModal(false)} className="btn-outline">Annuler</button>
                <button type="submit" className="btn-primary">{editingAcademicYear ? 'Mettre a jour' : 'Creer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {show2FAModal && twoFASetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShow2FAModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-bounce-in">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Configurer la 2FA</h3>
              <button onClick={() => setShow2FAModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4 text-center">
              <p className="text-sm text-gray-600">Scannez ce QR code avec Google Authenticator</p>
              {twoFASetup?.qr_code && <img src={twoFASetup.qr_code} alt="QR Code" className="mx-auto w-48 h-48" />}
              <div className="bg-gray-100 p-3 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Cle secrete</p>
                <code className="text-sm font-mono">{twoFASetup?.secret || ''}</code>
              </div>
              <div>
                <label className="label">Code de verification</label>
                <input type="text" maxLength={6} placeholder="000000" value={twoFACode} onChange={(e) => setTwoFACode(e.target.value)} className="input text-center text-2xl tracking-widest" />
              </div>
              <button onClick={handleEnable2FA} className="btn-primary w-full">Activer la 2FA</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}