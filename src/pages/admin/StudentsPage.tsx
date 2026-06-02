import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Plus, Search, Filter, FileDown, Table2, FileText,
  Edit2, Trash2, Eye, GraduationCap, School, Calendar,
  Phone, MapPin, AlertCircle, ChevronLeft, ChevronRight,
  Download, X, CheckCircle2, Loader2, ArrowUpDown,
  UserPlus, FileSpreadsheet, ArrowRight
} from 'lucide-react'
import { useLang } from '@/hooks/useLang'
import { toast } from 'sonner'
import { studentsApi, schoolApi, classesApi, cyclesApi, levelsApi } from '@/services/api'
import { useAuthStore } from '@/store/authStore'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════
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
  level_name?: string
  section_name?: string
  school_name?: string
  status: string
  handicap: boolean
  social_case: boolean
  emergency_phone: string
  enrollment_type?: string
  created_at: string
  class_id?: number
  level_id?: number
  section_id?: number
  cycle_id?: number
}

interface Section { id: number; code: string; label_fr: string; label_en: string }
interface Cycle { id: number; section_id: number; code: string; label_fr: string; label_en: string; order: number }
interface Level { id: number; cycle_id: number; code: string; label_fr: string; label_en: string; order: number }
interface ClassItem { id: number; level_id: number; specialty_id: number; code: string; abbreviation: string; name: string; capacity: number; status: string }

interface FilterState {
  search: string
  section_id: string
  cycle_id: string
  level_id: string
  class_id: string
  status: string
  sex: string
  handicap: string
  social_case: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
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
    active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Actif' },
    NOUVEAU: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Nouveau' },
    INSCRIT: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Inscrit' },
    EXCLU: { bg: 'bg-red-100', text: 'text-red-700', label: 'Exclu' },
    DEMISSION: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Démission' },
    RENVOYE: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Renvoyé' },
    REINTEGRE: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Réintégré' },
    TRANSFERE: { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'Transféré' },
  }
  const s = map[status] || map[status?.toLowerCase()] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status || 'N/A' }
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', s.bg, s.text)}>
      {s.label}
    </span>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════
function exportToCSV(students: Student[], filename: string) {
  const headers = [
    'Matricule', 'Nom', 'Prénom', 'Sexe', 'Date Naissance', 'Lieu Naissance',
    'Nationalité', 'Classe', 'Niveau', 'Section', 'Téléphone Urgence',
    'Statut', 'Handicap', 'Cas Social', 'Date Inscription'
  ]
  const rows = students.map(s => [
    s.matricule,
    s.last_name,
    s.first_name,
    s.sex === 'M' ? 'Masculin' : 'Féminin',
    formatDate(s.date_of_birth),
    s.place_of_birth,
    s.nationality,
    s.class_name || '-',
    s.level_name || '-',
    s.section_name || '-',
    s.emergency_phone,
    s.status,
    s.handicap ? 'Oui' : 'Non',
    s.social_case ? 'Oui' : 'Non',
    formatDate(s.created_at)
  ])
  const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  link.click()
}

