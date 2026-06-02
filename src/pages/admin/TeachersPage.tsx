import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap, Plus, Search, Filter, Download, Upload,
  Edit2, Trash2, Eye, Mail, Phone, MapPin, BookOpen,
  Clock, Award, Calendar, CheckCircle, XCircle, User,
  FileText, Printer, ChevronDown, ChevronUp, TrendingUp,
  Loader2, Users, ArrowRight, X
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { teachersApi, subjectsApi, classesApi } from '@/services/api'
import { toast } from 'sonner'
import { useLang } from '@/hooks/useLang'

// ==================== TYPES ====================
interface Teacher {
  id: number
  user_id: number
  matricule: string
  qualifications: string[]
  subjects_specialization: string[]
  hire_date: string
  contract_type: 'PERMANENT' | 'CONTRACTUAL' | 'TEMPORARY'
  status: 'active' | 'inactive' | 'suspendu' | 'retraite'
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  full_name?: string
  user?: {
    id: number
    first_name: string
    last_name: string
    email: string
    phone?: string
  }
  teacher_subject_classes?: Array<{
    id: number
    subject_id: number
    class_id: number
    hours_per_week: number
    is_principal_teacher: boolean
    subject?: { label_fr: string; label_en: string }
    class_?: { name: string; abbreviation: string }
  }>
}

// ==================== CONFIGS ALIGNÉES AVEC LE BACKEND ====================

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: 'Actif', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  inactive: { label: 'Inactif', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: XCircle },
  suspendu: { label: 'Suspendu', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  retraite: { label: 'Retraité', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Award },
}

// ✅ ALIGNÉ AVEC LE BACKEND: CDI, CDD, VACATAIRE, STAGE, CONTRAT_PRO
const CONTRACT_TYPES = [
  { value: 'PERMANENT', label: 'Permanent' },
  { value: 'CONTRACTUAL', label: 'Contractuel' },
  { value: 'TEMPORARY', label: 'Temporaire' },
]

