import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload, FileSpreadsheet, FileDown, CheckCircle2,
  AlertCircle, School, GraduationCap, ArrowRight,
  Building2, Loader2, X, FileText, UserPlus,
  Calendar, Landmark, ArrowLeft, Users, PartyPopper
} from 'lucide-react'
import { useLang } from '@/hooks/useLang'
import { toast } from 'sonner'
import { schoolApi, cyclesApi, levelsApi, classesApi, studentsApi } from '@/services/api'

interface Section { id: number; code: string; label_fr: string; label_en: string }
interface Cycle { id: number; section_id: number; code: string; label_fr: string; label_en: string; order: number }
interface Level { id: number; cycle_id: number; code: string; label_fr: string; label_en: string; order: number }
interface ClassItem { id: number; level_id: number; specialty_id: number; code: string; abbreviation: string; name: string; capacity: number; status: string }
interface SchoolItem { id: number; name: string; acronym: string; city: string; status: string }
interface AcademicYear { id: number; school_id: number; label: string; start_date: string; end_date: string; is_current: boolean; status: string }

function cn(...classes: (string | false | null | undefined)[]) { return classes.filter(Boolean).join(' ') }

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE CSV — 15 CHAMPS (matricule ajouté en #1)
// ═══════════════════════════════════════════════════════════════════════════════
const TEMPLATE_HEADERS = [
  'Matricule',
  "Nom de l'élève",
  "Prénom de l'élève",
  'Date de naissance (AAAA-MM-JJ)',
  'Sexe (M/F)',
  'Lieu de naissance',
  'Nationalité',
  'Nom du Père',
  'Nom de la Mère',
  "Téléphone d'urgence",
  "N° de référence de l'acte de naissance",
  "Centre d'Etat Civil",
  "Emetteur de l'acte de naissance",
  'Handicap (Oui/Non)',
  'Cas Social (Oui/Non)',
]

const TEMPLATE_EXAMPLE = [
  ['2025-001', 'KIBINDE OMBIONYO', 'Franck Landry', '2010-05-15', 'M', 'Douala', 'Camerounaise', 'Awang Betrand', 'Awang Mary', '+237 677123456', 'BC-2025-001', 'Kumba II Council', 'Civil Status Registrar', 'Non', 'Non'],
  ['2025-002', 'ATEBA', 'Marie Claire', '2011-03-22', 'F', 'Yaoundé', 'Camerounaise', 'ATEBA Jean', 'ATEBA Rose', '+237 677654321', 'BC-2025-002', 'Yaoundé I Council', 'Civil Status Registrar', 'Non', 'Oui'],
]

/** Génère un vrai fichier CSV avec BOM UTF-8 pour Excel */
function downloadTemplateCSV() {
  const BOM = '﻿'
  const csv = BOM + [
    TEMPLATE_HEADERS.join(';'),
    ...TEMPLATE_EXAMPLE.map(r => r.join(';'))
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'modele_import_eleves.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
  toast.success('Modèle CSV téléchargé')
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function StudentImportPage() {
  const { lang } = useLang()
  const navigate = useNavigate()

  // ─── DONNÉES DE RÉFÉRENCE ───
  const [sections, setSections] = useState<Section[]>([])
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [schools, setSchools] = useState<SchoolItem[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loadingRef, setLoadingRef] = useState(true)

  // ─── AUTO-DÉTECTION: Établissement & Année scolaire ───
  const [schoolId, setSchoolId] = useState<number | null>(null)
  const [academicYearId, setAcademicYearId] = useState<number | null>(null)
  const [schoolName, setSchoolName] = useState('')
  const [academicYearName, setAcademicYearName] = useState('')

  // ─── SÉLECTION CLASSE ───
  const [sectionId, setSectionId] = useState('')
  const [cycleId, setCycleId] = useState('')
  const [levelId, setLevelId] = useState('')
  const [classId, setClassId] = useState('')

  // ─── FICHIER & IMPORT ───
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; errors: any[] } | null>(null)

  // ✅ POPUP DE CONFIRMATION
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // ═══════════════════════════════════════════════════════════════════════════════
  // CHARGEMENT DES DONNÉES + AUTO-DÉTECTION ÉTABLISSEMENT/ANNÉE
  // ═══════════════════════════════════════════════════════════════════════════════
  const loadRefData = useCallback(async () => {
    setLoadingRef(true)
    try {
      const schoolsData = await schoolApi.getSchools()
      const schoolsList = Array.isArray(schoolsData) ? schoolsData : []
      setSchools(schoolsList)

      const detectedSchool = schoolsList.find((s: SchoolItem) => s.status === 'active') || schoolsList[0]
      if (detectedSchool) {
        setSchoolId(detectedSchool.id)
        setSchoolName(detectedSchool.name)

        const yearsData = await schoolApi.getAcademicYears(detectedSchool.id)
        const yearsList = Array.isArray(yearsData) ? yearsData : []
        setAcademicYears(yearsList)

        const currentYear = yearsList.find((y: AcademicYear) => y.is_current) || yearsList[0]
        if (currentYear) {
          setAcademicYearId(currentYear.id)
          setAcademicYearName(currentYear.label)
        }

        const secData = await schoolApi.getSections(detectedSchool.id)
        setSections(Array.isArray(secData) ? secData : [])
      }

      const [cycData, levData, clsData] = await Promise.allSettled([
        cyclesApi.getAll(),
        levelsApi.getAll(),
        classesApi.getAll()
      ])
      setCycles(cycData.status === 'fulfilled' ? (Array.isArray(cycData.value) ? cycData.value : []) : [])
      setLevels(levData.status === 'fulfilled' ? (Array.isArray(levData.value) ? levData.value : []) : [])
      setClasses(clsData.status === 'fulfilled' ? (Array.isArray(clsData.value) ? clsData.value : []) : [])

    } catch (e) {
      console.error('Erreur chargement:', e)
      toast.error(lang === 'fr' ? 'Erreur chargement des données' : 'Error loading data')
    } finally {
      setLoadingRef(false)
    }
  }, [lang])

  useEffect(() => { loadRefData() }, [loadRefData])

  // ─── FILTRAGE CASCADÉ ───
  const filteredCycles = sectionId
    ? cycles.filter((c: Cycle) => c.section_id === Number(sectionId))
    : []

  const filteredLevels = cycleId
    ? levels.filter((l: Level) => l.cycle_id === Number(cycleId))
    : sectionId
      ? levels.filter((l: Level) => {
          const c = cycles.find((cc: Cycle) => cc.id === l.cycle_id)
          return c && c.section_id === Number(sectionId)
        })
      : []

  const filteredClasses = levelId
    ? classes.filter((c: ClassItem) => c.level_id === Number(levelId))
    : cycleId
      ? classes.filter((c: ClassItem) => {
          const lvl = levels.find((l: Level) => l.id === c.level_id)
          return lvl && lvl.cycle_id === Number(cycleId)
        })
      : []

  const selectedClass = classes.find((c: ClassItem) => c.id === Number(classId))

  // ─── UPLOAD FICHIER ───
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.name.toLowerCase().endsWith('.csv')) {
      toast.error(lang === 'fr' ? 'Format non supporté. Utilisez un fichier CSV' : 'Unsupported format. Use CSV')
      return
    }
    setFile(f)
    setImportResult(null)
    setShowSuccessModal(false)
    parseFile(f)
  }

  const parseFile = async (f: File) => {
    try {
      const text = await f.text()
      const firstLine = text.split('\n')[0] || ''
      const separator = firstLine.includes(';') ? ';' : ','

      const lines = text.split('\n').filter(l => l.trim())
      const headers = lines[0]?.split(separator).map(h => h.trim()) || []
      const rows = lines.slice(1).map(line => {
        const cells = line.split(separator)
        const row: Record<string, string> = {}
        headers.forEach((h, i) => { row[h] = cells[i]?.trim() || '' })
        return row
      }).filter(r => r[TEMPLATE_HEADERS[0]])
      setPreviewData(rows)
    } catch {
      toast.error(lang === 'fr' ? 'Erreur lecture du fichier' : 'Error reading file')
    }
  }

  // ─── IMPORT ───
  const handleImport = async () => {
    if (!classId) {
      toast.error(lang === 'fr' ? 'Veuillez sélectionner une classe' : 'Please select a class')
      return
    }
    if (!file) {
      toast.error(lang === 'fr' ? 'Veuillez sélectionner un fichier' : 'Please select a file')
      return
    }
    if (!schoolId) {
      toast.error(lang === 'fr' ? "Établissement non détecté" : 'School not detected')
      return
    }
    if (!academicYearId) {
      toast.error(lang === 'fr' ? "Année scolaire non détectée" : 'Academic year not detected')
      return
    }

    setImporting(true)
    setShowSuccessModal(false)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('class_id', classId)
      formData.append('school_id', String(schoolId))
      formData.append('academic_year_id', String(academicYearId))

      const res = await studentsApi.importStudents(formData)
      setImportResult(res)

      if (res.success > 0) {
        toast.success(`${res.success} ${lang === 'fr' ? 'élèves importés avec succès' : 'students imported successfully'}`)
        // ✅ AFFICHER LE POPUP DE CONFIRMATION
        setShowSuccessModal(true)
      }
      if (res.errors?.length > 0) {
        toast.error(`${res.errors.length} ${lang === 'fr' ? 'erreurs' : 'errors'}`)
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || (lang === 'fr' ? 'Erreur import' : 'Import error'))
    } finally {
      setImporting(false)
    }
  }

  // ✅ REDIRECTION VERS LA LISTE DES ÉLÈVES
  const handleGoToStudents = () => {
    setShowSuccessModal(false)
    navigate('/admin/students')
  }

  // ✅ RESTER SUR LA PAGE POUR UN NOUVEL IMPORT
  const handleNewImport = () => {
    setShowSuccessModal(false)
    resetForm()
  }

  const resetForm = () => {
    setSectionId('')
    setCycleId('')
    setLevelId('')
    setClassId('')
    setFile(null)
    setPreviewData([])
    setImportResult(null)
    setShowSuccessModal(false)
  }

  if (loadingRef) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/20 to-amber-50/20 relative">
      {/* ✅ POPUP DE CONFIRMATION MODAL */}
      {showSuccessModal && importResult && importResult.success > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Header vert */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6 text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <PartyPopper className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">
                {lang === 'fr' ? 'Importation réussie !' : 'Import Successful!'}
              </h3>
              <p className="text-emerald-100 text-sm mt-1">
                {lang === 'fr'
                  ? `${importResult.success} élève${importResult.success > 1 ? 's' : ''} importé${importResult.success > 1 ? 's' : ''} avec succès`
                  : `${importResult.success} student${importResult.success > 1 ? 's' : ''} imported successfully`}
              </p>
            </div>

            {/* Body */}
            <div className="p-6">
              {importResult.errors.length > 0 && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-700 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {importResult.errors.length} {lang === 'fr' ? 'erreur(s) ignorée(s)' : 'error(s) skipped'}
                  </p>
                </div>
              )}

              <p className="text-sm text-gray-600 text-center mb-6">
                {lang === 'fr'
                  ? 'Les élèves ont été enregistrés dans la base de données. Souhaitez-vous consulter la liste des élèves ou effectuer un nouvel import ?'
                  : 'Students have been saved to the database. Would you like to view the student list or perform another import?'}
              </p>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleGoToStudents}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200"
                >
                  <Users className="w-5 h-5" />
                  {lang === 'fr' ? 'Voir la liste des élèves' : 'View Student List'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleNewImport}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  <Upload className="w-5 h-5 text-gray-500" />
                  {lang === 'fr' ? 'Nouvel import' : 'New Import'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header bg-white/80 backdrop-blur-md border-b border-purple-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="page-title text-2xl font-bold bg-gradient-to-r from-purple-700 to-purple-900 bg-clip-text text-transparent">
                {lang === 'fr' ? 'Importer la liste des élèves' : 'Import Student List'}
              </h1>
              <p className="page-subtitle text-sm text-gray-500 mt-0.5">
                {lang === 'fr' ? 'Importer des élèves via CSV' : 'Import students via CSV'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* ─── INFO ÉTABLISSEMENT & ANNÉE (auto-détectés) ─── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-blue-100">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-blue-600" />
              {lang === 'fr' ? 'Contexte scolaire (auto-détecté)' : 'School Context (auto-detected)'}
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <School className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{lang === 'fr' ? 'Établissement' : 'School'}</p>
                  <p className="text-sm font-semibold text-blue-800">{schoolName || '—'}</p>
                  <p className="text-xs text-blue-600">ID: {schoolId || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{lang === 'fr' ? 'Année scolaire' : 'Academic Year'}</p>
                  <p className="text-sm font-semibold text-amber-800">{academicYearName || '—'}</p>
                  <p className="text-xs text-amber-600">ID: {academicYearId || 'N/A'}</p>
                </div>
              </div>
            </div>
            {(!schoolId || !academicYearId) && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">
                  {lang === 'fr'
                    ? "⚠️ Établissement ou année scolaire non détectés. Vérifiez que des écoles et années académiques existent dans le système."
                    : '⚠️ School or academic year not detected. Please verify schools and academic years exist in the system.'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Step 1: Select Class */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-purple-50 to-purple-100/50 border-b border-purple-100">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <School className="w-5 h-5 text-purple-600" />
              {lang === 'fr' ? 'Étape 1 : Sélectionner la classe' : 'Step 1: Select Class'}
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'fr' ? 'Section' : 'Section'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={sectionId}
                    onChange={(e) => { setSectionId(e.target.value); setCycleId(''); setLevelId(''); setClassId('') }}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 appearance-none"
                  >
                    <option value="">{lang === 'fr' ? 'Sélectionner...' : 'Select...'}</option>
                    {sections.map((s: Section) => (
                      <option key={s.id} value={s.id}>{lang === 'fr' ? s.label_fr : s.label_en}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cycle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'fr' ? 'Cycle' : 'Cycle'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={cycleId}
                    onChange={(e) => { setCycleId(e.target.value); setLevelId(''); setClassId('') }}
                    disabled={!sectionId || filteredCycles.length === 0}
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 appearance-none',
                      (!sectionId || filteredCycles.length === 0) ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-200'
                    )}
                  >
                    <option value="">{lang === 'fr' ? 'Sélectionner...' : 'Select...'}</option>
                    {filteredCycles.map((c: Cycle) => (
                      <option key={c.id} value={c.id}>{lang === 'fr' ? c.label_fr : c.label_en}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'fr' ? 'Niveau' : 'Level'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <ArrowRight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={levelId}
                    onChange={(e) => { setLevelId(e.target.value); setClassId('') }}
                    disabled={!cycleId || filteredLevels.length === 0}
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 appearance-none',
                      (!cycleId || filteredLevels.length === 0) ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-200'
                    )}
                  >
                    <option value="">{lang === 'fr' ? 'Sélectionner...' : 'Select...'}</option>
                    {filteredLevels.map((l: Level) => (
                      <option key={l.id} value={l.id}>{lang === 'fr' ? l.label_fr : l.label_en}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Class */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'fr' ? 'Classe' : 'Class'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    disabled={!levelId || filteredClasses.length === 0}
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 appearance-none',
                      (!levelId || filteredClasses.length === 0) ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-200'
                    )}
                  >
                    <option value="">{lang === 'fr' ? 'Sélectionner...' : 'Select...'}</option>
                    {filteredClasses.map((c: ClassItem) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.abbreviation})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {selectedClass && (
              <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-purple-800 font-medium">
                  {lang === 'fr' ? 'Classe sélectionnée' : 'Selected class'} : {selectedClass.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Download Template */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-100">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              {lang === 'fr' ? 'Étape 2 : Télécharger le modèle' : 'Step 2: Download Template'}
            </h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">
              {lang === 'fr'
                ? "Téléchargez le modèle CSV, complétez-le avec les informations des élèves, puis importez-le. Le fichier s'ouvre directement dans Excel."
                : 'Download the CSV template, fill it with student information, then import it. Opens directly in Excel.'}
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                {lang === 'fr' ? 'Champs du fichier modèle (15 champs)' : 'Template fields (15 fields)'}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {TEMPLATE_HEADERS.map((h, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-gray-600">
                    <div className="w-5 h-5 bg-emerald-100 rounded flex items-center justify-center text-emerald-700 font-bold text-[10px]">
                      {i + 1}
                    </div>
                    <span className="truncate">{h}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={downloadTemplateCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
            >
              <FileDown className="w-4 h-4 text-green-600" />
              {lang === 'fr' ? 'Télécharger le modèle CSV (.csv)' : 'Download CSV Template (.csv)'}
            </button>
          </div>
        </div>

        {/* Step 3: Upload & Import */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-blue-100">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              {lang === 'fr' ? 'Étape 3 : Importer le fichier CSV' : 'Step 3: Import CSV File'}
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {/* Zone upload */}
            <div
              className={cn(
                'border-2 border-dashed rounded-xl p-8 text-center transition-all',
                file ? 'border-blue-400 bg-blue-50/50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              )}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="w-10 h-10 text-blue-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      onClick={(e) => { e.preventDefault(); setFile(null); setPreviewData([]); setImportResult(null); setShowSuccessModal(false) }}
                      className="p-1 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium text-gray-700">
                      {lang === 'fr' ? 'Cliquez pour sélectionner un fichier CSV' : 'Click to select a CSV file'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Format accepté : .csv (séparateur ; ou ,)
                    </p>
                  </>
                )}
              </label>
            </div>

            {/* Preview */}
            {previewData.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {previewData.length} {lang === 'fr' ? 'élèves détectés' : 'students detected'}
                  </span>
                </div>
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-left font-medium text-gray-500">Matricule</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">Nom</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">Prénom</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">Date naiss.</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">Sexe</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500">Lieu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {previewData.slice(0, 5).map((row, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 font-medium text-blue-700">{row['Matricule'] || '-'}</td>
                          <td className="px-3 py-2">{row["Nom de l'élève"] || '-'}</td>
                          <td className="px-3 py-2">{row["Prénom de l'élève"] || '-'}</td>
                          <td className="px-3 py-2">{row['Date de naissance (AAAA-MM-JJ)'] || '-'}</td>
                          <td className="px-3 py-2">{row['Sexe (M/F)'] || '-'}</td>
                          <td className="px-3 py-2">{row['Lieu de naissance'] || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.length > 5 && (
                    <p className="text-xs text-gray-500 text-center py-2">
                      +{previewData.length - 5} {lang === 'fr' ? 'autres' : 'more'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Résultat import (affiché en dessous aussi) */}
            {importResult && (
              <div className={cn(
                'rounded-xl p-4 border',
                importResult.errors.length === 0
                  ? 'bg-green-50 border-green-200'
                  : 'bg-amber-50 border-amber-200'
              )}>
                <div className="flex items-center gap-2 mb-2">
                  {importResult.errors.length === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  )}
                  <span className="font-medium text-gray-800">
                    {importResult.success} {lang === 'fr' ? 'élèves importés' : 'students imported'}
                  </span>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-amber-700 font-medium">
                      {importResult.errors.length} {lang === 'fr' ? 'erreurs' : 'errors'} :
                    </p>
                    <div className="max-h-32 overflow-y-auto text-xs text-amber-800 space-y-1">
                      {importResult.errors.map((err: any, i: number) => (
                        <p key={i}>Ligne {err.row}: {err.error}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleImport}
                disabled={importing || !file || !classId || !schoolId || !academicYearId}
                className={cn(
                  'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md',
                  importing || !file || !classId || !schoolId || !academicYearId
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-blue-200'
                )}
              >
                {importing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{lang === 'fr' ? 'Importation...' : 'Importing...'}</>
                ) : (
                  <><UserPlus className="w-4 h-4" />{lang === 'fr' ? 'Importer les élèves' : 'Import Students'}</>
                )}
              </button>
              <button
                onClick={resetForm}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
              >
                <X className="w-4 h-4" />
                {lang === 'fr' ? 'Réinitialiser' : 'Reset'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}