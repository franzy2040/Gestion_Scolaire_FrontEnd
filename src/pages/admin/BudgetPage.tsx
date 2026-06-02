import { useState, useEffect , useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Wallet, Plus, Printer, FileSpreadsheet, Search,
  ChevronDown, ChevronRight, Trash2, CheckCircle,
  TrendingUp, DollarSign, AlertTriangle, ArrowLeft,
  Loader2, X, Download, Eye, BarChart3, Receipt,
  ArrowUpRight, ArrowDownRight, RefreshCw, Info,
  ChevronUp, Pencil, FileText, Save, ShieldCheck,
  UserCheck, UserX, FilePlus, FileMinus
} from 'lucide-react'
import { toast } from 'sonner'
import { budgetApi } from '../../services/budgetService'
import { useAuthStore } from '../../store/authStore'
import type {
  BudgetYear, BudgetMainLine, BudgetExpense,
  PaginatedExpenses, BudgetStatistics, BudgetSubLine
} from '../../types/budgetTypes'

// ==================== TYPES ====================
interface BudgetInitForm {
  school_id: number
  academic_year_id: number
  label: string
  initial_balance: number
  notes: string
}

interface ExpenseForm {
  name: string
  description: string
  quantity: number
  unit_price: number
  expense_date: string
  payment_method: string
  beneficiary: string
}

// ← CORRIGÉ: ajout des champs requis par Pydantic
interface SubLineForm {
  name: string
  code: string
  quantity: number
  unit_price: number
  description?: string
}

// ← CORRIGÉ: ajout des champs requis par Pydantic
interface MainLineForm {
  name: string
  code: string
  description?: string
  planned_amount: number
}

