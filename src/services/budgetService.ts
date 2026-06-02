import axios, { AxiosError, AxiosInstance } from 'axios'
import { useAuthStore } from '@/store/authStore'

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://192.168.0.101:8001/api/v1'

class BudgetApiService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/budget`,
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    })
    this.setupInterceptors()
  }

  private getToken(): string | null {
    // 1. Zustand store (prioritaire - même pattern que api.ts)
    const zustandToken = useAuthStore.getState().accessToken
    if (zustandToken) return zustandToken

    // 2. localStorage fallback
    const oldToken = localStorage.getItem('access_token')
    if (oldToken) return oldToken

    // 3. auth-storage persisté
    const stored = localStorage.getItem('auth-storage')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        return parsed.state?.accessToken || null
      } catch (e) { return null }
    }
    return null
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
          console.log('🔑 Budget API: Token ajouté', token.substring(0, 20) + '...')
        } else {
          console.warn('⚠️ Budget API: Aucun token trouvé!')
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          console.error('❌ Budget API 401 - Token invalide')
          localStorage.removeItem('access_token')
          localStorage.removeItem('auth-storage')
          useAuthStore.getState().logout()
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // ==================== BUDGET YEAR ====================

  async initializeBudget(data: {
    school_id: number
    academic_year_id: number
    label: string
    initial_balance: number
    notes?: string
    custom_main_lines?: any[]
  }) {
    const response = await this.client.post('/initialize', data)
    return response.data
  }

  async getBudgets(params?: {
    school_id?: number
    academic_year_id?: number
    status?: string
    page?: number
    per_page?: number
  }) {
    const response = await this.client.get('', { params: { page: 1, per_page: 50, ...params } })
    return response.data
  }

  async getBudget(budgetYearId: number) {
    const response = await this.client.get(`/${budgetYearId}`)
    return response.data
  }

  async getBudgetFull(budgetYearId: number) {
    const response = await this.client.get(`/${budgetYearId}/full`)
    return response.data
  }

  async updateBudget(budgetYearId: number, data: any) {
    const response = await this.client.put(`/${budgetYearId}`, data)
    return response.data
  }

  async approveBudget(budgetYearId: number, data: { notes: string }) {
    const response = await this.client.post(`/${budgetYearId}/approve`, data)
    return response.data
  }

  async closeBudget(budgetYearId: number) {
    const response = await this.client.post(`/${budgetYearId}/close`)
    return response.data
  }

  // ==================== MAIN LINES ====================

  async getMainLines(budgetYearId: number) {
    const response = await this.client.get(`/${budgetYearId}/main-lines`)
    return response.data
  }

  async createMainLine(budgetYearId: number, data: any) {
    const response = await this.client.post(`/${budgetYearId}/main-lines`, data)
    return response.data
  }

  async updateMainLine(mainLineId: number, data: any) {
    const response = await this.client.put(`/main-lines/${mainLineId}`, data)
    return response.data
  }

  async deleteMainLine(mainLineId: number) {
    const response = await this.client.delete(`/main-lines/${mainLineId}`)
    return response.data
  }

  async reorderMainLines(budgetYearId: number, data: { line_ids: number[] }) {
    const response = await this.client.put(`/${budgetYearId}/main-lines/reorder`, data)
    return response.data
  }

  // ==================== SUB LINES ====================

  async getSubLines(mainLineId: number) {
    const response = await this.client.get(`/main-lines/${mainLineId}/sub-lines`)
    return response.data
  }

  async createSubLine(mainLineId: number, data: any) {
    const response = await this.client.post(`/main-lines/${mainLineId}/sub-lines`, data)
    return response.data
  }

  async updateSubLine(subLineId: number, data: any) {
    const response = await this.client.put(`/sub-lines/${subLineId}`, data)
    return response.data
  }

  async deleteSubLine(subLineId: number) {
    const response = await this.client.delete(`/sub-lines/${subLineId}`)
    return response.data
  }

  // ==================== EXPENSES ====================

  async getExpenses(
    budgetYearId: number,
    params?: {
      main_line_id?: number
      sub_line_id?: number
      expense_type?: string
      is_validated?: boolean
      date_from?: string
      date_to?: string
      search?: string
      page?: number
      per_page?: number
    }
  ) {
    const response = await this.client.get(`/${budgetYearId}/expenses`, { params: { page: 1, per_page: 20, ...params } })
    return response.data
  }

  async getExpense(expenseId: number) {
    const response = await this.client.get(`/expenses/${expenseId}`)
    return response.data
  }

  async createExpense(budgetYearId: number, data: any) {
    const response = await this.client.post(`/${budgetYearId}/expenses`, data)
    return response.data
  }

  async createBulkExpenses(budgetYearId: number, expenses: any[]) {
    const response = await this.client.post(`/${budgetYearId}/expenses/bulk`, { expenses })
    return response.data
  }

  async updateExpense(expenseId: number, data: any) {
    const response = await this.client.put(`/expenses/${expenseId}`, data)
    return response.data
  }

  async validateExpense(expenseId: number) {
    const response = await this.client.post(`/expenses/${expenseId}/validate`)
    return response.data
  }

  async deleteExpense(expenseId: number) {
    const response = await this.client.delete(`/expenses/${expenseId}`)
    return response.data
  }

  // ==================== TRANSFERS ====================

  async createTransfer(budgetYearId: number, data: {
    from_main_line_id: number
    to_main_line_id: number
    amount: number
    reason: string
    transfer_date: string
  }) {
    const response = await this.client.post(`/${budgetYearId}/transfers`, data)
    return response.data
  }

  // ==================== REPORTS & STATISTICS ====================

  async getStatistics(budgetYearId: number) {
    const response = await this.client.get(`/${budgetYearId}/statistics`)
    return response.data
  }

  async getBalanceSheet(budgetYearId: number) {
    const response = await this.client.get(`/${budgetYearId}/balance-sheet`)
    return response.data
  }

  async printBudgetInitial(budgetYearId: number) {
    const response = await this.client.get(`/${budgetYearId}/print/initial`)
    return response.data
  }

  async printExpenseReport(
    budgetYearId: number,
    params?: { main_line_id?: number; date_from?: string; date_to?: string }
  ) {
    const response = await this.client.get(`/${budgetYearId}/print/expense-report`, { params })
    return response.data
  }

  async exportExcel(budgetYearId: number) {
    const response = await this.client.get(`/${budgetYearId}/export/excel`)
    return response.data
  }

  async searchBudget(
    budgetYearId: number,
    params: { q: string; type?: 'expense' | 'main_line' | 'sub_line' }
  ) {
    const response = await this.client.get(`/${budgetYearId}/search`, { params })
    return response.data
  }
}

// Export singleton instance
export const budgetApi = new BudgetApiService()