function exportToExcel(students: Student[], filename: string) {
  const headers = [
    'Matricule', 'Nom', 'Prénom', 'Sexe', 'Date Naissance', 'Lieu Naissance',
    'Nationalité', 'Classe', 'Niveau', 'Section', 'Téléphone Urgence',
    'Statut', 'Handicap', 'Cas Social', 'Date Inscription'
  ]
  const rows = students.map(s => [
    s.matricule,
    s.last_name,
    s.first_name,
    s.sex === 'M' ? 'Masculin' : 'Féminin',
    formatDate(s.date_of_birth),
    s.place_of_birth,
    s.nationality,
    s.class_name || '-',
    s.level_name || '-',
    s.section_name || '-',
    s.emergency_phone,
    s.status,
    s.handicap ? 'Oui' : 'Non',
    s.social_case ? 'Oui' : 'Non',
    formatDate(s.created_at)
  ])
  let html = '<table><thead><tr>'
  headers.forEach(h => html += `<th>${h}</th>`)
  html += '</tr></thead><tbody>'
  rows.forEach(row => {
    html += '<tr>'
    row.forEach(cell => html += `<td>${cell}</td>`)
    html += '</tr>'
  })
  html += '</tbody></table>'
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.xls`
  link.click()
}

function exportToPDF(students: Student[], filename: string) {
  const headers = [
    'Matricule', 'Nom', 'Prénom', 'Sexe', 'Date Naiss.', 'Lieu Naiss.',
    'Nationalité', 'Classe', 'Statut'
  ]
  const rows = students.map(s => [
    s.matricule,
    s.last_name,
    s.first_name,
    s.sex === 'M' ? 'M' : 'F',
    formatDate(s.date_of_birth),
    s.place_of_birth,
    s.nationality,
    s.class_name || '-',
    s.status
  ])
  const printWindow = window.open('', '_blank')
  if (!printWindow) return
  printWindow.document.write(`
    <html>
      <head>
        <title>${filename}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { text-align: center; color: #333; font-size: 18px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
          th { background-color: #059669; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .footer { text-align: center; margin-top: 20px; font-size: 10px; color: #666; }
        </style>
      </head>
      <body>
        <h1>Liste des Élèves - Lycée Bilingue de Baleng</h1>
        <table>
          <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>
            ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
        <div class="footer">Généré le ${new Date().toLocaleDateString('fr-FR')} - Total: ${students.length} élèves</div>
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.print()
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export function StudentsPage() {
  const { lang } = useLang()
  const auth = useAuthStore()
  const navigate = useNavigate()

  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(20)
  const [showFilters, setShowFilters] = useState(false)
  const [sortField, setSortField] = useState<string>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // ─── DONNÉES DE RÉFÉRENCE POUR FILTRES CASCADÉS ───
  const [sections, setSections] = useState<Section[]>([])
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [refLoading, setRefLoading] = useState(false)

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    section_id: '',
    cycle_id: '',
    level_id: '',
    class_id: '',
    status: '',
    sex: '',
    handicap: '',
    social_case: '',
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // CHARGEMENT DES DONNÉES DE RÉFÉRENCE
  // ═══════════════════════════════════════════════════════════════════════════════
  const loadRefData = useCallback(async () => {
    setRefLoading(true)
    try {
      const schoolsData = await schoolApi.getSchools()
      const schoolsList = Array.isArray(schoolsData) ? schoolsData : []
      const detectedSchool = schoolsList.find((s: any) => s.status === 'active') || schoolsList[0]

      if (detectedSchool) {
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
      console.error('Erreur chargement données de référence:', e)
    } finally {
      setRefLoading(false)
    }
  }, [])

  useEffect(() => { loadRefData() }, [loadRefData])

  // ─── FILTRAGE CASCADÉ (calculé) ───
  const filteredCycles = useMemo(() => {
    if (!filters.section_id) return []
    return cycles.filter((c: Cycle) => c.section_id === Number(filters.section_id))
  }, [cycles, filters.section_id])

  const filteredLevels = useMemo(() => {
    if (!filters.cycle_id) {
      if (!filters.section_id) return []
      return levels.filter((l: Level) => {
        const c = cycles.find((cc: Cycle) => cc.id === l.cycle_id)
        return c && c.section_id === Number(filters.section_id)
      })
    }
    return levels.filter((l: Level) => l.cycle_id === Number(filters.cycle_id))
  }, [levels, cycles, filters.cycle_id, filters.section_id])

  const filteredClasses = useMemo(() => {
    if (!filters.level_id) {
      if (!filters.cycle_id) return []
      return classes.filter((c: ClassItem) => {
        const lvl = levels.find((l: Level) => l.id === c.level_id)
        return lvl && lvl.cycle_id === Number(filters.cycle_id)
      })
    }
    return classes.filter((c: ClassItem) => c.level_id === Number(filters.level_id))
  }, [classes, levels, filters.level_id, filters.cycle_id])

  // ═══════════════════════════════════════════════════════════════════════════════
  // CHARGEMENT DES ÉLÈVES
  // ═══════════════════════════════════════════════════════════════════════════════
  const loadStudents = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = { page, per_page: perPage }
      if (filters.search) params.search = filters.search
      if (filters.class_id) params.class_id = Number(filters.class_id)
      if (filters.level_id) params.level_id = Number(filters.level_id)
      if (filters.section_id) params.section_id = Number(filters.section_id)
      if (filters.cycle_id) params.cycle_id = Number(filters.cycle_id)
      if (filters.status) params.status = filters.status
      if (filters.sex) params.sex = filters.sex
      if (filters.handicap) params.handicap = filters.handicap === 'yes'
      if (filters.social_case) params.social_case = filters.social_case === 'yes'

      const res = await studentsApi.getAll(params)
      const items = res?.items || res?.data || res || []
      setStudents(Array.isArray(items) ? items : [])
      setTotal(res?.total || items.length || 0)
    } catch (err) {
      toast.error(lang === 'fr' ? 'Erreur chargement élèves' : 'Error loading students')
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [page, perPage, filters, lang])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  // ─── FILTRES CASCADÉS: reset des niveaux inférieurs quand supérieur change ───
  const handleSectionChange = (value: string) => {
    setFilters(prev => ({ ...prev, section_id: value, cycle_id: '', level_id: '', class_id: '' }))
    setPage(1)
  }

  const handleCycleChange = (value: string) => {
    setFilters(prev => ({ ...prev, cycle_id: value, level_id: '', class_id: '' }))
    setPage(1)
  }

  const handleLevelChange = (value: string) => {
    setFilters(prev => ({ ...prev, level_id: value, class_id: '' }))
    setPage(1)
  }

  const handleClassChange = (value: string) => {
    setFilters(prev => ({ ...prev, class_id: value }))
    setPage(1)
  }

  // Filtered & sorted students (client-side)
  const filteredStudents = useMemo(() => {
    let result = [...students]
    if (sortField) {
      result.sort((a: any, b: any) => {
        const aVal = a[sortField] || ''
        const bVal = b[sortField] || ''
        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
        return 0
      })
    }
    return result
  }, [students, sortField, sortDir])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(lang === 'fr' ? 'Supprimer cet élève ?' : 'Delete this student?')) return
    try {
      await studentsApi.delete(id)
      toast.success(lang === 'fr' ? 'Élève supprimé' : 'Student deleted')
      loadStudents()
    } catch {
      toast.error(lang === 'fr' ? 'Erreur suppression' : 'Delete error')
    }
  }

  const handleExport = (type: 'csv' | 'excel' | 'pdf') => {
    const filename = `eleves_${new Date().toISOString().split('T')[0]}`
    const data = filteredStudents.length > 0 ? filteredStudents : students
    switch (type) {
      case 'csv':
        exportToCSV(data, filename)
        toast.success('Export CSV terminé')
        break
      case 'excel':
        exportToExcel(data, filename)
        toast.success('Export Excel terminé')
        break
      case 'pdf':
        exportToPDF(data, filename)
        toast.success('Export PDF lancé')
        break
    }
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-amber-50/20">
      {/* Header */}
      <div className="page-header bg-white/80 backdrop-blur-md border-b border-blue-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="page-title text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
                {lang === 'fr' ? 'Gestion des élèves' : 'Student Management'}
              </h1>
              <p className="page-subtitle text-sm text-gray-500 mt-0.5">
                {total} {lang === 'fr' ? 'élèves enregistrés' : 'students registered'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Export Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                title="Export CSV"
              >
                <FileText className="w-4 h-4 text-green-600" />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                title="Export Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Excel</span>
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                title="Export PDF"
              >
                <FileDown className="w-4 h-4 text-red-600" />
                <span className="hidden sm:inline">PDF</span>
              </button>
            </div>

            <div className="w-px h-8 bg-gray-200" />

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => { setFilters(prev => ({ ...prev, search: e.target.value })); setPage(1) }}
                placeholder={lang === 'fr' ? 'Rechercher...' : 'Search...'}
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 w-48 lg:w-64"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border',
                showFilters
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              )}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">{lang === 'fr' ? 'Filtres avancés' : 'Advanced Filters'}</span>
            </button>

            {/* New Student */}
            <button
              onClick={() => navigate('/students/create')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md shadow-blue-200"
            >
              <UserPlus className="w-4 h-4" />
              {lang === 'fr' ? 'Nouvel élève' : 'New Student'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* ═══════════════════════════════════════════════════════════════════════════════
            FILTRES CASCADÉS PRINCIPAUX: Section → Cycle → Niveau → Classe
        ═══════════════════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              {lang === 'fr' ? 'Filtrer par structure académique' : 'Filter by academic structure'}
            </h3>
            <button
              onClick={() => {
                setFilters({ search: '', section_id: '', cycle_id: '', level_id: '', class_id: '', status: '', sex: '', handicap: '', social_case: '' })
                setPage(1)
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              {lang === 'fr' ? 'Réinitialiser les filtres' : 'Reset filters'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Section */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                <School className="w-3.5 h-3.5 inline mr-1 text-blue-500" />
                {lang === 'fr' ? 'Section' : 'Section'} <span className="text-red-400">*</span>
              </label>
              <select
                value={filters.section_id}
                onChange={(e) => handleSectionChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              >
                <option value="">{lang === 'fr' ? 'Toutes les sections' : 'All sections'}</option>
                {sections.map((s: Section) => (
                  <option key={s.id} value={s.id}>
                    {lang === 'fr' ? s.label_fr : s.label_en} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Cycle */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                <GraduationCap className="w-3.5 h-3.5 inline mr-1 text-purple-500" />
                {lang === 'fr' ? 'Cycle' : 'Cycle'}
              </label>
              <select
                value={filters.cycle_id}
                onChange={(e) => handleCycleChange(e.target.value)}
                disabled={!filters.section_id || filteredCycles.length === 0}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400',
                  (!filters.section_id || filteredCycles.length === 0)
                    ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white border-gray-200'
                )}
              >
                <option value="">{lang === 'fr' ? 'Tous les cycles' : 'All cycles'}</option>
                {filteredCycles.map((c: Cycle) => (
                  <option key={c.id} value={c.id}>
                    {lang === 'fr' ? c.label_fr : c.label_en}
                  </option>
                ))}
              </select>
            </div>

            {/* Niveau / Level */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 inline mr-1 text-amber-500" />
                {lang === 'fr' ? 'Niveau' : 'Level'}
              </label>
              <select
                value={filters.level_id}
                onChange={(e) => handleLevelChange(e.target.value)}
                disabled={!filters.cycle_id || filteredLevels.length === 0}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400',
                  (!filters.cycle_id || filteredLevels.length === 0)
                    ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white border-gray-200'
                )}
              >
                <option value="">{lang === 'fr' ? 'Tous les niveaux' : 'All levels'}</option>
                {filteredLevels.map((l: Level) => (
                  <option key={l.id} value={l.id}>
                    {lang === 'fr' ? l.label_fr : l.label_en}
                  </option>
                ))}
              </select>
            </div>

            {/* Classe / Class */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                <Users className="w-3.5 h-3.5 inline mr-1 text-emerald-500" />
                {lang === 'fr' ? 'Classe' : 'Class'}
              </label>
              <select
                value={filters.class_id}
                onChange={(e) => handleClassChange(e.target.value)}
                disabled={!filters.level_id || filteredClasses.length === 0}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400',
                  (!filters.level_id || filteredClasses.length === 0)
                    ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-white border-gray-200'
                )}
              >
                <option value="">{lang === 'fr' ? 'Toutes les classes' : 'All classes'}</option>
                {filteredClasses.map((c: ClassItem) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.abbreviation})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Indicateur de filtre actif */}
          {(filters.section_id || filters.cycle_id || filters.level_id || filters.class_id) && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500">{lang === 'fr' ? 'Filtres actifs:' : 'Active filters:'}</span>
              {filters.section_id && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                  {lang === 'fr' ? 'Section' : 'Section'}: {sections.find(s => s.id === Number(filters.section_id))?.label_fr}
                  <button onClick={() => handleSectionChange('')} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
                </span>
              )}
              {filters.cycle_id && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                  {lang === 'fr' ? 'Cycle' : 'Cycle'}: {filteredCycles.find(c => c.id === Number(filters.cycle_id))?.label_fr}
                  <button onClick={() => handleCycleChange('')} className="hover:text-purple-900"><X className="w-3 h-3" /></button>
                </span>
              )}
              {filters.level_id && (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1">
                  {lang === 'fr' ? 'Niveau' : 'Level'}: {filteredLevels.find(l => l.id === Number(filters.level_id))?.label_fr}
                  <button onClick={() => handleLevelChange('')} className="hover:text-amber-900"><X className="w-3 h-3" /></button>
                </span>
              )}
              {filters.class_id && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium flex items-center gap-1">
                  {lang === 'fr' ? 'Classe' : 'Class'}: {filteredClasses.find(c => c.id === Number(filters.class_id))?.name}
                  <button onClick={() => handleClassChange('')} className="hover:text-emerald-900"><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════════════
            FILTRES AVANCÉS (collapsible)
        ═══════════════════════════════════════════════════════════════════════════════ */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Filter className="w-4 h-4" />
                {lang === 'fr' ? 'Filtres avancés' : 'Advanced Filters'}
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{lang === 'fr' ? 'Statut' : 'Status'}</label>
                <select
                  value={filters.status}
                  onChange={(e) => { setFilters(prev => ({ ...prev, status: e.target.value })); setPage(1) }}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">{lang === 'fr' ? 'Tous' : 'All'}</option>
                  <option value="nouveau">Nouveau</option>
                  <option value="inscrit">Inscrit</option>
                  <option value="exclu">Exclu</option>
                  <option value="demission">Démission</option>
                  <option value="renvoye">Renvoyé</option>
                  <option value="reintegre">Réintégré</option>
                  <option value="transfere">Transféré</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{lang === 'fr' ? 'Sexe' : 'Sex'}</label>
                <select
                  value={filters.sex}
                  onChange={(e) => { setFilters(prev => ({ ...prev, sex: e.target.value })); setPage(1) }}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">{lang === 'fr' ? 'Tous' : 'All'}</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{lang === 'fr' ? 'Handicap' : 'Disability'}</label>
                <select
                  value={filters.handicap}
                  onChange={(e) => { setFilters(prev => ({ ...prev, handicap: e.target.value })); setPage(1) }}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">{lang === 'fr' ? 'Tous' : 'All'}</option>
                  <option value="yes">Oui</option>
                  <option value="no">Non</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">{lang === 'fr' ? 'Cas social' : 'Social Case'}</label>
                <select
                  value={filters.social_case}
                  onChange={(e) => { setFilters(prev => ({ ...prev, social_case: e.target.value })); setPage(1) }}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">{lang === 'fr' ? 'Tous' : 'All'}</option>
                  <option value="yes">Oui</option>
                  <option value="no">Non</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{total}</p>
              <p className="text-xs text-gray-500">{lang === 'fr' ? 'Total élèves' : 'Total students'}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {students.filter(s => ['NOUVEAU', 'INSCRIT', 'active'].includes(s.status)).length}
              </p>
              <p className="text-xs text-gray-500">{lang === 'fr' ? 'Actifs' : 'Active'}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {students.filter(s => s.handicap).length}
              </p>
              <p className="text-xs text-gray-500">{lang === 'fr' ? 'Handicap' : 'Disability'}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {students.filter(s => s.social_case).length}
              </p>
              <p className="text-xs text-gray-500">{lang === 'fr' ? 'Cas sociaux' : 'Social cases'}</p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <button onClick={() => handleSort('matricule')} className="flex items-center gap-1 hover:text-gray-700">
                      {lang === 'fr' ? 'Matricule' : 'Reg. No.'}
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <button onClick={() => handleSort('last_name')} className="flex items-center gap-1 hover:text-gray-700">
                      {lang === 'fr' ? 'Nom & Prénom' : 'Name'}
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    {lang === 'fr' ? 'Classe' : 'Class'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    {lang === 'fr' ? 'Naissance' : 'Birth'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    {lang === 'fr' ? 'Contact' : 'Contact'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {lang === 'fr' ? 'Statut' : 'Status'}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {lang === 'fr' ? 'Actions' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                      <p className="text-sm text-gray-500 mt-2">{lang === 'fr' ? 'Chargement...' : 'Loading...'}</p>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">
                        {lang === 'fr' ? 'Aucun élève trouvé' : 'No students found'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {student.matricule}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {student.first_name[0]}{student.last_name[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{student.last_name} {student.first_name}</p>
                            <p className="text-xs text-gray-500">
                              {student.sex === 'M' ? '♂' : '♀'} · {student.nationality}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-1 text-gray-600">
                          <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                          <span>{student.class_name || '-'}</span>
                        </div>
                        {student.level_name && (
                          <p className="text-xs text-gray-400 mt-0.5">{student.level_name}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="text-gray-600">
                          <p className="text-xs">{formatDate(student.date_of_birth)}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{student.place_of_birth}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex items-center gap-1 text-gray-600 text-xs">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          {student.emergency_phone || '-'}
                        </div>
                        {student.handicap && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 mt-1">
                            <AlertCircle className="w-3 h-3" />Handicap
                          </span>
                        )}
                        {student.social_case && (
                          <span className="inline-flex items-center gap-1 text-xs text-purple-600 mt-1">
                            <HeartPulse className="w-3 h-3" />Cas social
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(student.status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => toast.info(`${student.first_name} ${student.last_name}`)}
                            className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                            title="Voir"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/students/edit/${student.id}`)}
                            className="p-1.5 hover:bg-amber-50 rounded-lg text-gray-400 hover:text-amber-600 transition-colors"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {lang === 'fr' ? `Affichage ${(page - 1) * perPage + 1} - ${Math.min(page * perPage, total)} sur ${total}` : `Showing ${(page - 1) * perPage + 1} - ${Math.min(page * perPage, total)} of ${total}`}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600 min-w-[3rem] text-center">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Icon component for social case
function HeartPulse(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      <path d="M3.22 12H9.5l.5-1 2 4.5 2-3 1.5 2h3.72" />
    </svg>
  )
}

export default StudentsPage