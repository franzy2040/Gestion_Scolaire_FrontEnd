import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Heart, Search, Plus, Eye, Edit2, Trash2, X, Loader2,
  Users, GraduationCap, Phone, MapPin, Calendar,
  AlertCircle, CheckCircle2, UserPlus, FileText,
  User, ChevronRight, Save, RotateCcw, Landmark,
  School, ArrowRight, Building2, FileDown, Hash
} from 'lucide-react'
import { useLang } from '@/hooks/useLang'
import { toast } from 'sonner'
import { studentsApi, schoolApi, cyclesApi, levelsApi, classesApi } from '@/services/api'

interface Student {
  id: number
  matricule: string
  first_name: string
  last_name: string
  sex: string
  date_of_birth: string
  place_of_birth: string
  nationality: string
  class_name?: string
  school_name?: string
  status: string
  handicap: boolean
  social_case: boolean
  social_case_details?: string
  emergency_phone?: string
  father_name?: string
  mother_name?: string
  birth_certificate_ref?: string
  civil_status_center?: string
  birth_certificate_issuer?: string
}

interface Section { id: number; code: string; label_fr: string; label_en: string }
interface Cycle { id: number; section_id: number; code: string; label_fr: string; label_en: string; order: number }
interface Level { id: number; cycle_id: number; code: string; label_fr: string; label_en: string; order: number }
interface ClassItem { id: number; level_id: number; specialty_id: number; code: string; abbreviation: string; name: string; capacity: number; status: string }
interface AcademicYear { id: number; school_id: number; label: string; start_date: string; end_date: string; is_current: boolean; status: string }
interface SchoolItem { id: number; name: string; acronym: string; city: string; status: string }

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR')
}

function getStatusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    NOUVEAU: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Nouveau' },
    INSCRIT: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Inscrit' },
    EXCLU: { bg: 'bg-red-100', text: 'text-red-700', label: 'Exclu' },
    DEMISSION: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Démission' },
    RENVOYE: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Renvoyé' },
    REINTEGRE: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Réintégré' },
    TRANSFERE: { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'Transféré' },
  }
  const s = map[status?.toUpperCase()] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status || 'N/A' }
  return <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', s.bg, s.text)}>{s.label}</span>
}

