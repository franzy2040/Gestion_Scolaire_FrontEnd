import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Search, Plus, Save, Edit2, Trash2, Check, X,
  ChevronDown, Filter, Printer, BookOpen,
  Building2, Users, Layers, School, Loader2,
  FileText, ArrowDown, ArrowUp, Lock, Unlock, RotateCcw,
  AlertTriangle, Info
} from 'lucide-react'
import { useLang } from '@/hooks/useLang'
import { toast } from 'sonner'
import { specialtiesApi, classesApi, schoolApi, cyclesApi, levelsApi } from '@/services/api'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Section { id: number; code: string; label_fr: string; label_en: string }
interface Cycle { id: number; section_id: number; code: string; label_fr: string; label_en: string; order: number }
interface SpecialtyGroup { id: number; section_id: number; cycle_id: number; code: string; label_fr: string; label_en: string }
interface Specialty { id: number; specialty_group_id: number; code: string; abbreviation: string; label_fr: string; label_en: string }
interface Level { id: number; cycle_id: number; code: string; label_fr: string; label_en: string; order: number }
interface ClassItem { id: number; level_id: number; specialty_id: number; code: string; abbreviation: string; name: string; capacity: number; status: string; level_name?: string; specialty_name?: string; specialty_group_name?: string; section_id?: number; cycle_id?: number }

function cn(...classes: (string | false | null | undefined)[]) { return classes.filter(Boolean).join(' ') }

