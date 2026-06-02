import { useState, useCallback, useEffect } from 'react'
import {
  GraduationCap, BookOpen, Save, Plus, Trash2, Edit2, Check, X,
  ChevronDown, ChevronUp, Search, AlertTriangle, Sparkles,
  Award, Globe, Languages, FlaskConical, Palette, Calculator,
  Film, BrainCircuit, TrendingUp, Building2,
  BadgeCheck,
  Lock,
  Square,
  Loader2,
  Users,
  BarChart3,
  ShieldAlert,
  Info, FileDown,
  Table2,
  Upload,
  ArrowDown,
  ArrowUp,
  FileText,
  Import
} from 'lucide-react'
import { useLang } from '@/hooks/useLang'
import { toast } from 'sonner'
import { specialtiesApi, schoolApi } from '@/services/api'

// ==================== TYPES BACKEND ====================
interface SpecialtyGroup {
  id: number
  section_id: number
  code: string
  label_fr: string
  label_en: string
  status: string
  created_at?: string
  specialties?: Specialty[]
}

interface Specialty {
  id: number
  specialty_group_id: number
  code: string
  abbreviation: string
  label_fr: string
  label_en: string
  description?: string
  status: string
  created_at?: string
  specialty_group?: SpecialtyGroup
}

interface Section {
  id: number
  code: string
  name: string
  label_fr: string
  label_en: string
}

// ==================== CONFIG VISUELLE ====================
const SECTION_CONFIG: Record<number, {
  id: string
  icon: typeof Globe
  color: string
  bgColor: string
  borderColor: string
  badgeBg: string
  badgeText: string
  iconBg: string
  checkBorder: string
  checkHoverBorder: string
  checkHoverBg: string
  checkText: string
}> = {
  1: {
    id: 'anglo',
    icon: Globe,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    iconBg: 'bg-blue-600',
    checkBorder: 'border-blue-300',
    checkHoverBorder: 'hover:border-blue-500',
    checkHoverBg: 'hover:bg-blue-50',
    checkText: 'text-blue-400'
  },
  2: {
    id: 'franco',
    icon: Languages,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    iconBg: 'bg-amber-500',
    checkBorder: 'border-amber-300',
    checkHoverBorder: 'hover:border-amber-500',
    checkHoverBg: 'hover:bg-amber-50',
    checkText: 'text-amber-400'
  }
}

// ==================== ICÔNES PAR SPÉCIALITÉ ====================
const SPECIALTY_ICONS: Record<string, typeof BookOpen> = {
  'General': Calculator,
  'Arts': Palette,
  'Science': FlaskConical,
  'Science (2nd Cycle)': FlaskConical,
  'SBEP': Building2,
  'Generale': BookOpen,
  'Allemand': Languages,
  'Arabe': Languages,
  'Italien': Languages,
  'Espagnol': Languages,
  'Chinois': Languages,
  'Serie C': Calculator,
  'Serie D': Calculator,
  'TI': BrainCircuit,
  'Grec': Languages,
  'Latin': Languages,
  'SCIENCES ECONOMIQUES ET SOCIALES': TrendingUp,
  'ARTS CINEMATOGRAHIES': Film,
  'SCIENCES HUMAINES': BrainCircuit,
  'BS': Building2,
  'ABI': Award,
}

function getSpecialtyIcon(name: string): typeof BookOpen {
  for (const [key, icon] of Object.entries(SPECIALTY_ICONS)) {
    if (name.includes(key)) return icon
  }
  return BookOpen
}

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

