// ==================== BUDGET TYPES ====================

export interface BudgetYear {
  id: number
  school_id: number
  academic_year_id: number
  reference_number: string
  label: string
  initial_balance: number
  current_balance: number
  total_expenses: number
  total_planned: number
  total_income?: number
  status: 'draft' | 'active' | 'closed' | 'archived'
  is_active: boolean
  created_by: number
  approved_by?: number
  approved_at?: string
  closed_by?: number
  closed_at?: string
  notes?: string
  created_at: string
  updated_at: string
  academic_year_label?: string
  school_name?: string
  main_lines_count?: number
  main_lines?: BudgetMainLine[]
  statistics?: BudgetStatistics
}

export interface BudgetMainLine {
  id: number
  budget_year_id: number
  code: string
  name: string
  description?: string
  planned_amount: number
  actual_amount: number
  remaining_amount: number
  order_index: number
  is_system: boolean
  is_active: boolean
  created_by: number
  updated_by?: number
  sub_lines_count?: number
  expenses_count?: number
  percentage_used?: number
  sub_lines?: BudgetSubLine[]
  created_at: string
  updated_at: string
}

export interface BudgetSubLine {
  id: number
  main_line_id: number
  code: string
  name: string
  description?: string
  quantity: number
  unit_price: number
  total_amount: number
  order_index: number
  is_active: boolean
  main_line_name?: string
  main_line_code?: string
  created_at: string
  updated_at: string
}

export interface BudgetExpense {
  id: number
  budget_year_id: number
  main_line_id: number
  sub_line_id?: number
  expense_number: string
  expense_date: string
  name: string
  description?: string
  quantity: number
  unit_price: number
  total_amount: number
  payment_method?: string
  payment_reference?: string
  beneficiary?: string
  beneficiary_contact?: string
  receipt_number?: string
  balance_before: number
  balance_after: number
  is_validated: boolean
  validated_by?: number
  validated_at?: string
  validator_name?: string
  main_line_name?: string
  main_line_code?: string
  sub_line_name?: string
  expense_type?: 'initial' | 'expense' | 'adjustment' | 'income'
  created_by: number
  created_at: string
  updated_at: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export type PaginatedExpenses = PaginatedResponse<BudgetExpense>

export interface BudgetStatistics {
  budget_year_id?: number
  global_usage_rate?: number
  utilization_rate?: number
  total_planned: number
  total_actual: number
  total_remaining: number
  main_lines_stats?: {
    id: number
    code: string
    name: string
    planned: number
    actual: number
    remaining: number
    utilization_rate: number
  }[]
  top_lines?: {
    name: string
    percentage: number
    planned: number
    actual: number
  }[]
  top_expenses?: {
    id: number
    name: string
    amount: number
    date: string
  }[]
  expenses_by_month?: {
    month: string
    total: number
    amount?: number
  }[]
}

export interface BudgetTransfer {
  id: number
  budget_year_id: number
  from_main_line_id: number
  to_main_line_id: number
  from_line_name?: string
  to_line_name?: string
  transfer_number: string
  amount: number
  reason: string
  transfer_date: string
  approved_by?: number
  created_by: number
  created_at: string
}

export interface BudgetApprovalRequest {
  notes: string
}

export interface BudgetInitializeRequest {
  school_id: number
  academic_year_id: number
  label: string
  initial_balance: number
  notes?: string
  custom_main_lines?: Array<{
    code: string
    name: string
    description?: string
    planned_amount: number
  }>
}

export interface BudgetMainLineCreate {
  budget_year_id: number
  order_index: number
  code: string
  name: string
  description?: string
  planned_amount: number
}

export interface BudgetSubLineCreate {
  main_line_id: number
  order_index: number
  code: string
  name: string
  description?: string
  quantity: number
  unit_price: number
}

export interface ExpenseCreateRequest {
  budget_year_id: number
  main_line_id: number
  sub_line_id?: number
  name: string
  description?: string
  quantity: number
  unit_price: number
  expense_date: string
  payment_method?: string
  beneficiary?: string
  expense_type: 'expense'
}

export interface ExpenseUpdateRequest {
  name?: string
  description?: string
  quantity?: number
  unit_price?: number
  expense_date?: string
  payment_method?: string
  beneficiary?: string
}

export interface BudgetSearchParams {
  school_id?: number
  academic_year_id?: number
  status?: string
  page?: number
  per_page?: number
}

export interface ExpenseSearchParams {
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