export default function TeachersPage() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    contract_type: '',
    search: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  // Modals
  const [showForm, setShowForm] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)

  // Reference data
  const [subjects, setSubjects] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    matricule: '',
    qualifications: [] as string[],
    subjects_specialization: [] as string[],
    hire_date: new Date().toISOString().split('T')[0],
    contract_type: 'PERMANENT' as string,
    status: 'active' as string,
  })

  const loadTeachers = useCallback(async () => {
    setLoading(true)
    try {
      // ✅ FIX: Pas de per_page/page — le backend ne les supporte pas dans getAll
      const params: Record<string, string> = {}
      if (filters.status) params.status = filters.status
      if (filters.contract_type) params.contract_type = filters.contract_type
      if (filters.search) params.search = filters.search

      const response = await teachersApi.getAll(params)
      // Le backend retourne un array directement (pas {items, total})
      const items = Array.isArray(response) ? response : ((response as any).items || [])
      setTeachers(items)
    } catch (err) {
      toast.error(lang === 'fr' ? 'Erreur lors du chargement des enseignants' : 'Error loading teachers')
    } finally {
      setLoading(false)
    }
  }, [filters, lang])

  const loadStats = useCallback(async () => {
    try {
      const response = await teachersApi.getAll({})
      const items = Array.isArray(response) ? response : ((response as any).items || [])
      setStats({
        total_teachers: items.length,
        active_teachers: items.filter((t: Teacher) => t.status === 'active').length,
        by_contract_type: items.reduce((acc: Record<string, number>, t: Teacher) => {
          acc[t.contract_type] = (acc[t.contract_type] || 0) + 1
          return acc
        }, {}),
        by_status: items.reduce((acc: Record<string, number>, t: Teacher) => {
          acc[t.status] = (acc[t.status] || 0) + 1
          return acc
        }, {}),
        new_this_year: items.filter((t: Teacher) => {
          if (!t.hire_date) return false
          const hireYear = new Date(t.hire_date).getFullYear()
          return hireYear === new Date().getFullYear()
        }).length,
      })
    } catch (err) {
      console.error('Error loading stats:', err)
    }
  }, [])

  const loadReferenceData = useCallback(async () => {
    try {
      let subjectsData: any[] = []
      try {
        const subjRes = await subjectsApi.getAll()
        subjectsData = Array.isArray(subjRes) ? subjRes : (subjRes.items || [])
      } catch (e: any) {
        console.warn('Subjects load error:', e?.response?.status || e)
      }

      let classesData: any[] = []
      try {
        const clsRes = await classesApi.getAll()
        classesData = Array.isArray(clsRes) ? clsRes : (clsRes.items || [])
      } catch (e: any) {
        console.warn('Classes load error:', e?.response?.status || e)
      }

      setSubjects(subjectsData)
      setClasses(classesData)
    } catch (err) {
      console.error('Error loading reference data:', err)
    }
  }, [])

  useEffect(() => {
    loadTeachers()
    loadStats()
    loadReferenceData()
  }, [loadTeachers, loadStats, loadReferenceData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data: any = {
        ...formData,
        qualifications: formData.qualifications.filter((q: string) => q.trim() !== ''),
        subjects_specialization: formData.subjects_specialization.filter((s: string) => s.trim() !== ''),
      }

      // Supprimer password vide en mode édition
      if (editingTeacher && !data.password) {
        delete data.password
      }

      if (editingTeacher) {
        await teachersApi.update(editingTeacher.id, data)
        toast.success(lang === 'fr' ? 'Enseignant mis à jour' : 'Teacher updated')
      } else {
        await teachersApi.create(data)
        toast.success(lang === 'fr' ? 'Enseignant créé' : 'Teacher created')
      }
      setShowForm(false)
      setEditingTeacher(null)
      resetForm()
      loadTeachers()
      loadStats()
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || err.message
      toast.error(msg || (lang === 'fr' ? "Erreur lors de l'enregistrement" : 'Error during registration'))
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(lang === 'fr' ? 'Supprimer cet enseignant ?' : 'Delete this teacher?')) return
    try {
      await teachersApi.delete(id)
      toast.success(lang === 'fr' ? 'Enseignant supprimé' : 'Teacher deleted')
      loadTeachers()
      loadStats()
    } catch (err) {
      toast.error(lang === 'fr' ? 'Erreur lors de la suppression' : 'Delete error')
    }
  }

  const handleAssignSubject = async (teacherId: number, data: any) => {
    try {
      await teachersApi.createAssignment(data)
      toast.success(lang === 'fr' ? 'Matière assignée' : 'Subject assigned')
      setShowAssign(false)
      loadTeachers()
    } catch (err) {
      toast.error(lang === 'fr' ? "Erreur lors de l'assignation" : 'Assignment error')
    }
  }

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      matricule: '',
      qualifications: [],
      subjects_specialization: [],
      hire_date: new Date().toISOString().split('T')[0],
      contract_type: 'CDI',
      status: 'active',
    })
  }

  const editTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setFormData({
      first_name: teacher.first_name || teacher.user?.first_name || '',
      last_name: teacher.last_name || teacher.user?.last_name || '',
      email: teacher.email || teacher.user?.email || '',
      phone: teacher.phone || teacher.user?.phone || '',
      password: '',
      matricule: teacher.matricule || '',
      qualifications: teacher.qualifications || [],
      subjects_specialization: teacher.subjects_specialization || [],
      hire_date: teacher.hire_date || new Date().toISOString().split('T')[0],
      contract_type: teacher.contract_type || 'CDI',
      status: teacher.status || 'active',
    })
    setShowForm(true)
  }

  const viewDetail = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setShowDetail(true)
  }

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.active
    const IconComponent = config.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </span>
    )
  }

  const clearFilters = () => {
    setFilters({ status: '', contract_type: '', search: '' })
  }

  const addQualification = () => {
    setFormData(prev => ({ ...prev, qualifications: [...prev.qualifications, ''] }))
  }

  const removeQualification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index)
    }))
  }

  const updateQualification = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.map((q, i) => i === index ? value : q)
    }))
  }

  const addSpecialization = () => {
    setFormData(prev => ({ ...prev, subjects_specialization: [...prev.subjects_specialization, ''] }))
  }

  const removeSpecialization = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subjects_specialization: prev.subjects_specialization.filter((_, i) => i !== index)
    }))
  }

  const updateSpecialization = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      subjects_specialization: prev.subjects_specialization.map((s, i) => i === index ? value : s)
    }))
  }

  // ==================== RENDER ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-amber-50/10">
      {/* Header */}
      <div className="page-header bg-white/80 backdrop-blur-md border-b border-blue-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="page-title text-2xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                {lang === 'fr' ? 'Gestion des Enseignants' : 'Teacher Management'}
              </h1>
              <p className="page-subtitle text-sm text-gray-500 mt-0.5">
                {lang === 'fr' ? 'Suivi des enseignants, matières et affectations' : 'Teacher tracking, subjects and assignments'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >
              <Filter className="w-4 h-4" />
              {lang === 'fr' ? 'Filtres' : 'Filters'}
            </button>
            <button
              onClick={() => { setEditingTeacher(null); resetForm(); setShowForm(true) }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md shadow-blue-200"
            >
              <Plus className="w-4 h-4" />
              {lang === 'fr' ? 'Nouvel enseignant' : 'New teacher'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_teachers || 0}</p>
              <p className="text-xs text-gray-500">{lang === 'fr' ? 'Total' : 'Total'}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.active_teachers || 0}</p>
              <p className="text-xs text-gray-500">{lang === 'fr' ? 'Actifs' : 'Active'}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.by_contract_type?.CDI || 0}</p>
              <p className="text-xs text-gray-500">{lang === 'fr' ? 'CDI' : 'Permanent'}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.new_this_year || 0}</p>
              <p className="text-xs text-gray-500">{lang === 'fr' ? 'Nouveaux' : 'New'}</p>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{lang === 'fr' ? 'Statut' : 'Status'}</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">{lang === 'fr' ? 'Tous' : 'All'}</option>
                  {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{lang === 'fr' ? 'Type contrat' : 'Contract type'}</label>
                <select
                  value={filters.contract_type}
                  onChange={(e) => setFilters({ ...filters, contract_type: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">{lang === 'fr' ? 'Tous' : 'All'}</option>
                  {CONTRACT_TYPES.map((ct) => (
                    <option key={ct.value} value={ct.value}>{ct.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{lang === 'fr' ? 'Recherche' : 'Search'}</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={lang === 'fr' ? 'Nom, matricule...' : 'Name, registration...'}
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={clearFilters} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                {lang === 'fr' ? 'Réinitialiser' : 'Reset'}
              </button>
              <button onClick={() => loadTeachers()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                {lang === 'fr' ? 'Appliquer' : 'Apply'}
              </button>
            </div>
          </div>
        )}

        {/* Teachers Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">{lang === 'fr' ? 'Liste des enseignants' : 'Teacher list'}</h3>
            <span className="text-xs text-gray-500">{teachers.length} {lang === 'fr' ? 'entrées' : 'entries'}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{lang === 'fr' ? 'Matricule' : 'Reg. No.'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{lang === 'fr' ? 'Enseignant' : 'Teacher'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">{lang === 'fr' ? 'Contact' : 'Contact'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">{lang === 'fr' ? 'Qualifications' : 'Qualifications'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{lang === 'fr' ? 'Contrat' : 'Contract'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{lang === 'fr' ? 'Statut' : 'Status'}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{lang === 'fr' ? 'Actions' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" /></td></tr>
                ) : teachers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">{lang === 'fr' ? 'Aucun enseignant trouvé' : 'No teachers found'}</p>
                    </td>
                  </tr>
                ) : (
                  teachers.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{teacher.matricule}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {(teacher.first_name || teacher.user?.first_name || '')[0]}{(teacher.last_name || teacher.user?.last_name || '')[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{teacher.last_name || teacher.user?.last_name} {teacher.first_name || teacher.user?.first_name}</p>
                            <p className="text-xs text-gray-500">{teacher.subjects_specialization?.slice(0, 2).join(', ') || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />{teacher.email || teacher.user?.email || '-'}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />{teacher.phone || teacher.user?.phone || '-'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {teacher.qualifications?.slice(0, 2).map((q, i) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{q}</span>
                          ))}
                          {(teacher.qualifications?.length || 0) > 2 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded text-xs">+{(teacher.qualifications?.length || 0) - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                          {CONTRACT_TYPES.find(ct => ct.value === teacher.contract_type)?.label || teacher.contract_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(teacher.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => viewDetail(teacher)} className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600" title="Voir"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => editTeacher(teacher)} className="p-1.5 hover:bg-amber-50 rounded-lg text-gray-400 hover:text-amber-600" title="Modifier"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => { setSelectedTeacher(teacher); setShowAssign(true) }} className="p-1.5 hover:bg-purple-50 rounded-lg text-gray-400 hover:text-purple-600" title="Assigner"><BookOpen className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(teacher.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowForm(false); setEditingTeacher(null) }} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingTeacher ? (lang === 'fr' ? "Modifier l'enseignant" : 'Edit teacher') : (lang === 'fr' ? "Nouvel enseignant" : 'New teacher')}
              </h3>
              <button onClick={() => { setShowForm(false); setEditingTeacher(null) }} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Prénom *' : 'First name *'}</label>
                  <input
                    required
                    value={formData.first_name || ''}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Nom *' : 'Last name *'}</label>
                  <input
                    required
                    value={formData.last_name || ''}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Email *' : 'Email *'}</label>
                  <input
                    type="email"
                    required
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Téléphone' : 'Phone'}</label>
                  <input
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Matricule *' : 'Registration *'}</label>
                  <input
                    required
                    value={formData.matricule || ''}
                    onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="ENS-2025-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Type contrat' : 'Contract type'}</label>
                  <select
                    value={formData.contract_type}
                    onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {CONTRACT_TYPES.map((ct) => (
                      <option key={ct.value} value={ct.value}>{ct.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? "Date d'embauche" : 'Hire date'}</label>
                  <input
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Mot de passe *' : 'Password *'}</label>
                  <input
                    type="password"
                    required={!editingTeacher}
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder={editingTeacher ? (lang === 'fr' ? 'Laisser vide pour ne pas changer' : 'Leave empty to keep unchanged') : ''}
                  />
                </div>
              </div>

              {/* Qualifications (ARRAY) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Qualifications' : 'Qualifications'}</label>
                <div className="space-y-2">
                  {formData.qualifications.map((q: string, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={q}
                        onChange={(e) => updateQualification(i, e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder={lang === 'fr' ? 'Ex: Master, CAPES...' : 'Ex: Master, CAPES...'}
                      />
                      <button type="button" onClick={() => removeQualification(i)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={addQualification} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    <Plus className="w-4 h-4" />{lang === 'fr' ? 'Ajouter une qualification' : 'Add qualification'}
                  </button>
                </div>
              </div>

              {/* Spécialisations (ARRAY) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Spécialisations' : 'Specializations'}</label>
                <div className="space-y-2">
                  {formData.subjects_specialization.map((s: string, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={s}
                        onChange={(e) => updateSpecialization(i, e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder={lang === 'fr' ? 'Ex: Mathématiques, Physique...' : 'Ex: Mathematics, Physics...'}
                      />
                      <button type="button" onClick={() => removeSpecialization(i)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={addSpecialization} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    <Plus className="w-4 h-4" />{lang === 'fr' ? 'Ajouter une spécialisation' : 'Add specialization'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Statut' : 'Status'}</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditingTeacher(null) }} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  {lang === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md shadow-blue-200">
                  {editingTeacher ? (lang === 'fr' ? 'Mettre à jour' : 'Update') : (lang === 'fr' ? 'Créer' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetail(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">{lang === 'fr' ? "Profil de l'enseignant" : 'Teacher profile'}</h3>
              <button onClick={() => setShowDetail(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {(selectedTeacher.first_name || selectedTeacher.user?.first_name || '')[0]}{(selectedTeacher.last_name || selectedTeacher.user?.last_name || '')[0]}
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">{selectedTeacher.last_name || selectedTeacher.user?.last_name} {selectedTeacher.first_name || selectedTeacher.user?.first_name}</h4>
                  <p className="text-sm text-gray-500">{selectedTeacher.matricule}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {getStatusBadge(selectedTeacher.status)}
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                      {CONTRACT_TYPES.find(ct => ct.value === selectedTeacher.contract_type)?.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{lang === 'fr' ? 'Contact' : 'Contact'}</label>
                  <div className="space-y-1">
                    <p className="text-sm flex items-center gap-2 text-gray-700"><Mail className="w-4 h-4 text-gray-400" />{selectedTeacher.email || selectedTeacher.user?.email || '-'}</p>
                    <p className="text-sm flex items-center gap-2 text-gray-700"><Phone className="w-4 h-4 text-gray-400" />{selectedTeacher.phone || selectedTeacher.user?.phone || '-'}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{lang === 'fr' ? 'Informations' : 'Information'}</label>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-700">{lang === 'fr' ? 'Embauché le:' : 'Hired on:'} {selectedTeacher.hire_date}</p>
                    <p className="text-sm text-gray-700">{lang === 'fr' ? 'Qualifications:' : 'Qualifications:'} {selectedTeacher.qualifications?.join(', ') || '-'}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{lang === 'fr' ? 'Matières enseignées' : 'Subjects taught'}</label>
                <div className="flex flex-wrap gap-2">
                  {selectedTeacher.teacher_subject_classes?.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">{lang === 'fr' ? 'Aucune matière assignée' : 'No subjects assigned'}</p>
                  ) : (
                    selectedTeacher.teacher_subject_classes?.map((tsc) => (
                      <span key={tsc.id} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {tsc.subject?.label_fr || 'Matière'} — {tsc.class_?.name || 'Classe'} ({tsc.hours_per_week}h)
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Subject Modal */}
      {showAssign && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAssign(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">{lang === 'fr' ? 'Assigner une matière' : 'Assign a subject'}</h3>
              <p className="text-sm text-gray-500">{lang === 'fr' ? 'à' : 'to'} {selectedTeacher.last_name || selectedTeacher.user?.last_name} {selectedTeacher.first_name || selectedTeacher.user?.first_name}</p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.target as HTMLFormElement
                const formData = new FormData(form)
                handleAssignSubject(selectedTeacher.id, {
                  teacher_id: selectedTeacher.id,
                  subject_id: parseInt(formData.get('subject_id') as string),
                  class_id: parseInt(formData.get('class_id') as string),
                  hours_per_week: parseFloat(formData.get('hours') as string),
                  academic_year_id: 1, // TODO: récupérer l'année courante
                })
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Matière *' : 'Subject *'}</label>
                <select name="subject_id" required className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                  <option value="">{lang === 'fr' ? 'Sélectionner...' : 'Select...'}</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.label_fr || s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Classe *' : 'Class *'}</label>
                <select name="class_id" required className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                  <option value="">{lang === 'fr' ? 'Sélectionner...' : 'Select...'}</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Heures/semaine *' : 'Hours/week *'}</label>
                <input name="hours" type="number" step="0.5" min="0.5" required className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" defaultValue="2" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAssign(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">{lang === 'fr' ? 'Annuler' : 'Cancel'}</button>
                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md shadow-blue-200">{lang === 'fr' ? 'Assigner' : 'Assign'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}