// ==================== POPUP DE CONFIRMATION ====================
function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = 'danger'
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText: string
  cancelText: string
  type?: 'danger' | 'warning'
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header avec icône */}
        <div className={cn(
          'px-6 py-5 flex items-center gap-4',
          type === 'danger' ? 'bg-red-50' : 'bg-amber-50'
        )}>
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center shadow-md',
            type === 'danger' ? 'bg-red-500 shadow-red-200' : 'bg-amber-500 shadow-amber-200'
          )}>
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{message}</p>
          </div>
        </div>

        {/* Info box */}
        <div className="px-6 py-4 bg-gray-50 border-y border-gray-100">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-600">
              {type === 'danger'
                ? 'Cette action est irréversible. Les données supprimées ne pourront pas être récupérées.'
                : 'Veuillez confirmer votre action avant de procéder.'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={cn(
              'px-5 py-2.5 text-sm font-medium text-white rounded-xl transition-all shadow-md',
              type === 'danger'
                ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200'
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// ==================== STATISTIQUES DE GROUPE ====================
function GroupStats({
  group,
  specialties,
  selectedSpecialties,
  lang
}: {
  group: SpecialtyGroup
  specialties: Specialty[]
  selectedSpecialties: Set<number>
  lang: string
}) {
  const groupSpecs = specialties.filter(s => s.specialty_group_id === group.id)
  const selectedCount = groupSpecs.filter(s => selectedSpecialties.has(s.id)).length
  const activeCount = groupSpecs.filter(s => s.status === 'active').length
  const inactiveCount = groupSpecs.filter(s => s.status !== 'active').length
  const config = SECTION_CONFIG[group.section_id] || SECTION_CONFIG[2]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
      <div className={cn('rounded-xl p-3 border shadow-sm', config.bgColor, config.borderColor)}>
        <div className="flex items-center gap-2">
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', config.iconBg)}>
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className={cn('text-xl font-bold', config.color)}>{groupSpecs.length}</p>
            <p className="text-xs text-gray-500">{lang === 'fr' ? 'Total' : 'Total'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-3 border border-emerald-100 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
            <BadgeCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-emerald-700">{activeCount}</p>
            <p className="text-xs text-gray-500">{lang === 'fr' ? 'Actives' : 'Active'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-3 border border-blue-100 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-blue-700">{selectedCount}</p>
            <p className="text-xs text-gray-500">{lang === 'fr' ? 'Sélectionnées' : 'Selected'}</p>
          </div>
        </div>
      </div>

      {inactiveCount > 0 && (
        <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-700">{inactiveCount}</p>
              <p className="text-xs text-gray-500">{lang === 'fr' ? 'Inactives' : 'Inactive'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==================== COMPOSANT PRINCIPAL ====================
export default function AcademicSpecialtiesPage() {
  const { lang } = useLang()
  const [groups, setGroups] = useState<SpecialtyGroup[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({})
  const [selectedSpecialties, setSelectedSpecialties] = useState<Set<number>>(new Set())
  const [editingAbbrev, setEditingAbbrev] = useState<number | null>(null)
  const [abbrevValue, setAbbrevValue] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAddGroupModal, setShowAddGroupModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{success: boolean; message: string; details?: any} | null>(null)

  // Popups de confirmation
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText: string
    cancelText: string
    type: 'danger' | 'warning'
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    type: 'danger',
    onConfirm: () => {}
  })

  const [newSpecialty, setNewSpecialty] = useState({
    code: '',
    abbreviation: '',
    label_fr: '',
    label_en: '',
    description: '',
    specialty_group_id: 0
  })
  const [newGroup, setNewGroup] = useState({
    section_id: 1,
    code: '',
    label_fr: '',
    label_en: ''
  })

  // Charger les données depuis le backend
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const sectionsData = await schoolApi.getSections(1)
      setSections(sectionsData || [])

      const groupsData = await specialtiesApi.getSpecialtyGroups()
      setGroups(groupsData || [])

      const expanded: Record<number, boolean> = {}
      groupsData?.forEach((g: SpecialtyGroup) => { expanded[g.id] = true })
      setExpandedGroups(expanded)

      const allSpecialties: Specialty[] = []
      for (const group of (groupsData || [])) {
        try {
          const specs = await specialtiesApi.getSpecialties(group.id)
          if (specs && Array.isArray(specs)) allSpecialties.push(...specs)
        } catch (e) {}
      }
      setSpecialties(allSpecialties)
    } catch (error: any) {
      toast.error(lang === 'fr' ? 'Erreur lors du chargement des données' : 'Error loading data')
    } finally {
      setLoading(false)
    }
  }, [lang])

  useEffect(() => {
    loadData()
  }, [loadData])

  const toggleGroup = (groupId: number) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  const toggleSpecialty = (specialtyId: number) => {
    setSelectedSpecialties(prev => {
      const next = new Set(prev)
      if (next.has(specialtyId)) next.delete(specialtyId)
      else next.add(specialtyId)
      return next
    })
    setHasChanges(true)
  }

  const selectAllInGroup = (groupId: number, select: boolean) => {
    const groupSpecialties = specialties.filter(s => s.specialty_group_id === groupId)
    setSelectedSpecialties(prev => {
      const next = new Set(prev)
      groupSpecialties.forEach(s => {
        if (select) next.add(s.id)
        else next.delete(s.id)
      })
      return next
    })
    setHasChanges(true)
  }

  const startEditAbbrev = (specialty: Specialty) => {
    setEditingAbbrev(specialty.id)
    setAbbrevValue(specialty.abbreviation)
  }

  const saveAbbrev = async (specialtyId: number) => {
    try {
      await specialtiesApi.updateSpecialty(specialtyId, { abbreviation: abbrevValue.trim() })
      setSpecialties(prev => prev.map(s =>
        s.id === specialtyId ? { ...s, abbreviation: abbrevValue.trim() || s.abbreviation } : s
      ))
      setEditingAbbrev(null)
      setHasChanges(true)
      toast.success(lang === 'fr' ? 'Abréviation mise à jour' : 'Abbreviation updated')
    } catch (error: any) {
      const detail = error?.response?.data?.detail
      if (Array.isArray(detail)) {
        detail.forEach((err: any) => toast.error(`${err.loc?.join('.')}: ${err.msg}`))
      } else {
        toast.error(detail || (lang === 'fr' ? 'Erreur lors de la mise à jour' : 'Update error'))
      }
    }
  }

  const cancelEditAbbrev = () => {
    setEditingAbbrev(null)
    setAbbrevValue('')
  }

  // Popup suppression spécialité
  const handleDeleteSpecialty = (specialtyId: number) => {
    const specialty = specialties.find(s => s.id === specialtyId)
    setConfirmModal({
      isOpen: true,
      title: lang === 'fr' ? 'Supprimer la spécialité' : 'Delete specialty',
      message: lang === 'fr'
        ? `Voulez-vous vraiment supprimer "${specialty?.label_fr || specialty?.label_en}" ? Cette action est irréversible.`
        : `Do you really want to delete "${specialty?.label_en || specialty?.label_fr}"? This action is irreversible.`,
      confirmText: lang === 'fr' ? 'Supprimer' : 'Delete',
      cancelText: lang === 'fr' ? 'Annuler' : 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          await specialtiesApi.deleteSpecialty(specialtyId)
          setSpecialties(prev => prev.filter(s => s.id !== specialtyId))
          setSelectedSpecialties(prev => {
            const next = new Set(prev)
            next.delete(specialtyId)
            return next
          })
          setHasChanges(true)
          toast.success(lang === 'fr' ? 'Spécialité supprimée' : 'Specialty deleted')
        } catch (error: any) {
          const detail = error?.response?.data?.detail
          toast.error(detail || (lang === 'fr' ? 'Erreur lors de la suppression' : 'Delete error'))
        }
      }
    })
  }

  // Popup suppression groupe
  const handleDeleteGroup = (groupId: number) => {
    const group = groups.find(g => g.id === groupId)
    const groupSpecialties = specialties.filter(s => s.specialty_group_id === groupId)
    setConfirmModal({
      isOpen: true,
      title: lang === 'fr' ? 'Supprimer le groupe' : 'Delete group',
      message: lang === 'fr'
        ? `Voulez-vous vraiment supprimer "${group?.label_fr || group?.label_en}" et ses ${groupSpecialties.length} spécialité(s) ? Cette action est irréversible.`
        : `Do you really want to delete "${group?.label_en || group?.label_fr}" and its ${groupSpecialties.length} specialty(s)? This action is irreversible.`,
      confirmText: lang === 'fr' ? 'Supprimer' : 'Delete',
      cancelText: lang === 'fr' ? 'Annuler' : 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          await specialtiesApi.deleteSpecialtyGroup(groupId)
          setGroups(prev => prev.filter(g => g.id !== groupId))
          setSpecialties(prev => prev.filter(s => s.specialty_group_id !== groupId))
          setHasChanges(true)
          toast.success(lang === 'fr' ? 'Groupe supprimé' : 'Group deleted')
        } catch (error: any) {
          const detail = error?.response?.data?.detail
          toast.error(detail || (lang === 'fr' ? 'Erreur lors de la suppression' : 'Delete error'))
        }
      }
    })
  }

  const handleAddSpecialty = async () => {
    if (!newSpecialty.code.trim() || !newSpecialty.abbreviation.trim() || !newSpecialty.label_fr.trim() || !newSpecialty.label_en.trim()) {
      toast.error(lang === 'fr' ? 'Tous les champs requis doivent être remplis' : 'All required fields must be filled')
      return
    }
    if (newSpecialty.specialty_group_id === 0) {
      toast.error(lang === 'fr' ? 'Veuillez sélectionner un groupe' : 'Please select a group')
      return
    }
    try {
      const payload = {
        code: newSpecialty.code.trim(),
        abbreviation: newSpecialty.abbreviation.trim().toUpperCase(),
        label_fr: newSpecialty.label_fr.trim(),
        label_en: newSpecialty.label_en.trim(),
        description: newSpecialty.description.trim() || undefined,
        status: 'active'
      }
      const created = await specialtiesApi.createSpecialty(newSpecialty.specialty_group_id, payload)
      setSpecialties(prev => [...prev, created])
      setShowAddModal(false)
      setNewSpecialty({ code: '', abbreviation: '', label_fr: '', label_en: '', description: '', specialty_group_id: 0 })
      setHasChanges(true)
      toast.success(lang === 'fr' ? 'Spécialité ajoutée' : 'Specialty added')
    } catch (error: any) {
      const detail = error?.response?.data?.detail
      if (Array.isArray(detail)) {
        detail.forEach((err: any) => toast.error(`${err.loc?.join('.')}: ${err.msg}`))
      } else {
        toast.error(detail || (lang === 'fr' ? "Erreur lors de l'ajout" : 'Add error'))
      }
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      // ✅ Utiliser l'API service qui gère l'authentification automatiquement
      const blob = await specialtiesApi.downloadTemplate()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'specialties_template.xlsx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success(lang === 'fr' ? 'Template téléchargé' : 'Template downloaded')
    } catch (error: any) {
      console.error('Download error:', error)
      const detail = error?.response?.data?.detail || error.message
      toast.error(detail || (lang === 'fr' ? 'Erreur lors du téléchargement' : 'Download error'))
    }
  }

  const handleImportExcel = async () => {
    if (!importFile) {
      toast.error(lang === 'fr' ? 'Veuillez sélectionner un fichier' : 'Please select a file')
      return
    }

    setImporting(true)
    setImportResult(null)

    try {
      // ✅ Utiliser l'API service qui gère l'authentification automatiquement
      const result = await specialtiesApi.importFromExcel(importFile)

      setImportResult(result)
      toast.success(result.message || (lang === 'fr' ? 'Import réussi' : 'Import successful'))

      // Recharger les données
      await loadData()

      // Fermer le modal après 2 secondes si succès
      if (result.details?.errors?.length === 0) {
        setTimeout(() => {
          setShowImportModal(false)
          setImportFile(null)
          setImportResult(null)
        }, 2000)
      }
    } catch (error: any) {
      console.error('Import error:', error)
      const detail = error?.response?.data?.detail || error.message
      toast.error(detail || (lang === 'fr' ? "Erreur lors de l'import" : 'Import error'))
      setImportResult({ success: false, message: detail })
    } finally {
      setImporting(false)
    }
  }

  const handleAddGroup = async () => {
    if (!newGroup.code.trim() || !newGroup.label_fr.trim() || !newGroup.label_en.trim()) {
      toast.error(lang === 'fr' ? 'Tous les champs requis doivent être remplis' : 'All required fields must be filled')
      return
    }
    try {
      const payload = {
        section_id: newGroup.section_id,
        code: newGroup.code.trim(),
        label_fr: newGroup.label_fr.trim(),
        label_en: newGroup.label_en.trim(),
        status: 'active'
      }
      const created = await specialtiesApi.createSpecialtyGroup(payload)
      setGroups(prev => [...prev, created])
      setExpandedGroups(prev => ({ ...prev, [created.id]: true }))
      setShowAddGroupModal(false)
      setNewGroup({ section_id: 1, code: '', label_fr: '', label_en: '' })
      setHasChanges(true)
      toast.success(lang === 'fr' ? 'Groupe ajouté' : 'Group added')
    } catch (error: any) {
      const detail = error?.response?.data?.detail
      if (Array.isArray(detail)) {
        detail.forEach((err: any) => toast.error(`${err.loc?.join('.')}: ${err.msg}`))
      } else {
        toast.error(detail || (lang === 'fr' ? "Erreur lors de l'ajout" : 'Add error'))
      }
    }
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      await new Promise(r => setTimeout(r, 800))
      setHasChanges(false)
      toast.success(lang === 'fr' ? 'Toutes les modifications ont été enregistrées' : 'All changes saved')
    } catch {
      toast.error(lang === 'fr' ? 'Erreur lors de la sauvegarde' : 'Error saving')
    } finally {
      setSaving(false)
    }
  }

  const filteredGroups = groups.map(g => {
    const groupSpecialties = specialties.filter(s => s.specialty_group_id === g.id)
    const filteredSpecs = searchTerm
      ? groupSpecialties.filter(s =>
          s.label_fr.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.label_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.abbreviation.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : groupSpecialties
    return { ...g, specialties: filteredSpecs }
  }).filter(g => g.specialties.length > 0 || !searchTerm)

  const totalSelected = selectedSpecialties.size
  const totalSpecialties = specialties.length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-amber-50/20">
      {/* POPUP DE CONFIRMATION */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText}
        type={confirmModal.type}
      />

      {/* HEADER */}
      <div className="page-header bg-white/80 backdrop-blur-md border-b border-blue-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="page-title text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
                {lang === 'fr' ? 'Spécialités & Séries' : 'Specialties & Series'}
              </h1>
              <p className="page-subtitle text-sm text-gray-500 mt-0.5">
                {lang === 'fr'
                  ? 'Gestion des filières — ' + totalSelected + ' sélectionnée(s) sur ' + totalSpecialties
                  : 'Stream management — ' + totalSelected + ' selected out of ' + totalSpecialties}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={lang === 'fr' ? 'Rechercher...' : 'Search...'}
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 w-64"
              />
            </div>

            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-lg text-sm font-medium hover:from-violet-600 hover:to-violet-700 transition-all shadow-md shadow-violet-200"
            >
              <FileText className="w-4 h-4" />
              {lang === 'fr' ? 'Importer Excel' : 'Import Excel'}
            </button>

            <button
              onClick={() => setShowAddGroupModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md shadow-emerald-200"
            >
              <Plus className="w-4 h-4" />
              {lang === 'fr' ? 'Nouveau groupe' : 'New group'}
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg text-sm font-medium hover:from-amber-600 hover:to-amber-700 transition-all shadow-md shadow-amber-200"
            >
              <Plus className="w-4 h-4" />
              {lang === 'fr' ? 'Ajouter' : 'Add'}
            </button>

            <button
              onClick={handleSaveAll}
              disabled={!hasChanges || saving}
              className={cn(
                'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-md',
                hasChanges
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-blue-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {lang === 'fr' ? 'Enregistrer' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Stats Bar Global */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">
                  {specialties.filter(s => {
                    const g = groups.find(gg => gg.id === s.specialty_group_id)
                    return g && g.section_id === 1
                  }).length}
                </p>
                <p className="text-xs text-gray-500">{lang === 'fr' ? 'Anglophone' : 'Anglophone'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Languages className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">
                  {specialties.filter(s => {
                    const g = groups.find(gg => gg.id === s.specialty_group_id)
                    return g && g.section_id === 2
                  }).length}
                </p>
                <p className="text-xs text-gray-500">{lang === 'fr' ? 'Francophone' : 'Francophone'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <BadgeCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{totalSelected}</p>
                <p className="text-xs text-gray-500">{lang === 'fr' ? 'Sélectionnées' : 'Selected'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{totalSpecialties}</p>
                <p className="text-xs text-gray-500">{lang === 'fr' ? 'Total' : 'Total'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* GROUPS */}
        {filteredGroups.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">{lang === 'fr' ? 'Aucun groupe de spécialité' : 'No specialty group'}</p>
            <p className="text-sm mt-1">{lang === 'fr' ? 'Créez un groupe pour commencer' : 'Create a group to get started'}</p>
          </div>
        )}

        {filteredGroups.map((group) => {
          const config = SECTION_CONFIG[group.section_id] || SECTION_CONFIG[2]
          const Icon = config.icon
          const isExpanded = expandedGroups[group.id] ?? true
          const groupSpecialties = specialties.filter(s => s.specialty_group_id === group.id)
          const groupSelected = groupSpecialties.filter(s => selectedSpecialties.has(s.id)).length
          const allSelected = groupSelected === groupSpecialties.length && groupSpecialties.length > 0
          const isAnglo = group.section_id === 1

          return (
            <div
              key={group.id}
              className={cn(
                'bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all',
                isAnglo ? 'border-blue-200' : 'border-amber-200'
              )}
            >
              {/* Group Header */}
              <div
                className={cn(
                  'p-5 cursor-pointer transition-colors',
                  isAnglo ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50' : 'bg-gradient-to-r from-amber-50 to-amber-100/50 hover:from-amber-100 hover:to-amber-200/50'
                )}
                onClick={() => toggleGroup(group.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center shadow-md',
                      isAnglo ? 'bg-blue-600 shadow-blue-200' : 'bg-amber-500 shadow-amber-200'
                    )}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className={cn('text-lg font-bold', config.color)}>
                        {lang === 'fr' ? group.label_fr : group.label_en}
                      </h2>
                      <p className="text-sm text-gray-500">
                        <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded mr-2">{group.code}</span>
                        {groupSpecialties.length + ' ' + (lang === 'fr' ? 'spécialités' : 'specialties')}
                        {groupSelected > 0 && (
                          <span className={cn(
                            'ml-2 px-2 py-0.5 rounded-full text-xs font-medium',
                            config.badgeBg, config.badgeText
                          )}>
                            {groupSelected + ' ' + (lang === 'fr' ? 'sélectionnée(s)' : 'selected')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        selectAllInGroup(group.id, !allSelected)
                      }}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        allSelected
                          ? (isAnglo ? 'bg-blue-600 text-white' : 'bg-amber-500 text-white')
                          : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      <Check className="w-3 h-3" />
                      {allSelected
                        ? (lang === 'fr' ? 'Tout désélectionner' : 'Deselect all')
                        : (lang === 'fr' ? 'Tout sélectionner' : 'Select all')
                      }
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteGroup(group.id)
                      }}
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title={lang === 'fr' ? 'Supprimer le groupe' : 'Delete group'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {isExpanded ? (
                      <ChevronUp className={cn('w-5 h-5', config.color)} />
                    ) : (
                      <ChevronDown className={cn('w-5 h-5', config.color)} />
                    )}
                  </div>
                </div>

                {/* Statistiques du groupe */}
                {isExpanded && (
                  <GroupStats
                    group={group}
                    specialties={specialties}
                    selectedSpecialties={selectedSpecialties}
                    lang={lang}
                  />
                )}
              </div>

              {/* Specialties Table */}
              {isExpanded && (
                <div className="p-5">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-100">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                            {lang === 'fr' ? 'Code' : 'Code'}
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {lang === 'fr' ? 'Spécialité' : 'Specialty'}
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">
                            {lang === 'fr' ? 'Abréviation' : 'Abbreviation'}
                          </th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">
                            {lang === 'fr' ? 'Sélect.' : 'Select.'}
                          </th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">
                            {lang === 'fr' ? 'Actions' : 'Actions'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {groupSpecialties.map((specialty) => {
                          const isSelected = selectedSpecialties.has(specialty.id)
                          const isEditing = editingAbbrev === specialty.id
                          const SpecIcon = getSpecialtyIcon(specialty.label_fr)

                          return (
                            <tr
                              key={specialty.id}
                              className={cn(
                                'transition-colors',
                                isSelected
                                  ? (isAnglo ? 'bg-blue-50/60' : 'bg-amber-50/60')
                                  : 'hover:bg-gray-50/50'
                              )}
                            >
                              {/* Code */}
                              <td className="py-3 px-4">
                                <span className={cn(
                                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                                  isAnglo
                                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                                )}>
                                  <Icon className="w-3 h-3" />
                                  {specialty.code}
                                </span>
                              </td>

                              {/* Spécialité */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    'w-9 h-9 rounded-lg flex items-center justify-center',
                                    isAnglo ? 'bg-blue-100' : 'bg-amber-100'
                                  )}>
                                    <SpecIcon className={cn(
                                      'w-4 h-4',
                                      isAnglo ? 'text-blue-600' : 'text-amber-600'
                                    )} />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900 text-sm">
                                      {lang === 'fr' ? specialty.label_fr : specialty.label_en}
                                    </p>
                                    {specialty.description && (
                                      <p className="text-xs text-gray-400">{specialty.description}</p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Abréviation */}
                              <td className="py-3 px-4">
                                {isEditing ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={abbrevValue}
                                      onChange={(e) => setAbbrevValue(e.target.value)}
                                      className={cn(
                                        'w-24 px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2',
                                        isAnglo
                                          ? 'focus:ring-blue-500/30 focus:border-blue-400'
                                          : 'focus:ring-amber-500/30 focus:border-amber-400'
                                      )}
                                      maxLength={10}
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveAbbrev(specialty.id)
                                        if (e.key === 'Escape') cancelEditAbbrev()
                                      }}
                                    />
                                    <button
                                      onClick={() => saveAbbrev(specialty.id)}
                                      className={cn(
                                        'p-1 rounded-md',
                                        isAnglo ? 'text-blue-600 hover:bg-blue-50' : 'text-amber-600 hover:bg-amber-50'
                                      )}
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={cancelEditAbbrev}
                                      className="p-1 rounded-md text-gray-400 hover:bg-gray-50"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 group">
                                    <span className={cn(
                                      'inline-flex items-center px-3 py-1 rounded-md text-xs font-bold tracking-wide',
                                      isAnglo ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                    )}>
                                      {specialty.abbreviation}
                                    </span>
                                    <button
                                      onClick={() => startEditAbbrev(specialty)}
                                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-opacity"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </td>

                              {/* Sélection */}
                              <td className="py-3 px-4 text-center">
                                {isSelected ? (
                                  <button
                                    onClick={() => toggleSpecialty(specialty.id)}
                                    className={cn(
                                      'inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:scale-110',
                                      isAnglo ? 'bg-blue-100 hover:bg-blue-200' : 'bg-amber-100 hover:bg-amber-200'
                                    )}
                                    title={lang === 'fr' ? 'Cliquer pour désélectionner' : 'Click to deselect'}
                                  >
                                    <Lock className={cn(
                                      'w-4 h-4',
                                      isAnglo ? 'text-blue-600' : 'text-amber-600'
                                    )} />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => toggleSpecialty(specialty.id)}
                                    className={cn(
                                      'inline-flex items-center justify-center w-8 h-8 rounded-lg border-2 transition-all hover:scale-110',
                                      config.checkBorder,
                                      config.checkHoverBorder,
                                      config.checkHoverBg
                                    )}
                                    title={lang === 'fr' ? 'Sélectionner' : 'Select'}
                                  >
                                    <Square className={cn('w-4 h-4', config.checkText)} />
                                  </button>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => startEditAbbrev(specialty)}
                                    className={cn(
                                      'p-1.5 rounded-lg transition-colors',
                                      isAnglo ? 'text-blue-500 hover:bg-blue-50' : 'text-amber-500 hover:bg-amber-50'
                                    )}
                                    title={lang === 'fr' ? "Modifier l'abréviation" : 'Edit abbreviation'}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSpecialty(specialty.id)}
                                    className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                    title={lang === 'fr' ? 'Supprimer' : 'Delete'}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {groupSpecialties.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{lang === 'fr' ? 'Aucune spécialité dans ce groupe' : 'No specialties in this group'}</p>
                      <button
                        onClick={() => {
                          setNewSpecialty(prev => ({ ...prev, specialty_group_id: group.id }))
                          setShowAddModal(true)
                        }}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        + {lang === 'fr' ? 'Ajouter une spécialité' : 'Add a specialty'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Bottom Action Bar */}
        {hasChanges && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 px-6 py-4 flex items-center gap-4">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {lang === 'fr' ? 'Modifications non enregistrées' : 'Unsaved changes'}
                </span>
              </div>
              <div className="h-6 w-px bg-gray-200" />
              <button
                onClick={() => {
                  setSelectedSpecialties(new Set())
                  setHasChanges(false)
                  toast.info(lang === 'fr' ? 'Sélection réinitialisée' : 'Selection reset')
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {lang === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveAll}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-200"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {lang === 'fr' ? 'Appliquer les changements' : 'Apply changes'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ADD SPECIALTY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {lang === 'fr' ? 'Nouvelle spécialité' : 'New specialty'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {lang === 'fr' ? 'Ajoutez une spécialité au groupe' : 'Add a specialty to the group'}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'fr' ? 'Groupe' : 'Group'} *
                </label>
                <select
                  value={newSpecialty.specialty_group_id}
                  onChange={(e) => setNewSpecialty({ ...newSpecialty, specialty_group_id: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                >
                  <option value={0}>{lang === 'fr' ? 'Sélectionner un groupe...' : 'Select a group...'}</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>
                      {lang === 'fr' ? g.label_fr : g.label_en} ({g.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'fr' ? 'Code' : 'Code'} *
                </label>
                <input
                  type="text"
                  value={newSpecialty.code}
                  onChange={(e) => setNewSpecialty({ ...newSpecialty, code: e.target.value })}
                  placeholder={lang === 'fr' ? 'Ex: FR-SCI' : 'Ex: EN-SCI'}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'fr' ? 'Nom (FR)' : 'Name (FR)'} *
                </label>
                <input
                  type="text"
                  value={newSpecialty.label_fr}
                  onChange={(e) => setNewSpecialty({ ...newSpecialty, label_fr: e.target.value })}
                  placeholder={lang === 'fr' ? 'Ex: Science' : 'Ex: Science'}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'fr' ? 'Nom (EN)' : 'Name (EN)'} *
                </label>
                <input
                  type="text"
                  value={newSpecialty.label_en}
                  onChange={(e) => setNewSpecialty({ ...newSpecialty, label_en: e.target.value })}
                  placeholder={lang === 'fr' ? 'Ex: Science' : 'Ex: Science'}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'fr' ? 'Abréviation' : 'Abbreviation'} *
                </label>
                <input
                  type="text"
                  value={newSpecialty.abbreviation}
                  onChange={(e) => setNewSpecialty({ ...newSpecialty, abbreviation: e.target.value.toUpperCase() })}
                  placeholder={lang === 'fr' ? 'Ex: SCI' : 'Ex: SCI'}
                  maxLength={10}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {lang === 'fr' ? 'Max. 10 caractères, en majuscules' : 'Max. 10 characters, uppercase'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'fr' ? 'Description' : 'Description'}
                </label>
                <textarea
                  value={newSpecialty.description}
                  onChange={(e) => setNewSpecialty({ ...newSpecialty, description: e.target.value })}
                  placeholder={lang === 'fr' ? 'Description optionnelle...' : 'Optional description...'}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {lang === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                onClick={handleAddSpecialty}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md shadow-blue-200"
              >
                <Plus className="w-4 h-4" />
                {lang === 'fr' ? 'Ajouter' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT EXCEL MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowImportModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {lang === 'fr' ? 'Importer des spécialités' : 'Import specialties'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {lang === 'fr' ? 'Téléchargez le template, remplissez-le, puis importez-le' : 'Download the template, fill it, then import it'}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Étape 1: Télécharger le template */}
              <div className="bg-violet-50 rounded-xl p-4 border border-violet-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                    <ArrowDown className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-violet-900 text-sm">
                      {lang === 'fr' ? 'Étape 1: Télécharger le template' : 'Step 1: Download template'}
                    </h4>
                    <p className="text-xs text-violet-700 mt-1">
                      {lang === 'fr' 
                        ? 'Téléchargez le fichier Excel modèle avec les colonnes requises.' 
                        : 'Download the Excel template file with required columns.'}
                    </p>
                    <button
                      onClick={handleDownloadTemplate}
                      className="mt-3 flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors"
                    >
                      <ArrowDown className="w-4 h-4" />
                      {lang === 'fr' ? 'Télécharger le template (.xlsx)' : 'Download template (.xlsx)'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Étape 2: Envoyer le fichier */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                    <ArrowUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 text-sm">
                      {lang === 'fr' ? 'Étape 2: Importer le fichier rempli' : 'Step 2: Import filled file'}
                    </h4>
                    <p className="text-xs text-blue-700 mt-1">
                      {lang === 'fr'
                        ? 'Sélectionnez votre fichier Excel rempli avec les spécialités.'
                        : 'Select your filled Excel file with specialties.'}
                    </p>

                    <div className="mt-3">
                      <label className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-dashed border-blue-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <span className="text-sm text-blue-700">
                          {importFile ? importFile.name : (lang === 'fr' ? 'Choisir un fichier Excel...' : 'Choose an Excel file...')}
                        </span>
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Résultat d'import */}
              {importResult && (
                <div className={cn(
                  'rounded-xl p-4 border',
                  importResult.success && importResult.details?.errors?.length === 0
                    ? 'bg-emerald-50 border-emerald-200'
                    : importResult.success
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-red-50 border-red-200'
                )}>
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                      importResult.success && importResult.details?.errors?.length === 0
                        ? 'bg-emerald-100'
                        : importResult.success
                          ? 'bg-amber-100'
                          : 'bg-red-100'
                    )}>
                      {importResult.success && importResult.details?.errors?.length === 0 ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : importResult.success ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      ) : (
                        <X className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className={cn(
                        'text-sm font-medium',
                        importResult.success && importResult.details?.errors?.length === 0
                          ? 'text-emerald-800'
                          : importResult.success
                            ? 'text-amber-800'
                            : 'text-red-800'
                      )}>
                        {importResult.message}
                      </p>
                      {importResult.details && (
                        <div className="mt-2 text-xs space-y-1">
                          <p className="text-gray-600">
                            {lang === 'fr' ? 'Créées' : 'Created'}: <span className="font-semibold text-emerald-600">{importResult.details.created}</span> / {importResult.details.total}
                          </p>
                          {importResult.details.errors?.length > 0 && (
                            <div className="mt-2">
                              <p className="font-medium text-red-600 mb-1">
                                {lang === 'fr' ? 'Erreurs:' : 'Errors:'} {importResult.details.errors.length}
                              </p>
                              <div className="max-h-32 overflow-y-auto bg-white rounded-lg p-2 border border-red-100">
                                {importResult.details.errors.map((err: string, idx: number) => (
                                  <p key={idx} className="text-red-600 text-xs">• {err}</p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportFile(null)
                  setImportResult(null)
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {lang === 'fr' ? 'Fermer' : 'Close'}
              </button>
              <button
                onClick={handleImportExcel}
                disabled={!importFile || importing}
                className={cn(
                  'flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all',
                  importFile && !importing
                    ? 'bg-gradient-to-r from-violet-600 to-violet-700 text-white hover:from-violet-700 hover:to-violet-800 shadow-md shadow-violet-200'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
              >
                {importing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowUp className="w-4 h-4" />
                )}
                {lang === 'fr' ? 'Importer' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD GROUP MODAL */}
      {showAddGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddGroupModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {lang === 'fr' ? 'Nouveau groupe' : 'New group'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {lang === 'fr' ? 'Créez un groupe de spécialité' : 'Create a specialty group'}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'fr' ? 'Section' : 'Section'} *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setNewGroup({ ...newGroup, section_id: 1 })}
                    className={cn(
                      'flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all',
                      newGroup.section_id === 1
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-blue-200'
                    )}
                  >
                    <Globe className="w-5 h-5" />
                    <span className="text-sm font-medium">{lang === 'fr' ? 'Anglophone' : 'Anglophone'}</span>
                  </button>
                  <button
                    onClick={() => setNewGroup({ ...newGroup, section_id: 2 })}
                    className={cn(
                      'flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all',
                      newGroup.section_id === 2
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-gray-200 hover:border-amber-200'
                    )}
                  >
                    <Languages className="w-5 h-5" />
                    <span className="text-sm font-medium">{lang === 'fr' ? 'Francophone' : 'Francophone'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'fr' ? 'Code' : 'Code'} *
                </label>
                <input
                  type="text"
                  value={newGroup.code}
                  onChange={(e) => setNewGroup({ ...newGroup, code: e.target.value })}
                  placeholder={lang === 'fr' ? 'Ex: ANG-GEN' : 'Ex: EN-GEN'}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'fr' ? 'Nom (FR)' : 'Name (FR)'} *
                </label>
                <input
                  type="text"
                  value={newGroup.label_fr}
                  onChange={(e) => setNewGroup({ ...newGroup, label_fr: e.target.value })}
                  placeholder={lang === 'fr' ? 'Ex: Général Anglophone' : 'Ex: General Anglophone'}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'fr' ? 'Nom (EN)' : 'Name (EN)'} *
                </label>
                <input
                  type="text"
                  value={newGroup.label_en}
                  onChange={(e) => setNewGroup({ ...newGroup, label_en: e.target.value })}
                  placeholder={lang === 'fr' ? 'Ex: General Anglophone' : 'Ex: General Anglophone'}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowAddGroupModal(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {lang === 'fr' ? 'Annuler' : 'Cancel'}
              </button>
              <button
                onClick={handleAddGroup}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg text-sm font-medium hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md shadow-emerald-200"
              >
                <Plus className="w-4 h-4" />
                {lang === 'fr' ? 'Créer' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}