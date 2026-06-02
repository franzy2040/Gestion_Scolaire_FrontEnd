import { useState, useEffect, useCallback } from 'react'
import { budgetApi } from '../services/budgetService'
import type {
  BudgetYear,
  BudgetMainLine,
  BudgetExpense,
  PaginatedResponse,
} from '../types'

interface UseBudgetReturn {
  budgets: BudgetYear[] | null
  budget: BudgetYear | null
  mainLines: BudgetMainLine[] | null
  expenses: PaginatedResponse<BudgetExpense> | null
  isLoading: boolean
  error: string | null
  initialize: (data: {
    school_id: number
    academic_year_id: number
    label: string
    initial_balance: number
    notes?: string
  }) => Promise<void>
  createMainLine: (data: any) => Promise<void>
  createSubLine: (data: any) => Promise<void>
  createExpense: (params: {
    budgetYearId: number
    data: any
  }) => Promise<void>
  validateExpense: (expenseId: number) => Promise<void>
  approveBudget: (params: { id: number; notes: string }) => Promise<void>
  deleteMainLine: (id: number) => Promise<void>
  deleteExpense: (id: number) => Promise<void>
  refresh: () => void
}

export function useBudget(budgetYearId?: number): UseBudgetReturn {
  const [budgets, setBudgets] = useState<BudgetYear[] | null>(null)
  const [budget, setBudget] = useState<BudgetYear | null>(null)
  const [mainLines, setMainLines] = useState<BudgetMainLine[] | null>(null)
  const [expenses, setExpenses] = useState<
    PaginatedResponse<BudgetExpense> | null
  >(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  // ─── Load all budgets ───
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    budgetApi
      .getBudgets() // <-- Use the correct method name from your budgetApi service
      .then((res: PaginatedResponse<BudgetYear>) => {
        if (!cancelled) {
          // Backend retourne { data: [...], total, page, ... }
          const budgetList = res.data || res || []
          setBudgets(Array.isArray(budgetList) ? budgetList : budgetList.data || [])
          setError(null)
        }
      })
      .catch((err: any) => {
        if (!cancelled) {
          setError(err.message || 'Erreur de chargement des budgets')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [refreshKey])

  // ─── Load specific budget + main lines + expenses ───
  useEffect(() => {
    if (!budgetYearId) return

    let cancelled = false
    setIsLoading(true)

    Promise.all([
      budgetApi.getBudgetFull(budgetYearId),
      budgetApi.getMainLines(budgetYearId),
      budgetApi.getExpenses(budgetYearId, { page: 1, per_page: 50 }),
    ])
      .then(([budgetRes, linesRes, expensesRes]) => {
        if (!cancelled) {
          // Budget full: backend retourne objet direct avec main_lines, statistics
          setBudget(budgetRes)

          // Main lines: backend retourne List[BudgetMainLineResponse] → array direct
          setMainLines(Array.isArray(linesRes) ? linesRes : linesRes.data || [])

          // Expenses: backend retourne { data: [...], total, page, ... }
          setExpenses(
            expensesRes && expensesRes.data
              ? expensesRes
              : { data: [], total: 0, page: 1, per_page: 50, total_pages: 0, has_next: false, has_prev: false }
          )
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Erreur de chargement')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [budgetYearId, refreshKey])

  // ─── Actions ───
  const initialize = async (data: {
    school_id: number
    academic_year_id: number
    label: string
    initial_balance: number
    notes?: string
  }) => {
    setIsLoading(true)
    try {
      await budgetApi.initializeBudget(data)
      refresh()
    } catch (err: any) {
      console.error('🔴 Erreur init:', err.response?.status, err.response?.data)
      setError(err.message || "Erreur lors de l'initialisation")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const createMainLine = async (data: any) => {
    if (!budgetYearId) return
    setIsLoading(true)
    try {
      await budgetApi.createMainLine(budgetYearId, data)
      refresh()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const createSubLine = async (data: any) => {
    setIsLoading(true)
    try {
      await budgetApi.createSubLine(data.main_line_id, data)
      refresh()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const createExpense = async ({
    budgetYearId,
    data,
  }: {
    budgetYearId: number
    data: any
  }) => {
    setIsLoading(true)
    try {
      await budgetApi.createExpense(budgetYearId, data)
      refresh()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de la dépense')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const validateExpense = async (expenseId: number) => {
    setIsLoading(true)
    try {
      await budgetApi.validateExpense(expenseId)
      refresh()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la validation')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const approveBudget = async ({
    id,
    notes,
  }: {
    id: number
    notes: string
  }) => {
    setIsLoading(true)
    try {
      await budgetApi.approveBudget(id, { notes })
      refresh()
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'approbation")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteMainLine = async (id: number) => {
    setIsLoading(true)
    try {
      await budgetApi.deleteMainLine(id)
      refresh()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const deleteExpense = async (id: number) => {
    setIsLoading(true)
    try {
      await budgetApi.deleteExpense(id)
      refresh()
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    budgets,
    budget,
    mainLines,
    expenses,
    isLoading,
    error,
    initialize,
    createMainLine,
    createSubLine,
    createExpense,
    validateExpense,
    approveBudget,
    deleteMainLine,
    deleteExpense,
    refresh,
  }
}