// Helper to escape CSV values
function escapeCSV(value: string): string {
  const str = String(value ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

// Helper to format date for filenames
function getFormattedDate(): string {
  const now = new Date()
  return now.toISOString().split('T')[0]
}

export default function LevelsAndClassesPage() {
  const { lang } = useLang()
  const [sections, setSections] = useState<Section[]>([])
  const [cycles, setCycles] = useState<Cycle[]>([])
  const [specialtyGroups, setSpecialtyGroups] = useState<SpecialtyGroup[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [levels, setLevels] = useState<Level[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [selectedSection, setSelectedSection] = useState<number | ''>('')
  const [selectedCycle, setSelectedCycle] = useState<number | ''>('')
  const [selectedSpecialty, setSelectedSpecialty] = useState<number | ''>('')
  const [selectedLevel, setSelectedLevel] = useState<number | ''>('')
  const [className, setClassName] = useState('')
  const [classAbbrev, setClassAbbrev] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editAbbrev, setEditAbbrev] = useState('')
  const [activeTab, setActiveTab] = useState<'classes' | 'cycles' | 'levels'>('classes')
  const [cycleForm, setCycleForm] = useState({ code: '', label_fr: '', label_en: '', order: 1 })
  const [levelForm, setLevelForm] = useState({ code: '', label_fr: '', label_en: '', order: 1 })
  const [editingCycleId, setEditingCycleId] = useState<number | null>(null)
  const [editingLevelId, setEditingLevelId] = useState<number | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  const loadAllData = useCallback(async () => {
    setLoading(true)
    try {
      const secData = await schoolApi.getSections(1)
      setSections(secData || [])
      const [cyclesData, levelsData, classesData] = await Promise.allSettled([cyclesApi.getAll(), levelsApi.getAll(), classesApi.getAll()])
      setCycles(cyclesData.status === 'fulfilled' && cyclesData.value?.length > 0 ? cyclesData.value : [])
      setLevels(levelsData.status === 'fulfilled' && levelsData.value?.length > 0 ? levelsData.value : [])
      setClasses(classesData.status === 'fulfilled' ? (classesData.value || []) : [])
    } catch { toast.error(lang === 'fr' ? 'Erreur chargement' : 'Loading error') }
    finally { setLoading(false) }
  }, [lang])

  const loadSpecialtyGroups = useCallback(async () => {
    try { const d = await specialtiesApi.getSpecialtyGroups(); setSpecialtyGroups(d || []); return d || [] }
    catch { setSpecialtyGroups([]); return [] }
  }, [])

  const loadSpecialtiesForGroups = useCallback(async (groupIds: number[]) => {
    if (groupIds.length === 0) { setSpecialties([]); return }
    const all: Specialty[] = []
    const results = await Promise.allSettled(groupIds.map(id => specialtiesApi.getSpecialties(id)))
    results.forEach(r => { if (r.status === 'fulfilled' && Array.isArray(r.value)) all.push(...r.value) })
    setSpecialties(all)
  }, [])

  const loadSpecialtiesByCycle = useCallback(async (cycleId: number) => {
    const groups = specialtyGroups.length > 0 ? specialtyGroups : await loadSpecialtyGroups()
    const groupsForCycle = groups.filter((g: SpecialtyGroup) => g.cycle_id === cycleId)
    if (groupsForCycle.length > 0) {
      await loadSpecialtiesForGroups(groupsForCycle.map((g: SpecialtyGroup) => g.id))
    } else {
      const cycle = cycles.find(c => c.id === cycleId)
      if (cycle) {
        const groupsForSection = groups.filter((g: SpecialtyGroup) => g.section_id === cycle.section_id)
        if (groupsForSection.length > 0) await loadSpecialtiesForGroups(groupsForSection.map((g: SpecialtyGroup) => g.id))
        else setSpecialties([])
      } else setSpecialties([])
    }
  }, [cycles, loadSpecialtyGroups, loadSpecialtiesForGroups, specialtyGroups])

  useEffect(() => { loadAllData(); loadSpecialtyGroups() }, [loadAllData, loadSpecialtyGroups])

  useEffect(() => {
    if (selectedCycle) loadSpecialtiesByCycle(Number(selectedCycle))
    else {
      const loadAll = async () => {
        const groups = specialtyGroups.length > 0 ? specialtyGroups : await loadSpecialtyGroups()
        if (groups.length > 0) await loadSpecialtiesForGroups(groups.map((g: SpecialtyGroup) => g.id))
      }
      loadAll()
    }
  }, [selectedCycle, loadSpecialtiesByCycle, loadSpecialtyGroups, loadSpecialtiesForGroups, specialtyGroups])

  const filteredCycles = selectedSection ? cycles.filter(c => c.section_id === Number(selectedSection)) : cycles

  const filteredSpecialties = useMemo(() => {
    if (!selectedCycle) return specialties
    const cycleId = Number(selectedCycle)
    const groupsForCycle = specialtyGroups.filter(g => g.cycle_id === cycleId)
    if (groupsForCycle.length > 0) {
      const groupIds = groupsForCycle.map(g => g.id)
      return specialties.filter(s => groupIds.includes(s.specialty_group_id))
    }
    const cycle = cycles.find(c => c.id === cycleId)
    if (cycle) {
      const groupsForSection = specialtyGroups.filter(g => g.section_id === cycle.section_id)
      const groupIds = groupsForSection.map(g => g.id)
      return specialties.filter(s => groupIds.includes(s.specialty_group_id))
    }
    return specialties
  }, [specialties, specialtyGroups, selectedCycle, cycles])

  const filteredLevels = selectedCycle ? levels.filter(l => l.cycle_id === Number(selectedCycle))
    : selectedSection ? levels.filter(l => { const c = cycles.find(cc => cc.id === l.cycle_id); return c && c.section_id === Number(selectedSection) }) : levels

  const getClassDisplayData = useCallback((cls: ClassItem) => {
    const level = levels.find(l => l.id === cls.level_id)
    const cycle = level ? cycles.find(c => c.id === level.cycle_id) : undefined
    const section = cycle ? sections.find(s => s.id === cycle.section_id) : undefined
    const specialty = specialties.find(s => s.id === cls.specialty_id)
    return {
      levelName: level?.label_fr || cls.level_name || '\u2014',
      cycleName: cycle?.label_fr || '\u2014',
      sectionName: section?.label_fr || '\u2014',
      sectionId: section?.id,
      cycleId: cycle?.id,
      specialtyName: specialty?.label_fr || cls.specialty_name || '\u2014',
      specialtyCode: specialty?.code || ''
    }
  }, [levels, cycles, sections, specialties])

  const handleCreateClass = async () => {
    if (!selectedSpecialty || !selectedLevel || !className.trim() || !classAbbrev.trim()) {
      toast.error(lang === 'fr' ? 'Veuillez remplir tous les champs' : 'Please fill all fields')
      return
    }
    try {
      await classesApi.create({ level_id: Number(selectedLevel), specialty_id: Number(selectedSpecialty), code: classAbbrev.trim().toUpperCase(), abbreviation: classAbbrev.trim().toUpperCase(), name: className.trim(), capacity: 50, academic_year_id: 1, status: 'open' })
      toast.success(lang === 'fr' ? 'Classe creee' : 'Class created')
      setClassName(''); setClassAbbrev(''); await loadAllData()
    } catch (error: any) { toast.error(error?.response?.data?.detail || (lang === 'fr' ? "Erreur creation" : 'Create error')) }
  }

  const handleToggleStatus = async (cls: ClassItem) => {
    try { const ns = cls.status === 'open' ? 'closed' : 'open'; await classesApi.update(cls.id, { status: ns }); setClasses(prev => prev.map(c => c.id === cls.id ? { ...c, status: ns } : c)); toast.success(lang === 'fr' ? 'Statut mis a jour' : 'Status updated') }
    catch { toast.error(lang === 'fr' ? 'Erreur' : 'Error') }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(lang === 'fr' ? 'Supprimer cette classe ?' : 'Delete this class?')) return
    try { await classesApi.delete(id); setClasses(prev => prev.filter(c => c.id !== id)); toast.success(lang === 'fr' ? 'Classe supprimee' : 'Class deleted') }
    catch { toast.error(lang === 'fr' ? 'Erreur suppression' : 'Delete error') }
  }

  const startEdit = (cls: ClassItem) => { setEditingId(cls.id); setEditName(cls.name); setEditAbbrev(cls.abbreviation) }
  const saveEdit = async (id: number) => {
    try { await classesApi.update(id, { name: editName.trim(), abbreviation: editAbbrev.trim().toUpperCase() }); setClasses(prev => prev.map(c => c.id === id ? { ...c, name: editName.trim(), abbreviation: editAbbrev.trim().toUpperCase() } : c)); setEditingId(null); toast.success(lang === 'fr' ? 'Modifie' : 'Updated') }
    catch { toast.error(lang === 'fr' ? 'Erreur' : 'Error') }
  }

  const handleCreateCycle = async () => {
    if (!selectedSection || !cycleForm.code.trim() || !cycleForm.label_fr.trim()) { toast.error(lang === 'fr' ? 'Veuillez remplir tous les champs du cycle' : 'Please fill all cycle fields'); return }
    try { await cyclesApi.create({ section_id: Number(selectedSection), code: cycleForm.code.trim().toUpperCase(), label_fr: cycleForm.label_fr.trim(), label_en: cycleForm.label_en.trim() || cycleForm.label_fr.trim(), order: cycleForm.order }); toast.success(lang === 'fr' ? 'Cycle cree' : 'Cycle created'); setCycleForm({ code: '', label_fr: '', label_en: '', order: 1 }); await loadAllData() }
    catch (error: any) { toast.error(error?.response?.data?.detail || (lang === 'fr' ? 'Erreur creation cycle' : 'Cycle creation error')) }
  }

  const handleUpdateCycle = async (id: number) => {
    try { await cyclesApi.update(id, { code: cycleForm.code.trim().toUpperCase(), label_fr: cycleForm.label_fr.trim(), label_en: cycleForm.label_en.trim(), order: cycleForm.order }); toast.success(lang === 'fr' ? 'Cycle modifie' : 'Cycle updated'); setEditingCycleId(null); setCycleForm({ code: '', label_fr: '', label_en: '', order: 1 }); await loadAllData() }
    catch { toast.error(lang === 'fr' ? 'Erreur modification cycle' : 'Cycle update error') }
  }

  const handleDeleteCycle = async (id: number) => {
    if (!confirm(lang === 'fr' ? 'Supprimer ce cycle ?' : 'Delete this cycle?')) return
    try { await cyclesApi.delete(id); toast.success(lang === 'fr' ? 'Cycle supprime' : 'Cycle deleted'); await loadAllData() }
    catch { toast.error(lang === 'fr' ? 'Erreur suppression cycle' : 'Cycle delete error') }
  }

  const handleCreateLevel = async () => {
    if (!selectedCycle || !levelForm.code.trim() || !levelForm.label_fr.trim()) { toast.error(lang === 'fr' ? 'Veuillez remplir tous les champs du niveau' : 'Please fill all level fields'); return }
    try { await levelsApi.create({ cycle_id: Number(selectedCycle), code: levelForm.code.trim().toLowerCase(), label_fr: levelForm.label_fr.trim(), label_en: levelForm.label_en.trim() || levelForm.label_fr.trim(), order: levelForm.order }); toast.success(lang === 'fr' ? 'Niveau cree' : 'Level created'); setLevelForm({ code: '', label_fr: '', label_en: '', order: 1 }); await loadAllData() }
    catch (error: any) { toast.error(error?.response?.data?.detail || (lang === 'fr' ? 'Erreur creation niveau' : 'Level creation error')) }
  }

  const handleUpdateLevel = async (id: number) => {
    try { await levelsApi.update(id, { code: levelForm.code.trim().toLowerCase(), label_fr: levelForm.label_fr.trim(), label_en: levelForm.label_en.trim(), order: levelForm.order }); toast.success(lang === 'fr' ? 'Niveau modifie' : 'Level updated'); setEditingLevelId(null); setLevelForm({ code: '', label_fr: '', label_en: '', order: 1 }); await loadAllData() }
    catch { toast.error(lang === 'fr' ? 'Erreur modification niveau' : 'Level update error') }
  }

  const handleDeleteLevel = async (id: number) => {
    if (!confirm(lang === 'fr' ? 'Supprimer ce niveau ?' : 'Delete this level?')) return
    try { await levelsApi.delete(id); toast.success(lang === 'fr' ? 'Niveau supprime' : 'Level deleted'); await loadAllData() }
    catch { toast.error(lang === 'fr' ? 'Erreur suppression niveau' : 'Level delete error') }
  }

  // Derived state - MUST be before export callbacks
  const filteredClasses = useMemo(() => classes.filter(c => {
    const d = getClassDisplayData(c)
    const matchesSearch = !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.abbreviation.toLowerCase().includes(searchTerm.toLowerCase()) || d.specialtyName.toLowerCase().includes(searchTerm.toLowerCase()) || d.levelName.toLowerCase().includes(searchTerm.toLowerCase()) || d.cycleName.toLowerCase().includes(searchTerm.toLowerCase()) || d.sectionName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSpecialty = !selectedSpecialty || c.specialty_id === Number(selectedSpecialty)
    const matchesLevel = !selectedLevel || c.level_id === Number(selectedLevel)
    const matchesCycle = !selectedCycle || (d.cycleId === Number(selectedCycle))
    const matchesSection = !selectedSection || (d.sectionId === Number(selectedSection))
    return matchesSearch && matchesSpecialty && matchesLevel && matchesCycle && matchesSection
  }), [classes, getClassDisplayData, searchTerm, selectedSpecialty, selectedLevel, selectedCycle, selectedSection])

  const totalClasses = classes.length
  const openClasses = classes.filter(c => c.status === 'open').length
  const closedClasses = classes.filter(c => c.status === 'closed').length
  const hasSections = sections.length > 0
  const hasCycles = cycles.length > 0
  const hasLevels = levels.length > 0

  // ============================
  // EXPORT FUNCTIONS
  // ============================

  const getExportData = useCallback(() => {
    return filteredClasses.map(c => {
      const d = getClassDisplayData(c)
      return {
        [lang === 'fr' ? 'Section' : 'Section']: d.sectionName,
        [lang === 'fr' ? 'Cycle' : 'Cycle']: d.cycleName,
        [lang === 'fr' ? 'Specialite' : 'Specialty']: d.specialtyName,
        [lang === 'fr' ? 'Niveau' : 'Level']: d.levelName,
        [lang === 'fr' ? 'Classe' : 'Class']: c.name,
        [lang === 'fr' ? 'Abreviation' : 'Abbreviation']: c.abbreviation,
        [lang === 'fr' ? 'Statut' : 'Status']: c.status === 'open'
          ? (lang === 'fr' ? 'Ouverte' : 'Open')
          : (lang === 'fr' ? 'Fermee' : 'Closed'),
        [lang === 'fr' ? 'Capacite' : 'Capacity']: c.capacity
      }
    })
  }, [filteredClasses, getClassDisplayData, lang])

  const exportToCSV = useCallback(() => {
    const data = getExportData()
    if (data.length === 0) {
      toast.info(lang === 'fr' ? 'Aucune donnee a exporter' : 'No data to export')
      return
    }
    const headers = Object.keys(data[0])
    const csvRows = [
      headers.map(escapeCSV).join(';'),
      ...data.map(row => headers.map(h => escapeCSV(row[h as keyof typeof row] as string)).join(';'))
    ]
    const csvContent = '\uFEFF' + csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `classes_${getFormattedDate()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(lang === 'fr' ? 'CSV exporte avec succes' : 'CSV exported successfully')
  }, [getExportData, lang])

  const exportToExcel = useCallback(() => {
    const data = getExportData()
    if (data.length === 0) {
      toast.info(lang === 'fr' ? 'Aucune donnee a exporter' : 'No data to export')
      return
    }

    const title = lang === 'fr' ? 'Liste des Classes' : 'Class List'
    const wsData: (string | number)[][] = []

    // Title row
    wsData.push([title])
    wsData.push([])

    // Headers
    const headers = Object.keys(data[0])
    wsData.push(headers)

    // Data rows
    data.forEach(row => {
      wsData.push(headers.map(h => row[h as keyof typeof row] as string | number))
    })

    // Summary rows
    wsData.push([])
    wsData.push([lang === 'fr' ? 'Total' : 'Total', filteredClasses.length])
    wsData.push([lang === 'fr' ? 'Ouvertes' : 'Open', openClasses])
    wsData.push([lang === 'fr' ? 'Fermees' : 'Closed', closedClasses])

    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Set column widths
    ws['!cols'] = headers.map(() => ({ wch: 20 }))

    // Style the header row (row 3, index 2)
    const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1')
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 2, c: col })
      if (ws[cellAddr]) {
        ws[cellAddr].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '2563EB' }, patternType: 'solid' },
          alignment: { horizontal: 'center', vertical: 'center' }
        }
      }
    }

    // Style title
    const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 })
    if (ws[titleCell]) {
      ws[titleCell].s = {
        font: { bold: true, sz: 16, color: { rgb: '1E40AF' } },
        alignment: { horizontal: 'left', vertical: 'center' }
      }
    }

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, lang === 'fr' ? 'Classes' : 'Classes')
    XLSX.writeFile(wb, `classes_${getFormattedDate()}.xlsx`)
    toast.success(lang === 'fr' ? 'Excel exporte avec succes' : 'Excel exported successfully')
  }, [getExportData, lang, filteredClasses.length, openClasses, closedClasses])

  const exportToPDF = useCallback(() => {
    const data = getExportData()
    if (data.length === 0) {
      toast.info(lang === 'fr' ? 'Aucune donnee a exporter' : 'No data to export')
      return
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()

    // Title
    doc.setFontSize(18)
    doc.setTextColor(30, 64, 175)
    const title = lang === 'fr' ? 'Liste des Classes' : 'Class List'
    doc.text(title, pageWidth / 2, 15, { align: 'center' })

    // Subtitle with date
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    const dateStr = new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US')
    doc.text(`${lang === 'fr' ? 'Genere le' : 'Generated on'}: ${dateStr}`, pageWidth / 2, 22, { align: 'center' })

    // Table
    const headers = Object.keys(data[0])
    const body = data.map(row => headers.map(h => String(row[h as keyof typeof row])))

    autoTable(doc, {
      head: [headers],
      body: body,
      startY: 28,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        halign: 'left'
      },
      alternateRowStyles: {
        fillColor: [239, 246, 255]
      },
      columnStyles: {
        0: { halign: 'center' },
        6: { halign: 'center' },
        7: { halign: 'center' }
      },
      margin: { top: 28, left: 10, right: 10, bottom: 20 },
      didDrawPage: (dataArg: any) => {
        // Footer with page number
        const pageCount = doc.getNumberOfPages()
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(
          `${lang === 'fr' ? 'Page' : 'Page'} ${dataArg.pageNumber} / ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'center' }
        )
      }
    })

    // Summary section
    const finalY = (doc as any).lastAutoTable?.finalY || 50
    doc.setFontSize(11)
    doc.setTextColor(30, 64, 175)
    doc.text(lang === 'fr' ? 'Resume' : 'Summary', 14, finalY + 10)

    doc.setFontSize(10)
    doc.setTextColor(60, 60, 60)
    doc.text(`${lang === 'fr' ? 'Total classes' : 'Total classes'}: ${filteredClasses.length}`, 14, finalY + 17)
    doc.text(`${lang === 'fr' ? 'Ouvertes' : 'Open'}: ${openClasses}`, 70, finalY + 17)
    doc.text(`${lang === 'fr' ? 'Fermees' : 'Closed'}: ${closedClasses}`, 120, finalY + 17)

    doc.save(`classes_${getFormattedDate()}.pdf`)
    toast.success(lang === 'fr' ? 'PDF exporte avec succes' : 'PDF exported successfully')
  }, [getExportData, lang, filteredClasses.length, openClasses, closedClasses])

  const handleExport = useCallback((format: 'excel' | 'csv' | 'pdf') => {
    switch (format) {
      case 'csv':
        exportToCSV()
        break
      case 'excel':
        exportToExcel()
        break
      case 'pdf':
        exportToPDF()
        break
    }
  }, [exportToCSV, exportToExcel, exportToPDF])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-amber-50/20">
      <div className="page-header bg-white/80 backdrop-blur-md border-b border-blue-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <School className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="page-title text-2xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
                {lang === 'fr' ? 'Niveaux & Classes' : 'Levels & Classes'}
              </h1>
              <p className="page-subtitle text-sm text-gray-500 mt-0.5">
                {lang === 'fr' ? `${totalClasses} classes \u2014 ${openClasses} ouvertes / ${closedClasses} fermees` : `${totalClasses} classes \u2014 ${openClasses} open / ${closedClasses} closed`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button onClick={() => setActiveTab('classes')} className={cn('px-4 py-2 rounded-md text-sm font-medium transition-all', activeTab === 'classes' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-800')}>{lang === 'fr' ? 'Classes' : 'Classes'}</button>
              <button onClick={() => setActiveTab('cycles')} className={cn('px-4 py-2 rounded-md text-sm font-medium transition-all', activeTab === 'cycles' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-800')}>{lang === 'fr' ? 'Cycles' : 'Cycles'}</button>
              <button onClick={() => setActiveTab('levels')} className={cn('px-4 py-2 rounded-md text-sm font-medium transition-all', activeTab === 'levels' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-800')}>{lang === 'fr' ? 'Niveaux' : 'Levels'}</button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={lang === 'fr' ? 'Rechercher...' : 'Search...'} className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 w-64" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all', showFilters ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}>
              <Filter className="w-4 h-4" />{lang === 'fr' ? 'Filtres' : 'Filters'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center"><Layers className="w-5 h-5 text-blue-600" /></div><div><p className="text-2xl font-bold text-blue-700">{totalClasses}</p><p className="text-xs text-gray-500">{lang === 'fr' ? 'Total' : 'Total'}</p></div></div></div>
          <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center"><Unlock className="w-5 h-5 text-emerald-600" /></div><div><p className="text-2xl font-bold text-emerald-700">{openClasses}</p><p className="text-xs text-gray-500">{lang === 'fr' ? 'Ouvertes' : 'Open'}</p></div></div></div>
          <div className="bg-white rounded-xl p-4 border border-red-100 shadow-sm"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center"><Lock className="w-5 h-5 text-red-600" /></div><div><p className="text-2xl font-bold text-red-700">{closedClasses}</p><p className="text-xs text-gray-500">{lang === 'fr' ? 'Fermees' : 'Closed'}</p></div></div></div>
          <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center"><Users className="w-5 h-5 text-amber-600" /></div><div><p className="text-2xl font-bold text-amber-700">{levels.length}</p><p className="text-xs text-gray-500">{lang === 'fr' ? 'Niveaux' : 'Levels'}</p></div></div></div>
        </div>

        {activeTab === 'classes' && (
          <>
            {(!hasCycles || !hasLevels) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">{lang === 'fr' ? 'Structure incomplete' : 'Incomplete structure'}</p>
                  <p className="text-xs text-amber-700 mt-1">{!hasCycles ? (lang === 'fr' ? "Veuillez d'abord creer des cycles dans l'onglet \"Cycles\"." : 'Please create cycles first in the "Cycles" tab.') : (lang === 'fr' ? "Veuillez d'abord creer des niveaux dans l'onglet \"Niveaux\"." : 'Please create levels first in the "Levels" tab.')}</p>
                </div>
              </div>
            )}

            {showFilters && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-5 bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Filter className="w-5 h-5 text-blue-600" />{lang === 'fr' ? 'Filtrer et creer une classe' : 'Filter and create a class'}</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Section' : 'Section'} *</label>
                      <div className="relative">
                        <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select value={selectedSection} onChange={(e) => { setSelectedSection(Number(e.target.value) || ''); setSelectedCycle(''); setSelectedSpecialty(''); setSelectedLevel('') }} className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 appearance-none">
                          <option value="">{lang === 'fr' ? 'Selectionner...' : 'Select...'}</option>
                          {sections.map(s => (<option key={s.id} value={s.id}>{lang === 'fr' ? s.label_fr : s.label_en}</option>))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Cycle' : 'Cycle'} *</label>
                      <div className="relative">
                        <RotateCcw className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select value={selectedCycle} onChange={(e) => { setSelectedCycle(Number(e.target.value) || ''); setSelectedSpecialty(''); setSelectedLevel('') }} disabled={!selectedSection || cycles.length === 0} className={cn('w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 appearance-none', !selectedSection || cycles.length === 0 ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-200')}>
                          <option value="">{lang === 'fr' ? 'Selectionner...' : 'Select...'}</option>
                          {filteredCycles.map(c => (<option key={c.id} value={c.id}>{lang === 'fr' ? c.label_fr : c.label_en}</option>))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                      {selectedSection && cycles.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1"><Info className="w-3 h-3" />{lang === 'fr' ? "Aucun cycle pour cette section. Creez-en un dans l'onglet Cycles." : 'No cycles for this section. Create one in the Cycles tab.'}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Specialite / Serie' : 'Specialty / Series'} *</label>
                      <div className="relative">
                        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select value={selectedSpecialty} onChange={(e) => { setSelectedSpecialty(Number(e.target.value) || ''); setSelectedLevel('') }} disabled={!selectedCycle} className={cn('w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 appearance-none', !selectedCycle ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-200')}>
                          <option value="">{lang === 'fr' ? 'Selectionner...' : 'Select...'}</option>
                          {filteredSpecialties.map(s => (<option key={s.id} value={s.id}>{lang === 'fr' ? s.label_fr : s.label_en} ({s.code})</option>))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                      {selectedCycle && filteredSpecialties.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{lang === 'fr' ? 'Aucune specialite pour ce cycle' : 'No specialties for this cycle'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Niveau' : 'Level'} *</label>
                      <div className="relative">
                        <ArrowUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select value={selectedLevel} onChange={(e) => setSelectedLevel(Number(e.target.value) || '')} disabled={!selectedSpecialty || filteredLevels.length === 0} className={cn('w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 appearance-none', !selectedSpecialty || filteredLevels.length === 0 ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-200')}>
                          <option value="">{lang === 'fr' ? 'Selectionner...' : 'Select...'}</option>
                          {filteredLevels.map(l => (<option key={l.id} value={l.id}>{lang === 'fr' ? l.label_fr : l.label_en}</option>))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                      {selectedCycle && filteredLevels.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1"><Info className="w-3 h-3" />{lang === 'fr' ? "Aucun niveau pour ce cycle. Creez-en un dans l'onglet Niveaux." : 'No levels for this cycle. Create one in the Levels tab.'}</p>
                      )}
                    </div>
                    <div className="flex items-end">
                      <button onClick={handleCreateClass} disabled={!selectedLevel || !className.trim() || !classAbbrev.trim()} className={cn('flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md w-full', selectedLevel && className.trim() && classAbbrev.trim() ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed')}>
                        <Plus className="w-4 h-4" />{lang === 'fr' ? 'Ajouter Classe' : 'Add Class'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Nom de la classe' : 'Class name'} *</label>
                      <input type="text" value={className} onChange={(e) => setClassName(e.target.value)} disabled={!selectedLevel} placeholder={lang === 'fr' ? 'Ex: Quatrieme Allemande' : 'Ex: Fourth German'} className={cn('w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400', !selectedLevel ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-200')} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Abreviation' : 'Abbreviation'} *</label>
                      <input type="text" value={classAbbrev} onChange={(e) => setClassAbbrev(e.target.value.toUpperCase())} disabled={!selectedLevel} placeholder={lang === 'fr' ? 'Ex: 4e ALL' : 'Ex: 4th GER'} maxLength={20} className={cn('w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400', !selectedLevel ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-200')} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TABLE CLASSES - FIXED with Section, Cycle, Specialty columns */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden" ref={tableRef}>
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-600" />{lang === 'fr' ? 'Liste des classes' : 'Class list'}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{filteredClasses.length} {lang === 'fr' ? 'resultat(s)' : 'result(s)'}</span>
                  <div className="flex items-center gap-1 ml-2">
                    <button onClick={() => handleExport('excel')} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors border border-emerald-200" title="Excel"><FileText className="w-4 h-4" />Excel</button>
                    <button onClick={() => handleExport('csv')} className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200" title="CSV"><ArrowDown className="w-4 h-4" />CSV</button>
                    <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors border border-red-200" title="PDF"><Printer className="w-4 h-4" />PDF</button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{lang === 'fr' ? 'Section' : 'Section'}</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{lang === 'fr' ? 'Cycle' : 'Cycle'}</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{lang === 'fr' ? 'Specialite' : 'Specialty'}</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">{lang === 'fr' ? 'Niveau' : 'Level'}</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{lang === 'fr' ? 'Classe' : 'Class'}</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">{lang === 'fr' ? 'Abrev.' : 'Abbrev.'}</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">{lang === 'fr' ? 'Statut' : 'Status'}</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">{lang === 'fr' ? 'Actions' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredClasses.map((cls) => {
                      const isEditing = editingId === cls.id
                      const isOpen = cls.status === 'open'
                      const display = getClassDisplayData(cls)

                      return (
                        <tr key={cls.id} className="hover:bg-gray-50/50 transition-colors">
                          {/* Section */}
                          <td className="py-3 px-4">
                            <span className={cn('inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border', display.sectionId === 1 ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100')}>
                              {display.sectionName}
                            </span>
                          </td>
                          {/* Cycle */}
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-700">{display.cycleName}</span>
                          </td>
                          {/* Specialite */}
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                              {display.specialtyName}
                            </span>
                          </td>
                          {/* Niveau */}
                          <td className="py-3 px-4">
                            <span className="text-sm font-medium text-gray-700">{display.levelName}</span>
                          </td>
                          {/* Classe */}
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/30" autoFocus />
                            ) : (
                              <span className="text-sm font-medium text-gray-900">{cls.name}</span>
                            )}
                          </td>
                          {/* Abreviation */}
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input type="text" value={editAbbrev} onChange={(e) => setEditAbbrev(e.target.value.toUpperCase())} className="w-20 px-2 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/30" maxLength={20} />
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-wide bg-gray-100 text-gray-700">{cls.abbreviation}</span>
                            )}
                          </td>
                          {/* Statut */}
                          <td className="py-3 px-4 text-center">
                            <button onClick={() => handleToggleStatus(cls)} className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all', isOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100')}>
                              {isOpen ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                              {isOpen ? (lang === 'fr' ? 'Ouverte' : 'Open') : (lang === 'fr' ? 'Fermee' : 'Closed')}
                            </button>
                          </td>
                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {isEditing ? (
                                <>
                                  <button onClick={() => saveEdit(cls.id)} className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors"><Check className="w-4 h-4" /></button>
                                  <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors"><X className="w-4 h-4" /></button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => startEdit(cls)} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors" title={lang === 'fr' ? 'Modifier' : 'Edit'}><Edit2 className="w-4 h-4" /></button>
                                  <button onClick={() => handleDelete(cls.id)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors" title={lang === 'fr' ? 'Supprimer' : 'Delete'}><Trash2 className="w-4 h-4" /></button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {filteredClasses.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <School className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">{lang === 'fr' ? 'Aucune classe' : 'No classes'}</p>
                  <p className="text-sm mt-1">{lang === 'fr' ? 'Utilisez les filtres ci-dessus pour creer une classe' : 'Use the filters above to create a class'}</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'cycles' && (
          <div className="space-y-6">
            {!hasSections && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">{lang === 'fr' ? 'Aucune section disponible' : 'No sections available'}</p>
                  <p className="text-xs text-amber-700 mt-1">{lang === 'fr' ? "Veuillez d'abord configurer les sections dans les parametres de l'ecole." : 'Please configure sections in the school settings first.'}</p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-blue-100">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-blue-600" />
                  {editingCycleId ? (lang === 'fr' ? 'Modifier le cycle' : 'Edit cycle') : (lang === 'fr' ? 'Creer un cycle' : 'Create cycle')}
                </h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Section' : 'Section'} *</label>
                    <select value={selectedSection} onChange={(e) => setSelectedSection(Number(e.target.value) || '')} disabled={!hasSections} className={cn('w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400', !hasSections ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-200')}>
                      <option value="">{lang === 'fr' ? 'Selectionner...' : 'Select...'}</option>
                      {sections.map(s => (<option key={s.id} value={s.id}>{lang === 'fr' ? s.label_fr : s.label_en}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Code' : 'Code'} *</label>
                    <input type="text" value={cycleForm.code} onChange={(e) => setCycleForm({ ...cycleForm, code: e.target.value.toUpperCase() })} placeholder="1ST, 2ND" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Libelle FR' : 'Label FR'} *</label>
                    <input type="text" value={cycleForm.label_fr} onChange={(e) => setCycleForm({ ...cycleForm, label_fr: e.target.value })} placeholder={lang === 'fr' ? '1er Cycle' : '1st Cycle'} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Libelle EN' : 'Label EN'}</label>
                    <input type="text" value={cycleForm.label_en} onChange={(e) => setCycleForm({ ...cycleForm, label_en: e.target.value })} placeholder={lang === 'fr' ? '1st Cycle' : '1st Cycle'} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {editingCycleId ? (
                    <>
                      <button onClick={() => handleUpdateCycle(editingCycleId)} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md shadow-blue-200"><Save className="w-4 h-4" />{lang === 'fr' ? 'Enregistrer' : 'Save'}</button>
                      <button onClick={() => { setEditingCycleId(null); setCycleForm({ code: '', label_fr: '', label_en: '', order: 1 }) }} className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all"><X className="w-4 h-4" />{lang === 'fr' ? 'Annuler' : 'Cancel'}</button>
                    </>
                  ) : (
                    <button onClick={handleCreateCycle} disabled={!selectedSection || !cycleForm.code.trim() || !cycleForm.label_fr.trim()} className={cn('flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md', selectedSection && cycleForm.code.trim() && cycleForm.label_fr.trim() ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-blue-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed')}><Plus className="w-4 h-4" />{lang === 'fr' ? 'Ajouter Cycle' : 'Add Cycle'}</button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><RotateCcw className="w-5 h-5 text-blue-600" />{lang === 'fr' ? 'Liste des cycles' : 'Cycle list'}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{lang === 'fr' ? 'Section' : 'Section'}</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{lang === 'fr' ? 'Code' : 'Code'}</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{lang === 'fr' ? 'Libelle FR' : 'Label FR'}</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{lang === 'fr' ? 'Libelle EN' : 'Label EN'}</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">{lang === 'fr' ? 'Actions' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {cycles.map((cycle) => (
                      <tr key={cycle.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4"><span className="text-sm text-gray-700">{sections.find(s => s.id === cycle.section_id)?.label_fr || '\u2014'}</span></td>
                        <td className="py-3 px-4"><span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-wide bg-blue-100 text-blue-700">{cycle.code}</span></td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{cycle.label_fr}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{cycle.label_en}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => { setEditingCycleId(cycle.id); setCycleForm({ code: cycle.code, label_fr: cycle.label_fr, label_en: cycle.label_en, order: cycle.order }); setSelectedSection(cycle.section_id) }} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteCycle(cycle.id)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {cycles.length === 0 && (
                <div className="text-center py-12 text-gray-400"><RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-50" /><p className="text-lg font-medium">{lang === 'fr' ? 'Aucun cycle' : 'No cycles'}</p><p className="text-sm mt-1">{lang === 'fr' ? 'Creez un cycle pour commencer' : 'Create a cycle to get started'}</p></div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'levels' && (
          <div className="space-y-6">
            {!hasCycles && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">{lang === 'fr' ? 'Aucun cycle disponible' : 'No cycles available'}</p>
                  <p className="text-xs text-amber-700 mt-1">{lang === 'fr' ? "Veuillez d'abord creer des cycles dans l'onglet \"Cycles\"." : 'Please create cycles first in the "Cycles" tab.'}</p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 bg-gradient-to-r from-amber-50 to-amber-100/50 border-b border-amber-100">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <ArrowUp className="w-5 h-5 text-amber-600" />
                  {editingLevelId ? (lang === 'fr' ? 'Modifier le niveau' : 'Edit level') : (lang === 'fr' ? 'Creer un niveau' : 'Create level')}
                </h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Cycle' : 'Cycle'} *</label>
                    <select value={selectedCycle} onChange={(e) => setSelectedCycle(Number(e.target.value) || '')} disabled={cycles.length === 0} className={cn('w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400', cycles.length === 0 ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-200')}>
                      <option value="">{lang === 'fr' ? 'Selectionner...' : 'Select...'}</option>
                      {cycles.map(c => (<option key={c.id} value={c.id}>{lang === 'fr' ? c.label_fr : c.label_en} \u2014 {sections.find(s => s.id === c.section_id)?.label_fr || ''}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Code' : 'Code'} *</label>
                    <input type="text" value={levelForm.code} onChange={(e) => setLevelForm({ ...levelForm, code: e.target.value.toLowerCase() })} placeholder="6e, 5e, 2nd" className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Libelle FR' : 'Label FR'} *</label>
                    <input type="text" value={levelForm.label_fr} onChange={(e) => setLevelForm({ ...levelForm, label_fr: e.target.value })} placeholder={lang === 'fr' ? 'Sixieme' : 'Sixth'} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{lang === 'fr' ? 'Libelle EN' : 'Label EN'}</label>
                    <input type="text" value={levelForm.label_en} onChange={(e) => setLevelForm({ ...levelForm, label_en: e.target.value })} placeholder={lang === 'fr' ? 'Sixth' : 'Sixth'} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {editingLevelId ? (
                    <>
                      <button onClick={() => handleUpdateLevel(editingLevelId)} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl text-sm font-medium hover:from-amber-700 hover:to-amber-800 transition-all shadow-md shadow-amber-200"><Save className="w-4 h-4" />{lang === 'fr' ? 'Enregistrer' : 'Save'}</button>
                      <button onClick={() => { setEditingLevelId(null); setLevelForm({ code: '', label_fr: '', label_en: '', order: 1 }) }} className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all"><X className="w-4 h-4" />{lang === 'fr' ? 'Annuler' : 'Cancel'}</button>
                    </>
                  ) : (
                    <button onClick={handleCreateLevel} disabled={!selectedCycle || !levelForm.code.trim() || !levelForm.label_fr.trim()} className={cn('flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md', selectedCycle && levelForm.code.trim() && levelForm.label_fr.trim() ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800 shadow-amber-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed')}><Plus className="w-4 h-4" />{lang === 'fr' ? 'Ajouter Niveau' : 'Add Level'}</button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2"><ArrowUp className="w-5 h-5 text-amber-600" />{lang === 'fr' ? 'Liste des niveaux' : 'Level list'}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{lang === 'fr' ? 'Cycle' : 'Cycle'}</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{lang === 'fr' ? 'Code' : 'Code'}</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{lang === 'fr' ? 'Libelle FR' : 'Label FR'}</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{lang === 'fr' ? 'Libelle EN' : 'Label EN'}</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">{lang === 'fr' ? 'Actions' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {levels.map((level) => (
                      <tr key={level.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4"><span className="text-sm text-gray-700">{cycles.find(c => c.id === level.cycle_id)?.label_fr || '\u2014'}</span></td>
                        <td className="py-3 px-4"><span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-wide bg-amber-100 text-amber-700">{level.code}</span></td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{level.label_fr}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{level.label_en}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => { setEditingLevelId(level.id); setLevelForm({ code: level.code, label_fr: level.label_fr, label_en: level.label_en, order: level.order }); setSelectedCycle(level.cycle_id) }} className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteLevel(level.id)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {levels.length === 0 && (
                <div className="text-center py-12 text-gray-400"><ArrowUp className="w-12 h-12 mx-auto mb-3 opacity-50" /><p className="text-lg font-medium">{lang === 'fr' ? 'Aucun niveau' : 'No levels'}</p><p className="text-sm mt-1">{lang === 'fr' ? 'Creez un niveau pour commencer' : 'Create a level to get started'}</p></div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
