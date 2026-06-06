import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap, Plus, Search, Filter, Download, Upload,
  Edit2, Trash2, Eye, Mail, Phone, BookOpen, X, ChevronDown,
  Loader2, Users, CheckCircle, XCircle, Award, ArrowRight,
  Calculator, School, Layers, Star, User
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { teachersApi, subjectsApi, classesApi, schoolApi, apiService } from '@/services/api'
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
  contract_type: string
  status: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  user?: {
    id: number
    first_name: string
    last_name: string
    email: string
    phone?: string
  }
  teacher_subject_classes?: TeacherSubjectClass[]
}

interface TeacherSubjectClass {
  id: number
  subject_id: number
  class_id: number
  hours_per_week: number
  coefficient: number
  is_principal_teacher: boolean
  subject?: { label_fr: string; label_en: string; code: string }
  class_?: { name: string; abbreviation: string; level_name?: string }
}

interface Subject {
  id: number
  code: string
  label_fr: string
  label_en: string
  default_coefficient: number
  section_id?: number
  specialty_id?: number
  section_name?: string
  specialty_name?: string
}

interface ClassItem {
  id: number
  name: string
  abbreviation: string
  level_id: number
  level_name?: string
  section_id?: number
  section_name?: string
}

interface SubjectCoefficient {
  id: number
  subject_id: number
  class_id: number
  coefficient: number
  class_name?: string
  class_level?: string
}

interface AssignmentForm {
  teacher_id: number
  subject_id: number
  class_id: number
  hours_per_week: number
  coefficient: number
  is_principal_teacher: boolean
  academic_year_id: number
}

