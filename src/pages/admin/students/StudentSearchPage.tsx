import { useState } from 'react'
import { Search, Users, GraduationCap, Calendar, Hash, ArrowRight, Loader2, X, School, Phone, MapPin, User, ChevronRight, AlertCircle } from 'lucide-react'
import { useLang } from '@/hooks/useLang'
import { toast } from 'sonner'
import { studentsApi } from '@/services/api'

interface Student {
  id: number
  matricule: string
  first_name: string
  last_name: string
  sex: string
  date_of_birth: string
  place_of_birth: string
  nationality: string
  father_name?: string
  mother_name?: string
  emergency_phone?: string
  birth_certificate_ref?: string
  civil_status_center?: string
  birth_certificate_issuer?: string
  handicap: boolean
  social_case: boolean
  status: string
  class_name?: string
  school_name?: string
  photo_url?: string
}

type SearchMode = 'matricule' | 'name'

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
    active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Actif' },
    nouveau: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Nouveau' },
    inscrit: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Inscrit' },
  }
  const s = map[status] || map[status?.toUpperCase()] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status || 'N/A' }
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', s.bg, s.text)}>
      {s.label}
    </span>
  )
}

export default function StudentSearchPage() {
  const { lang } = useLang()
  const [searchMode, setSearchMode] = useState<SearchMode>('matricule')
  const [matricule, setMatricule] = useState('')
  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = async () => {
    setLoading(true)
    setSearched(true)
    setResults([])
    setSelectedStudent(null)
    try {
      let params: Record<string, any> = {}
      if (searchMode === 'matricule') {
        if (!matricule.trim()) {
          toast.error(lang === 'fr' ? 'Veuillez entrer un matricule' : 'Please enter a registration number')
          setLoading(false)
          return
        }
        params.matricule = matricule.trim()
      } else {
        if (!lastName.trim() && !firstName.trim()) {
          toast.error(lang === 'fr' ? 'Veuillez entrer au moins un nom ou prénom' : 'Please enter at least a name')
          setLoading(false)
          return
        }
        if (lastName.trim()) params.last_name = lastName.trim()
        if (firstName.trim()) params.first_name = firstName.trim()
        if (dateOfBirth) params.date_of_birth = dateOfBirth
      }

      const res = await studentsApi.getAll(params)
      const items = res?.items || res?.data || res || []
      const students = Array.isArray(items) ? items : []

      if (students.length === 0) {
        toast.error(lang === 'fr' ? 'Aucun élève trouvé' : 'No student found')
      } else {
        setResults(students)
        toast.success(`${students.length} ${lang === 'fr' ? 'élève(s) trouvé(s)' : 'student(s) found'}`)
        // Auto-select first result for matricule search
        if (searchMode === 'matricule' && students.length === 1) {
          setSelectedStudent(students[0])
        }
      }
    } catch (err) {
      toast.error(lang === 'fr' ? 'Erreur de recherche' : 'Search error')
    } finally {
      setLoading(false)
    }
  }

  const resetSearch = () => {
    setMatricule('')
    setLastName('')
    setFirstName('')
    setDateOfBirth('')
    setResults([])
    setSelectedStudent(null)
    setSearched(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-amber-50/10">
      {/* Header */}
      <div className="page-header bg-white/80 backdrop-blur-md border-b border-blue-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Search className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="page-title text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
              {lang === 'fr' ? "Recherche d'élève" : 'Student Search'}
            </h1>
            <p className="page-subtitle text-sm text-gray-500 mt-0.5">
              {lang === 'fr' ? 'Rechercher un élève par matricule ou par nom' : 'Search a student by ID or name'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* ─── CARD DE RECHERCHE ─── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-blue-100">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              {lang === 'fr' ? 'Critères de recherche' : 'Search Criteria'}
            </h2>
          </div>

          <div className="p-6 space-y-5">
            {/* Mode de recherche */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === 'fr' ? 'Rechercher par' : 'Search by'}
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => { setSearchMode('matricule'); resetSearch() }}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border',
                    searchMode === 'matricule'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <Hash className="w-4 h-4" />
                  {lang === 'fr' ? 'Matricule' : 'Reg. Number'}
                </button>
                <button
                  onClick={() => { setSearchMode('name'); resetSearch() }}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border',
                    searchMode === 'name'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  )}
                >
                  <User className="w-4 h-4" />
                  {lang === 'fr' ? "Nom de l'apprenant" : 'Student Name'}
                </button>
              </div>
            </div>

            {/* ─── Champs Matricule ─── */}
            {searchMode === 'matricule' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Hash className="w-4 h-4 inline mr-1 text-blue-500" />
                  {lang === 'fr' ? "Matricule de l'élève" : 'Student Reg. Number'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={matricule}
                    onChange={(e) => setMatricule(e.target.value)}
                    placeholder={lang === 'fr' ? 'Ex: 2025-001' : 'Ex: 2025-001'}
                    className="w-full pl-4 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
              </div>
            )}

            {/* ─── Champs Nom ─── */}
            {searchMode === 'name' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <User className="w-4 h-4 inline mr-1 text-blue-500" />
                    {lang === 'fr' ? "Nom de l'élève" : 'Last Name'}
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={lang === 'fr' ? 'Ex: KIBINDE' : 'Ex: Smith'}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <User className="w-4 h-4 inline mr-1 text-blue-500" />
                    {lang === 'fr' ? "Prénom de l'élève" : 'First Name'}
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={lang === 'fr' ? 'Ex: Franck Landry' : 'Ex: John'}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Calendar className="w-4 h-4 inline mr-1 text-blue-500" />
                    {lang === 'fr' ? 'Date de naissance (optionnel)' : 'Date of birth (optional)'}
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>
              </div>
            )}

            {/* Boutons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSearch}
                disabled={loading}
                className={cn(
                  'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md',
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-blue-200'
                )}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{lang === 'fr' ? 'Recherche...' : 'Searching...'}</>
                ) : (
                  <><Search className="w-4 h-4" />{lang === 'fr' ? 'Rechercher' : 'Search'}</>
                )}
              </button>
              <button
                onClick={resetSearch}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
              >
                <X className="w-4 h-4" />
                {lang === 'fr' ? 'Réinitialiser' : 'Reset'}
              </button>
            </div>
          </div>
        </div>

        {/* ─── LISTE DES RÉSULTATS ─── */}
        {searched && !loading && results.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">
              {lang === 'fr' ? 'Aucun résultat trouvé' : 'No results found'}
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-blue-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                {results.length} {lang === 'fr' ? 'résultat(s)' : 'result(s)'}
              </h3>
              <span className="text-xs text-blue-600">
                {lang === 'fr' ? 'Cliquez sur un élève pour voir les détails' : 'Click a student to see details'}
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {results.map((student) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 text-left transition-all hover:bg-blue-50/50',
                    selectedStudent?.id === student.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'
                  )}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {student.first_name[0]}{student.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">
                        {student.last_name} {student.first_name}
                      </p>
                      {getStatusBadge(student.status)}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                      <span className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{student.matricule}</span>
                      <span>{student.sex === 'M' ? '♂' : '♀'} · {formatDate(student.date_of_birth)}</span>
                      <span>· {student.place_of_birth}</span>
                      {student.class_name && <span>· <GraduationCap className="w-3 h-3 inline" /> {student.class_name}</span>}
                    </div>
                  </div>
                  <ChevronRight className={cn(
                    'w-5 h-5 shrink-0 transition-colors',
                    selectedStudent?.id === student.id ? 'text-blue-600' : 'text-gray-300'
                  )} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── DÉTAILS DE L'ÉLÈVE SÉLECTIONNÉ ─── */}
        {selectedStudent && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  {lang === 'fr' ? "Détails de l'élève" : 'Student Details'}
                </h2>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-1.5 hover:bg-white/50 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Identité */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-200">
                  {selectedStudent.first_name[0]}{selectedStudent.last_name[0]}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedStudent.last_name} {selectedStudent.first_name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {selectedStudent.sex === 'M' ? '♂ Masculin' : '♀ Féminin'} · {selectedStudent.nationality}
                  </p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="font-mono text-sm font-medium text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg">
                      {selectedStudent.matricule}
                    </span>
                    {getStatusBadge(selectedStudent.status)}
                    {selectedStudent.handicap && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                        Handicap
                      </span>
                    )}
                    {selectedStudent.social_case && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        Cas social
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Grille d'infos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" />
                    {lang === 'fr' ? 'Identité' : 'Identity'}
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{lang === 'fr' ? 'Date de naissance' : 'Date of birth'}</span>
                      <span className="text-sm font-medium text-gray-900">{formatDate(selectedStudent.date_of_birth)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{lang === 'fr' ? 'Lieu' : 'Place'}</span>
                      <span className="text-sm font-medium text-gray-900">{selectedStudent.place_of_birth}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{lang === 'fr' ? 'Réf. acte de naissance' : 'Birth cert. ref'}</span>
                      <span className="text-sm font-medium text-gray-900">{selectedStudent.birth_certificate_ref || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{lang === 'fr' ? "Centre d'état civil" : 'Civil status center'}</span>
                      <span className="text-sm font-medium text-gray-900">{selectedStudent.civil_status_center || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    {lang === 'fr' ? 'Parents / Tuteurs' : 'Parents / Guardians'}
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{lang === 'fr' ? 'Nom du père' : 'Father'}</span>
                      <span className="text-sm font-medium text-gray-900">{selectedStudent.father_name || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{lang === 'fr' ? 'Nom de la mère' : 'Mother'}</span>
                      <span className="text-sm font-medium text-gray-900">{selectedStudent.mother_name || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{lang === 'fr' ? 'Tél. urgence' : 'Emergency phone'}</span>
                      <span className="text-sm font-medium text-gray-900">{selectedStudent.emergency_phone || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <School className="w-4 h-4 text-blue-500" />
                    {lang === 'fr' ? 'Scolarité' : 'Schooling'}
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" />{lang === 'fr' ? 'Classe' : 'Class'}</span>
                      <span className="text-sm font-medium text-gray-900">{selectedStudent.class_name || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{lang === 'fr' ? 'Établissement' : 'School'}</span>
                      <span className="text-sm font-medium text-gray-900">{selectedStudent.school_name || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-500" />
                    {lang === 'fr' ? 'Informations complémentaires' : 'Additional info'}
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{lang === 'fr' ? 'Handicap' : 'Disability'}</span>
                      <span className={cn('text-sm font-medium', selectedStudent.handicap ? 'text-amber-600' : 'text-gray-900')}>
                        {selectedStudent.handicap ? 'Oui' : 'Non'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{lang === 'fr' ? 'Cas social' : 'Social case'}</span>
                      <span className={cn('text-sm font-medium', selectedStudent.social_case ? 'text-purple-600' : 'text-gray-900')}>
                        {selectedStudent.social_case ? 'Oui' : 'Non'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}