// ==================== SERVICE HOOK ====================
function useBudget(budgetId?: number) {
  const [budgets, setBudgets] = useState<BudgetYear[]>([])
  const [budget, setBudget] = useState<BudgetYear | null>(null)
  const [mainLines, setMainLines] = useState<BudgetMainLine[]>([])
  const [expenses, setExpenses] = useState<PaginatedExpenses | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [budgetExists, setBudgetExists] = useState(false)

  const loadBudgets = async () => {
    setIsLoading(true)
    try {
      const res = await budgetApi.getBudgets({ page: 1, per_page: 50 })
      const list = res.data || []
      setBudgets(list)
      setBudgetExists(list.length > 0)
      setError(null)
    } catch (e: any) {
      setError(e.message || 'Erreur chargement budgets')
      setBudgetExists(false)
    } finally {
      setIsLoading(false)
    }
  }

  const loadBudget = async (id: number) => {
    setIsLoading(true)
    try {
      const res = await budgetApi.getBudgetFull(id)
      setBudget(res)
      setMainLines(res.main_lines || [])
      setError(null)
    } catch (e: any) {
      setError(e.message || 'Erreur chargement budget')
      toast.error('Erreur chargement budget')
    } finally {
      setIsLoading(false)
    }
  }

  const loadExpenses = async (id: number, page = 1) => {
    try {
      console.log('📥 Chargement dépenses - budgetId:', id, 'page:', page)
      const res = await budgetApi.getExpenses(id, { page, per_page: 20 })
      console.log('📥 Réponse dépenses:', res)

      // Vérifier que la réponse a la bonne structure
      if (res && typeof res === 'object' && Array.isArray(res.data)) {
        setExpenses(res)
      } else if (res && Array.isArray(res)) {
        // Si le backend retourne un array directement
        setExpenses({
          data: res,
          total: res.length,
          page: 1,
          per_page: res.length,
          total_pages: 1,
          has_next: false,
          has_prev: false
        })
      } else {
        console.warn('⚠️ Structure de réponse dépenses inattendue:', res)
        setExpenses({ data: [], total: 0, page: 1, per_page: 20, total_pages: 0, has_next: false, has_prev: false })
      }
    } catch (e: any) {
      console.error('❌ Erreur loadExpenses:', e)
      console.error('❌ Response data:', e.response?.data)
      console.error('❌ Response status:', e.response?.status)
      toast.error(e.response?.data?.detail || 'Erreur chargement dépenses')
    }
  }

  const initialize = async (data: BudgetInitForm) => {
    setIsLoading(true)
    try {
      const res = await budgetApi.initializeBudget(data)
      toast.success('Budget initialisé avec succès')
      await loadBudgets()
      return res
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Erreur initialisation'
      toast.error(msg)
      if (msg.includes('existe déjà') || msg.includes('already')) {
        await loadBudgets()
      }
      throw e
    } finally {
      setIsLoading(false)
    }
  }

  const approveBudget = async (id: number, notes?: string) => {
    setIsLoading(true)
    try {
      await budgetApi.approveBudget(id, { notes: notes || 'Approuvé' })
      toast.success('Budget approuvé')
      if (budgetId) await loadBudget(budgetId)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Erreur approbation')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteMainLine = async (id: number) => {
    try {
      await budgetApi.deleteMainLine(id)
      toast.success('Rubrique supprimée')
      if (budgetId) await loadBudget(budgetId)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Erreur suppression')
    }
  }

  const deleteExpense = async (id: number) => {
    try {
      await budgetApi.deleteExpense(id)
      toast.success('Dépense supprimée')
      if (budgetId) await loadExpenses(budgetId)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Erreur suppression')
    }
  }

  const createExpense = async (budgetYearId: number, data: ExpenseForm & { main_line_id: number; sub_line_id?: number }) => {
    try {
      // ← CORRIGÉ: envoyer budget_year_id explicitement pour Pydantic
      const payload = {
        ...data,
        expense_type: 'expense',
        budget_year_id: budgetYearId,
        main_line_id: data.main_line_id,
        sub_line_id: data.sub_line_id ?? null,
        description: data.description || null,
        payment_method: data.payment_method || null,
        beneficiary: data.beneficiary || null,
      }
      console.log('📤 Payload dépense:', JSON.stringify(payload, null, 2))
      await budgetApi.createExpense(budgetYearId, payload)
      toast.success('Dépense enregistrée')
      if (budgetId) {
        await loadBudget(budgetId)
        await loadExpenses(budgetId)
      }
    } catch (e: any) {
      console.error('❌ Erreur création dépense:', e.response?.data)
      toast.error(e.response?.data?.detail || e.message || 'Erreur création dépense')
      throw e
    }
  }


     // ← NOUVEAU: Validation d'une dépense
  const validateExpense = async (expenseId: number) => {
    try {
      await budgetApi.validateExpense(expenseId)
      toast.success('Dépense validée avec succès')
      if (budgetId) {
        await loadBudget(budgetId)
        await loadExpenses(budgetId)
      }
    } catch (e: any) {
      console.error('❌ Erreur validation:', e.response?.data)
      toast.error(e.response?.data?.detail || 'Erreur validation dépense')
      throw e
    }
  }

  // ← CORRIGÉ V3: envoyer TOUS les champs requis par BudgetSubLineCreate Pydantic
  const createSubLine = async (mainLineId: number, data: SubLineForm) => {
    try {
      await budgetApi.createSubLine(mainLineId, {
        name: data.name,
        code: data.code,
        quantity: data.quantity,
        unit_price: data.unit_price,
        description: data.description || undefined,
        main_line_id: mainLineId,      // ← REQUIS par Pydantic
        order_index: 999,               // ← REQUIS par Pydantic (backend réordonne)
      })
      toast.success('Sous-rubrique ajoutée')
      if (budgetId) await loadBudget(budgetId)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Erreur création sous-rubrique')
      throw e
    }
  }

  // ← CORRIGÉ V3: envoyer TOUS les champs requis par BudgetMainLineCreate Pydantic
  const createMainLine = async (budgetYearId: number, data: MainLineForm) => {
    try {
      await budgetApi.createMainLine(budgetYearId, {
        name: data.name,
        code: data.code,
        description: data.description || undefined,
        planned_amount: data.planned_amount,
        budget_year_id: budgetYearId,  // ← REQUIS par Pydantic
        order_index: 999,              // ← REQUIS par Pydantic (backend réordonne)
      })
      toast.success('Rubrique ajoutée')
      if (budgetId) await loadBudget(budgetId)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Erreur création rubrique')
      throw e
    }
  }

  const exportPDF = async (budgetYearId: number, type: 'initial' | 'expense') => {
    try {
      if (type === 'initial') {
        const res = await budgetApi.printBudgetInitial(budgetYearId)
        if (res.download_url) {
          window.open(res.download_url, '_blank')
          toast.success('PDF généré avec succès')
        }
      }
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Erreur export PDF')
    }
  }

  const exportExcel = async (budgetYearId: number) => {
    try {
      const res = await budgetApi.exportExcel(budgetYearId)
      if (res.download_url) {
        window.open(res.download_url, '_blank')
        toast.success('Excel exporté avec succès')
      }
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Erreur export Excel')
    }
  }

  useEffect(() => {
    loadBudgets()
  }, [])

  useEffect(() => {
    if (budgetId) {
      loadBudget(budgetId)
      loadExpenses(budgetId)
    }
  }, [budgetId])

  return {
    budgets,
    budget,
    mainLines,
    expenses,
    isLoading,
    error,
    budgetExists,
    initialize,
    approveBudget,
    deleteMainLine,
    deleteExpense,
    createExpense,
    validateExpense,
    createSubLine,
    createMainLine,
    exportPDF,
    exportExcel,
    loadBudget,
    loadExpenses,
    loadBudgets,
  }
}

// ==================== COMPONENT ====================
export default function BudgetPage() {
  const navigate = useNavigate()
  const [selectedBudgetId, setSelectedBudgetId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'lines' | 'expenses' | 'reports'>('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedLines, setExpandedLines] = useState<Set<number>>(new Set())
  const [showInitModal, setShowInitModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showSubLineModal, setShowSubLineModal] = useState(false)
  const [showAddMainLineModal, setShowAddMainLineModal] = useState(false)
  //const [selectedMainLine, setSelectedMainLine] = useState<BudgetMainLine | null>(null)
  
  const [showExpenseDetailModal, setShowExpenseDetailModal] = useState(false)  // ← NOUVEAU
  const [selectedMainLine, setSelectedMainLine] = useState<BudgetMainLine | null>(null)
  const [selectedExpense, setSelectedExpense] = useState<BudgetExpense | null>(null)  // ← NOUVEAU

  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: number } | null>(null)
  const [expensePage, setExpensePage] = useState(1)

  const {
    budgets,
    budget,
    mainLines,
    expenses,
    isLoading,
    error,
    budgetExists, 
    validateExpense, // ← NOUVEAU
    initialize,
    approveBudget,
    deleteMainLine,
    deleteExpense,
    createExpense,  
    createSubLine,
    createMainLine,
    exportPDF,
    exportExcel,
    loadBudget,
    loadExpenses,
    loadBudgets,
  } = useBudget(selectedBudgetId || undefined)

  useEffect(() => {
    if (!selectedBudgetId && budgets.length > 0) {
      setSelectedBudgetId(budgets[0].id)
    }
  }, [budgets, selectedBudgetId])

  const toggleLine = (id: number) => {
    const newSet = new Set(expandedLines)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setExpandedLines(newSet)
  }

  const handleInitialize = async (data: BudgetInitForm) => {
    try {
      await initialize(data)
      setShowInitModal(false)
    } catch (e) {
      // Erreur déjà toastée
    }
  }

  const handleAddExpense = (mainLine: BudgetMainLine) => {
    setSelectedMainLine(mainLine)
    setShowExpenseModal(true)
  }

  const handleAddSubLine = (mainLine: BudgetMainLine) => {
    setSelectedMainLine(mainLine)
    setShowSubLineModal(true)
  }

   // ← NOUVEAU: Voir le détail d'une dépense
  const handleViewExpense = (expense: BudgetExpense) => {
    setSelectedExpense(expense)
    setShowExpenseDetailModal(true)
  }

  // ← NOUVEAU: Valider une dépense
  const handleValidateExpense = async (expenseId: number) => {
    try {
      await validateExpense(expenseId)
      setShowExpenseDetailModal(false)
      setSelectedExpense(null)
    } catch (e) {
      // Erreur déjà toastée
    }
  }
  const handleDelete = () => {
    if (!confirmDelete) return
    if (confirmDelete.type === 'mainLine') deleteMainLine(confirmDelete.id)
    else if (confirmDelete.type === 'expense') deleteExpense(confirmDelete.id)
    setConfirmDelete(null)
  }

  const handleExpenseSubmit = async (data: ExpenseForm & { main_line_id: number }) => {
    if (!selectedBudgetId || !selectedMainLine) return
    await createExpense(selectedBudgetId, { ...data, sub_line_id: undefined })
    setShowExpenseModal(false)
    setSelectedMainLine(null)
  }

  const handleSubLineSubmit = async (data: SubLineForm) => {
    if (!selectedMainLine) return
    await createSubLine(selectedMainLine.id, data)
    setShowSubLineModal(false)
    setSelectedMainLine(null)
  }

  const handleMainLineSubmit = async (data: MainLineForm) => {
    if (!selectedBudgetId) return
    await createMainLine(selectedBudgetId, data)
    setShowAddMainLineModal(false)
  }

  const usageRate = budget?.statistics?.utilization_rate ??
    (budget?.total_planned && budget.total_planned > 0
      ? ((budget.total_expenses || 0) / budget.total_planned) * 100
      : 0)

  if (isLoading && !budgetExists && !budget) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-500">Chargement des budgets...</p>
        </div>
      </div>
    )
  }

  if (!budgetExists && !isLoading) {
    return (
      <div className="animate-fade-in p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </button>
        </div>
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Wallet className="h-10 w-10 text-primary-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucun budget créé</h2>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            Initialisez votre premier budget annuel avec les 14 rubriques de base pour commencer la gestion financière.
          </p>
          <button onClick={() => setShowInitModal(true)} className="btn-primary text-base px-6 py-3">
            <Plus className="mr-2 h-5 w-5" />
            Initialiser un budget
          </button>
        </div>
        {showInitModal && <BudgetInitModal onClose={() => setShowInitModal(false)} onSubmit={handleInitialize} />}
      </div>
    )
  }

  if (error && !budget && budgets.length === 0) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="card p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-600 mb-2">Erreur de chargement</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  const currentBudget = budget

  return (
    <div className="animate-fade-in p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </button>
        {currentBudget?.status && (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            currentBudget.status === 'active' ? 'bg-green-100 text-green-700' :
            currentBudget.status === 'draft' ? 'bg-amber-100 text-amber-700' :
            currentBudget.status === 'closed' ? 'bg-gray-100 text-gray-600' :
            'bg-blue-100 text-blue-700'
          }`}>
            {currentBudget.status === 'active' ? 'Actif' :
             currentBudget.status === 'draft' ? 'Brouillon' :
             currentBudget.status === 'closed' ? 'Clôturé' : currentBudget.status}
          </span>
        )}
      </div>

      {/* Title */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {currentBudget?.label || 'Budget Scolaire'}
                </h1>
                <p className="text-sm text-gray-500">
                  {currentBudget?.reference_number || '---'} · Année: {currentBudget?.academic_year_label || '---'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {budgets.length > 0 && (
              <select
                value={selectedBudgetId || ''}
                onChange={(e) => setSelectedBudgetId(Number(e.target.value))}
                className="input text-sm bg-white border-gray-200"
              >
                {budgets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.reference_number} — {b.label}
                  </option>
                ))}
              </select>
            )}

            {currentBudget?.status === 'draft' && (
              <button
                onClick={() => selectedBudgetId && approveBudget(selectedBudgetId)}
                className="btn-success"
                disabled={isLoading}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approuver
              </button>
            )}

            <button 
              className="btn-outline" 
              disabled={isLoading || !selectedBudgetId}
              onClick={() => selectedBudgetId && exportPDF(selectedBudgetId, 'initial')}
            >
              <Printer className="mr-2 h-4 w-4" />
              PDF
            </button>
            <button 
              className="btn-outline" 
              disabled={isLoading || !selectedBudgetId}
              onClick={() => selectedBudgetId && exportExcel(selectedBudgetId)}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </button>
            <button
              onClick={() => setShowInitModal(true)}
              className="btn-primary"
              disabled={isLoading}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouveau
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card border-l-4 border-l-blue-500">
          <div className="card-body p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Solde Initial</span>
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {(currentBudget?.initial_balance ?? 0).toLocaleString()} <span className="text-sm font-normal text-gray-500">FCFA</span>
            </p>
          </div>
        </div>

        <div className="card border-l-4 border-l-emerald-500">
          <div className="card-body p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Total Prévu</span>
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {(currentBudget?.total_planned ?? 0).toLocaleString()} <span className="text-sm font-normal text-gray-500">FCFA</span>
            </p>
          </div>
        </div>

        <div className="card border-l-4 border-l-red-500">
          <div className="card-body p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Total Dépensé</span>
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                <Receipt className="h-4 w-4 text-red-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {(currentBudget?.total_expenses ?? 0).toLocaleString()} <span className="text-sm font-normal text-gray-500">FCFA</span>
            </p>
            <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-red-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(usageRate, 100)}%` }} />
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-l-amber-500">
          <div className="card-body p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Solde Actuel</span>
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
                <Wallet className="h-4 w-4 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {(currentBudget?.current_balance ?? 0).toLocaleString()} <span className="text-sm font-normal text-gray-500">FCFA</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">{usageRate.toFixed(1)}% utilisé</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="card mb-6">
        <div className="card-body p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progression globale</span>
            <span className={`text-sm font-bold ${usageRate > 90 ? 'text-red-600' : usageRate > 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {usageRate.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all ${usageRate > 90 ? 'bg-red-500' : usageRate > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(usageRate, 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>0 FCFA</span>
            <span>{(currentBudget?.total_planned ?? 0).toLocaleString()} FCFA</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1">
          {[
            { id: 'overview' as const, label: "Vue d'ensemble", icon: BarChart3 },
            { id: 'lines' as const, label: 'Rubriques', icon: FileText },
            { id: 'expenses' as const, label: 'Dépenses', icon: Receipt },
            { id: 'reports' as const, label: 'Rapports', icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ─── TAB: OVERVIEW ─── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card">
              <div className="card-header border-b border-gray-100">
                <h3 className="font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary-600" />
                  Utilisation par rubrique
                </h3>
              </div>
              <div className="card-body p-4 space-y-4 max-h-[500px] overflow-y-auto">
                {mainLines?.map((line) => {
                  const planned = line.planned_amount ?? 0
                  const actual = line.actual_amount ?? 0
                  const percentage = planned > 0 ? (actual / planned) * 100 : 0
                  return (
                    <div key={line.id} className="group">
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{line.code}</span>
                          <span className="text-sm font-medium text-gray-700">{line.name}</span>
                        </div>
                        <span className={`text-xs font-bold ${percentage > 90 ? 'text-red-600' : percentage > 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all ${percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>{actual.toLocaleString()} FCFA</span>
                        <span>{planned.toLocaleString()} FCFA</span>
                      </div>
                    </div>
                  )
                })}
                {(!mainLines || mainLines.length === 0) && (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Aucune rubrique disponible</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="card">
                <div className="card-header border-b border-gray-100">
                  <h3 className="font-semibold">Résumé</h3>
                </div>
                <div className="card-body p-4 space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500">Nombre de rubriques</span>
                    <span className="font-semibold">{mainLines?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500">Nombre de dépenses</span>
                    <span className="font-semibold">{expenses?.total || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-50">
                    <span className="text-sm text-gray-500">Taux d'utilisation</span>
                    <span className={`font-semibold ${usageRate > 90 ? 'text-red-600' : 'text-emerald-600'}`}>{usageRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-500">Solde restant</span>
                    <span className="font-semibold text-emerald-600">{(currentBudget?.current_balance ?? 0).toLocaleString()} FCFA</span>
                  </div>
                </div>
              </div>

              {currentBudget?.statistics?.top_expenses && currentBudget.statistics.top_expenses.length > 0 && (
                <div className="card">
                  <div className="card-header border-b border-gray-100">
                    <h3 className="font-semibold">Top dépenses</h3>
                  </div>
                  <div className="card-body p-4 space-y-3">
                    {currentBudget.statistics.top_expenses.map((exp, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">{idx + 1}</span>
                          <span className="text-sm text-gray-700">{exp.name}</span>
                        </div>
                        <span className="text-sm font-semibold">{exp.amount.toLocaleString()} FCFA</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: LINES ─── */}
      {activeTab === 'lines' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Rechercher une rubrique..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} className="input pl-10 w-full" />
            </div>
            <div className="flex gap-2">
              <button 
                className="btn-outline" 
                disabled={isLoading || !selectedBudgetId}
                onClick={() => selectedBudgetId && exportPDF(selectedBudgetId, 'initial')}
              >
                <Printer className="mr-2 h-4 w-4" />
                PDF
              </button>
              <button 
                className="btn-outline" 
                disabled={isLoading || !selectedBudgetId}
                onClick={() => selectedBudgetId && exportExcel(selectedBudgetId)}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
              </button>
              <button onClick={() => setShowAddMainLineModal(true)} className="btn-primary whitespace-nowrap" disabled={isLoading}>
                <Plus className="mr-2 h-4 w-4" />Ajouter rubrique
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {mainLines?.filter((l) => l.name.toLowerCase().includes(searchQuery.toLowerCase()) || (l.code ?? '').includes(searchQuery))
              .map((line) => {
                const planned = line.planned_amount ?? 0
                const actual = line.actual_amount ?? 0
                const remaining = line.remaining_amount ?? 0
                const percentage = planned > 0 ? (actual / planned) * 100 : 0
                const isExpanded = expandedLines.has(line.id)
                const subLinesTotal = line.sub_lines?.reduce((sum, sl) => sum + (sl.total_amount ?? 0), 0) ?? 0

                return (
                  <div key={line.id} className="card overflow-hidden">
                    <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => toggleLine(line.id)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                            {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                          </button>
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{line.code}</span>
                          <span className="font-medium text-gray-900">{line.name}</span>
                          {line.is_system && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded-full font-medium">Système</span>}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold">{planned.toLocaleString()} FCFA</p>
                            <p className="text-xs text-gray-400">{actual.toLocaleString()} dépensé</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); handleAddExpense(line) }}
                              className="p-2 hover:bg-primary-50 text-primary-600 rounded-lg transition-colors" title="Ajouter dépense">
                              <Plus className="h-4 w-4" />
                            </button>
                            {!line.is_system && (
                              <button onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: 'mainLine', id: line.id }) }}
                                className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors" title="Supprimer">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full transition-all ${percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }} />
                        </div>
                        <span className={`text-xs font-medium ${percentage > 90 ? 'text-red-600' : percentage > 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50/50">
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-600">Sous-rubriques</h4>
                            <button 
                              onClick={() => handleAddSubLine(line)}
                              className="text-xs text-primary-600 hover:underline flex items-center gap-1"
                            >
                              <Plus className="h-3 w-3" /> Ajouter sous-rubrique
                            </button>
                          </div>
                          {!line.sub_lines || line.sub_lines.length === 0 ? (
                            <p className="text-sm text-gray-400 italic py-2">Aucune sous-rubrique définie</p>
                          ) : (
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">N°</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Nom</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Qté</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">P.U.</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                  {line.sub_lines.map((sl, idx) => (
                                    <tr key={sl.id} className="hover:bg-gray-50">
                                      <td className="px-3 py-2 font-mono text-xs text-gray-500">{idx + 1}</td>
                                      <td className="px-3 py-2 font-medium">{sl.name}</td>
                                      <td className="px-3 py-2 text-right">{sl.quantity ?? 0}</td>
                                      <td className="px-3 py-2 text-right font-mono">{(sl.unit_price ?? 0).toLocaleString()}</td>
                                      <td className="px-3 py-2 text-right font-mono font-medium">{(sl.total_amount ?? 0).toLocaleString()}</td>
                                    </tr>
                                  ))}
                                  <tr className="bg-gray-50 font-semibold">
                                    <td className="px-3 py-2 text-xs text-gray-500" colSpan={4}>TOTAL SOUS-RUBRIQUES</td>
                                    <td className="px-3 py-2 text-right font-mono text-primary-700">{subLinesTotal.toLocaleString()}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}

                          {line.sub_lines && line.sub_lines.length > 0 && (
                            <div className="mt-3 p-3 rounded-lg bg-blue-50 border border-blue-100">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-blue-700">Total sous-rubriques:</span>
                                <span className="font-bold text-blue-800">{subLinesTotal.toLocaleString()} FCFA</span>
                              </div>
                              <div className="flex justify-between items-center text-sm mt-1">
                                <span className="text-gray-600">Montant prévu rubrique:</span>
                                <span className="font-semibold">{planned.toLocaleString()} FCFA</span>
                              </div>
                              {subLinesTotal !== planned && (
                                <div className="flex justify-between items-center text-sm mt-1">
                                  <span className={`${subLinesTotal > planned ? 'text-red-600' : 'text-amber-600'}`}>
                                    {subLinesTotal > planned ? 'Dépassement:' : 'Écart:'}
                                  </span>
                                  <span className={`font-bold ${subLinesTotal > planned ? 'text-red-600' : 'text-amber-600'}`}>
                                    {Math.abs(subLinesTotal - planned).toLocaleString()} FCFA
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

            {(!mainLines || mainLines.length === 0) && (
              <div className="card p-8 text-center">
                <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">Aucune rubrique trouvée</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: EXPENSES ─── */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Rechercher dépense..." className="input pl-10 w-full" />
            </div>
            <button className="btn-primary whitespace-nowrap"
              onClick={() => mainLines?.[0] && handleAddExpense(mainLines[0])}
              disabled={isLoading || !mainLines?.length}>
              <Plus className="mr-2 h-4 w-4" />Nouvelle dépense
            </button>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">N°</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Libellé</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rubrique</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Bénéficiaire</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Montant</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Solde Avant</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Statut</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expenses?.data?.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.expense_number}</td>
                      <td className="px-4 py-3 text-gray-600">{item.expense_date}</td>
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3"><span className="text-xs bg-gray-100 px-2 py-1 rounded">{item.main_line_name || '—'}</span></td>
                      <td className="px-4 py-3 text-gray-600">{item.beneficiary || '—'}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium">{(item.total_amount ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-500 font-mono">{(item.balance_before ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        {item.is_validated
                          ? <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">Validé</span>
                          : <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">En attente</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 hover:bg-blue-50 text-blue-600 rounded" onClick={() => handleViewExpense(item)} title="Voir détail">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => setConfirmDelete({ type: 'expense', id: item.id })}
                            className="p-1.5 hover:bg-red-50 text-red-500 rounded" title="Supprimer"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!expenses?.data || expenses.data.length === 0) && (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                        <Receipt className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Aucune dépense enregistrée</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {expenses && expenses.total > (expenses.per_page || 20) && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {(expenses.page - 1) * (expenses.per_page || 20) + 1} - {Math.min(expenses.page * (expenses.per_page || 20), expenses.total)} sur {expenses.total}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => { const p = expensePage - 1; setExpensePage(p); if (selectedBudgetId) loadExpenses(selectedBudgetId, p); }}
                    disabled={expensePage <= 1} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50">Précédent</button>
                  <span className="text-sm text-gray-600">Page {expensePage} / {expenses.total_pages}</span>
                  <button onClick={() => { const p = expensePage + 1; setExpensePage(p); if (selectedBudgetId) loadExpenses(selectedBudgetId, p); }}
                    disabled={expensePage >= expenses.total_pages} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50">Suivant</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB: REPORTS ─── */}
      {activeTab === 'reports' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header border-b border-gray-100">
              <h3 className="font-semibold flex items-center gap-2"><Printer className="h-5 w-5 text-primary-600" />Rapports disponibles</h3>
            </div>
            <div className="card-body p-4 space-y-3">
              {[
                { icon: Printer, label: 'Budget Initial (PDF)', color: 'text-red-600', bg: 'bg-red-50', action: () => selectedBudgetId && exportPDF(selectedBudgetId, 'initial') },
                { icon: Receipt, label: 'Rapport de Dépenses (PDF)', color: 'text-orange-600', bg: 'bg-orange-50', action: () => toast.info('Fonctionnalité à venir') },
                { icon: FileSpreadsheet, label: 'Export Excel Complet', color: 'text-emerald-600', bg: 'bg-emerald-50', action: () => selectedBudgetId && exportExcel(selectedBudgetId) },
                { icon: TrendingUp, label: 'Fiche de Situation', color: 'text-blue-600', bg: 'bg-blue-50', action: () => toast.info('Fonctionnalité à venir') },
              ].map((report, idx) => (
                <button 
                  key={idx} 
                  onClick={report.action}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left group"
                >
                  <div className={`w-10 h-10 ${report.bg} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <report.icon className={`h-5 w-5 ${report.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{report.label}</p>
                    <p className="text-xs text-gray-400">Cliquez pour générer</p>
                  </div>
                  <Download className="h-4 w-4 text-gray-300 group-hover:text-primary-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card">
              <div className="card-header border-b border-gray-100">
                <h3 className="font-semibold flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary-600" />Statistiques</h3>
              </div>
              <div className="card-body p-4 space-y-5">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-500">Taux d'utilisation global</span>
                    <span className={`text-lg font-bold ${usageRate > 90 ? 'text-red-600' : usageRate > 70 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {usageRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className={`h-3 rounded-full transition-all ${usageRate > 90 ? 'bg-red-500' : usageRate > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(usageRate, 100)}%` }} />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Rubriques les plus utilisées</p>
                  <div className="space-y-2">
                    {(currentBudget?.statistics?.main_lines_stats || [])
                      .sort((a, b) => b.utilization_rate - a.utilization_rate)
                      .slice(0, 5)
                      .map((line, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">{idx + 1}</span>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700">{line.name}</span>
                              <span className="font-medium">{line.utilization_rate}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${Math.min(line.utilization_rate, 100)}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    {(!currentBudget?.statistics?.main_lines_stats || currentBudget.statistics.main_lines_stats.length === 0) && (
                      <p className="text-sm text-gray-400 italic">Aucune statistique disponible</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Dépenses par mois</p>
                  <div className="space-y-2">
                    {(currentBudget?.statistics?.expenses_by_month || []).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{item.month}</span>
                        <span className="font-mono font-medium">{(item.total ?? item.amount ?? 0).toLocaleString()} FCFA</span>
                      </div>
                    ))}
                    {(!currentBudget?.statistics?.expenses_by_month || currentBudget.statistics.expenses_by_month.length === 0) && (
                      <p className="text-sm text-gray-400 italic">Aucune donnée mensuelle</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODALS ─── */}
      {showInitModal && (
        <BudgetInitModal onClose={() => setShowInitModal(false)} onSubmit={handleInitialize} />
      )}

      {showExpenseModal && selectedMainLine && selectedBudgetId && (
        <ExpenseModal
          mainLine={selectedMainLine}
          budgetId={selectedBudgetId}
          onClose={() => { setShowExpenseModal(false); setSelectedMainLine(null); }}
          onSubmit={handleExpenseSubmit}
        />
      )}

      {showSubLineModal && selectedMainLine && (
        <SubLineModal
          mainLine={selectedMainLine}
          onClose={() => { setShowSubLineModal(false); setSelectedMainLine(null); }}
          onSubmit={handleSubLineSubmit}
        />
      )}

      {showAddMainLineModal && selectedBudgetId && (
        <AddMainLineModal
          budgetId={selectedBudgetId}
          onClose={() => setShowAddMainLineModal(false)}
          onSubmit={handleMainLineSubmit}
        />
      )}

      {/* ← NOUVEAU: Modal de détail/validation d'une dépense */}
      {showExpenseDetailModal && selectedExpense && (
        // Remplacez true par une logique de permission si besoin
        <ExpenseDetailModal
          expense={selectedExpense}
          canValidate={true}
          onClose={() => { setShowExpenseDetailModal(false); setSelectedExpense(null); }}
          onValidate={handleValidateExpense}
        />
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-bounce-in p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold">Confirmer la suppression</h3>
            </div>
            <p className="text-gray-600 mb-6">Cette action est irréversible. Êtes-vous sûr de vouloir supprimer cet élément ?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="btn-outline">Annuler</button>
              <button onClick={handleDelete} className="btn-danger"><Trash2 className="mr-2 h-4 w-4" />Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



// ← NOUVEAU: Modal de détail et validation d'une dépense
function ExpenseDetailModal({ 
  expense, 
  canValidate, 
  onClose, 
  onValidate 
}: { 
  expense: BudgetExpense; 
  canValidate: boolean; 
  onClose: () => void; 
  onValidate: (id: number) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleValidate = async () => {
    setIsSubmitting(true)
    try {
      await onValidate(expense.id)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full animate-bounce-in">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Détail de la dépense</h3>
            <p className="text-sm text-gray-500">N° {expense.expense_number}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="h-5 w-5 text-gray-400" /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Statut */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
            <span className="text-sm font-medium text-gray-700">Statut</span>
            {expense.is_validated ? (
              <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
                <CheckCircle className="h-4 w-4" /> Validé
              </span>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full font-medium">
                <AlertTriangle className="h-4 w-4" /> En attente de validation
              </span>
            )}
          </div>

          {/* Informations principales */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Libellé</label>
              <p className="text-sm font-medium text-gray-900">{expense.name}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
              <p className="text-sm text-gray-900">{expense.expense_date}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Rubrique</label>
              <p className="text-sm text-gray-900">{expense.main_line_name || '—'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Bénéficiaire</label>
              <p className="text-sm text-gray-900">{expense.beneficiary || '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Quantité</label>
              <p className="text-sm text-gray-900">{expense.quantity}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Prix Unitaire</label>
              <p className="text-sm text-gray-900">{expense.unit_price?.toLocaleString()} FCFA</p>
            </div>
          </div>

          {/* Montant total */}
          <div className="p-4 rounded-lg border-2 border-emerald-200 bg-emerald-50">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Montant total:</span>
              <span className="text-2xl font-bold text-emerald-700">{expense.total_amount?.toLocaleString()} FCFA</span>
            </div>
          </div>

          {/* Solde */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-blue-50">
              <label className="block text-xs font-medium text-blue-600 mb-1">Solde avant</label>
              <p className="text-sm font-bold text-blue-800">{expense.balance_before?.toLocaleString()} FCFA</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50">
              <label className="block text-xs font-medium text-gray-600 mb-1">Solde après</label>
              <p className="text-sm font-bold text-gray-800">{expense.balance_after?.toLocaleString()} FCFA</p>
            </div>
          </div>

          {/* Description */}
          {expense.description && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{expense.description}</p>
            </div>
          )}

          {/* Mode de paiement */}
          {expense.payment_method && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Mode de paiement</label>
              <p className="text-sm text-gray-900">{expense.payment_method}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="btn-outline">Fermer</button>

          {/* ← Bouton validation visible seulement si pas encore validé ET user a les permissions */}
          {!expense.is_validated && canValidate && (
            <button 
              onClick={handleValidate} 
              className="btn-success"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Validation...</>
              ) : (
                <><ShieldCheck className="mr-2 h-4 w-4" />Valider la dépense</>
              )}
            </button>
          )}

          {/* Message si déjà validé */}
          {expense.is_validated && (
            <span className="flex items-center gap-1 px-3 py-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" /> Déjà validée
            </span>
          )}

          {/* Message si pas les permissions */}
          {!expense.is_validated && !canValidate && (
            <span className="flex items-center gap-1 px-3 py-2 text-sm text-gray-400">
              <UserCheck className="h-4 w-4" /> En attente de validation
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ==================== SUB-COMPONENTS ====================

function BudgetInitModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: BudgetInitForm) => void }) {
  const [formData, setFormData] = useState<BudgetInitForm>({
    school_id: 1, academic_year_id: 1, label: '', initial_balance: 0, notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!formData.label.trim()) { toast.error('Veuillez saisir un libellé'); return }
    if (formData.initial_balance <= 0) { toast.error('Le solde initial doit être supérieur à 0'); return }
    setIsSubmitting(true)
    try { await onSubmit(formData) } finally { setIsSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full animate-bounce-in">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Initialiser un budget</h3>
            <p className="text-sm text-gray-500">Créer un nouveau budget avec les 14 rubriques de base</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Libellé *</label>
            <input type="text" value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="input" placeholder="Budget 2025-2026" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">École ID</label>
              <input type="number" value={formData.school_id} onChange={(e) => setFormData({ ...formData, school_id: Number(e.target.value) })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Année scolaire ID</label>
              <input type="number" value={formData.academic_year_id} onChange={(e) => setFormData({ ...formData, academic_year_id: Number(e.target.value) })} className="input" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Solde Initial (FCFA) *</label>
            <input type="number" value={formData.initial_balance} onChange={(e) => setFormData({ ...formData, initial_balance: Number(e.target.value) })}
              className="input" placeholder="50000000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input" rows={3} placeholder="Notes optionnelles..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="btn-outline" disabled={isSubmitting}>Annuler</button>
          <button onClick={handleSubmit} className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Initialisation...</> : <><Plus className="mr-2 h-4 w-4" />Initialiser</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function ExpenseModal({ mainLine, budgetId, onClose, onSubmit }: {
  mainLine: BudgetMainLine; budgetId: number; onClose: () => void;
  onSubmit: (data: ExpenseForm & { main_line_id: number }) => void;
}) {
  const [formData, setFormData] = useState<ExpenseForm>({
    name: '', description: '', quantity: 1, unit_price: 0,
    expense_date: new Date().toISOString().split('T')[0], payment_method: 'espèces', beneficiary: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const total = formData.quantity * formData.unit_price
  const remaining = mainLine.remaining_amount ?? 0
  const isOverBudget = total > remaining

  const handleSubmit = async () => {
    if (!formData.name.trim()) { toast.error('Veuillez saisir un libellé'); return }
    if (total <= 0) { toast.error('Le montant doit être supérieur à 0'); return }
    if (isOverBudget) { toast.error('Solde insuffisant pour cette dépense'); return }
    setIsSubmitting(true)
    try { await onSubmit({ ...formData, main_line_id: mainLine.id }) } finally { setIsSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full animate-bounce-in">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Nouvelle dépense</h3>
            <p className="text-sm text-gray-500">Rubrique: <span className="font-mono">{mainLine.code}</span> — {mainLine.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className={`p-3 rounded-lg flex items-center gap-2 ${remaining < total ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
            <Wallet className="h-4 w-4" />
            <span className="text-sm font-medium">Solde disponible: {remaining.toLocaleString()} FCFA</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Libellé *</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input" placeholder="Description de la dépense" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input" rows={2} placeholder="Détails optionnels..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
              <input type="number" min={1} value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: Math.max(1, Number(e.target.value)) })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix Unitaire (FCFA)</label>
              <input type="number" min={0} value={formData.unit_price} onChange={(e) => setFormData({ ...formData, unit_price: Math.max(0, Number(e.target.value)) })} className="input" />
            </div>
          </div>
          <div className={`p-4 rounded-lg border-2 ${isOverBudget ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50'}`}>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total calculé:</span>
              <span className={`text-2xl font-bold ${isOverBudget ? 'text-red-600' : 'text-emerald-700'}`}>{total.toLocaleString()} FCFA</span>
            </div>
            {isOverBudget && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />Dépasses le solde de {Math.abs(remaining - total).toLocaleString()} FCFA
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={formData.expense_date} onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
              <select value={formData.payment_method} onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })} className="input">
                <option value="espèces">Espèces</option>
                <option value="chèque">Chèque</option>
                <option value="virement">Virement bancaire</option>
                <option value="mobile_money">Mobile Money</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bénéficiaire</label>
            <input type="text" value={formData.beneficiary} onChange={(e) => setFormData({ ...formData, beneficiary: e.target.value })}
              className="input" placeholder="Nom du bénéficiaire" />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="btn-outline" disabled={isSubmitting}>Annuler</button>
          <button onClick={handleSubmit} className={`${isOverBudget ? 'btn-disabled' : 'btn-primary'}`} disabled={isSubmitting || isOverBudget}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement...</> : <><Receipt className="mr-2 h-4 w-4" />{isOverBudget ? 'Solde insuffisant' : 'Enregistrer'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ← CORRIGÉ V3: code est REQUIS par Pydantic BudgetSubLineCreate
function SubLineModal({ mainLine, onClose, onSubmit }: {
  mainLine: BudgetMainLine;
  onClose: () => void;
  onSubmit: (data: SubLineForm) => void;
}) {
  const [formData, setFormData] = useState<SubLineForm>({
    name: '', code: '', quantity: 1, unit_price: 0, description: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const total = formData.quantity * formData.unit_price

  const handleSubmit = async () => {
    if (!formData.name.trim()) { toast.error('Veuillez saisir un nom'); return }
    if (!formData.code.trim()) { toast.error('Veuillez saisir un code'); return }
    if (formData.quantity <= 0) { toast.error('La quantité doit être > 0'); return }
    if (formData.unit_price < 0) { toast.error('Le prix unitaire ne peut pas être négatif'); return }
    setIsSubmitting(true)
    try { await onSubmit(formData) } finally { setIsSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full animate-bounce-in">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Ajouter une sous-rubrique</h3>
            <p className="text-sm text-gray-500">Rubrique: <span className="font-mono">{mainLine.code}</span> — {mainLine.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
              <input 
                type="text" 
                value={formData.code} 
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="input" 
                placeholder="Ex: SR-001" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input" 
                placeholder="Ex: Fournitures" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input" 
              rows={2} 
              placeholder="Détails optionnels..." 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantité *</label>
              <input 
                type="number" 
                min={1} 
                value={formData.quantity} 
                onChange={(e) => setFormData({ ...formData, quantity: Math.max(1, Number(e.target.value)) })} 
                className="input" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix Unitaire (FCFA) *</label>
              <input 
                type="number" 
                min={0} 
                value={formData.unit_price} 
                onChange={(e) => setFormData({ ...formData, unit_price: Math.max(0, Number(e.target.value)) })} 
                className="input" 
              />
            </div>
          </div>
          <div className="p-4 rounded-lg border-2 border-emerald-200 bg-emerald-50">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total calculé:</span>
              <span className="text-2xl font-bold text-emerald-700">{total.toLocaleString()} FCFA</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Le backend calcule automatiquement le total
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="btn-outline" disabled={isSubmitting}>Annuler</button>
          <button onClick={handleSubmit} className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enregistrement...</> : <><Save className="mr-2 h-4 w-4" />Enregistrer</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// ← CORRIGÉ V3: code est REQUIS par Pydantic BudgetMainLineCreate
function AddMainLineModal({ budgetId, onClose, onSubmit }: {
  budgetId: number;
  onClose: () => void;
  onSubmit: (data: MainLineForm) => void;
}) {
  const [formData, setFormData] = useState<MainLineForm>({
    name: '', code: '', description: '', planned_amount: 0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!formData.name.trim()) { toast.error('Veuillez saisir un nom'); return }
    if (!formData.code.trim()) { toast.error('Veuillez saisir un code'); return }
    if (formData.planned_amount <= 0) { toast.error('Le montant prévu doit être > 0'); return }
    setIsSubmitting(true)
    try { await onSubmit(formData) } finally { setIsSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full animate-bounce-in">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Ajouter une rubrique</h3>
            <p className="text-sm text-gray-500">Créer une nouvelle rubrique principale</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="h-5 w-5 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
              <input 
                type="text" 
                value={formData.code} 
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="input" 
                placeholder="Ex: R-001" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input" 
                placeholder="Ex: Matériel" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              value={formData.description} 
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input" 
              rows={2} 
              placeholder="Description optionnelle..." 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant prévu (FCFA) *</label>
            <input 
              type="number" 
              min={0} 
              value={formData.planned_amount} 
              onChange={(e) => setFormData({ ...formData, planned_amount: Math.max(0, Number(e.target.value)) })} 
              className="input" 
              placeholder="500000" 
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button onClick={onClose} className="btn-outline" disabled={isSubmitting}>Annuler</button>
          <button onClick={handleSubmit} className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Création...</> : <><Plus className="mr-2 h-4 w-4" />Ajouter rubrique</>}
          </button>
        </div>
      </div>
    </div>
  )
}