// ==================== CONFIGS ====================
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  active: { label: 'Actif', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
  inactive: { label: 'Inactif', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: XCircle },
  suspendu: { label: 'Suspendu', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  retraite: { label: 'Retraité', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Award },
}

const CONTRACT_TYPES = [
  { value: 'PERMANENT', label: 'Permanent (CDI)' },
  { value: 'CONTRACTUAL', label: 'Contractuel (CDD)' },
  { value: 'TEMPORARY', label: 'Temporaire' },
  { value: 'INTERN', label: 'Stagiaire' },
]

export default function TeachersPage() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [academicYearId, setAcademicYearId] = useState<number | null>(null)

  // Filters
  const [filters, setFilters] = useState({ status: '', contract_type: '', search: '' })
  const [showFilters, setShowFilters] = useState(false)

  // Modals
  const [showForm, setShowForm] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [showSubjectManager, setShowSubjectManager] = useState(false)
  const [showCoeffModal, setShowCoeffModal] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    password: '', matricule: '', qualifications: [] as string[],
    subjects_specialization: [] as string[],
    hire_date: new Date().toISOString().split('T')[0],
    contract_type: 'PERMANENT', status: 'active',
  })

  const [assignmentForm, setAssignmentForm] = useState<Partial<AssignmentForm>>({
    subject_id: 0, class_id: 0, hours_per_week: 2,
    coefficient: 1, is_principal_teacher: false,
  })

  const [subjectCoefficients, setSubjectCoefficients] = useState<SubjectCoefficient[]>([])
  const [newCoeff, setNewCoeff] = useState({ class_id: 0, coefficient: 1 })

  // Subject creation form
  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [subjectSearchTerm, setSubjectSearchTerm] = useState('')
  const [subjectFormData, setSubjectFormData] = useState({
    code: '', label_fr: '', label_en: '', coefficient: 1, section_id: 0, specialty_id: 0, section: 'FR' as 'FR' | 'EN'
  })

  // ==================== LOAD DATA ====================
  const loadAcademicYear = useCallback(async () => {
    try {
      const schoolId = user?.school_id || 1
      const res = await schoolApi.getAcademicYears(schoolId)
      const years = Array.isArray(res) ? res : (res.items || res.data || [])
      const current = years.find((y: any) => y.is_current) || years[0]
      if (current) setAcademicYearId(current.id)
    } catch (e) { console.warn('Academic year load error', e) }
  }, [user])

  const loadTeachers = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (filters.status) params.status = filters.status
      if (filters.contract_type) params.contract_type = filters.contract_type
      if (filters.search) params.search = filters.search

      const response = await teachersApi.getAll(params)
      const items = Array.isArray(response) ? response : ((response as any).items || [])
      setTeachers(items)
    } catch (err) {
      toast.error(lang === 'fr' ? 'Erreur chargement enseignants' : 'Error loading teachers')
    } finally { setLoading(false) }
  }, [filters, lang])

  const loadSubjects = useCallback(async () => {
    try {
      console.log('Loading subjects...')
      const res = await apiService.get<any>('/teachers/subjects')
      console.log('Raw subjects response:', res)

      const items = Array.isArray(res) ? res : (res?.items || res?.data || [])
      console.log('Subjects parsed:', items.length, 'items')
      console.log('Subject items:', items.map((s: any) => ({ id: s.id, code: s.code, label: s.label_fr, coef: s.default_coefficient })))

      setSubjects(items)
    } catch (e: any) {
      console.error('Subjects load error:', e?.response?.status, e?.response?.data)
      toast.error(lang === 'fr' ? 'Erreur chargement matières' : 'Error loading subjects')
    }
  }, [lang])

  const loadClasses = useCallback(async () => {
    try {
      const res = await classesApi.getAll()
      const items = Array.isArray(res) ? res : (res.items || res.data || [])
      setClasses(items)
    } catch (e) { console.warn('Classes load error', e) }
  }, [])

  const loadStats = useCallback(() => {
    const items = teachers
    setStats({
      total_teachers: items.length,
      active_teachers: items.filter((t) => t.status === 'active').length,
      by_contract_type: items.reduce((acc: Record<string, number>, t) => {
        acc[t.contract_type] = (acc[t.contract_type] || 0) + 1
        return acc
      }, {}),
      by_status: items.reduce((acc: Record<string, number>, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1
        return acc
      }, {}),
      new_this_year: items.filter((t) => {
        if (!t.hire_date) return false
        return new Date(t.hire_date).getFullYear() === new Date().getFullYear()
      }).length,
    })
  }, [teachers])

  useEffect(() => {
    console.log('Initial load triggered')
    loadAcademicYear()
    loadSubjects()
    loadClasses()
  }, [])

  useEffect(() => {
    console.log('Subjects state updated:', subjects.length)
  }, [subjects])

  useEffect(() => {
    loadTeachers()
  }, [loadTeachers])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  // ==================== CRUD TEACHER ====================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data: any = {
        ...formData,
        qualifications: formData.qualifications.filter((q) => q.trim() !== ''),
        subjects_specialization: formData.subjects_specialization.filter((s) => s.trim() !== ''),
      }
      if (editingTeacher && !data.password) delete data.password

      if (editingTeacher) {
        await teachersApi.update(editingTeacher.id, data)
        toast.success(lang === 'fr' ? 'Enseignant mis à jour' : 'Teacher updated')
      } else {
        await teachersApi.create(data)
        toast.success(lang === 'fr' ? 'Enseignant créé avec compte utilisateur' : 'Teacher created with user account')
      }
      setShowForm(false)
      setEditingTeacher(null)
      resetForm()
      loadTeachers()
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
    } catch (err) {
      toast.error(lang === 'fr' ? 'Erreur suppression' : 'Delete error')
    }
  }

  // ==================== ASSIGN SUBJECT ====================
  const handleAssignSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeacher || !academicYearId) return
    if (!assignmentForm.subject_id || !assignmentForm.class_id) {
      toast.error(lang === 'fr' ? 'Veuillez sélectionner une matière et une classe' : 'Please select a subject and a class')
      return
    }

    try {
      const data = {
        teacher_id: selectedTeacher.id,
        subject_id: assignmentForm.subject_id as number,
        class_id: assignmentForm.class_id as number,
        hours_per_week: assignmentForm.hours_per_week || 2,
        coefficient: assignmentForm.coefficient || 1,
        is_principal_teacher: assignmentForm.is_principal_teacher || false,
        academic_year_id: academicYearId,
      }
      await teachersApi.createAssignment(data)
      toast.success(lang === 'fr' ? 'Matière assignée avec succès' : 'Subject assigned successfully')
      setShowAssign(false)
      loadTeachers()
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message
      toast.error(msg || (lang === 'fr' ? "Erreur d'assignation" : 'Assignment error'))
    }
  }

  // ==================== COEFFICIENTS ====================
  const loadSubjectCoefficients = async (subjectId: number) => {
    try {
      const res = await subjectsApi.getCoefficients(subjectId)
      const items = Array.isArray(res) ? res : (res.items || [])
      setSubjectCoefficients(items)
    } catch (e) {
      const coeffs: SubjectCoefficient[] = []
      teachers.forEach((t) => {
        t.teacher_subject_classes?.forEach((tsc) => {
          if (tsc.subject_id === subjectId && tsc.coefficient) {
            const cls = classes.find((c) => c.id === tsc.class_id)
            coeffs.push({
              id: tsc.id, subject_id: subjectId, class_id: tsc.class_id,
              coefficient: tsc.coefficient,
              class_name: cls?.name, class_level: cls?.level_name,
            })
          }
        })
      })
      setSubjectCoefficients(coeffs)
    }
  }

  const handleAddCoefficient = async () => {
    if (!selectedSubject || !newCoeff.class_id) return
    try {
      const data = {
        subject_id: selectedSubject.id,
        class_id: newCoeff.class_id,
        coefficient: newCoeff.coefficient,
      }
      await subjectsApi.createCoefficient(data)
      toast.success(lang === 'fr' ? 'Coefficient ajouté' : 'Coefficient added')
      loadSubjectCoefficients(selectedSubject.id)
      setNewCoeff({ class_id: 0, coefficient: selectedSubject.default_coefficient || 1 })
    } catch (err: any) {
      toast.error(err.message || (lang === 'fr' ? 'Erreur coefficient' : 'Coefficient error'))
    }
  }

  const handleDeleteCoefficient = async (coeffId: number) => {
    if (!confirm(lang === 'fr' ? 'Supprimer ce coefficient ?' : 'Delete this coefficient?')) return
    try {
      await subjectsApi.deleteCoefficient(coeffId)
      toast.success(lang === 'fr' ? 'Coefficient supprimé' : 'Coefficient deleted')
      if (selectedSubject) loadSubjectCoefficients(selectedSubject.id)
    } catch (err) {
      toast.error(lang === 'fr' ? 'Erreur suppression' : 'Delete error')
    }
  }

  // ==================== HELPERS ====================
  const resetForm = () => {
    setFormData({
      first_name: '', last_name: '', email: '', phone: '', password: '',
      matricule: '', qualifications: [], subjects_specialization: [],
      hire_date: new Date().toISOString().split('T')[0],
      contract_type: 'PERMANENT', status: 'active',
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
      contract_type: teacher.contract_type || 'PERMANENT',
      status: teacher.status || 'active',
    })
    setShowForm(true)
  }

  const viewDetail = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setShowDetail(true)
  }

  const openAssignModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setAssignmentForm({
      subject_id: 0, class_id: 0, hours_per_week: 2,
      coefficient: 1, is_principal_teacher: false,
    })
    setShowAssign(true)
  }

  const openCoeffModal = (subject: Subject) => {
    setSelectedSubject(subject)
    setNewCoeff({ class_id: 0, coefficient: subject.default_coefficient || 1 })
    loadSubjectCoefficients(subject.id)
    setShowCoeffModal(true)
  }

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.active
    const IconComponent = config.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <IconComponent className="w-3 h-3" />{config.label}
      </span>
    )
  }

  const getEffectiveCoefficient = (subject: Subject | undefined, classId: number) => {
    if (!subject) return 1
    const specific = subjectCoefficients.find(
      (c) => c.subject_id === subject.id && c.class_id === classId
    )
    return specific ? specific.coefficient : (subject.default_coefficient || 1)
  }

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // CORRECTION: Mapper section FR/EN vers section_id
      let sectionId = subjectFormData.section_id;
      if (sectionId <= 0 && subjectFormData.section) {
        try {
          const sectionsRes: any = await apiService.get('/school/sections');
          const sections = Array.isArray(sectionsRes) ? sectionsRes : (sectionsRes?.items || sectionsRes?.data || []);
          const found = sections.find((sec: any) =>
            (sec.code || '').toUpperCase() === subjectFormData.section.toUpperCase() ||
            (sec.label_fr || '').toLowerCase().includes(subjectFormData.section.toLowerCase() === 'fr' ? 'franc' : 'angl')
          );
          if (found) sectionId = found.id;
        } catch (e) {
          console.warn('Could not load sections for mapping');
        }
      }

      const data: any = {
        code: subjectFormData.code,
        label_fr: subjectFormData.label_fr,
        label_en: subjectFormData.label_en || subjectFormData.label_fr,
        abbreviation: subjectFormData.code,
        coefficient: subjectFormData.coefficient || 1,
      }
      if (sectionId > 0) data.section_id = sectionId
      if (subjectFormData.specialty_id > 0) data.specialty_id = subjectFormData.specialty_id

      await subjectsApi.create(data)
      toast.success(lang === 'fr' ? 'Matière créée avec succès' : 'Subject created successfully')
      setShowSubjectForm(false)
      setSubjectFormData({ code: '', label_fr: '', label_en: '', coefficient: 1, section_id: 0, specialty_id: 0, section: 'FR' })
      loadSubjects()
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message
      toast.error(msg || (lang === 'fr' ? "Erreur lors de la création" : 'Creation error'))
    }
  }

  const clearFilters = () => setFilters({ status: '', contract_type: '', search: '' })

  const addQualification = () => setFormData(p => ({ ...p, qualifications: [...p.qualifications, ''] }))
  const removeQualification = (i: number) => setFormData(p => ({ ...p, qualifications: p.qualifications.filter((_, idx) => idx !== i) }))
  const updateQualification = (i: number, v: string) => setFormData(p => ({ ...p, qualifications: p.qualifications.map((q, idx) => idx === i ? v : q) }))

  const addSpecialization = () => setFormData(p => ({ ...p, subjects_specialization: [...p.subjects_specialization, ''] }))
  const removeSpecialization = (i: number) => setFormData(p => ({ ...p, subjects_specialization: p.subjects_specialization.filter((_, idx) => idx !== i) }))
  const updateSpecialization = (i: number, v: string) => setFormData(p => ({ ...p, subjects_specialization: p.subjects_specialization.map((s, idx) => idx === i ? v : s) }))

  // ==================== RENDER ====================
    const filteredSubjects = subjectSearchTerm
      ? subjects.filter((s) =>
          (s.label_fr || '').toLowerCase().includes(subjectSearchTerm.toLowerCase()) ||
          (s.label_en || '').toLowerCase().includes(subjectSearchTerm.toLowerCase()) ||
          (s.code || '').toLowerCase().includes(subjectSearchTerm.toLowerCase()) ||
          (s.section_name || '').toLowerCase().includes(subjectSearchTerm.toLowerCase())
        )
      : subjects;
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
                {lang === 'fr' ? 'Comptes utilisateurs, matières et coefficients' : 'User accounts, subjects and coefficients'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >
              <Filter className="w-4 h-4" />{lang === 'fr' ? 'Filtres' : 'Filters'}
            </button>
            <button
              onClick={() => setShowSubjectManager(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >
              <BookOpen className="w-4 h-4" />{lang === 'fr' ? 'Matières' : 'Subjects'}
            </button>
            <button
              onClick={() => { setEditingTeacher(null); resetForm(); setShowForm(true) }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md shadow-blue-200"
            >
              <Plus className="w-4 h-4" />{lang === 'fr' ? 'Nouvel enseignant' : 'New teacher'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: GraduationCap, color: 'blue', label: lang === 'fr' ? 'Total' : 'Total', value: stats?.total_teachers || 0 },
            { icon: CheckCircle, color: 'green', label: lang === 'fr' ? 'Actifs' : 'Active', value: stats?.active_teachers || 0 },
            { icon: Users, color: 'purple', label: 'CDI', value: stats?.by_contract_type?.PERMANENT || 0 },
            { icon: Award, color: 'amber', label: lang === 'fr' ? 'Nouveaux' : 'New', value: stats?.new_this_year || 0 },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
              <div className={`w-10 h-10 bg-${s.color}-100 rounded-lg flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 text-${s.color}-600`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{lang === 'fr' ? 'Statut' : 'Status'}</label>
                <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                  <option value="">{lang === 'fr' ? 'Tous' : 'All'}</option>
                  {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{lang === 'fr' ? 'Type contrat' : 'Contract type'}</label>
                <select value={filters.contract_type} onChange={(e) => setFilters({ ...filters, contract_type: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
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
                  <input type="text" placeholder={lang === 'fr' ? 'Nom, matricule...' : 'Name, registration...'}
                    value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">{lang === 'fr' ? 'Matières' : 'Subjects'}</th>
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
                            <p className="text-xs text-gray-500">{teacher.qualifications?.slice(0, 2).join(', ') || '-'}</p>
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
                          {teacher.teacher_subject_classes?.length === 0 ? (
                            <span className="text-xs text-gray-400 italic">{lang === 'fr' ? 'Aucune' : 'None'}</span>
                          ) : (
                            teacher.teacher_subject_classes?.slice(0, 3).map((tsc) => {
                              const subject = subjects.find((s) => s.id === tsc.subject_id);
                              return (
                                <span key={tsc.id} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                  {subject?.label_fr || subject?.code || tsc.subject?.label_fr || 'Matière'} ({tsc.hours_per_week}h)
                                </span>
                              );
                            })
                          )}
                          {(teacher.teacher_subject_classes?.length || 0) > 3 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">+{(teacher.teacher_subject_classes?.length || 0) - 3}</span>
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
                          <button onClick={() => openAssignModal(teacher)} className="p-1.5 hover:bg-purple-50 rounded-lg text-gray-400 hover:text-purple-600" title="Assigner matière"><BookOpen className="w-4 h-4" /></button>
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

      {/* ==================== TEACHER FORM MODAL ==================== */}
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                <p className="text-xs text-blue-700 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {lang === 'fr' ? 'Un compte utilisateur sera créé automatiquement avec cet email et mot de passe.' : 'A user account will be automatically created with this email and password.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Prénom *' : 'First name *'}</label>
                  <input required value={formData.first_name || ''}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Nom *' : 'Last name *'}</label>
                  <input required value={formData.last_name || ''}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Email *' : 'Email *'}</label>
                  <input type="email" required value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Téléphone' : 'Phone'}</label>
                  <input value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Matricule *' : 'Registration *'}</label>
                  <input required value={formData.matricule || ''}
                    onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="ENS-2025-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Type contrat' : 'Contract type'}</label>
                  <select value={formData.contract_type}
                    onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    {CONTRACT_TYPES.map((ct) => (
                      <option key={ct.value} value={ct.value}>{ct.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? "Date d'embauche" : 'Hire date'}</label>
                  <input type="date" value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {editingTeacher ? (lang === 'fr' ? 'Mot de passe (laisser vide = inchangé)' : 'Password (empty = unchanged)') : (lang === 'fr' ? 'Mot de passe *' : 'Password *')}
                  </label>
                  <input type="password" required={!editingTeacher} value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                </div>
              </div>

              {/* Qualifications */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Qualifications' : 'Qualifications'}</label>
                <div className="space-y-2">
                  {formData.qualifications.map((q, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input value={q} onChange={(e) => updateQualification(i, e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder={lang === 'fr' ? 'Ex: Master, CAPES...' : 'Ex: Master, CAPES...'} />
                      <button type="button" onClick={() => removeQualification(i)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={addQualification} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    <Plus className="w-4 h-4" />{lang === 'fr' ? 'Ajouter' : 'Add'}
                  </button>
                </div>
              </div>

              {/* Spécialisations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Spécialisations' : 'Specializations'}</label>
                <div className="space-y-2">
                  {formData.subjects_specialization.map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input value={s} onChange={(e) => updateSpecialization(i, e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder={lang === 'fr' ? 'Ex: Mathématiques, Physique...' : 'Ex: Mathematics, Physics...'} />
                      <button type="button" onClick={() => removeSpecialization(i)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={addSpecialization} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    <Plus className="w-4 h-4" />{lang === 'fr' ? 'Ajouter' : 'Add'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Statut' : 'Status'}</label>
                <select value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                  {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditingTeacher(null) }}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  {lang === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md shadow-blue-200">
                  {editingTeacher ? (lang === 'fr' ? 'Mettre à jour' : 'Update') : (lang === 'fr' ? 'Créer' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DETAIL MODAL ==================== */}
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
                <div className="space-y-2">
                  {selectedTeacher.teacher_subject_classes?.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">{lang === 'fr' ? 'Aucune matière assignée' : 'No subjects assigned'}</p>
                  ) : (
                    selectedTeacher.teacher_subject_classes?.map((tsc) => (
                      <div key={tsc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-medium text-gray-800">{tsc.subject?.label_fr || 'Matière'}</span>
                          <span className="text-xs text-gray-500">— {tsc.class_?.name || 'Classe'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">{tsc.hours_per_week}h/semaine</span>
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs font-medium flex items-center gap-1">
                            <Calculator className="w-3 h-3" />Coef: {tsc.coefficient || 1}
                          </span>
                          {tsc.is_principal_teacher && (
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium flex items-center gap-1">
                              <Star className="w-3 h-3" />Principal
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== ASSIGN SUBJECT MODAL ==================== */}
      {showAssign && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAssign(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">{lang === 'fr' ? 'Assigner une matière' : 'Assign a subject'}</h3>
              <p className="text-sm text-gray-500">{lang === 'fr' ? 'à' : 'to'} {selectedTeacher.last_name || selectedTeacher.user?.last_name} {selectedTeacher.first_name || selectedTeacher.user?.first_name}</p>
            </div>
            <form onSubmit={handleAssignSubject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Matière *' : 'Subject *'}</label>
                <select
                  required
                  value={assignmentForm.subject_id || ''}
                  onChange={(e) => {
                    const subjectId = parseInt(e.target.value)
                    const subject = subjects.find((s) => s.id === subjectId)
                    setAssignmentForm({
                      ...assignmentForm,
                      subject_id: subjectId,
                      coefficient: subject?.default_coefficient || 1
                    })
                  }}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">{lang === 'fr' ? 'Sélectionner...' : 'Select...'}</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.code} — {s.label_fr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Classe *' : 'Class *'}</label>
                <select
                  required
                  value={assignmentForm.class_id || ''}
                  onChange={(e) => {
                    const classId = parseInt(e.target.value)
                    const subject = subjects.find((s) => s.id === assignmentForm.subject_id)
                    const effectiveCoeff = getEffectiveCoefficient(subject, classId)
                    setAssignmentForm({
                      ...assignmentForm,
                      class_id: classId,
                      coefficient: effectiveCoeff
                    })
                  }}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">{lang === 'fr' ? 'Sélectionner...' : 'Select...'}</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} {c.level_name ? `(${c.level_name})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Heures/semaine *' : 'Hours/week *'}</label>
                  <input
                    type="number" step="0.5" min="0.5" required
                    value={assignmentForm.hours_per_week || 2}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, hours_per_week: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Coefficient' : 'Coefficient'}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number" step="0.5" min="0.5"
                      value={assignmentForm.coefficient || 1}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, coefficient: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const subject = subjects.find((s) => s.id === assignmentForm.subject_id)
                        if (subject) openCoeffModal(subject)
                      }}
                      className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100"
                      title={lang === 'fr' ? 'Gérer les coefficients' : 'Manage coefficients'}
                    >
                      <Calculator className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {lang === 'fr' ? 'Défaut: ' : 'Default: '}
                    {subjects.find((s) => s.id === assignmentForm.subject_id)?.default_coefficient || 1}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="principal"
                  checked={assignmentForm.is_principal_teacher || false}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, is_principal_teacher: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
                <label htmlFor="principal" className="text-sm text-gray-700">{lang === 'fr' ? 'Enseignant principal (titulaire)' : 'Principal teacher'}</label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAssign(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  {lang === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md shadow-blue-200">
                  {lang === 'fr' ? 'Assigner' : 'Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== SUBJECT MANAGER MODAL ==================== */}
      {showSubjectManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSubjectManager(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{lang === 'fr' ? 'Gestion des Matières' : 'Subject Management'}</h3>
                <p className="text-sm text-gray-500">{lang === 'fr' ? 'Coefficients par défaut et spécifiques par classe' : 'Default coefficients and class-specific overrides'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSubjectForm(true)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {lang === 'fr' ? 'Ajouter matière' : 'Add subject'}
                </button>
                <button onClick={() => setShowSubjectManager(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Barre de recherche des matières */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={lang === 'fr' ? 'Rechercher une matière (nom, code, section...)' : 'Search a subject (name, code, section...)'}
                  value={subjectSearchTerm}
                  onChange={(e) => setSubjectSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                {subjectSearchTerm && (
                  <button
                    onClick={() => setSubjectSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              {(() => {
                const filteredSubjects = subjectSearchTerm
                  ? subjects.filter((s) =>
                      (s.label_fr || '').toLowerCase().includes(subjectSearchTerm.toLowerCase()) ||
                      (s.label_en || '').toLowerCase().includes(subjectSearchTerm.toLowerCase()) ||
                      (s.code || '').toLowerCase().includes(subjectSearchTerm.toLowerCase()) ||
                      (s.section_name || '').toLowerCase().includes(subjectSearchTerm.toLowerCase())
                    )
                  : subjects;
                return filteredSubjects.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">{lang === 'fr' ? 'Aucune matière enregistrée' : 'No subjects registered'}</p>
                  <p className="text-xs text-gray-400 mb-4">{lang === 'fr' ? 'Créez une matière pour commencer' : 'Create a subject to get started'}</p>
                  <button
                    onClick={() => setShowSubjectForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    {lang === 'fr' ? 'Ajouter une matière' : 'Add a subject'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSubjects.map((subject) => (
                    <div key={subject.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{subject.code}</span>
                          <span className="font-medium text-gray-800">{subject.label_fr}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            (subject.section_name || '').toLowerCase().includes('angl') || subject.section_id === 2
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {subject.section_name || (subject.section_id === 2 ? 'EN' : 'FR')}
                          </span>
                          {subject.specialty_name && <span className="text-xs text-gray-500">• {subject.specialty_name}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{lang === 'fr' ? 'Coef. défaut:' : 'Default coef:'} <strong className="text-gray-800">{subject.default_coefficient || 1}</strong></span>
                          <button
                            onClick={() => openCoeffModal(subject)}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 flex items-center gap-1"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                            {lang === 'fr' ? 'Gérer' : 'Manage'}
                          </button>
                        </div>
                      </div>
                      {/* Preview des coefficients spécifiques */}
                      <div className="px-4 py-2">
                        {(() => {
                          const specificCoeffs = subjectCoefficients.filter((c) => c.subject_id === subject.id)
                          if (specificCoeffs.length === 0) {
                            return <p className="text-xs text-gray-400 italic">{lang === 'fr' ? 'Aucun coefficient spécifique — le défaut est appliqué à toutes les classes' : 'No specific coefficient — default applied to all classes'}</p>
                          }
                          return (
                            <div className="flex flex-wrap gap-2">
                              {specificCoeffs.map((c) => (
                                <span key={c.id} className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-medium flex items-center gap-1">
                                  <School className="w-3 h-3" />
                                  {c.class_name || `Classe ${c.class_id}`}: {c.coefficient}
                                </span>
                              ))}
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUBJECT CREATE FORM MODAL ==================== */}
      {showSubjectForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSubjectForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">{lang === 'fr' ? 'Nouvelle Matière' : 'New Subject'}</h3>
              <button onClick={() => setShowSubjectForm(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleCreateSubject} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Code *' : 'Code *'}</label>
                  <input
                    required
                    value={subjectFormData.code}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="MATH"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Coef. défaut' : 'Default coef.'}</label>
                  <input
                    type="number" step="0.5" min="0.5"
                    value={subjectFormData.coefficient}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, coefficient: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Nom (FR) *' : 'Name (FR) *'}</label>
                <input
                  required
                  value={subjectFormData.label_fr}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, label_fr: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder={lang === 'fr' ? 'Ex: Mathématiques' : 'Ex: Mathematics'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Nom (EN)' : 'Name (EN)'}</label>
                <input
                  value={subjectFormData.label_en}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, label_en: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder={lang === 'fr' ? 'Ex: Mathematics' : 'Ex: Mathématiques'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Section' : 'Section'}</label>
                <select
                  value={subjectFormData.section}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, section: e.target.value as 'FR' | 'EN' })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="FR">{lang === 'fr' ? 'Francophone' : 'French'}</option>
                  <option value="EN">{lang === 'fr' ? 'Anglophone' : 'English'}</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowSubjectForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  {lang === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md shadow-blue-200">
                  {lang === 'fr' ? 'Créer' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== COEFFICIENT MODAL ==================== */}
      {showCoeffModal && selectedSubject && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCoeffModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                {lang === 'fr' ? 'Coefficients' : 'Coefficients'} — {selectedSubject.label_fr}
              </h3>
              <p className="text-sm text-gray-500">
                {lang === 'fr' ? 'Coefficient défaut:' : 'Default coefficient:'} <strong>{selectedSubject.default_coefficient || 1}</strong>
                {' '}{lang === 'fr' ? '— Les classes sans coefficient spécifique utilisent cette valeur.' : '— Classes without specific coefficient use this value.'}
              </p>
            </div>
            <div className="p-6 space-y-4">
              {/* Add new coefficient */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-medium text-gray-700">{lang === 'fr' ? 'Ajouter un coefficient spécifique' : 'Add specific coefficient'}</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{lang === 'fr' ? 'Classe' : 'Class'}</label>
                    <select
                      value={newCoeff.class_id || ''}
                      onChange={(e) => setNewCoeff({ ...newCoeff, class_id: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                    >
                      <option value="">{lang === 'fr' ? 'Choisir...' : 'Choose...'}</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} {c.level_name ? `(${c.level_name})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">{lang === 'fr' ? 'Coefficient' : 'Coefficient'}</label>
                    <input
                      type="number" step="0.5" min="0.5"
                      value={newCoeff.coefficient}
                      onChange={(e) => setNewCoeff({ ...newCoeff, coefficient: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddCoefficient}
                  disabled={!newCoeff.class_id}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />{lang === 'fr' ? 'Ajouter' : 'Add'}
                </button>
              </div>

              {/* List existing coefficients */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">{lang === 'fr' ? 'Coefficients spécifiques enregistrés' : 'Registered specific coefficients'}</h4>
                {subjectCoefficients.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">{lang === 'fr' ? 'Aucun coefficient spécifique' : 'No specific coefficients'}</p>
                ) : (
                  <div className="space-y-2">
                    {subjectCoefficients.map((coeff) => {
                      const cls = classes.find((c) => c.id === coeff.class_id)
                      const isDefault = coeff.coefficient === (selectedSubject.default_coefficient || 1)
                      return (
                        <div key={coeff.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <School className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">{cls?.name || `Classe ${coeff.class_id}`}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${isDefault ? 'bg-gray-100 text-gray-500' : 'bg-amber-50 text-amber-700'}`}>
                              {isDefault ? (lang === 'fr' ? 'défaut' : 'default') : (lang === 'fr' ? 'spécifique' : 'specific')}: {coeff.coefficient}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteCoefficient(coeff.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700 flex items-start gap-1">
                  <Calculator className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  {lang === 'fr'
                    ? "Si une classe n'a pas de coefficient spécifique, le coefficient par défaut est automatiquement appliqué lors de l'assignation."
                    : 'If a class has no specific coefficient, the default coefficient is automatically applied during assignment.'}
                </p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button onClick={() => setShowCoeffModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                {lang === 'fr' ? 'Fermer' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}