import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ArrowLeftRight, ArrowRightLeft, Users, Search, Check, X, Loader2,
  GraduationCap, School, Calendar, ChevronRight, ChevronLeft, Save,
  AlertCircle, CheckCircle2, RotateCcw, Landmark, Building2, ArrowRight
} from 'lucide-react'
import { useLang } from '@/hooks/useLang'
import { toast } from 'sonner'
import { studentsApi, schoolApi, classesApi, apiService } from '@/services/api'
import { useAuthStore } from '@/store/authStore'

interface Student {
  id: number
  matricule: string
  first_name: string
  last_name: string
  sex: string
  date_of_birth: string
  place_of_birth: string
  class_name?: string
  class_id?: number
  school_name?: string
  status: string
  emergency_phone?: string
  selected?: boolean
}

interface ClassItem {
  id: number
  name: string
  abbreviation: string
  level_id: number
  academic_year_id: number
}

interface AcademicYear {
  id: number
  school_id: number
  label: string
  start_date: string
  end_date: string
  is_current: boolean
  status: string
}

interface SchoolItem {
  id: number
  name: string
  acronym: string
  city: string
  status: string
}

type TabType = 'transfer' | 'resign' | 'reintegrate'

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR')
}

export default function StudentTransferredPage() {
  const { lang } = useLang()
  const auth = useAuthStore()
  const userSchoolId = auth.user?.school_id ?? null

  const [activeTab, setActiveTab] = useState<TabType>('transfer')
  const [schools, setSchools] = useState<SchoolItem[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingRef, setLoadingRef] = useState(true)

  // ─── Filtres ───
  const [selectedYearId, setSelectedYearId] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set())

  // ─── Transfert ───
  const [targetYearId, setTargetYearId] = useState('')
  const [targetClassId, setTargetClassId] = useState('')
  const [transferReason, setTransferReason] = useState('')

  // ✅ ÉTATS POUR LE MODAL DE CONFIRMATION
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean
    title: string
    message: string
    type: 'transfer' | 'resign' | 'reintegrate'
    onConfirm: () => void
  }>({ open: false, title: '', message: '', type: 'transfer', onConfirm: () => {} })

  const detectedSchool = schools.find(s => s.id === userSchoolId)
  const filteredClasses = selectedYearId
    ? classes.filter(c => c.academic_year_id === Number(selectedYearId))
    : []
  const targetClasses = targetYearId
    ? classes.filter(c => c.academic_year_id === Number(targetYearId))
    : []

  // ─── CHARGEMENT DONNÉES DE RÉFÉRENCE ───
  const loadRefData = useCallback(async () => {
    setLoadingRef(true)
    try {
      const [sch, years, cls] = await Promise.all([
        schoolApi.getSchools(),
        schoolApi.getAcademicYears(userSchoolId || 1),
        classesApi.getAll()
      ])
      setSchools(Array.isArray(sch) ? sch : [])
      setAcademicYears(Array.isArray(years) ? years : [])
      setClasses(Array.isArray(cls) ? cls : [])
    } catch (e) { console.error(e) }
    finally { setLoadingRef(false) }
  }, [userSchoolId])

  useEffect(() => { loadRefData() }, [loadRefData])

  // ─── CHARGEMENT ÉLÈVES ───
  // ✅ CORRIGÉ: Logique par onglet + filtrage côté client
  const loadStudents = useCallback(async () => {
    if (!selectedClassId) { setStudents([]); return }
    setLoading(true)
    try {
      // ⚠️ Ne PAS filtrer par status côté backend (valeurs incohérentes INSCRIT/inscrit)
      // On récupère TOUS les élèves de la classe et on filtre côté client
      const params: any = { class_id: Number(selectedClassId), per_page: 100 }

      const res = await studentsApi.getAll(params as any)
      const items = res?.items || res?.data || res || []
      let list = Array.isArray(items) ? items : []

      // ✅ FILTRAGE CÔTÉ CLIENT selon l'onglet actif
      if (activeTab === 'transfer') {
        // Transfert: élèves actifs/inscrits
        list = list.filter((s: Student) => {
          const st = (s.status || '').toString().toLowerCase()
          return st === 'inscrit' || st === 'active' || st === 'inscrit'
        })
      }
      if (activeTab === 'resign') {
        // Démission: élèves actifs/inscrits (qu'on va passer en démission)
        list = list.filter((s: Student) => {
          const st = (s.status || '').toString().toLowerCase()
          return st === 'inscrit' || st === 'active' || st === 'inscrit'
        })
      }
      if (activeTab === 'reintegrate') {
        // Réintégration: élèves démissionnaires
        list = list.filter((s: Student) => {
          const st = (s.status || '').toString().toLowerCase()
          return st === 'demission' || st === 'demissionnaire' || st === 'resigned'
        })
      }

      setStudents(list.map((s: Student) => ({ ...s, selected: false })))
      setSelectedStudents(new Set())
    } catch (err) {
      toast.error(lang === 'fr' ? 'Erreur chargement élèves' : 'Error loading students')
    } finally { setLoading(false) }
  }, [selectedClassId, activeTab, lang])

  // ✅ CORRIGÉ: useEffect avec dépendances explicites, pas de boucle infinie
  useEffect(() => {
    loadStudents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, activeTab])

  // ─── RECHERCHE TEMPS RÉEL ───
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const originalStudents = useRef<Student[]>([])

  useEffect(() => {
    // Sauvegarder la liste originale quand elle change
    if (students.length > 0 && originalStudents.current.length === 0) {
      originalStudents.current = students
    }
  }, [students])

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      if (!searchQuery.trim()) {
        // Recharger depuis le serveur si la recherche est vide
        if (selectedClassId) loadStudents()
        return
      }
      // Filtrer côté client
      const baseList = originalStudents.current.length > 0 ? originalStudents.current : students
      const filtered = baseList.filter(s =>
        s.matricule.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.first_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setStudents(filtered)
    }, 300)
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  // ─── SÉLECTION ───
  const toggleStudent = (id: number) => {
    const next = new Set(selectedStudents)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedStudents(next)
  }

  const toggleAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)))
    }
  }

  // ─── TRANSFERT DE CLASSE ───
  // ✅ CORRIGÉ: Utilise POST /students/{id}/transfer avec les champs exacts du schéma ClassHistoryCreate
  const executeTransfer = async () => {
    setConfirmModal(prev => ({ ...prev, open: false }))
    try {
      let success = 0
      let failed = 0
      const academicYearId = targetYearId ? Number(targetYearId) : (selectedYearId ? Number(selectedYearId) : 1)

      for (const studentId of Array.from(selectedStudents)) {
        const student = students.find(s => s.id === studentId)
        if (!student) { failed++; continue }

        const transferData = {
          student_id: Number(studentId),
          from_class_id: Number(selectedClassId),
          to_class_id: Number(targetClassId),
          academic_year_id: academicYearId,
          transfer_date: new Date().toISOString().split('T')[0],
          transfer_type: 'manual',
          reason: transferReason || 'Transfert de classe',
        }

        console.log(`[TRANSFERT] POST /students/${studentId}/transfer`, JSON.stringify(transferData, null, 2))

        try {
          const response = await studentsApi.transfer(studentId, transferData)
          console.log(`[TRANSFERT] Réponse OK élève ${studentId}:`, response)
          success++
        } catch (e: any) {
          console.error(`[TRANSFERT] Échec élève ${studentId}:`, e?.response?.data || e?.message || e)
          const errorData = e?.response?.data
          let errorMsg = 'Erreur inconnue'
          if (errorData?.errors && Array.isArray(errorData.errors)) {
            errorMsg = errorData.errors.map((err: any) => `${err.field}: ${err.message}`).join(', ')
          } else if (errorData?.detail) {
            errorMsg = errorData.detail
          } else if (e?.message) {
            errorMsg = e.message
          }
          toast.error(`${lang === 'fr' ? 'Échec transfert' : 'Transfer failed'} #${studentId}: ${errorMsg}`)
          failed++
        }
      }

      if (failed > 0) {
        toast.warning(`${success} ${lang === 'fr' ? 'transfert(s) effectué(s)' : 'transfer(s) done'}, ${failed} ${lang === 'fr' ? 'échec(s)' : 'failed'}`)
      } else {
        toast.success(lang === 'fr' ? 'Transfert effectué avec succès' : 'Transfer completed successfully')
      }

      setTimeout(() => {
        setSelectedStudents(new Set())
        loadStudents()
      }, 800)
    } catch (err) {
      toast.error(lang === 'fr' ? 'Erreur transfert' : 'Transfer error')
    }
  }

  const handleTransfer = () => {
    if (selectedStudents.size === 0) {
      toast.error(lang === 'fr' ? 'Sélectionnez au moins un élève' : 'Select at least one student')
      return
    }
    if (!targetClassId) {
      toast.error(lang === 'fr' ? 'Sélectionnez la classe de destination' : 'Select target class')
      return
    }
    const targetClass = targetClasses.find(c => c.id === Number(targetClassId))
    setConfirmModal({
      open: true,
      type: 'transfer',
      title: lang === 'fr' ? 'Confirmer le transfert' : 'Confirm Transfer',
      message: lang === 'fr'
        ? `Transférer ${selectedStudents.size} élève(s) vers « ${targetClass?.name || 'la classe sélectionnée'} » ?`
        : `Transfer ${selectedStudents.size} student(s) to "${targetClass?.name || 'selected class'}"?`,
      onConfirm: executeTransfer
    })
  }

  // ─── DÉMISSION EN MASSE ───
  // ✅ CORRIGÉ: Démission = UPDATE status → 'demission' via JSON (pas FormData)
  const executeResign = async () => {
    setConfirmModal(prev => ({ ...prev, open: false }))
    try {
      let success = 0
      let failed = 0
      for (const studentId of Array.from(selectedStudents)) {
        try {
          const fullStudent = await studentsApi.getById(studentId)
          if (!fullStudent) { failed++; continue }
          const updateData = {
            ...fullStudent,
            status: 'demission',
            resignation_date: new Date().toISOString().split('T')[0]
          }
          await apiService.put(`/students/${studentId}`, updateData)
          success++
        } catch (e: any) {
          console.error(`[DEMISSION] Erreur élève ${studentId}:`, e?.response?.data || e?.message || e)
          failed++
        }
      }
      if (failed > 0) {
        toast.warning(`${success} ${lang === 'fr' ? 'démission(s) effectuée(s)' : 'resignation(s) done'}, ${failed} ${lang === 'fr' ? 'échec(s)' : 'failed'}`)
      } else {
        toast.success(lang === 'fr' ? 'Démission effectuée avec succès' : 'Resignation completed successfully')
      }
      setSelectedStudents(new Set())
      loadStudents()
    } catch (err) {
      toast.error(lang === 'fr' ? 'Erreur démission' : 'Resignation error')
    }
  }

  const handleResign = () => {
    if (selectedStudents.size === 0) {
      toast.error(lang === 'fr' ? 'Sélectionnez au moins un élève' : 'Select at least one student')
      return
    }
    setConfirmModal({
      open: true,
      type: 'resign',
      title: lang === 'fr' ? 'Confirmer la démission' : 'Confirm Resignation',
      message: lang === 'fr'
        ? `Marquer ${selectedStudents.size} élève(s) comme démissionnaire(s) ? Cette action est irréversible.`
        : `Mark ${selectedStudents.size} student(s) as resigned? This action is irreversible.`,
      onConfirm: executeResign
    })
  }

  // ─── RÉINTÉGRATION EN MASSE ───
  // ✅ CORRIGÉ: Réintégration = UPDATE status → 'inscrit' via JSON (pas FormData)
  const executeReintegrate = async () => {
    setConfirmModal(prev => ({ ...prev, open: false }))
    try {
      let success = 0
      let failed = 0
      for (const studentId of Array.from(selectedStudents)) {
        try {
          const fullStudent = await studentsApi.getById(studentId)
          if (!fullStudent) { failed++; continue }
          const updateData = {
            ...fullStudent,
            status: 'inscrit',
            reintegration_date: new Date().toISOString().split('T')[0]
          }
          await apiService.put(`/students/${studentId}`, updateData)
          success++
        } catch (e: any) {
          console.error(`[REINTEGRATION] Erreur élève ${studentId}:`, e?.response?.data || e?.message || e)
          failed++
        }
      }
      if (failed > 0) {
        toast.warning(`${success} ${lang === 'fr' ? 'réintégration(s) effectuée(s)' : 'reintegration(s) done'}, ${failed} ${lang === 'fr' ? 'échec(s)' : 'failed'}`)
      } else {
        toast.success(lang === 'fr' ? 'Réintégration effectuée avec succès' : 'Reintegration completed successfully')
      }
      setSelectedStudents(new Set())
      loadStudents()
    } catch (err) {
      toast.error(lang === 'fr' ? 'Erreur réintégration' : 'Reintegration error')
    }
  }

  const handleReintegrate = () => {
    if (selectedStudents.size === 0) {
      toast.error(lang === 'fr' ? 'Sélectionnez au moins un élève' : 'Select at least one student')
      return
    }
    setConfirmModal({
      open: true,
      type: 'reintegrate',
      title: lang === 'fr' ? 'Confirmer la réintégration' : 'Confirm Reintegration',
      message: lang === 'fr'
        ? `Réintégrer ${selectedStudents.size} élève(s) dans la classe ? Leur statut redeviendra « Inscrit ».`
        : `Reintegrate ${selectedStudents.size} student(s) into the class? Their status will return to "Enrolled".`,
      onConfirm: executeReintegrate
    })
  }

  const resetAll = () => {
    setSelectedYearId('')
    setSelectedClassId('')
    setSearchQuery('')
    setSelectedStudents(new Set())
    setTargetYearId('')
    setTargetClassId('')
    setTransferReason('')
    setStudents([])
  }

  if (loadingRef) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-amber-50/10">
      {/* ═══════════════════════ HEADER ═══════════════════════ */}
      <div className="page-header bg-white/80 backdrop-blur-md border-b border-blue-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <ArrowLeftRight className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="page-title text-2xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                {lang === 'fr' ? 'Gestion des élèves' : 'Student Management'}
              </h1>
              <p className="page-subtitle text-sm text-gray-500 mt-0.5">
                {lang === 'fr' ? 'Transferts, démissions et réintégrations' : 'Transfers, resignations and reintegrations'}
              </p>
            </div>
          </div>
          <button onClick={resetAll} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all border border-gray-200">
            <RotateCcw className="w-4 h-4" />
            {lang === 'fr' ? 'Réinitialiser' : 'Reset'}
          </button>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* ═══════════════════════ TABS ═══════════════════════ */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-1 flex gap-1">
          {[
            { key: 'transfer', label: lang === 'fr' ? 'Changement de classe' : 'Class Change', icon: ArrowLeftRight },
            { key: 'resign', label: lang === 'fr' ? 'Démission' : 'Resignation', icon: ArrowRightLeft },
            { key: 'reintegrate', label: lang === 'fr' ? 'Réintégration' : 'Reintegration', icon: CheckCircle2 }
          ].map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key as TabType); resetAll() }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-200'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* ═══════════════════════ FILTRES ═══════════════════════ */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
          {/* Établissement (auto-détecté) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                <Landmark className="w-3.5 h-3.5 inline mr-1 text-blue-500" />
                {lang === 'fr' ? 'Établissement' : 'School'}
              </label>
              <input
                type="text"
                value={detectedSchool ? `${detectedSchool.name}` : (lang === 'fr' ? 'Non détecté' : 'Not detected')}
                disabled
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 font-medium cursor-not-allowed"
              />
            </div>

            {/* Année scolaire */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                <Calendar className="w-3.5 h-3.5 inline mr-1 text-blue-500" />
                {lang === 'fr' ? 'Année scolaire' : 'Academic Year'} <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedYearId}
                onChange={(e) => { setSelectedYearId(e.target.value); setSelectedClassId('') }}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              >
                <option value="">{lang === 'fr' ? 'Sélectionner...' : 'Select...'}</option>
                {academicYears.map(y => (
                  <option key={y.id} value={y.id}>{y.label} {y.is_current ? (lang === 'fr' ? ' (Courante)' : ' (Current)') : ''}</option>
                ))}
              </select>
            </div>

            {/* Classe */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                <Building2 className="w-3.5 h-3.5 inline mr-1 text-blue-500" />
                {lang === 'fr' ? 'Classe actuelle' : 'Current Class'} <span className="text-red-400">*</span>
              </label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                disabled={!selectedYearId || filteredClasses.length === 0}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400',
                  (!selectedYearId || filteredClasses.length === 0) ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-200'
                )}
              >
                <option value="">{lang === 'fr' ? 'Sélectionner...' : 'Select...'}</option>
                {filteredClasses.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.abbreviation})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'fr' ? 'Rechercher par matricule, nom ou prénom...' : 'Search by reg. number, name or first name...'}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
        </div>

        {/* ═══════════════════════ TABLEAU ═══════════════════════ */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedStudents.size > 0 && selectedStudents.size === students.length}
                onChange={toggleAll}
                className="w-4 h-4 text-blue-600 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">
                {selectedStudents.size > 0 ? `${selectedStudents.size} ${lang === 'fr' ? 'sélectionné(s)' : 'selected'}` : lang === 'fr' ? 'Tout sélectionner' : 'Select all'}
              </span>
            </div>
            <span className="text-xs text-gray-500">{students.length} {lang === 'fr' ? 'élève(s)' : 'student(s)'}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{lang === 'fr' ? 'Matricule' : 'Reg. No.'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{lang === 'fr' ? 'Nom & Prénom' : 'Name'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">{lang === 'fr' ? 'Date naiss.' : 'Birth'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">{lang === 'fr' ? 'Lieu' : 'Place'}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{lang === 'fr' ? 'Statut' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" /></td></tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">{lang === 'fr' ? 'Aucun élève' : 'No students'}</p>
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className={cn('hover:bg-gray-50/50 transition-colors', selectedStudents.has(student.id) && 'bg-blue-50/50')}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedStudents.has(student.id)}
                          onChange={() => toggleStudent(student.id)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{student.matricule}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {student.first_name[0]}{student.last_name[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{student.last_name} {student.first_name}</p>
                            <p className="text-xs text-gray-500">{student.sex === 'M' ? '♂' : '♀'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-gray-600">{formatDate(student.date_of_birth)}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-gray-600">{student.place_of_birth}</td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                          student.status === 'active' || student.status === 'inscrit' || student.status === 'INSCRIT' ? 'bg-green-100 text-green-700' :
                          student.status === 'demission' || student.status === 'DEMISSION' ? 'bg-amber-100 text-amber-700' :
                          student.status === 'exclu' || student.status === 'EXCLU' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        )}>
                          {student.status || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ═══════════════════════ ACTIONS SPÉCIFIQUES PAR TAB ═══════════════════════ */}
        {activeTab === 'transfer' && selectedStudents.size > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-blue-600" />
              {lang === 'fr' ? 'Transférer vers' : 'Transfer to'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{lang === 'fr' ? 'Année de destination' : 'Target year'}</label>
                <select
                  value={targetYearId}
                  onChange={(e) => { setTargetYearId(e.target.value); setTargetClassId('') }}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">{lang === 'fr' ? 'Sélectionner...' : 'Select...'}</option>
                  {academicYears.map(y => (
                    <option key={y.id} value={y.id}>{y.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{lang === 'fr' ? 'Nouvelle classe' : 'New class'} <span className="text-red-400">*</span></label>
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  disabled={!targetYearId || targetClasses.length === 0}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20',
                    (!targetYearId || targetClasses.length === 0) ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-200'
                  )}
                >
                  <option value="">{lang === 'fr' ? 'Sélectionner...' : 'Select...'}</option>
                  {targetClasses.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.abbreviation})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{lang === 'fr' ? 'Motif (optionnel)' : 'Reason (optional)'}</label>
                <input
                  type="text"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder={lang === 'fr' ? 'Ex: Changement de niveau' : 'Ex: Level change'}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
            <button
              onClick={handleTransfer}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md shadow-blue-200"
            >
              <ArrowLeftRight className="w-4 h-4" />
              {lang === 'fr' ? `Transférer ${selectedStudents.size} élève(s)` : `Transfer ${selectedStudents.size} student(s)`}
            </button>
          </div>
        )}

        {activeTab === 'resign' && selectedStudents.size > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <p className="text-sm text-gray-700">
                {selectedStudents.size} {lang === 'fr' ? 'élève(s) sélectionné(s) pour démission' : 'student(s) selected for resignation'}
              </p>
            </div>
            <button
              onClick={handleResign}
              className="mt-3 w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg text-sm font-medium hover:from-amber-600 hover:to-orange-600 transition-all shadow-md shadow-amber-200"
            >
              <ArrowRightLeft className="w-4 h-4" />
              {lang === 'fr' ? `Marquer comme démissionnaire(s)` : `Mark as resigned`}
            </button>
          </div>
        )}

        {activeTab === 'reintegrate' && selectedStudents.size > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <p className="text-sm text-gray-700">
                {selectedStudents.size} {lang === 'fr' ? 'élève(s) sélectionné(s) pour réintégration' : 'student(s) selected for reintegration'}
              </p>
            </div>
            <button
              onClick={handleReintegrate}
              className="mt-3 w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm font-medium hover:from-green-600 hover:to-emerald-600 transition-all shadow-md shadow-green-200"
            >
              <CheckCircle2 className="w-4 h-4" />
              {lang === 'fr' ? `Réintégrer ${selectedStudents.size} élève(s)` : `Reintegrate ${selectedStudents.size} student(s)`}
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════ MODAL DE CONFIRMATION ═══════════════════════ */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header coloré selon le type */}
            <div className={cn(
              'px-6 py-4 flex items-center gap-3',
              confirmModal.type === 'transfer' ? 'bg-gradient-to-r from-blue-600 to-cyan-600' :
              confirmModal.type === 'resign' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
              'bg-gradient-to-r from-green-500 to-emerald-500'
            )}>
              {confirmModal.type === 'transfer' && <ArrowLeftRight className="w-6 h-6 text-white" />}
              {confirmModal.type === 'resign' && <AlertCircle className="w-6 h-6 text-white" />}
              {confirmModal.type === 'reintegrate' && <CheckCircle2 className="w-6 h-6 text-white" />}
              <h3 className="text-lg font-bold text-white">{confirmModal.title}</h3>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <p className="text-gray-700 text-sm leading-relaxed">{confirmModal.message}</p>

              {confirmModal.type === 'resign' && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-700 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {lang === 'fr' ? 'Les élèves démissionnaires ne pourront plus être notés ni suivis.' : 'Resigned students will no longer be graded or tracked.'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                {lang === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium text-white transition-all shadow-md',
                  confirmModal.type === 'transfer' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-blue-200' :
                  confirmModal.type === 'resign' ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-200' :
                  'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-green-200'
                )}
              >
                {confirmModal.type === 'transfer' && (lang === 'fr' ? 'Transférer' : 'Transfer')}
                {confirmModal.type === 'resign' && (lang === 'fr' ? 'Démissionner' : 'Resign')}
                {confirmModal.type === 'reintegrate' && (lang === 'fr' ? 'Réintégrer' : 'Reintegrate')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}