// ═══════════════════════════════════════════════════════════════════════════════
// POPUP DE CRÉATION D'ÉLÈVE CAS SOCIAL (formulaire complet)
// ═══════════════════════════════════════════════════════════════════════════════
function CreateSocialCaseModal({
  isOpen, onClose, onSuccess, lang
}: {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  lang: string
}) {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [sections, setSections] = useState<Section[]>([])
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [schools, setSchools] = useState<SchoolItem[]>([])
  const [loadingRef, setLoadingRef] = useState(true)

  const [form, setForm] = useState({
    matricule: '', first_name: '', last_name: '', sex: '', date_of_birth: '',
    place_of_birth: '', nationality: 'Camerounaise',
    section_id: '', cycle_id: '', level_id: '', class_id: '',
    father_name: '', mother_name: '', emergency_phone: '',
    birth_certificate_ref: '', civil_status_center: '', birth_certificate_issuer: '',
    handicap: false, handicap_details: '',
    social_case: true, social_case_details: '',  // ✅ social_case coché par défaut
    school_id: '', academic_year_id: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const STEP_LABELS = lang === 'fr'
    ? ['Identité', 'Scolarité', 'Parents', 'Acte de naissance', 'Santé & Social']
    : ['Identity', 'Schooling', 'Parents', 'Birth Cert.', 'Health & Social']
  const STEP_ICONS = [User, GraduationCap, Users, FileText, Heart]

  useEffect(() => {
    if (!isOpen) return
    const load = async () => {
      setLoadingRef(true)
      try {
        const [sch, sec, cyc, lev, cls, years] = await Promise.all([
          schoolApi.getSchools(),
          schoolApi.getSections(1),
          cyclesApi.getAll(),
          levelsApi.getAll(),
          classesApi.getAll(),
          schoolApi.getAcademicYears(1)
        ])
        setSchools(Array.isArray(sch) ? sch : [])
        setSections(Array.isArray(sec) ? sec : [])
        setCycles(Array.isArray(cyc) ? cyc : [])
        setLevels(Array.isArray(lev) ? lev : [])
        setClasses(Array.isArray(cls) ? cls : [])
        setAcademicYears(Array.isArray(years) ? years : [])
        const currentYear = Array.isArray(years) ? years.find((y: AcademicYear) => y.is_current) : null
        if (currentYear) setForm(prev => ({ ...prev, academic_year_id: String(currentYear.id) }))
      } catch (e) { console.error(e) }
      finally { setLoadingRef(false) }
    }
    load()
  }, [isOpen])

  const filteredCycles = form.section_id
    ? cycles.filter(c => c.section_id === Number(form.section_id))
    : []
  const filteredLevels = form.cycle_id
    ? levels.filter(l => l.cycle_id === Number(form.cycle_id))
    : []
  const filteredClasses = form.level_id
    ? classes.filter(c => c.level_id === Number(form.level_id))
    : []

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
      if (!form.matricule.trim()) newErrors.matricule = lang === 'fr' ? 'Champ obligatoire' : 'Required'
      if (!form.first_name.trim()) newErrors.first_name = lang === 'fr' ? 'Champ obligatoire' : 'Required'
      if (!form.last_name.trim()) newErrors.last_name = lang === 'fr' ? 'Champ obligatoire' : 'Required'
      if (!form.sex) newErrors.sex = lang === 'fr' ? 'Champ obligatoire' : 'Required'
      if (!form.date_of_birth) newErrors.date_of_birth = lang === 'fr' ? 'Champ obligatoire' : 'Required'
      if (!form.place_of_birth.trim()) newErrors.place_of_birth = lang === 'fr' ? 'Champ obligatoire' : 'Required'
    }
    if (s === 1) {
      if (!form.section_id) newErrors.section_id = lang === 'fr' ? 'Champ obligatoire' : 'Required'
      if (!form.cycle_id) newErrors.cycle_id = lang === 'fr' ? 'Champ obligatoire' : 'Required'
      if (!form.level_id) newErrors.level_id = lang === 'fr' ? 'Champ obligatoire' : 'Required'
      if (!form.class_id) newErrors.class_id = lang === 'fr' ? 'Champ obligatoire' : 'Required'
    }
    if (s === 2) {
      if (!form.mother_name.trim()) newErrors.mother_name = lang === 'fr' ? 'Champ obligatoire' : 'Required'
      if (!form.emergency_phone.trim()) newErrors.emergency_phone = lang === 'fr' ? 'Champ obligatoire' : 'Required'
    }
    if (s === 3) {
      if (!form.birth_certificate_ref.trim()) newErrors.birth_certificate_ref = lang === 'fr' ? 'Champ obligatoire' : 'Required'
      if (!form.civil_status_center.trim()) newErrors.civil_status_center = lang === 'fr' ? 'Champ obligatoire' : 'Required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) setStep(prev => Math.min(prev + 1, 4))
  }
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 0))

  const handleSubmit = async () => {
    let allValid = true
    for (let s = 0; s <= 4; s++) { if (!validateStep(s)) allValid = false }
    if (!allValid) {
      toast.error(lang === 'fr' ? 'Veuillez corriger les erreurs' : 'Please fix errors')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        matricule: form.matricule.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        sex: form.sex,
        date_of_birth: form.date_of_birth,
        place_of_birth: form.place_of_birth.trim(),
        nationality: form.nationality,
        mother_name: form.mother_name.trim(),
        emergency_phone: form.emergency_phone.trim(),
        birth_certificate_ref: form.birth_certificate_ref.trim(),
        civil_status_center: form.civil_status_center.trim(),
        birth_certificate_issuer: form.birth_certificate_issuer.trim() || 'Civil Status Registrar',
        handicap: form.handicap,
        social_case: true,  // ✅ Toujours true
        school_id: Number(form.school_id) || 1,
        academic_year_id: form.academic_year_id ? Number(form.academic_year_id) : null,
        class_id: Number(form.class_id),
        enrollment_type: 'new',
        ...(form.father_name.trim() && { father_name: form.father_name.trim() }),
        ...(form.handicap_details.trim() && { handicap_details: form.handicap_details.trim() }),
        ...(form.social_case_details.trim() && { social_case_details: form.social_case_details.trim() }),
      }
      await studentsApi.create(payload)
      toast.success(lang === 'fr' ? 'Cas social créé avec succès' : 'Social case created successfully')
      onSuccess()
      onClose()
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || (lang === 'fr' ? 'Erreur création' : 'Create error'))
    } finally { setSubmitting(false) }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-purple-600" />
            {lang === 'fr' ? 'Ajouter un cas social' : 'Add Social Case'}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-white/50 rounded-lg text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between">
            {STEP_LABELS.map((label, i) => {
              const Icon = STEP_ICONS[i]
              const isActive = i === step
              const isDone = i < step
              return (
                <div key={i} className="flex flex-col items-center gap-1 flex-1 relative">
                  {i > 0 && <div className={cn('absolute top-3 right-1/2 w-full h-0.5 -z-10', isDone ? 'bg-purple-500' : 'bg-gray-200')} />}
                  <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all', isActive ? 'bg-purple-600 text-white' : isDone ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-400')}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <span className={cn('text-[10px] font-medium text-center hidden sm:block', isActive ? 'text-purple-700' : 'text-gray-400')}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="p-6">
          {loadingRef ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-purple-600 animate-spin" /></div>
          ) : (
            <div className="space-y-4">
              {step === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Matricule' : 'Reg. No.'} *</label>
                    <input type="text" value={form.matricule} onChange={e => updateField('matricule', e.target.value)} className={cn('w-full px-3 py-2 border rounded-lg text-sm', errors.matricule ? 'border-red-300 bg-red-50' : 'border-gray-200')} />
                    {errors.matricule && <p className="text-xs text-red-500">{errors.matricule}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Prénom' : 'First Name'} *</label>
                    <input type="text" value={form.first_name} onChange={e => updateField('first_name', e.target.value)} className={cn('w-full px-3 py-2 border rounded-lg text-sm', errors.first_name ? 'border-red-300 bg-red-50' : 'border-gray-200')} />
                    {errors.first_name && <p className="text-xs text-red-500">{errors.first_name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Nom' : 'Last Name'} *</label>
                    <input type="text" value={form.last_name} onChange={e => updateField('last_name', e.target.value)} className={cn('w-full px-3 py-2 border rounded-lg text-sm', errors.last_name ? 'border-red-300 bg-red-50' : 'border-gray-200')} />
                    {errors.last_name && <p className="text-xs text-red-500">{errors.last_name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Sexe' : 'Sex'} *</label>
                    <select value={form.sex} onChange={e => updateField('sex', e.target.value)} className={cn('w-full px-3 py-2 border rounded-lg text-sm', errors.sex ? 'border-red-300 bg-red-50' : 'border-gray-200')}>
                      <option value="">{lang === 'fr' ? 'Sélectionner' : 'Select'}</option>
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                    {errors.sex && <p className="text-xs text-red-500">{errors.sex}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Date de naissance' : 'Date of birth'} *</label>
                    <input type="date" value={form.date_of_birth} onChange={e => updateField('date_of_birth', e.target.value)} className={cn('w-full px-3 py-2 border rounded-lg text-sm', errors.date_of_birth ? 'border-red-300 bg-red-50' : 'border-gray-200')} />
                    {errors.date_of_birth && <p className="text-xs text-red-500">{errors.date_of_birth}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Lieu de naissance' : 'Place of birth'} *</label>
                    <input type="text" value={form.place_of_birth} onChange={e => updateField('place_of_birth', e.target.value)} className={cn('w-full px-3 py-2 border rounded-lg text-sm', errors.place_of_birth ? 'border-red-300 bg-red-50' : 'border-gray-200')} />
                    {errors.place_of_birth && <p className="text-xs text-red-500">{errors.place_of_birth}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Nationalité' : 'Nationality'}</label>
                    <select value={form.nationality} onChange={e => updateField('nationality', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                      <option value="Camerounaise">Camerounaise</option>
                      <option value="Nigeriane">Nigériane</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Année académique' : 'Academic Year'}</label>
                    <input type="text" value={academicYears.find(y => y.id === Number(form.academic_year_id))?.label || '—'} disabled className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Section' : 'Section'} *</label>
                    <select value={form.section_id} onChange={e => updateField('section_id', e.target.value)} className={cn('w-full px-3 py-2 border rounded-lg text-sm', errors.section_id ? 'border-red-300 bg-red-50' : 'border-gray-200')}>
                      <option value="">{lang === 'fr' ? 'Sélectionner' : 'Select'}</option>
                      {sections.map(s => <option key={s.id} value={s.id}>{lang === 'fr' ? s.label_fr : s.label_en}</option>)}
                    </select>
                    {errors.section_id && <p className="text-xs text-red-500">{errors.section_id}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Cycle' : 'Cycle'} *</label>
                    <select value={form.cycle_id} onChange={e => updateField('cycle_id', e.target.value)} disabled={!form.section_id} className={cn('w-full px-3 py-2 border rounded-lg text-sm', errors.cycle_id ? 'border-red-300 bg-red-50' : !form.section_id ? 'bg-gray-50 text-gray-400' : 'border-gray-200')}>
                      <option value="">{lang === 'fr' ? 'Sélectionner' : 'Select'}</option>
                      {filteredCycles.map(c => <option key={c.id} value={c.id}>{lang === 'fr' ? c.label_fr : c.label_en}</option>)}
                    </select>
                    {errors.cycle_id && <p className="text-xs text-red-500">{errors.cycle_id}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Niveau' : 'Level'} *</label>
                    <select value={form.level_id} onChange={e => updateField('level_id', e.target.value)} disabled={!form.cycle_id} className={cn('w-full px-3 py-2 border rounded-lg text-sm', errors.level_id ? 'border-red-300 bg-red-50' : !form.cycle_id ? 'bg-gray-50 text-gray-400' : 'border-gray-200')}>
                      <option value="">{lang === 'fr' ? 'Sélectionner' : 'Select'}</option>
                      {filteredLevels.map(l => <option key={l.id} value={l.id}>{lang === 'fr' ? l.label_fr : l.label_en}</option>)}
                    </select>
                    {errors.level_id && <p className="text-xs text-red-500">{errors.level_id}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Classe' : 'Class'} *</label>
                    <select value={form.class_id} onChange={e => updateField('class_id', e.target.value)} disabled={!form.level_id} className={cn('w-full px-3 py-2 border rounded-lg text-sm', errors.class_id ? 'border-red-300 bg-red-50' : !form.level_id ? 'bg-gray-50 text-gray-400' : 'border-gray-200')}>
                      <option value="">{lang === 'fr' ? 'Sélectionner' : 'Select'}</option>
                      {filteredClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {errors.class_id && <p className="text-xs text-red-500">{errors.class_id}</p>}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Nom du père' : 'Father'}</label>
                    <input type="text" value={form.father_name} onChange={e => updateField('father_name', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Nom de la mère' : 'Mother'} *</label>
                    <input type="text" value={form.mother_name} onChange={e => updateField('mother_name', e.target.value)} className={cn('w-full px-3 py-2 border rounded-lg text-sm', errors.mother_name ? 'border-red-300 bg-red-50' : 'border-gray-200')} />
                    {errors.mother_name && <p className="text-xs text-red-500">{errors.mother_name}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'fr' ? "Téléphone d'urgence" : 'Emergency phone'} *</label>
                    <input type="tel" value={form.emergency_phone} onChange={e => updateField('emergency_phone', e.target.value)} className={cn('w-full px-3 py-2 border rounded-lg text-sm', errors.emergency_phone ? 'border-red-300 bg-red-50' : 'border-gray-200')} />
                    {errors.emergency_phone && <p className="text-xs text-red-500">{errors.emergency_phone}</p>}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'fr' ? 'N° acte de naissance' : 'Birth cert. ref'} *</label>
                    <input type="text" value={form.birth_certificate_ref} onChange={e => updateField('birth_certificate_ref', e.target.value)} className={cn('w-full px-3 py-2 border rounded-lg text-sm', errors.birth_certificate_ref ? 'border-red-300 bg-red-50' : 'border-gray-200')} />
                    {errors.birth_certificate_ref && <p className="text-xs text-red-500">{errors.birth_certificate_ref}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'fr' ? "Centre d'état civil" : 'Civil status center'} *</label>
                    <input type="text" value={form.civil_status_center} onChange={e => updateField('civil_status_center', e.target.value)} className={cn('w-full px-3 py-2 border rounded-lg text-sm', errors.civil_status_center ? 'border-red-300 bg-red-50' : 'border-gray-200')} />
                    {errors.civil_status_center && <p className="text-xs text-red-500">{errors.civil_status_center}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Émetteur' : 'Issuer'}</label>
                    <input type="text" value={form.birth_certificate_issuer} onChange={e => updateField('birth_certificate_issuer', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-5 h-5 text-purple-600" />
                      <span className="font-semibold text-purple-800">{lang === 'fr' ? 'Cas social' : 'Social Case'}</span>
                      <span className="px-2 py-0.5 bg-purple-600 text-white rounded-full text-xs">{lang === 'fr' ? 'Activé' : 'Active'}</span>
                    </div>
                    <p className="text-sm text-purple-600">{lang === 'fr' ? 'Cet élève sera enregistré comme cas social.' : 'This student will be registered as a social case.'}</p>
                    <textarea
                      value={form.social_case_details}
                      onChange={e => updateField('social_case_details', e.target.value)}
                      placeholder={lang === 'fr' ? 'Détails du cas social (orphelin, famille monoparentale, etc.)...' : 'Social case details...'}
                      rows={3}
                      className="w-full mt-2 px-3 py-2 border border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={form.handicap} onChange={e => updateField('handicap', e.target.checked)} className="w-4 h-4 text-purple-600 rounded" />
                      <span className="text-sm text-gray-700">{lang === 'fr' ? 'Handicap' : 'Disability'}</span>
                    </label>
                    {form.handicap && (
                      <input type="text" value={form.handicap_details} onChange={e => updateField('handicap_details', e.target.value)} placeholder={lang === 'fr' ? 'Détails...' : 'Details...'} className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 flex items-center justify-between sticky bottom-0 bg-white">
          <button onClick={handlePrev} disabled={step === 0} className={cn('px-4 py-2 rounded-lg text-sm font-medium', step === 0 ? 'bg-gray-100 text-gray-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>
            {lang === 'fr' ? 'Précédent' : 'Previous'}
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{step + 1}/5</span>
            {step < 4 ? (
              <button onClick={handleNext} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700">
                {lang === 'fr' ? 'Suivant' : 'Next'} <ChevronRight className="w-4 h-4 inline" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} className={cn('px-4 py-2 rounded-lg text-sm font-medium', submitting ? 'bg-gray-300' : 'bg-purple-600 text-white hover:bg-purple-700')}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin inline" /> : <Save className="w-4 h-4 inline" />} {lang === 'fr' ? 'Enregistrer' : 'Save'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function StudentSocialCasesPage() {
  const { lang } = useLang()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [searchMatricule, setSearchMatricule] = useState('')
  const [searchName, setSearchName] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Student>>({})

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── CHARGEMENT ───
  const loadSocialCases = useCallback(async () => {
    setLoading(true)
    try {
      const res = await studentsApi.getAll({ social_case: true, per_page: 100 } as any)
      const items = res?.items || res?.data || res || []
      setStudents(Array.isArray(items) ? items : [])
    } catch (err) {
      toast.error(lang === 'fr' ? 'Erreur chargement' : 'Error loading')
    } finally {
      setLoading(false)
    }
  }, [lang])

  useEffect(() => { loadSocialCases() }, [loadSocialCases])

  // ─── RECHERCHE EN TEMPS RÉEL ───
  const performSearch = useCallback(async () => {
    const hasMatricule = searchMatricule.trim().length > 0
    const hasName = searchName.trim().length > 0

    if (!hasMatricule && !hasName) {
      loadSocialCases()
      return
    }

    setLoading(true)
    try {
      const params: Record<string, any> = { per_page: 100 }
      if (hasMatricule) params.matricule = searchMatricule.trim()
      if (hasName) params.search = searchName.trim()

      const res = await studentsApi.getAll(params as any)
      const items = res?.items || res?.data || res || []
      const allStudents = Array.isArray(items) ? items : []
      // Filtrer seulement les cas sociaux si recherche par nom
      const filtered = hasName ? allStudents.filter((s: Student) => s.social_case) : allStudents
      setStudents(filtered)
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }, [searchMatricule, searchName, loadSocialCases])

  // Déclencher la recherche après 300ms d'inactivité
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      performSearch()
    }, 300)
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
  }, [searchMatricule, searchName, performSearch])

  const resetSearch = () => {
    setSearchMatricule('')
    setSearchName('')
    loadSocialCases()
  }

  // ─── DÉTAILS ───
  const handleViewDetails = (student: Student) => {
    setSelectedStudent(student)
  }

  // ─── ÉDITION ───
  const handleEdit = (student: Student) => {
    setEditForm({ ...student })
    setShowEditModal(true)
  }

  const handleSaveEdit = async () => {
    if (!editForm.id) return
    try {
      await studentsApi.update(editForm.id, { social_case_details: editForm.social_case_details, handicap: editForm.handicap } as any)
      toast.success(lang === 'fr' ? 'Modifications enregistrées' : 'Changes saved')
      setShowEditModal(false)
      loadSocialCases()
    } catch (err) {
      toast.error(lang === 'fr' ? 'Erreur' : 'Error')
    }
  }

  // ─── SUPPRESSION ───
  const handleDelete = async (id: number) => {
    if (!confirm(lang === 'fr' ? 'Retirer ce cas social ?' : 'Remove this social case?')) return
    try {
      await studentsApi.update(id, { social_case: false } as any)
      toast.success(lang === 'fr' ? 'Cas social retiré' : 'Social case removed')
      loadSocialCases()
    } catch (err) {
      toast.error(lang === 'fr' ? 'Erreur' : 'Error')
    }
  }

  // ─── EXPORT CSV ───
  const exportCSV = () => {
    const headers = ['Matricule', 'Nom', 'Prénom', 'Sexe', 'Date Naissance', 'Lieu', 'Classe', 'Téléphone', 'Détails']
    const rows = students.map(s => [
      s.matricule, s.last_name, s.first_name, s.sex,
      formatDate(s.date_of_birth), s.place_of_birth,
      s.class_name || '-', s.emergency_phone || '-', s.social_case_details || '-'
    ])
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `cas_sociaux_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast.success('Export CSV terminé')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-amber-50/10">
      {/* Header */}
      <div className="page-header bg-white/80 backdrop-blur-md border-b border-purple-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="page-title text-2xl font-bold bg-gradient-to-r from-purple-700 to-pink-600 bg-clip-text text-transparent">
                {lang === 'fr' ? 'Cas sociaux' : 'Social Cases'}
              </h1>
              <p className="page-subtitle text-sm text-gray-500 mt-0.5">
                {students.length} {lang === 'fr' ? 'élèves en situation difficile' : 'students in difficult situations'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
              <FileText className="w-4 h-4 text-green-600" /> CSV
            </button>
            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-600 transition-all shadow-md shadow-purple-200">
              <UserPlus className="w-4 h-4" />
              {lang === 'fr' ? 'Ajouter' : 'Add'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* ─── RECHERCHE EN TEMPS RÉEL ─── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchMatricule}
                onChange={(e) => setSearchMatricule(e.target.value)}
                placeholder={lang === 'fr' ? 'Rechercher par matricule...' : 'Search by reg. number...'}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
              />
            </div>
            <div className="flex-1 relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder={lang === 'fr' ? 'Rechercher par nom...' : 'Search by name...'}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
              />
            </div>
            <button onClick={resetSearch} className="flex items-center gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
          {(searchMatricule || searchName) && (
            <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {lang === 'fr' ? 'Recherche en cours...' : 'Searching...'}
            </p>
          )}
        </div>

        {/* ─── TABLEAU ─── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{lang === 'fr' ? 'Matricule' : 'Reg. No.'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{lang === 'fr' ? 'Nom & Prénom' : 'Name'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">{lang === 'fr' ? 'Classe' : 'Class'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">{lang === 'fr' ? 'Contact' : 'Contact'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{lang === 'fr' ? 'Statut' : 'Status'}</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">{lang === 'fr' ? 'Actions' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center"><Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" /></td></tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">{lang === 'fr' ? 'Aucun cas social' : 'No social cases'}</p>
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded">{student.matricule}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {student.first_name[0]}{student.last_name[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{student.last_name} {student.first_name}</p>
                            <p className="text-xs text-gray-500">{student.sex === 'M' ? '♂' : '♀'} · {formatDate(student.date_of_birth)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1 text-gray-600">
                          <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                          <span>{student.class_name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-gray-600 text-xs">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {student.emergency_phone || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(student.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleViewDetails(student)} className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors" title="Voir"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handleEdit(student)} className="p-1.5 hover:bg-amber-50 rounded-lg text-gray-400 hover:text-amber-600 transition-colors" title="Modifier"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(student.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors" title="Retirer"><Trash2 className="w-4 h-4" /></button>
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

      {/* ─── MODAL DÉTAILS ─── */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Heart className="w-5 h-5 text-purple-600" />{lang === 'fr' ? 'Détails' : 'Details'}</h3>
              <button onClick={() => setSelectedStudent(null)} className="p-1.5 hover:bg-white/50 rounded-lg text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
                  {selectedStudent.first_name[0]}{selectedStudent.last_name[0]}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">{selectedStudent.last_name} {selectedStudent.first_name}</h4>
                  <p className="text-sm text-gray-500">{selectedStudent.matricule} · {selectedStudent.class_name || '-'}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between"><span className="text-sm text-gray-500">{lang === 'fr' ? 'Date de naissance' : 'Date of birth'}</span><span className="text-sm font-medium">{formatDate(selectedStudent.date_of_birth)}</span></div>
                <div className="flex justify-between"><span className="text-sm text-gray-500">{lang === 'fr' ? 'Lieu' : 'Place'}</span><span className="text-sm font-medium">{selectedStudent.place_of_birth}</span></div>
                <div className="flex justify-between"><span className="text-sm text-gray-500">{lang === 'fr' ? 'Téléphone' : 'Phone'}</span><span className="text-sm font-medium">{selectedStudent.emergency_phone || '-'}</span></div>
                <div className="flex justify-between"><span className="text-sm text-gray-500">{lang === 'fr' ? 'Père' : 'Father'}</span><span className="text-sm font-medium">{selectedStudent.father_name || '-'}</span></div>
                <div className="flex justify-between"><span className="text-sm text-gray-500">{lang === 'fr' ? 'Mère' : 'Mother'}</span><span className="text-sm font-medium">{selectedStudent.mother_name || '-'}</span></div>
                <div className="flex justify-between"><span className="text-sm text-gray-500">{lang === 'fr' ? 'Handicap' : 'Disability'}</span><span className="text-sm font-medium">{selectedStudent.handicap ? 'Oui' : 'Non'}</span></div>
              </div>
              {selectedStudent.social_case_details && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-sm font-medium text-amber-800 mb-1">{lang === 'fr' ? 'Détails du cas social' : 'Social case details'}</p>
                  <p className="text-sm text-amber-700">{selectedStudent.social_case_details}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL ÉDITION ─── */}
      {showEditModal && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Edit2 className="w-5 h-5 text-amber-600" />{lang === 'fr' ? 'Modifier' : 'Edit'}</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1.5 hover:bg-white/50 rounded-lg text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{lang === 'fr' ? 'Détails du cas social' : 'Social case details'}</label>
                <textarea
                  value={editForm.social_case_details || ''}
                  onChange={(e) => setEditForm({ ...editForm, social_case_details: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  placeholder={lang === 'fr' ? 'Décrivez la situation...' : 'Describe the situation...'}
                />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={editForm.handicap || false} onChange={(e) => setEditForm({ ...editForm, handicap: e.target.checked })} className="w-4 h-4 text-amber-600 rounded" />
                <span className="text-sm text-gray-700">{lang === 'fr' ? 'Handicap' : 'Disability'}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={handleSaveEdit} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600"><Save className="w-4 h-4" />{lang === 'fr' ? 'Enregistrer' : 'Save'}</button>
                <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">{lang === 'fr' ? 'Annuler' : 'Cancel'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL AJOUT (formulaire complet) ─── */}
      <CreateSocialCaseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadSocialCases}
        lang={lang}
      />
    </div>
  )
}