import { useState, useEffect, useCallback } from 'react'
import {
  ShieldAlert, Plus, Search, Filter, Download, Calendar,
  User, AlertTriangle, CheckCircle, XCircle, Eye, Edit2,
  Trash2, FileText, Send, ChevronDown, ChevronUp, TrendingUp,
  Users, Clock, Ban, RotateCcw, Printer
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { disciplineApi, studentsApi } from '@/services/api'
import { toast } from 'sonner'

// ==================== TYPES ====================
interface DisciplineRecord {
  id: number
  student_id: number
  student_name: string
  student_matricule: string
  class_name: string
  incident_type: 'absence' | 'retard' | 'trouble' | 'violence' | 'fraude' | 'autre'
  severity: 'leger' | 'moyen' | 'grave' | 'tres_grave'
  description: string
  date_incident: string
  reported_by: number
  reported_by_name: string
  sanction?: string
  sanction_executed: boolean
  parent_notified: boolean
  notes: string
  created_at: string
}

interface DisciplineStats {
  total_incidents: number
  by_type: Record<string, number>
  by_severity: Record<string, number>
  by_month: Array<{ month: string; count: number }>
  top_students: Array<{ student_id: number; student_name: string; count: number }>
  pending_sanctions: number
  parent_notifications: number
}

const INCIDENT_TYPES: Record<string, { label: string; color: string; icon: any }> = {
  absence: { label: 'Absence', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
  retard: { label: 'Retard', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  trouble: { label: 'Trouble', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertTriangle },
  violence: { label: 'Violence', color: 'bg-red-100 text-red-700 border-red-200', icon: ShieldAlert },
  fraude: { label: 'Fraude', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: FileText },
  autre: { label: 'Autre', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: AlertTriangle },
}

const SEVERITY_CONFIG: Record<string, { label: string; color: string; points: number }> = {
  leger: { label: 'Léger', color: 'bg-green-100 text-green-700 border-green-200', points: 1 },
  moyen: { label: 'Moyen', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', points: 3 },
  grave: { label: 'Grave', color: 'bg-orange-100 text-orange-700 border-orange-200', points: 5 },
  tres_grave: { label: 'Très grave', color: 'bg-red-100 text-red-700 border-red-200', points: 10 },
}

const SANCTIONS = [
  'Avertissement verbal',
  'Avertissement écrit',
  'Travail d\'intérêt général',
  'Retenue',
  'Exclusion temporaire (1-3 jours)',
  'Exclusion temporaire (1-2 semaines)',
  'Exclusion définitive',
  'Convocation parents',
  'Rapport au conseil de discipline',
]

export default function DisciplinePage() {
  const { user } = useAuthStore()
  const [records, setRecords] = useState<DisciplineRecord[]>([])
  const [stats, setStats] = useState<DisciplineStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [perPage] = useState(20)
  const [total, setTotal] = useState(0)

  // Filters
  const [filters, setFilters] = useState({
    student_id: '',
    incident_type: '',
    severity: '',
    date_from: '',
    date_to: '',
    sanction_executed: '',
    search: '',
  })
  const [showFilters, setShowFilters] = useState(false)

  // Modals
  const [showForm, setShowForm] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [showConvocation, setShowConvocation] = useState(false)
  const [editingRecord, setEditingRecord] = useState<DisciplineRecord | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<DisciplineRecord | null>(null)
  const [students, setStudents] = useState<any[]>([])

  const [formData, setFormData] = useState({
    student_id: '',
    incident_type: 'absence',
    severity: 'leger',
    description: '',
    date_incident: new Date().toISOString().split('T')[0],
    sanction: '',
    notes: '',
  })

  const loadRecords = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = {
        page,
        per_page: perPage,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        ),
      }
      const response = await disciplineApi.getAll(params)
      setRecords(response.items || [])
      setTotal(response.total || 0)
    } catch (err) {
      toast.error('Erreur lors du chargement des incidents')
    } finally {
      setLoading(false)
    }
  }, [page, perPage, filters])

  const loadStats = useCallback(async () => {
    try {
      const response = await disciplineApi.getStats()
      setStats(response)
    } catch (err) {
      console.error('Error loading stats:', err)
    }
  }, [])

  const loadStudents = useCallback(async () => {
    try {
      const response = await studentsApi.getAll({ per_page: 1000, status: 'active' })
      setStudents(response.items || [])
    } catch (err) {
      console.error('Error loading students:', err)
    }
  }, [])

  useEffect(() => {
    loadRecords()
    loadStats()
    loadStudents()
  }, [loadRecords, loadStats, loadStudents])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        student_id: parseInt(formData.student_id),
      }

      if (editingRecord) {
        await disciplineApi.update(editingRecord.id, data)
        toast.success('Incident mis à jour')
      } else {
        await disciplineApi.create(data)
        toast.success('Incident enregistré')
      }
      setShowForm(false)
      setEditingRecord(null)
      resetForm()
      loadRecords()
      loadStats()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Erreur lors de l\'enregistrement')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet incident ?')) return
    try {
      await disciplineApi.delete(id)
      toast.success('Incident supprimé')
      loadRecords()
      loadStats()
    } catch (err) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleToggleSanction = async (record: DisciplineRecord) => {
    try {
      await disciplineApi.update(record.id, {
        sanction_executed: !record.sanction_executed,
      })
      toast.success('Statut mis à jour')
      loadRecords()
    } catch (err) {
      toast.error('Erreur')
    }
  }

  const handleNotifyParent = async (record: DisciplineRecord) => {
    try {
      await disciplineApi.createConvocation({
        discipline_id: record.id,
        parent_name: '',
        convocation_date: new Date().toISOString().split('T')[0],
        reason: record.description,
      })
      toast.success('Convocation envoyée')
      setShowConvocation(false)
      loadRecords()
    } catch (err) {
      toast.error('Erreur lors de l\'envoi')
    }
  }

  const resetForm = () => {
    setFormData({
      student_id: '',
      incident_type: 'absence',
      severity: 'leger',
      description: '',
      date_incident: new Date().toISOString().split('T')[0],
      sanction: '',
      notes: '',
    })
  }

  const editRecord = (record: DisciplineRecord) => {
    setEditingRecord(record)
    setFormData({
      student_id: record.student_id.toString(),
      incident_type: record.incident_type,
      severity: record.severity,
      description: record.description,
      date_incident: record.date_incident,
      sanction: record.sanction || '',
      notes: record.notes,
    })
    setShowForm(true)
  }

  const viewDetail = (record: DisciplineRecord) => {
    setSelectedRecord(record)
    setShowDetail(true)
  }

  const getIncidentBadge = (type: string) => {
    const config = INCIDENT_TYPES[type] || INCIDENT_TYPES.autre
    const IconComponent = config.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </span>
    )
  }

  const getSeverityBadge = (severity: string) => {
    const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.leger
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        {config.label} ({config.points} pts)
      </span>
    )
  }

  const clearFilters = () => {
    setFilters({
      student_id: '',
      incident_type: '',
      severity: '',
      date_from: '',
      date_to: '',
      sanction_executed: '',
      search: '',
    })
    setPage(1)
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title flex items-center gap-3">
              <ShieldAlert className="h-7 w-7 text-primary-600" />
              Gestion Disciplinaire
            </h1>
            <p className="page-subtitle">
              Suivi des incidents, sanctions et convocations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-outline"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filtres
            </button>
            <button
              onClick={() => { setEditingRecord(null); resetForm(); setShowForm(true) }}
              className="btn-primary"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouvel incident
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_incidents || 0}</p>
              <p className="text-sm text-gray-500">Total incidents</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.pending_sanctions || 0}</p>
              <p className="text-sm text-gray-500">Sanctions en attente</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.parent_notifications || 0}</p>
              <p className="text-sm text-gray-500">Parents notifiés</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {records.filter(r => !r.sanction_executed).length}
              </p>
              <p className="text-sm text-gray-500">À traiter</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card mb-6">
          <div className="card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="label">Type d'incident</label>
                <select
                  value={filters.incident_type}
                  onChange={(e) => setFilters({ ...filters, incident_type: e.target.value })}
                  className="input"
                >
                  <option value="">Tous</option>
                  {Object.entries(INCIDENT_TYPES).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Sévérité</label>
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                  className="input"
                >
                  <option value="">Toutes</option>
                  {Object.entries(SEVERITY_CONFIG).map(([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Statut sanction</label>
                <select
                  value={filters.sanction_executed}
                  onChange={(e) => setFilters({ ...filters, sanction_executed: e.target.value })}
                  className="input"
                >
                  <option value="">Tous</option>
                  <option value="true">Exécutée</option>
                  <option value="false">En attente</option>
                </select>
              </div>
              <div>
                <label className="label">Date début</label>
                <input
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Date fin</label>
                <input
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Recherche</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Élève, matricule..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="input pl-10"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={clearFilters} className="btn-outline">
                Réinitialiser
              </button>
              <button onClick={() => { setPage(1); loadRecords() }} className="btn-primary">
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold">Liste des incidents</h3>
          <p className="text-sm text-gray-500">{total} entrées trouvées</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Élève</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sévérité</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sanction</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    Chargement...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    <ShieldAlert className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Aucun incident trouvé</p>
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(record.date_incident).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{record.student_name}</p>
                          <p className="text-xs text-gray-500">{record.student_matricule}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getIncidentBadge(record.incident_type)}
                    </td>
                    <td className="px-4 py-3">
                      {getSeverityBadge(record.severity)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {record.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {record.sanction || '-'}
                    </td>
                    <td className="px-4 py-3">
                      {record.sanction_executed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3" />
                          Exécutée
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          <Clock className="w-3 h-3" />
                          En attente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => viewDetail(record)}
                          className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => editRecord(record)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleSanction(record)}
                          className="p-1.5 hover:bg-green-50 rounded-lg text-green-600"
                          title={record.sanction_executed ? 'Marquer non exécutée' : 'Marquer exécutée'}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedRecord(record); setShowConvocation(true) }}
                          className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"
                          title="Convocation parent"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-600"
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
        {total > perPage && (
          <div className="card-footer flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Affichage de {(page - 1) * perPage + 1} à {Math.min(page * perPage, total)} sur {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Précédent
              </button>
              <span className="text-sm text-gray-600">
                Page {page} / {Math.ceil(total / perPage)}
              </span>
              <button
                onClick={() => setPage(Math.min(Math.ceil(total / perPage), page + 1))}
                disabled={page >= Math.ceil(total / perPage)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowForm(false); setEditingRecord(null) }} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full animate-bounce-in max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold">
                {editingRecord ? 'Modifier l\'incident' : 'Nouvel incident disciplinaire'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Élève *</label>
                <select
                  required
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  className="input"
                >
                  <option value="">Sélectionner...</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.matricule} - {s.first_name} {s.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Type *</label>
                  <select
                    required
                    value={formData.incident_type}
                    onChange={(e) => setFormData({ ...formData, incident_type: e.target.value })}
                    className="input"
                  >
                    {Object.entries(INCIDENT_TYPES).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Sévérité *</label>
                  <select
                    required
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="input"
                  >
                    {Object.entries(SEVERITY_CONFIG).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Date de l'incident *</label>
                <input
                  type="date"
                  required
                  value={formData.date_incident}
                  onChange={(e) => setFormData({ ...formData, date_incident: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  placeholder="Décrire l'incident..."
                />
              </div>
              <div>
                <label className="label">Sanction</label>
                <select
                  value={formData.sanction}
                  onChange={(e) => setFormData({ ...formData, sanction: e.target.value })}
                  className="input"
                >
                  <option value="">Aucune</option>
                  {SANCTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Notes complémentaires</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  placeholder="Notes internes..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingRecord(null) }}
                  className="btn-outline"
                >
                  Annuler
                </button>
                <button type="submit" className="btn-primary">
                  {editingRecord ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetail(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full animate-bounce-in">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Détails de l'incident #{selectedRecord.id}</h3>
              <button onClick={() => setShowDetail(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Élève</label>
                  <p className="text-sm font-medium">{selectedRecord.student_name}</p>
                  <p className="text-xs text-gray-500">{selectedRecord.student_matricule}</p>
                </div>
                <div>
                  <label className="label">Classe</label>
                  <p className="text-sm font-medium">{selectedRecord.class_name}</p>
                </div>
                <div>
                  <label className="label">Type</label>
                  <div className="mt-1">{getIncidentBadge(selectedRecord.incident_type)}</div>
                </div>
                <div>
                  <label className="label">Sévérité</label>
                  <div className="mt-1">{getSeverityBadge(selectedRecord.severity)}</div>
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{selectedRecord.description}</p>
              </div>
              {selectedRecord.sanction && (
                <div>
                  <label className="label">Sanction</label>
                  <p className="text-sm font-medium text-red-600">{selectedRecord.sanction}</p>
                  <p className="text-xs text-gray-500">
                    {selectedRecord.sanction_executed ? 'Exécutée' : 'En attente d\'exécution'}
                  </p>
                </div>
              )}
              <div>
                <label className="label">Signalé par</label>
                <p className="text-sm">{selectedRecord.reported_by_name}</p>
              </div>
              {selectedRecord.notes && (
                <div>
                  <label className="label">Notes</label>
                  <p className="text-sm text-gray-600">{selectedRecord.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Convocation Modal */}
      {showConvocation && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConvocation(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-bounce-in">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold">Convocation parent</h3>
              <p className="text-sm text-gray-500">
                Incident: {selectedRecord.description.substring(0, 50)}...
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Attention</p>
                    <p className="text-sm text-amber-700">
                      Une convocation sera envoyée aux parents de {selectedRecord.student_name} concernant cet incident.
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <label className="label">Motif de la convocation</label>
                <textarea
                  rows={3}
                  defaultValue={selectedRecord.description}
                  className="input"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
              <button onClick={() => setShowConvocation(false)} className="btn-outline">
                Annuler
              </button>
              <button
                onClick={() => handleNotifyParent(selectedRecord)}
                className="btn-primary"
              >
                <Send className="mr-2 h-4 w-4" />
                Envoyer la convocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}