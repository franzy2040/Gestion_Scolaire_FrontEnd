import { useState, useEffect, useCallback } from 'react'
import {
  UserPlus, ChevronRight, ChevronLeft, Save, User, Calendar,
  MapPin, Flag, GraduationCap, Users, Phone, FileText,
  Building2, HeartPulse, AlertCircle, Check, RotateCcw,
  Loader2, School, ArrowRight, Landmark, CheckCircle2,
  X
} from 'lucide-react'
import { useLang } from '@/hooks/useLang'
import { toast } from 'sonner'
import { studentsApi, schoolApi, cyclesApi, levelsApi, classesApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'

interface Section { id: number; code: string; label_fr: string; label_en: string }
interface Cycle { id: number; section_id: number; code: string; label_fr: string; label_en: string; order: number }
interface Level { id: number; cycle_id: number; code: string; label_fr: string; label_en: string; order: number }
interface ClassItem { id: number; level_id: number; specialty_id: number; code: string; abbreviation: string; name: string; capacity: number; status: string }
interface AcademicYear { id: number; school_id: number; label: string; start_date: string; end_date: string; is_current: boolean; status: string }
interface SchoolItem { id: number; name: string; acronym: string; city: string; status: string }

function cn(...classes: (string | false | null | undefined)[]) { return classes.filter(Boolean).join(' ') }

const STEP_LABELS_FR = [
  'Informations personnelles',
  'Informations academiques',
  'Parents & Contacts',
  'Acte de naissance',
  'Sante & Social'
]
const STEP_LABELS_EN = [
  'Personal Information',
  'Academic Information',
  'Parents & Contacts',
  'Birth Certificate',
  'Health & Social'
]

const STEP_ICONS = [User, GraduationCap, Users, FileText, HeartPulse]

// ═══════════════════════════════════════════════════════════════════════════════
// POPUP DE CONFIRMATION DE CREATION
// ═══════════════════════════════════════════════════════════════════════════════
function SuccessModal({
  isOpen,
  onClose,
  studentName,
  matricule,
  onViewStudents
}: {
  isOpen: boolean
  onClose: () => void
  studentName: string
  matricule: string
  onViewStudents: () => void
}) {
  const { lang } = useLang()
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {lang === 'fr' ? 'Élève créé avec succès !' : 'Student created successfully!'}
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm text-gray-500">{lang === 'fr' ? 'Nom complet' : 'Full Name'}</p>
                <p className="font-semibold text-gray-800">{studentName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <FileText className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm text-gray-500">{lang === 'fr' ? 'Matricule' : 'Registration No.'}</p>
                <p className="font-semibold text-gray-800">{matricule}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onViewStudents}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
            >
              <Users className="w-4 h-4" />
              {lang === 'fr' ? 'Voir les élèves' : 'View Students'}
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all border border-gray-200"
            >
              <X className="w-4 h-4" />
              {lang === 'fr' ? 'Nouveau' : 'New'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StudentCreatePage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { lang } = useLang()
  const auth = useAuthStore()

  // ═══════════════════════════════════════════════════════════════════════════════
  // AUTO-DETECTION: Établissement depuis l'utilisateur connecté
  // ═══════════════════════════════════════════════════════════════════════════════
  const userSchoolId = auth.user?.school_id ?? null

  const [sections, setSections] = useState<Section[]>([])
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [schools, setSchools] = useState<SchoolItem[]>([])
  const [loadingRef, setLoadingRef] = useState(true)

  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // Popup de confirmation
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdStudentName, setCreatedStudentName] = useState('')
  const [createdMatricule, setCreatedMatricule] = useState('')

  const [form, setForm] = useState({
    matricule: '',
    first_name: '',
    last_name: '',
    sex: '',
    date_of_birth: '',
    place_of_birth: '',
    nationality: '',
    section_id: '',
    cycle_id: '',
    level_id: '',
    class_id: '',
    father_name: '',
    mother_name: '',
    emergency_phone: '',
    birth_certificate_ref: '',
    civil_status_center: '',
    birth_certificate_issuer: '',
    handicap: false,
    handicap_details: '',
    social_case: false,
    social_case_details: '',
    // AUTO-DETECTÉS: non modifiables par l'utilisateur
    school_id: userSchoolId ? String(userSchoolId) : '',
    academic_year_id: '',
    user_id: null as number | null,
    previous_school: '',
    previous_class: '',
    is_repeating: false,
    enrollment_type: 'new' as 'new' | 'renewal' | 'transfer' | 'reintegration',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // ═══════════════════════════════════════════════════════════════════════════════
  // AUTO-DETECTION: Année académique courante
  // ═══════════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (form.school_id && academicYears.length > 0) {
      const currentYear = academicYears.find(
        y => y.school_id === Number(form.school_id) && y.is_current
      )
      if (currentYear) {
        setForm(prev => ({ ...prev, academic_year_id: String(currentYear.id) }))
      }
    }
  }, [form.school_id, academicYears])

  const loadRefData = useCallback(async () => {
    setLoadingRef(true)
    try {
      const schoolsData = await schoolApi.getSchools()
      const schoolsList = Array.isArray(schoolsData) ? schoolsData : []
      setSchools(schoolsList)

      const secData = await schoolApi.getSections(1)
      setSections(Array.isArray(secData) ? secData : [])

      const allYears: AcademicYear[] = []
      for (const school of schoolsList) {
        try {
          const yearsData = await schoolApi.getAcademicYears(school.id)
          if (Array.isArray(yearsData)) {
            allYears.push(...yearsData)
          }
        } catch { /* ignore */ }
      }
      setAcademicYears(allYears)

      const [cycData, levData, clsData] = await Promise.allSettled([
        cyclesApi.getAll(),
        levelsApi.getAll(),
        classesApi.getAll()
      ])
      setCycles(cycData.status === 'fulfilled' ? (Array.isArray(cycData.value) ? cycData.value : []) : [])
      setLevels(levData.status === 'fulfilled' ? (Array.isArray(levData.value) ? levData.value : []) : [])
      setClasses(clsData.status === 'fulfilled' ? (Array.isArray(clsData.value) ? clsData.value : []) : [])
    } catch {
      toast.error(lang === 'fr' ? 'Erreur chargement des donnees' : 'Error loading data')
    } finally { setLoadingRef(false) }
  }, [lang])

  useEffect(() => { loadRefData() }, [loadRefData])

  const filteredCycles = form.section_id
    ? cycles.filter((c: Cycle) => c.section_id === Number(form.section_id))
    : cycles

  const filteredLevels = form.cycle_id
    ? levels.filter((l: Level) => l.cycle_id === Number(form.cycle_id))
    : form.section_id
      ? levels.filter((l: Level) => {
          const c = cycles.find((cc: Cycle) => cc.id === l.cycle_id)
          return c && c.section_id === Number(form.section_id)
        })
      : levels

  const filteredClasses = form.level_id
    ? classes.filter((c: ClassItem) => c.level_id === Number(form.level_id))
    : form.cycle_id
      ? classes.filter((c: ClassItem) => {
          const lvl = levels.find((l: Level) => l.id === c.level_id)
          return lvl && lvl.cycle_id === Number(form.cycle_id)
        })
      : classes

  const updateField = (field: string, value: any) => {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'section_id') { next.cycle_id = ''; next.level_id = ''; next.class_id = '' }
      if (field === 'cycle_id') { next.level_id = ''; next.class_id = '' }
      if (field === 'level_id') { next.class_id = '' }
      return next
    })
    if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e })
  }

  const validateStep = (s: number): boolean => {
    const newErrors: Record<string, string> = {}
    if (s === 0) {
      if (!form.matricule.trim()) newErrors.matricule = lang === 'fr' ? 'Champ obligatoire' : 'Required field'
      if (!form.first_name.trim()) newErrors.first_name = lang === 'fr' ? 'Champ obligatoire' : 'Required field'
      if (!form.last_name.trim()) newErrors.last_name = lang === 'fr' ? 'Champ obligatoire' : 'Required field'
      if (!form.sex) newErrors.sex = lang === 'fr' ? 'Champ obligatoire' : 'Required field'
      if (!form.date_of_birth) newErrors.date_of_birth = lang === 'fr' ? 'Champ obligatoire' : 'Required field'
      if (!form.place_of_birth.trim()) newErrors.place_of_birth = lang === 'fr' ? 'Champ obligatoire' : 'Required field'
      if (!form.nationality) newErrors.nationality = lang === 'fr' ? 'Champ obligatoire' : 'Required field'
    }
    if (s === 1) {
      if (!form.section_id) newErrors.section_id = lang === 'fr' ? 'Champ obligatoire' : 'Required field'
      if (!form.cycle_id) newErrors.cycle_id = lang === 'fr' ? 'Champ obligatoire' : 'Required field'
      if (!form.level_id) newErrors.level_id = lang === 'fr' ? 'Champ obligatoire' : 'Required field'
      if (!form.class_id) newErrors.class_id = lang === 'fr' ? 'Champ obligatoire' : 'Required field'
    }
    if (s === 2) {
      if (!form.mother_name.trim()) newErrors.mother_name = lang === 'fr' ? 'Champ obligatoire' : 'Required field'
      if (!form.emergency_phone.trim()) newErrors.emergency_phone = lang === 'fr' ? 'Champ obligatoire' : 'Required field'
    }
    if (s === 3) {
      if (!form.birth_certificate_ref.trim()) newErrors.birth_certificate_ref = lang === 'fr' ? 'Champ obligatoire' : 'Required field'
      if (!form.civil_status_center.trim()) newErrors.civil_status_center = lang === 'fr' ? 'Champ obligatoire' : 'Required field'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) setStep(prev => Math.min(prev + 1, 4))
  }
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 0))

  // ═══════════════════════════════════════════════════════════════════════════════
  // SOUMISSION AVEC POPUP DE CONFIRMATION + REDIRECTION
  // ═══════════════════════════════════════════════════════════════════════════════
  const handleSubmit = async () => {
    let allValid = true
    for (let s = 0; s <= 4; s++) {
      if (!validateStep(s)) allValid = false
    }
    if (!allValid) {
      toast.error(lang === 'fr' ? 'Veuillez corriger les erreurs' : 'Please fix the errors')
      return
    }

    setSubmitting(true)
    try {
      const payload: Record<string, any> = {
        matricule: form.matricule.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        sex: form.sex,
        date_of_birth: form.date_of_birth,
        place_of_birth: form.place_of_birth.trim(),
        nationality: form.nationality || 'Camerounaise',
        mother_name: form.mother_name.trim(),
        emergency_phone: form.emergency_phone.trim(),
        birth_certificate_ref: form.birth_certificate_ref.trim(),
        civil_status_center: form.civil_status_center.trim(),
        birth_certificate_issuer: form.birth_certificate_issuer.trim() || 'Civil Status Registrar',
        handicap: form.handicap,
        social_case: form.social_case,
        school_id: Number(form.school_id),
        academic_year_id: form.academic_year_id ? Number(form.academic_year_id) : null,
        class_id: Number(form.class_id),
        enrollment_type: form.enrollment_type,
        is_repeating: form.is_repeating,
      }

      if (form.father_name.trim()) payload.father_name = form.father_name.trim()
      if (form.handicap_details.trim()) payload.handicap_details = form.handicap_details.trim()
      if (form.social_case_details.trim()) payload.social_case_details = form.social_case_details.trim()
      if (form.previous_school.trim()) payload.previous_school = form.previous_school.trim()
      if (form.previous_class.trim()) payload.previous_class = form.previous_class.trim()
      if (form.user_id) payload.user_id = form.user_id

      console.log('[StudentCreate] Payload:', JSON.stringify(payload, null, 2))
      await studentsApi.create(payload)

      // ✅ POPUP DE CONFIRMATION
      setCreatedStudentName(`${form.first_name} ${form.last_name}`)
      setCreatedMatricule(form.matricule)
      setShowSuccess(true)

      toast.success(lang === 'fr' ? 'Élève créé avec succès' : 'Student created successfully')
    } catch (e: any) {
      const respData = e?.response?.data
      console.error('[StudentCreate] Error response:', respData)
      if (Array.isArray(respData?.detail)) {
        const details = respData.detail.map((d: any) => `${d.loc?.join('.')}: ${d.msg}`).join('; ')
        toast.error('Validation: ' + details)
      } else if (respData?.errors && Array.isArray(respData.errors)) {
        const details = respData.errors.map((d: any) => `${d.field}: ${d.message}`).join('; ')
        toast.error('Validation: ' + details)
      } else {
        toast.error(respData?.detail || (lang === 'fr' ? 'Erreur creation' : 'Create error'))
      }
    } finally { setSubmitting(false) }
  }

  // Redirection vers la liste des élèves
  const handleViewStudents = () => {
    setShowSuccess(false)
    if (onNavigate) {
      onNavigate('students')
    } else {
      window.location.href = '/students'// ← route React Router correcte
    }
  }



  // Réinitialiser pour créer un autre élève
  const handleCreateAnother = () => {
    setShowSuccess(false)
    setForm({
      matricule: '', first_name: '', last_name: '', sex: '', date_of_birth: '', place_of_birth: '', nationality: '',
      section_id: '', cycle_id: '', level_id: '', class_id: '',
      school_id: userSchoolId ? String(userSchoolId) : '',
      academic_year_id: '',
      father_name: '', mother_name: '', emergency_phone: '',
      birth_certificate_ref: '', civil_status_center: '', birth_certificate_issuer: '',
      handicap: false, handicap_details: '', social_case: false, social_case_details: '',
      user_id: null, previous_school: '', previous_class: '', is_repeating: false, enrollment_type: 'new'
    })
    setErrors({})
    setStep(0)
    if (userSchoolId && academicYears.length > 0) {
      const currentYear = academicYears.find(
        y => y.school_id === userSchoolId && y.is_current
      )
      if (currentYear) {
        setForm(prev => ({ ...prev, academic_year_id: String(currentYear.id) }))
      }
    }
  }

  const handleReset = () => {
    if (!confirm(lang === 'fr' ? 'Reinitialiser le formulaire ?' : 'Reset the form?')) return
    handleCreateAnother()
    toast.info(lang === 'fr' ? 'Formulaire reinitialise' : 'Form reset')
  }

  const labels = lang === 'fr' ? STEP_LABELS_FR : STEP_LABELS_EN

  // Établissement et année auto-détectés (affichage info)
  const detectedSchool = schools.find((s: SchoolItem) => s.id === userSchoolId)
  const detectedYear = academicYears.find(
    (y: AcademicYear) => y.school_id === userSchoolId && y.is_current
  )

  if (loadingRef) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-amber-50/20">
      {/* POPUP DE CONFIRMATION */}
      <SuccessModal
        isOpen={showSuccess}
        onClose={handleCreateAnother}
        studentName={createdStudentName}
        matricule={createdMatricule}
        onViewStudents={handleViewStudents}
      />

      <div className="page-header bg-white/80 backdrop-blur-md border-b border-blue-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="page-title text-2xl font-bold bg-gradient-to-r from-emerald-700 to-emerald-900 bg-clip-text text-transparent">
                {lang === 'fr' ? 'Creer un eleve' : 'Create a Student'}
              </h1>
              <p className="page-subtitle text-sm text-gray-500 mt-0.5">
                {lang === 'fr' ? 'Inscrire un nouvel eleve' : 'Enroll a new student'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all border border-gray-200">
              <RotateCcw className="w-4 h-4" />
              {lang === 'fr' ? 'Reinitialiser' : 'Reset'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between">
            {labels.map((label, i) => {
              const Icon = STEP_ICONS[i]
              const isActive = i === step
              const isDone = i < step
              return (
                <div key={i} className="flex flex-col items-center gap-2 flex-1 relative">
                  {i > 0 && (
                    <div className={cn(
                      'absolute top-5 right-1/2 w-full h-0.5 -z-10',
                      isDone ? 'bg-emerald-500' : 'bg-gray-200'
                    )} />
                  )}
                  <button
                    onClick={() => { if (isDone) setStep(i) }}
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all border-2',
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200 scale-110'
                        : isDone
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : 'bg-gray-100 text-gray-400 border-gray-200'
                    )}
                  >
                    {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                  </button>
                  <span className={cn(
                    'text-xs font-medium text-center hidden md:block max-w-[100px]',
                    isActive ? 'text-emerald-700' : isDone ? 'text-emerald-600' : 'text-gray-400'
                  )}>
                    {label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-100">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              {(() => { const I = STEP_ICONS[step]; return <I className="w-5 h-5 text-emerald-600" /> })()}
              {labels[step]}
            </h2>
          </div>

          <div className="p-6 space-y-5">
            {step === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {lang === 'fr' ? 'Matricule' : 'Registration No.'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={form.matricule} onChange={(e) => updateField('matricule', e.target.value)} placeholder="Ex. 123456789" className={cn('w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400', errors.matricule ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white')} />
                  </div>
                  {errors.matricule && <p className="text-xs text-red-500 mt-1">{errors.matricule}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {lang === 'fr' ? 'Prenom' : 'First Name'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={form.first_name} onChange={(e) => updateField('first_name', e.target.value)} placeholder="Ex. Franck Landry" className={cn('w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400', errors.first_name ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white')} />
                  </div>
                  {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {lang === 'fr' ? 'Nom' : 'Last Name'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={form.last_name} onChange={(e) => updateField('last_name', e.target.value)} placeholder="Ex. KIBINDE OMBIONYO" className={cn('w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400', errors.last_name ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white')} />
                  </div>
                  {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Sexe' : 'Sex'} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select value={form.sex} onChange={(e) => updateField('sex', e.target.value)} className={cn('w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 appearance-none', errors.sex ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white')}>
                      <option value="">{lang === 'fr' ? 'Selectionner...' : 'Select...'}</option>
                      <option value="M">{lang === 'fr' ? 'Masculin' : 'Male'}</option>
                      <option value="F">{lang === 'fr' ? 'Feminin' : 'Female'}</option>
                    </select>
                  </div>
                  {errors.sex && <p className="text-xs text-red-500 mt-1">{errors.sex}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Date de naissance' : 'Date of Birth'} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="date" value={form.date_of_birth} onChange={(e) => updateField('date_of_birth', e.target.value)} className={cn('w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400', errors.date_of_birth ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white')} />
                  </div>
                  {errors.date_of_birth && <p className="text-xs text-red-500 mt-1">{errors.date_of_birth}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Lieu de naissance' : 'Place of Birth'} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={form.place_of_birth} onChange={(e) => updateField('place_of_birth', e.target.value)} placeholder="Ex. Douala" className={cn('w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400', errors.place_of_birth ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white')} />
                  </div>
                  {errors.place_of_birth && <p className="text-xs text-red-500 mt-1">{errors.place_of_birth}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Nationalite' : 'Nationality'} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Flag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select value={form.nationality} onChange={(e) => updateField('nationality', e.target.value)} className={cn('w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 appearance-none', errors.nationality ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white')}>
                      <option value="">{lang === 'fr' ? 'Selectionner...' : 'Select...'}</option>
                      <option value="Camerounaise">Camerounaise / Cameroonian</option>
                      <option value="Nigeriane">Nigeriane / Nigerian</option>
                      <option value="Gabonaise">Gabonaise / Gabonese</option>
                      <option value="Tchadienne">Tchadienne / Chadian</option>
                      <option value="Equato-guineenne">Equato-guineenne / Eq. Guinean</option>
                      <option value="Centrafricaine">Centrafricaine / Central African</option>
                      <option value="Congolaise">Congolaise / Congolese</option>
                      <option value="Ivoirienne">Ivoirienne / Ivorian</option>
                      <option value="Senegalaise">Senegalaise / Senegalese</option>
                      <option value="Autre">Autre / Other</option>
                    </select>
                  </div>
                  {errors.nationality && <p className="text-xs text-red-500 mt-1">{errors.nationality}</p>}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* ═══════════════════════════════════════════════════════════════
                    ÉTABLISSEMENT AUTO-DÉTECTÉ (lecture seule)
                ═══════════════════════════════════════════════════════════════ */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {lang === 'fr' ? 'Etablissement' : 'School'}
                  </label>
                  <div className="relative">
                    <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                    <input
                      type="text"
                      value={detectedSchool ? `${detectedSchool.name} (${detectedSchool.acronym || detectedSchool.city})` : (lang === 'fr' ? "Non détecté — veuillez contacter l'administrateur" : "Not detected — please contact admin")}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm bg-emerald-50/50 border-emerald-200 text-emerald-800 font-medium cursor-not-allowed"
                    />
                  </div>
                  <input type="hidden" value={form.school_id} />
                  {!userSchoolId && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {lang === 'fr' ? 'Aucun établissement associé à votre compte' : 'No school associated with your account'}
                    </p>
                  )}
                </div>

                {/* ANNÉE ACADÉMIQUE AUTO-DÉTECTÉE (lecture seule) */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {lang === 'fr' ? 'Annee academique' : 'Academic Year'}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                    <input
                      type="text"
                      value={detectedYear ? `${detectedYear.label} ${detectedYear.is_current ? (lang === 'fr' ? ' (Courante)' : ' (Current)') : ''}` : (lang === 'fr' ? 'Aucune année académique courante' : 'No current academic year')}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm bg-emerald-50/50 border-emerald-200 text-emerald-800 font-medium cursor-not-allowed"
                    />
                  </div>
                  <input type="hidden" value={form.academic_year_id} />
                  {userSchoolId && !detectedYear && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {lang === 'fr' ? 'Aucune année académique courante pour cet établissement' : 'No current academic year for this school'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Section' : 'Section'} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select value={form.section_id} onChange={(e) => updateField('section_id', e.target.value)} className={cn('w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 appearance-none', errors.section_id ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white')}>
                      <option value="">{lang === 'fr' ? 'Selectionner...' : 'Select...'}</option>
                      {sections.map((s: Section) => (<option key={s.id} value={s.id}>{lang === 'fr' ? s.label_fr : s.label_en}</option>))}
                    </select>
                  </div>
                  {errors.section_id && <p className="text-xs text-red-500 mt-1">{errors.section_id}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Cycle' : 'Cycle'} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select value={form.cycle_id} onChange={(e) => updateField('cycle_id', e.target.value)} disabled={!form.section_id || filteredCycles.length === 0} className={cn('w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 appearance-none', errors.cycle_id ? 'border-red-300 bg-red-50' : (!form.section_id || filteredCycles.length === 0) ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'border-gray-200 bg-white')}>
                      <option value="">{lang === 'fr' ? 'Selectionner...' : 'Select...'}</option>
                      {filteredCycles.map((c: Cycle) => (<option key={c.id} value={c.id}>{lang === 'fr' ? c.label_fr : c.label_en}</option>))}
                    </select>
                  </div>
                  {errors.cycle_id && <p className="text-xs text-red-500 mt-1">{errors.cycle_id}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Niveau' : 'Level'} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <ArrowRight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select value={form.level_id} onChange={(e) => updateField('level_id', e.target.value)} disabled={!form.cycle_id || filteredLevels.length === 0} className={cn('w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 appearance-none', errors.level_id ? 'border-red-300 bg-red-50' : (!form.cycle_id || filteredLevels.length === 0) ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'border-gray-200 bg-white')}>
                      <option value="">{lang === 'fr' ? 'Selectionner...' : 'Select...'}</option>
                      {filteredLevels.map((l: Level) => (<option key={l.id} value={l.id}>{lang === 'fr' ? l.label_fr : l.label_en}</option>))}
                    </select>
                  </div>
                  {errors.level_id && <p className="text-xs text-red-500 mt-1">{errors.level_id}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Classe' : 'Class'} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select value={form.class_id} onChange={(e) => updateField('class_id', e.target.value)} disabled={!form.level_id || filteredClasses.length === 0} className={cn('w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 appearance-none', errors.class_id ? 'border-red-300 bg-red-50' : (!form.level_id || filteredClasses.length === 0) ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'border-gray-200 bg-white')}>
                      <option value="">{lang === 'fr' ? 'Selectionner...' : 'Select...'}</option>
                      {filteredClasses.map((c: ClassItem) => (<option key={c.id} value={c.id}>{c.name} ({c.abbreviation})</option>))}
                    </select>
                  </div>
                  {errors.class_id && <p className="text-xs text-red-500 mt-1">{errors.class_id}</p>}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Nom du pere' : "Father's Name"}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={form.father_name} onChange={(e) => updateField('father_name', e.target.value)} placeholder="Ex. Awang Betrand" className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Nom de la mere' : "Mother's Name"} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={form.mother_name} onChange={(e) => updateField('mother_name', e.target.value)} placeholder="Ex. Awang Mary" className={cn('w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400', errors.mother_name ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white')} />
                  </div>
                  {errors.mother_name && <p className="text-xs text-red-500 mt-1">{errors.mother_name}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Telephone durgence' : 'Emergency Phone'} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="tel" value={form.emergency_phone} onChange={(e) => updateField('emergency_phone', e.target.value)} placeholder="+237 6XX XXX XXX" className={cn('w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400', errors.emergency_phone ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white')} />
                  </div>
                  {errors.emergency_phone && <p className="text-xs text-red-500 mt-1">{errors.emergency_phone}</p>}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'No de reference de lacte de naissance' : 'Birth Certificate Ref No.'} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={form.birth_certificate_ref} onChange={(e) => updateField('birth_certificate_ref', e.target.value)} placeholder="Ex. BC-2025-001" className={cn('w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400', errors.birth_certificate_ref ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white')} />
                  </div>
                  {errors.birth_certificate_ref && <p className="text-xs text-red-500 mt-1">{errors.birth_certificate_ref}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? "Centre d'Etat Civil" : 'Civil Status Center'} <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={form.civil_status_center} onChange={(e) => updateField('civil_status_center', e.target.value)} placeholder="Ex. Kumba II Council" className={cn('w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400', errors.civil_status_center ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white')} />
                  </div>
                  {errors.civil_status_center && <p className="text-xs text-red-500 mt-1">{errors.civil_status_center}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? "Emetteur de lacte de naissance" : 'Birth Certificate Issuer'}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="text" value={form.birth_certificate_issuer} onChange={(e) => updateField('birth_certificate_issuer', e.target.value)} placeholder="Ex. Civil Status Registrar" className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Handicap' : 'Disability'}</label>
                  <div className="flex items-center gap-3 mt-2">
                    <input
                      type="checkbox"
                      id="handicap"
                      checked={form.handicap}
                      onChange={(e) => updateField('handicap', e.target.checked)}
                      className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <label htmlFor="handicap" className="text-sm text-gray-700">
                      {lang === 'fr' ? 'Cet eleve presente un handicap' : 'This student has a disability'}
                    </label>
                  </div>
                  {form.handicap && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={form.handicap_details}
                        onChange={(e) => updateField('handicap_details', e.target.value)}
                        placeholder={lang === 'fr' ? 'Details du handicap...' : 'Disability details...'}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Cas social' : 'Social Case'}</label>
                  <div className="flex items-center gap-3 mt-2">
                    <input
                      type="checkbox"
                      id="social_case"
                      checked={form.social_case}
                      onChange={(e) => updateField('social_case', e.target.checked)}
                      className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <label htmlFor="social_case" className="text-sm text-gray-700">
                      {lang === 'fr' ? 'Cet eleve est un cas social (orphelin, famille monoparentale, etc.)' : 'This student is a social case (orphan, single parent family, etc.)'}
                    </label>
                  </div>
                  {form.social_case && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={form.social_case_details}
                        onChange={(e) => updateField('social_case_details', e.target.value)}
                        placeholder={lang === 'fr' ? 'Details du cas social...' : 'Social case details...'}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                      />
                    </div>
                  )}
                </div>
                <div className="md:col-span-2 mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <h3 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {lang === 'fr' ? 'Resume de inscription' : 'Enrollment Summary'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">{lang === 'fr' ? 'Matricule' : 'Reg. No.'}:</span> <span className="font-medium text-gray-800">{form.matricule || '—'}</span></div>
                    <div><span className="text-gray-500">{lang === 'fr' ? 'Nom' : 'Name'}:</span> <span className="font-medium text-gray-800">{form.first_name} {form.last_name}</span></div>
                    <div><span className="text-gray-500">{lang === 'fr' ? 'Sexe' : 'Sex'}:</span> <span className="font-medium text-gray-800">{form.sex === 'M' ? 'Masculin' : form.sex === 'F' ? 'Feminin' : '—'}</span></div>
                    <div><span className="text-gray-500">{lang === 'fr' ? 'Etablissement' : 'School'}:</span> <span className="font-medium text-gray-800">{detectedSchool?.name || '—'}</span></div>
                    <div><span className="text-gray-500">{lang === 'fr' ? 'Annee academique' : 'Academic Year'}:</span> <span className="font-medium text-gray-800">{detectedYear?.label || '—'}</span></div>
                    <div><span className="text-gray-500">{lang === 'fr' ? 'Classe' : 'Class'}:</span> <span className="font-medium text-gray-800">{classes.find((c: ClassItem) => c.id === Number(form.class_id))?.name || '—'}</span></div>
                    <div><span className="text-gray-500">{lang === 'fr' ? 'Contact' : 'Contact'}:</span> <span className="font-medium text-gray-800">{form.emergency_phone || '—'}</span></div>
                    <div><span className="text-gray-500">{lang === 'fr' ? 'Acte de naissance' : 'Birth Cert.'}:</span> <span className="font-medium text-gray-800">{form.birth_certificate_ref || '—'}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-5 border-t border-gray-100 flex items-center justify-between">
            <button onClick={handlePrev} disabled={step === 0} className={cn('flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all', step === 0 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200')}>
              <ChevronLeft className="w-4 h-4" />
              {lang === 'fr' ? 'Precedent' : 'Previous'}
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">{lang === 'fr' ? 'Etape' : 'Step'} {step + 1} / 5</span>
              {step < 4 ? (
                <button onClick={handleNext} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl text-sm font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md shadow-emerald-200">
                  {lang === 'fr' ? 'Suivant' : 'Next'}<ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting} className={cn('flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md', submitting ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-200')}>
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />{lang === 'fr' ? 'Enregistrement...' : 'Saving...'}</> : <><Save className="w-4 h-4" />{lang === 'fr' ? 'Enregistrer' : 'Save'}</>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}