import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8001/api/v1'

class ApiService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    })
    this.setupInterceptors()
  }

  private getToken(): string | null {
    const zustandToken = useAuthStore.getState().accessToken
    if (zustandToken) return zustandToken
    const oldToken = localStorage.getItem('access_token')
    if (oldToken) return oldToken
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
        if (token) config.headers.Authorization = `Bearer ${token}`
        return config
      },
      (error) => Promise.reject(error)
    )
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('auth-storage')
          useAuthStore.getState().logout()
          window.location.href = '/login'
        }
        if (error.response?.status === 403) {
          return Promise.reject(error)
        }
        const message = (error.response?.data as any)?.detail || error.message || 'Erreur serveur'
        toast.error(message)
        return Promise.reject(error)
      }
    )
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config)
    return response.data
  }
  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config)
    return response.data
  }
  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config)
    return response.data
  }
  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config)
    return response.data
  }
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config)
    return response.data
  }
  async upload<T>(url: string, file: File, fieldName = 'file'): Promise<T> {
    const formData = new FormData()
    formData.append(fieldName, file)
    const response = await this.client.post<T>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  }

  // ==================== FLAT ALIASES ====================
  // TIMETABLE
  getAll = (params?: Record<string, any>) => this.get<any>('/timetable', { params })
  createTimetableSlot = (data: any) => this.post<any>('/timetable', data)
  updateTimetableSlot = (id: number, data: any) => this.put<any>(`/timetable/${id}`, data)
  deleteTimetableSlot = (id: number) => this.delete<any>(`/timetable/${id}`)

  // SUBJECTS
  getSubjects = (params?: Record<string, any>) => this.get<any>('/subjects', { params })
  createSubject = (data: any) => this.post<any>('/subjects', data)

  // CLASSROOMS / ROOMS
  getClassrooms = () => this.get<any>('/rooms')
  createClassroom = (data: any) => this.post<any>('/rooms', data)

  // TEACHERS
  getTeachers = (params?: Record<string, any>) => this.get<any>('/teachers', { params })
  getTeacherAssignments = (params?: Record<string, any>) => this.get<any>('/teachers/assignments', { params })
  createTeacherAssignment = (data: any) => this.post<any>('/teachers/assignments', data)

  // CLASSES
  getClasses = (params?: Record<string, any>) => this.get<any>('/classes', { params })

  // STUDENTS
  getStudents = (params?: Record<string, any>) => this.get<any>('/students', { params })

  // GRADES
  getGrades = (params?: Record<string, any>) => this.get<any>('/grades', { params })
  createGrade = (data: any) => this.post<any>('/grades', data)
  createBulkGrades = (data: any) => this.post<any>('/grades/bulk', data)
  updateGrade = (id: number, data: any) => this.put<any>(`/grades/${id}`, data)
  validateGrades = (gradeIds: number[]) => this.post<any>('/grades/validate', { grade_ids: gradeIds })
  getGradeSequences = () => this.get<any>('/grades/sequences')
  createGradeSequence = (data: any) => this.post<any>('/grades/sequences', data)
  toggleSequence = (id: number) => this.patch<any>(`/grades/sequences/${id}/toggle`, {})
  getClassRanking = (classId: number, params?: Record<string, any>) => this.get<any>(`/grades/ranking/${classId}`, { params })
  getHonorBoard = (params?: Record<string, any>) => this.get<any>('/grades/honor-board', { params })
  getClassAverage = (classId: number, params?: Record<string, any>) => this.get<any>(`/grades/averages/${classId}`, { params })
  calculateAverages = (evaluationPeriodId: number, params?: Record<string, any>) => this.post<any>(`/grades/calculate-averages/${evaluationPeriodId}`, null, { params })
  getGradeStatistics = (classId: number, subjectId: number, sequenceId: number) => this.get<any>(`/grades/statistics/${classId}/${subjectId}/${sequenceId}`)
  generateBulletin = (studentId: number, params?: Record<string, any>) => this.get<Blob>(`/grades/bulletin/${studentId}`, { params, responseType: 'blob' })

  // FARMS
  getFarms = (params?: Record<string, any>) => this.get<any>('/farms', { params })
  getFarmById = (id: number) => this.get<any>(`/farms/${id}`)
  createFarm = (data: any) => this.post<any>('/farms', data)
  updateFarm = (id: number, data: any) => this.put<any>(`/farms/${id}`, data)
  deleteFarm = (id: number) => this.delete<any>(`/farms/${id}`)

  // LIVESTOCK
  getLivestock = (params?: Record<string, any>) => this.get<any>('/livestock', { params })
  getAnimalById = (id: number) => this.get<any>(`/livestock/${id}`)
  createAnimal = (data: any) => this.post<any>('/livestock', data)
  updateAnimal = (id: number, data: any) => this.put<any>(`/livestock/${id}`, data)
  deleteAnimal = (id: number) => this.delete<any>(`/livestock/${id}`)

  // EMPLOYEES
  getEmployees = (params?: Record<string, any>) => this.get<any>('/employees', { params })

  // INVENTORY
  getInventory = (params?: Record<string, any>) => this.get<any>('/inventory', { params })

  // PURCHASES
  getPurchases = (params?: Record<string, any>) => this.get<any>('/purchases', { params })

  // SALES
  getSales = (params?: Record<string, any>) => this.get<any>('/sales', { params })

  // PROJECTS
  getProjects = (params?: Record<string, any>) => this.get<any>('/projects', { params })

  // REPORTS
  getReports = (params?: Record<string, any>) => this.get<any>('/reports', { params })

  // BUDGET
  getBudgets = (params?: Record<string, any>) => this.get<any>('/budgets', { params })
  getBudgetById = (id: number) => this.get<any>(`/budgets/${id}`)
  initializeBudget = (data: any) => this.post<any>('/budgets/initialize', data)
  createMainLine = (data: any) => this.post<any>('/budgets/main-lines', data)
  createSubLine = (data: any) => this.post<any>('/budgets/sub-lines', data)
  createExpense = (data: any) => this.post<any>('/budgets/expenses', data)
  validateExpense = (id: number, data?: any) => this.post<any>(`/budgets/expenses/${id}/validate`, data)
  approveBudget = (id: number, data?: any) => this.post<any>(`/budgets/${id}/approve`, data)

  // TIMETABLE (legacy)
  getTimetable = (params?: Record<string, any>) => this.get<any>('/timetable', { params })

  // DISCIPLINE
  getDisciplineRecords = (params?: Record<string, any>) => this.get<any>('/discipline', { params })

  // NEWS / EVENTS
  getNews = (params?: Record<string, any>) => this.get<any>('/news', { params })
  getEvents = (params?: Record<string, any>) => this.get<any>('/events', { params })

  // AUDIT
  getAuditLogs = (params?: Record<string, any>) => this.get<any>('/audit', { params })
}

export const apiService = new ApiService()
export default apiService

// ============================================
// AUTH
// ============================================
export const authApi = {
  login: (email: string, password: string) =>
    apiService.post<{ access_token: string; token_type: string; user: any }>('/auth/login', { email, password }),
  logout: () => apiService.post('/auth/logout', {}),
  me: () => apiService.get<any>('/auth/me'),
  refresh: () => apiService.post<{ access_token: string }>('/auth/refresh', {}),
  changePassword: (oldPassword: string, newPassword: string) =>
    apiService.post('/auth/change-password', { old_password: oldPassword, new_password: newPassword }),

  // --- USERS CRUD ---
  getUsers: (params?: { page?: number; per_page?: number; search?: string; role_id?: number; status?: string }) =>
    apiService.get<any>('/auth/users', { params }),
  getUserById: (id: number) => apiService.get<any>(`/auth/users/${id}`),
  createUser: (data: any) => apiService.post<any>('/auth/users', data),
  updateUser: (id: number, data: any) => apiService.put<any>(`/auth/users/${id}`, data),
  deleteUser: (id: number) => apiService.delete<any>(`/auth/users/${id}`),

  // --- 2FA ---
  setup2FA: () => apiService.post<any>('/auth/2fa/setup', {}),
  enable2FA: (data: { code: string }) => apiService.post<any>('/auth/2fa/enable', data),
  disable2FA: (data: { password: string }) => apiService.post<any>('/auth/2fa/disable', data),
  get2FAStatus: () => apiService.get<any>('/auth/2fa/status'),

  // --- ADMIN 2FA ---
  adminEnable2FA: (userId: number) => apiService.post<any>(`/auth/users/${userId}/2fa/enable`, {}),
  adminDisable2FA: (userId: number) => apiService.post<any>(`/auth/users/${userId}/2fa/disable`, {}),

  // --- USER PERMISSIONS ---
  getUserPermissions: (userId: number) => apiService.get<any>(`/auth/users/${userId}/permissions`),
}

// ============================================
// ÉLÈVES
// ============================================
export const studentsApi = {
  getAll: (params?: { page?: number; per_page?: number; search?: string; class_id?: number; level_id?: number; section_id?: number; status?: string; gender?: string; social_case?: boolean; }) =>
    apiService.get<any>('/students', { params }),
  getById: (id: number) => apiService.get<any>(`/students/${id}`),
  create: (data: Record<string, any>) => apiService.post<any>('/students', data),
  update: (id: number, data: FormData) => apiService.put<any>(`/students/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: number) => apiService.delete(`/students/${id}`),
  search: (filters: Record<string, any>) => apiService.post<any>('/students/search', filters),
  transfer: (id: number, data: any) => apiService.post(`/students/${id}/transfer`, data),
  bulkTransfer: (data: any) => apiService.post('/students/bulk-transfer', data),
  exclude: (id: number, data: any) => apiService.post(`/students/${id}/exclude`, data),
  bulkExclude: (data: any) => apiService.post('/students/bulk-exclude', data),
  reintegrate: (id: number, data: any) => apiService.post(`/students/${id}/reintegrate`, data),
  resign: (id: number, data: any) => apiService.post(`/students/${id}/resign`, data),
  bulkResign: (data: any) => apiService.post('/students/bulk-resign', data),
  importExcel: (file: File) => apiService.upload<any>('/students/import', file),
  exportExcel: (params?: Record<string, any>) => apiService.get<Blob>('/students/export/excel', { params, responseType: 'blob' }),
  exportPDF: (params?: Record<string, any>) => apiService.get<Blob>('/students/export/pdf', { params, responseType: 'blob' }),
  getTemplate: () => apiService.get<Blob>('/students/template', { responseType: 'blob' }),
//  getStats: () => apiService.get<any>('/students/stats'),
  getStats: (params?: { school_id?: number; academic_year_id?: number }) => apiService.get<any>('/students/stats/summary', { params }),

  getDiscipline: (id: number) => apiService.get<any>(`/students/${id}/discipline`),
  getGrades: (id: number, params?: any) => apiService.get<any>(`/students/${id}/grades`, { params }),


/*
  getAll: (params?: { page?: number; per_page?: number; search?: string; class_id?: number; level_id?: number; section_id?: number; status?: string; gender?: string; social_case?: boolean; }) =>
    apiService.get<any>('/students', { params }),
  getById: (id: number) => apiService.get<any>(`/students/${id}`),
  create: (data: Record<string, any>) => apiService.post<any>('/students', data),
  update: (id: number, data: FormData) => apiService.put<any>(`/students/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: number) => apiService.delete(`/students/${id}`),
  search: (filters: Record<string, any>) => apiService.post<any>('/students/search', filters),
  transfer: (id: number, data: any) => apiService.post(`/students/${id}/transfer`, data),
  bulkTransfer: (data: any) => apiService.post('/students/bulk-transfer', data),
  exclude: (id: number, data: any) => apiService.post(`/students/${id}/exclude`, data),
  bulkExclude: (data: any) => apiService.post('/students/bulk-exclude', data),
  reintegrate: (id: number, data: any) => apiService.post(`/students/${id}/reintegrate`, data),
  resign: (id: number, data: any) => apiService.post(`/students/${id}/resign`, data),
  bulkResign: (data: any) => apiService.post('/students/bulk-resign', data),
  importExcel: (file: File) => apiService.upload<any>('/students/import', file),
  exportExcel: (params?: Record<string, any>) => apiService.get<Blob>('/students/export/excel', { params, responseType: 'blob' }),
  exportPDF: (params?: Record<string, any>) => apiService.get<Blob>('/students/export/pdf', { params, responseType: 'blob' }),
  getTemplate: () => apiService.get<Blob>('/students/template', { responseType: 'blob' }),
  getStats: (params?: { school_id?: number; academic_year_id?: number }) => apiService.get<any>('/students/stats/summary', { params }),
  getDiscipline: (id: number) => apiService.get<any>(`/students/${id}/discipline`),
  getGrades: (id: number, params?: any) => apiService.get<any>(`/students/${id}/grades`, { params }),

*/




  // ✅ CORRIGÉ: Import students from CSV — envoie FormData avec school_id + academic_year_id
  importStudents: (formData: FormData) =>
    apiService.post<any>('/students/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
}




// ============================================
// ENSEIGNANTS
// ============================================
export const teachersApi = {
  // ✅ FIX: Return type changed from any[] to any to avoid TypeScript narrowing to 'never'
  getAll: (params?: {
    status?: string;
    contract_type?: string;
    search?: string;
  }) => apiService.get<any>('/teachers', { params }),

  getById: (id: number) => apiService.get<any>(`/teachers/${id}`),

  create: (data: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    password: string;
    matricule: string;
    qualifications?: string[];
    subjects_specialization?: string[];
    hire_date?: string;
    contract_type?: 'PERMANENT' | 'CONTRACTUAL' | 'TEMPORARY';
    status?: 'active' | 'inactive' | 'suspendu' | 'retraite';
  }) => apiService.post<any>('/teachers', data),

  update: (id: number, data: Partial<{
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    password?: string;
    matricule: string;
    qualifications?: string[];
    subjects_specialization?: string[];
    hire_date?: string;
    contract_type?: 'PERMANENT' | 'CONTRACTUAL' | 'TEMPORARY';
    status?: 'active' | 'inactive' | 'suspendu' | 'retraite';
  }>) => apiService.put<any>(`/teachers/${id}`, data),

  delete: (id: number) => apiService.delete(`/teachers/${id}`),

  // Matières — ✅ FIX: pas de params du tout si vide
  getSubjects: (params?: { section_id?: number; specialty_id?: number; status?: string }) => {
    const cleanParams: Record<string, any> = {}
    if (params?.section_id !== undefined && params.section_id !== null) cleanParams.section_id = params.section_id
    if (params?.specialty_id !== undefined && params.specialty_id !== null) cleanParams.specialty_id = params.specialty_id
    if (params?.status !== undefined && params.status !== null && params.status !== '') cleanParams.status = params.status
    // Si aucun param, ne pas envoyer du tout l'objet params
    return apiService.get<any>('/teachers/subjects', Object.keys(cleanParams).length > 0 ? { params: cleanParams } : undefined)
  },
  createSubject: (data: {
    code: string;
    label_fr: string;
    label_en: string;
    abbreviation: string;
    coefficient?: number;
    section_id?: number;
    specialty_id?: number;
    is_core?: boolean;
    max_score?: number;
    status?: string;
  }) => apiService.post<any>('/teachers/subjects', data),

  // Affectations enseignant-matière-classe
  getAssignments: (params?: { teacher_id?: number; class_id?: number; academic_year_id?: number }) => {
    const cleanParams: Record<string, any> = {}
    if (params?.teacher_id !== undefined) cleanParams.teacher_id = params.teacher_id
    if (params?.class_id !== undefined) cleanParams.class_id = params.class_id
    if (params?.academic_year_id !== undefined) cleanParams.academic_year_id = params.academic_year_id
    return apiService.get<any>('/teachers/assignments', { params: Object.keys(cleanParams).length > 0 ? cleanParams : undefined })
  },
  createAssignment: (data: {
    teacher_id: number;
    subject_id: number;
    class_id: number;
    academic_year_id: number;
    hours_per_week?: number;
    is_principal_teacher?: boolean;
    status?: string;
  }) => apiService.post<any>('/teachers/assignments', data),
  deleteAssignment: (assignmentId: number) => 
    apiService.delete(`/teachers/assignments/${assignmentId}`),

  // Retards (legacy)
  getDelays: (id: number, params?: Record<string, any>) => 
    apiService.get<any>(`/teachers/${id}/delays`, { params }),
  recordDelay: (data: { teacher_id: number; date: string; reason?: string; minutes?: number }) => 
    apiService.post('/teachers/delays', data),
}


// ============================================
// CLASSES & NIVEAUX
// ============================================
export const classesApi = {
  getAll: (params?: Record<string, any>) => apiService.get<any>('/classes', { params }),
  getById: (id: number) => apiService.get<any>(`/classes/${id}`),
  create: (data: any) => apiService.post<any>('/classes', data),
  update: (id: number, data: any) => apiService.put<any>(`/classes/${id}`, data),
  delete: (id: number) => apiService.delete(`/classes/${id}`),
  getStudents: (id: number) => apiService.get<any>(`/classes/${id}/students`),
  getSubjects: (id: number) => apiService.get<any>(`/classes/${id}/subjects`),
}

export const levelsApi = {
  getAll: () => apiService.get<any>('/levels'),
  getById: (id: number) => apiService.get<any>(`/levels/${id}`),
  create: (data: any) => apiService.post<any>('/levels', data),
  update: (id: number, data: any) => apiService.put<any>(`/levels/${id}`, data),
  delete: (id: number) => apiService.delete(`/levels/${id}`),
}

export const sectionsApi = {
  getAll: () => apiService.get<any>('/sections'),
  getById: (id: number) => apiService.get<any>(`/sections/${id}`),
  create: (data: any) => apiService.post<any>('/sections', data),
  update: (id: number, data: any) => apiService.put<any>(`/sections/${id}`, data),
  delete: (id: number) => apiService.delete(`/sections/${id}`),
}

// ============================================
// MATIÈRES
// ============================================
export const subjectsApi = {
  getAll: (params?: Record<string, any>) => apiService.get<any>('/teachers/subjects', { params }),
  getById: (id: number) => apiService.get<any>(`/teachers/subjects/${id}`),
  create: (data: any) => apiService.post<any>('/teachers/subjects', data),
  update: (id: number, data: any) => apiService.put<any>(`/teachers/subjects/${id}`, data),
  delete: (id: number) => apiService.delete(`/teachers/subjects/${id}`),
}

// ============================================
// EMPLOI DU TEMPS
// ============================================
export const timetableApi = {
  getAll: (params?: any) => apiService.get<any>('/timetable', { params }),
  getById: (id: number) => apiService.get<any>(`/timetable/${id}`),
  create: (data: any) => apiService.post<any>('/timetable', data),
  update: (id: number, data: any) => apiService.put<any>(`/timetable/${id}`, data),
  delete: (id: number) => apiService.delete(`/timetable/${id}`),
  getTimeSlots: () => apiService.get<any>('/timetable/time-slots'),
  createTimeSlot: (data: any) => apiService.post<any>('/timetable/time-slots', data),
  getRooms: () => apiService.get<any>('/rooms'),
  createRoom: (data: any) => apiService.post<any>('/rooms', data),
  getTeacherTimetable: (teacherId: number, params?: any) => apiService.get<any>(`/teachers/${teacherId}/timetable`, { params }),
  getClassTimetable: (classId: number, params?: any) => apiService.get<any>(`/classes/${classId}/timetable`, { params }),
}

// ============================================
// NOTES / GRADES
// ============================================
export const gradesApi = {
  getSequences: () => apiService.get<any>('/grades/sequences'),
  createSequence: (data: any) => apiService.post<any>('/grades/sequences', data),
  toggleSequence: (id: number) => apiService.patch<any>(`/grades/sequences/${id}/toggle`, {}),
  getGrades: (params?: any) => apiService.get<any>('/grades', { params }),
  createGrade: (data: any) => apiService.post<any>('/grades', data),
  createBulkGrades: (data: any) => apiService.post<any>('/grades/bulk', data),
  updateGrade: (id: number, data: any) => apiService.put<any>(`/grades/${id}`, data),
  validateGrades: (gradeIds: number[]) => apiService.post<any>('/grades/validate', { grade_ids: gradeIds }),
  getClassAverage: (classId: number, params?: any) => apiService.get<any>(`/grades/averages/${classId}`, { params }),
  getClassRanking: (classId: number, params?: any) => apiService.get<any>(`/grades/ranking/${classId}`, { params }),
  getHonorBoard: (params?: any) => apiService.get<any>('/grades/honor-board', { params }),
  calculateAverages: (evaluationPeriodId: number, params?: any) => apiService.post<any>(`/grades/calculate-averages/${evaluationPeriodId}`, null, { params }),
  getGradeStatistics: (classId: number, subjectId: number, sequenceId: number) => apiService.get<any>(`/grades/statistics/${classId}/${subjectId}/${sequenceId}`),
  generateBulletin: (studentId: number, params?: any) => apiService.get<Blob>(`/grades/bulletin/${studentId}`, { params, responseType: 'blob' }),
  getConfig: (params?: any) => apiService.get<any>('/grades/config', { params }),
  openEntry: (data: any) => apiService.post('/grades/config/open', data),
  closeEntry: (configId: number) => apiService.post(`/grades/config/${configId}/close`, {}),
  getStudentGrades: (studentId: number, params?: any) => apiService.get<any>(`/students/${studentId}/grades`, { params }),
  enterGrades: (data: any) => apiService.post('/grades/bulk', data),
  publish: (configId: number) => apiService.post(`/grades/config/${configId}/publish`, {}),
  getAverages: (params?: any) => apiService.get<any>('/grades/averages', { params }),
  getStudentAverage: (studentId: number, params?: any) => apiService.get<any>(`/students/${studentId}/average`, { params }),
  getHonorRollConfig: (params?: any) => apiService.get<any>('/grades/honor-roll-config', { params }),
  updateHonorRollConfig: (id: number, data: any) => apiService.put<any>(`/grades/honor-roll-config/${id}`, data),
}

// ============================================
// BULLETINS
// ============================================
export const reportCardsApi = {
  generate: (data: any) => apiService.post<any[]>('/report-cards/generate', data),
  getByStudent: (studentId: number, params?: any) => apiService.get<any>(`/students/${studentId}/report-cards`, { params }),
  getById: (id: number) => apiService.get<any>(`/report-cards/${id}`),
  bulkGenerate: (data: any) => apiService.post<Blob>('/report-cards/bulk-generate', data, { responseType: 'blob' }),
  print: (id: number) => apiService.get<Blob>(`/report-cards/${id}/print`, { responseType: 'blob' }),
}

// ============================================
// DISCIPLINE
// ============================================
export const disciplineApi = {
  getAll: (params?: any) => apiService.get<any>('/discipline', { params }),
  getByStudent: (studentId: number) => apiService.get<any>(`/students/${studentId}/discipline`),
  create: (data: any) => apiService.post<any>('/discipline', data),
  update: (id: number, data: any) => apiService.put<any>(`/discipline/${id}`, data),
  delete: (id: number) => apiService.delete(`/discipline/${id}`),
  getStats: (params?: any) => apiService.get<any>('/discipline/stats', { params }),
  getStudentStats: (studentId: number) => apiService.get<any>(`/students/${studentId}/discipline-stats`),
  createConvocation: (data: any) => apiService.post<any>('/discipline/convocations', data),
  getConvocations: (params?: any) => apiService.get<any>('/discipline/convocations', { params }),
}

// ============================================
// BUDGET
// ============================================
export const budgetApi = {
  getCategories: () => apiService.get<any>('/budget/categories'),
  createCategory: (data: any) => apiService.post<any>('/budget/categories', data),
  updateCategory: (id: number, data: any) => apiService.put<any>(`/budget/categories/${id}`, data),
  deleteCategory: (id: number) => apiService.delete(`/budget/categories/${id}`),
  getSubLines: (categoryId?: number) => apiService.get<any>('/budget/sub-lines', { params: categoryId ? { category_id: categoryId } : undefined }),
  createSubLine: (data: any) => apiService.post<any>('/budget/sub-lines', data),
  updateSubLine: (id: number, data: any) => apiService.put<any>(`/budget/sub-lines/${id}`, data),
  deleteSubLine: (id: number) => apiService.delete(`/budget/sub-lines/${id}`),
  getExpenses: (params?: any) => apiService.get<any>('/budget/expenses', { params }),
  createExpense: (data: any) => apiService.post<any>('/budget/expenses', data),
  updateExpense: (id: number, data: any) => apiService.put<any>(`/budget/expenses/${id}`, data),
  deleteExpense: (id: number) => apiService.delete(`/budget/expenses/${id}`),
  getSummary: (params?: any) => apiService.get<any>('/budget/summary', { params }),
  exportPDF: (params?: any) => apiService.get<Blob>('/budget/export/pdf', { params, responseType: 'blob' }),
  exportExcel: (params?: any) => apiService.get<Blob>('/budget/export/excel', { params, responseType: 'blob' }),
}

// ============================================
// STATISTIQUES
// ============================================
export const statsApi = {
  getDashboard: () => apiService.get<any>('/stats/dashboard'),
  getTermResults: (params?: any) => apiService.get<any>('/stats/term-results', { params }),
  getClassResults: (classId: number, params?: any) => apiService.get<any>(`/stats/classes/${classId}/results`, { params }),
  getStudentRanking: (params?: any) => apiService.get<any>('/stats/ranking', { params }),
  getPassRate: (params?: any) => apiService.get<any>('/stats/pass-rate', { params }),
  getHonorRoll: (params?: any) => apiService.get<any>('/stats/honor-roll', { params }),
  getClassCouncil: (classId: number, params?: any) => apiService.get<any>(`/stats/classes/${classId}/council`, { params }),
  generatePV: (data: any) => apiService.post<Blob>('/stats/pv', data, { responseType: 'blob' }),
  getAdmittedList: (params?: any) => apiService.get<any>('/stats/admitted', { params }),
  getRepeatList: (params?: any) => apiService.get<any>('/stats/repeat', { params }),
  getExcludedList: (params?: any) => apiService.get<any>('/stats/excluded', { params }),
  getRecentActivity: (params?: any) => apiService.get<any>('/stats/recent-activity', { params }),
}

// ============================================
// COMMUNICATION
// ============================================
export const messagesApi = {
  getTemplates: () => apiService.get<any>('/messages/templates'),
  createTemplate: (data: any) => apiService.post<any>('/messages/templates', data),
  updateTemplate: (id: number, data: any) => apiService.put<any>(`/messages/templates/${id}`, data),
  deleteTemplate: (id: number) => apiService.delete(`/messages/templates/${id}`),
  sendSMS: (data: any) => apiService.post('/messages/sms', data),
  sendEmail: (data: any) => apiService.post('/messages/email', data),
  getSentMessages: (params?: any) => apiService.get<any>('/messages/sent', { params }),
  getSmsCredits: () => apiService.get<any>('/messages/sms-credits'),
  purchaseCredits: (amount: number) => apiService.post('/messages/sms-credits/purchase', { amount }),
}

// ============================================
// CONTENU PUBLIC
// ============================================
export const contentApi = {
  getNews: (params?: any) => apiService.get<any>('/content/news', { params }),
  getNewsById: (id: number) => apiService.get<any>(`/content/news/${id}`),
  createNews: (data: any) => apiService.post<any>('/content/news', data),
  updateNews: (id: number, data: any) => apiService.put<any>(`/content/news/${id}`, data),
  deleteNews: (id: number) => apiService.delete(`/content/news/${id}`),
  getEvents: (params?: any) => apiService.get<any>('/content/events', { params }),
  getEventById: (id: number) => apiService.get<any>(`/content/events/${id}`),
  createEvent: (data: any) => apiService.post<any>('/content/events', data),
  updateEvent: (id: number, data: any) => apiService.put<any>(`/content/events/${id}`, data),
  deleteEvent: (id: number) => apiService.delete(`/content/events/${id}`),
  getForumTopics: (params?: any) => apiService.get<any>('/content/forum', { params }),
  getForumTopic: (id: number) => apiService.get<any>(`/content/forum/${id}`),
  createForumTopic: (data: any) => apiService.post<any>('/content/forum', data),
  createForumReply: (topicId: number, data: any) => apiService.post<any>(`/content/forum/${topicId}/replies`, data),
  getGallery: (params?: any) => apiService.get<any>('/content/gallery', { params }),
  uploadImage: (data: FormData) => apiService.post<any>('/content/gallery', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteImage: (id: number) => apiService.delete(`/content/gallery/${id}`),
}

// ============================================
// SPÉCIALITÉS & GROUPES DE SPÉCIALITÉ
// ============================================
export const specialtiesApi = {
  getSpecialtyGroups: (sectionId?: number) =>
    apiService.get<any[]>('/classes/specialty-groups', { params: sectionId ? { section_id: sectionId } : undefined }),
  createSpecialtyGroup: (data: { section_id: number; code: string; label_fr: string; label_en: string; status?: string }) =>
    apiService.post<any>('/classes/specialty-groups', data),
  updateSpecialtyGroup: (id: number, data: { label_fr?: string; label_en?: string; status?: string }) =>
    apiService.put<any>(`/classes/specialty-groups/${id}`, data),
  deleteSpecialtyGroup: (id: number) =>
    apiService.delete(`/classes/specialty-groups/${id}`),

  getSpecialties: (groupId: number) =>
    apiService.get<any[]>(`/classes/specialty-groups/${groupId}/specialties`),
  createSpecialty: (groupId: number, data: { code: string; abbreviation: string; label_fr: string; label_en: string; description?: string; status?: string }) =>
    apiService.post<any>(`/classes/specialty-groups/${groupId}/specialties`, data),
  updateSpecialty: (id: number, data: { code?: string; abbreviation?: string; label_fr?: string; label_en?: string; description?: string; status?: string }) =>
    apiService.put<any>(`/classes/specialty-groups/specialties/${id}`, data),
  deleteSpecialty: (id: number) =>
    apiService.delete(`/classes/specialty-groups/specialties/${id}`),

  downloadTemplate: () => apiService.get<Blob>('/classes/specialty-groups/template', { responseType: 'blob' }),
  importFromExcel: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiService.post<any>('/classes/specialty-groups/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
}

// ============================================
// CYCLES
// ============================================
export const cyclesApi = {
  getAll: (params?: Record<string, any>) => apiService.get<any>('/cycles', { params }),
  getById: (id: number) => apiService.get<any>(`/cycles/${id}`),
  create: (data: any) => apiService.post<any>('/cycles', data),
  update: (id: number, data: any) => apiService.put<any>(`/cycles/${id}`, data),
  delete: (id: number) => apiService.delete(`/cycles/${id}`),
}

// ============================================
// ÉCOLE / STRUCTURE ACADÉMIQUE
// ============================================
export const schoolApi = {
  getSchools: () => apiService.get<any>('/schools'),
  getSchoolById: (id: number) => apiService.get<any>(`/schools/${id}`),
  createSchool: (data: any) => apiService.post<any>('/schools', data),
  updateSchool: (id: number, data: any) => apiService.put<any>(`/schools/${id}`, data),
  deleteSchool: (id: number) => apiService.delete(`/schools/${id}`),

  getAcademicYears: (schoolId: number) => apiService.get<any>(`/schools/${schoolId}/academic-years`),
  getCurrentAcademicYear: (schoolId: number) => apiService.get<any>(`/schools/${schoolId}/academic-years/current`),
  createAcademicYear: (schoolId: number, data: any) => apiService.post<any>(`/schools/${schoolId}/academic-years`, data),
  updateAcademicYear: (schoolId: number, yearId: number, data: any) =>
    apiService.put<any>(`/schools/${schoolId}/academic-years/${yearId}`, data),
  deleteAcademicYear: (schoolId: number, yearId: number) =>
    apiService.delete(`/schools/${schoolId}/academic-years/${yearId}`),
  setCurrentAcademicYear: (schoolId: number, yearId: number) =>
    apiService.post<any>(`/schools/${schoolId}/academic-years/${yearId}/set-current`, {}),

  getSections: (schoolId: number) => apiService.get<any>(`/schools/${schoolId}/sections`),
  createSection: (schoolId: number, data: any) => apiService.post<any>(`/schools/${schoolId}/sections`, data),

  getCycles: (sectionId: number) => apiService.get<any>(`/schools/sections/${sectionId}/cycles`),
  createCycle: (sectionId: number, data: any) => apiService.post<any>(`/schools/sections/${sectionId}/cycles`, data),

  getLevels: (cycleId: number) => apiService.get<any>(`/schools/cycles/${cycleId}/levels`),
  createLevel: (cycleId: number, data: any) => apiService.post<any>(`/schools/cycles/${cycleId}/levels`, data),

  getCompleteStructure: (schoolId?: number) => apiService.get<any>('/schools/structure/complete', { params: schoolId ? { school_id: schoolId } : undefined }),

  uploadLogo: (file: File, schoolId?: number) => {
    if (!schoolId) throw new Error('school_id requis pour uploader le logo')
    const formData = new FormData()
    formData.append('file', file)
    return apiService.post<{ logo_url: string; full_url: string; message: string }>(`/schools/${schoolId}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  getLogo: (schoolId: number) => apiService.get<{ logo_url: string; full_url: string }>(`/schools/${schoolId}/logo`),

  getPermissions: () => apiService.get<any>('/auth/permissions'),
}

// ============================================
// ADMIN
// ============================================
export const adminApi = {
  getUsers: () => apiService.get<any>('/admin/users'),
  createUser: (data: any) => apiService.post<any>('/admin/users', data),
  updateUser: (id: number, data: any) => apiService.put<any>(`/admin/users/${id}`, data),
  deleteUser: (id: number) => apiService.delete(`/admin/users/${id}`),
  resetPassword: (id: number) => apiService.post(`/admin/users/${id}/reset-password`, {}),

  getRoles: () => apiService.get<any>('/auth/roles'),
  getRoleById: (id: number) => apiService.get<any>(`/auth/roles/${id}`),
  createRole: (data: any) => apiService.post<any>('/auth/roles', data),
  updateRole: (id: number, data: any) => apiService.put<any>(`/auth/roles/${id}`, data),
  deleteRole: (id: number) => apiService.delete(`/auth/roles/${id}`),

  getPermissions: () => apiService.get<any>('/auth/permissions'),
  getPermissionById: (id: number) => apiService.get<any>(`/auth/permissions/${id}`),
  createPermission: (data: any) => apiService.post<any>('/auth/permissions', data),
  updatePermission: (id: number, data: any) => apiService.put<any>(`/auth/permissions/${id}`, data),
  deletePermission: (id: number) => apiService.delete(`/auth/permissions/${id}`),

  getRolePermissions: (roleId: number) => apiService.get<any>(`/auth/roles/${roleId}/permissions`),
  grantPermission: (roleId: number, permissionId: number) =>
    apiService.post<any>(`/auth/roles/${roleId}/permissions`, { permission_id: permissionId }),
  revokePermission: (roleId: number, permissionId: number) =>
    apiService.delete<any>(`/auth/roles/${roleId}/permissions/${permissionId}`),

  updateUserPermissions: (userId: number, data: any) =>
    apiService.put<any>(`/auth/users/${userId}/permissions`, data),

  getAuditLogs: (params?: Record<string, any>) => apiService.get<any>('/audit/logs', { params }),
  getAuditStatistics: (days?: number) => apiService.get<any>(`/audit/statistics`, { params: { days: days || 30 } }),
  getAnalyticsDashboard: () => apiService.get<any>('/audit/dashboard'),
  getPageVisits2: (params?: Record<string, any>) => apiService.get<any>('/audit/page-visits', { params }),

  getSchool: () => apiService.get<any>('/admin/school'),
  updateSchool: (data: any) => apiService.put<any>('/admin/school', data),
  uploadLogo: (file: File, schoolId?: number) => {
    if (!schoolId) throw new Error('school_id requis pour uploader le logo')
    const formData = new FormData()
    formData.append('file', file)
    return apiService.post<any>(`/schools/${schoolId}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  getPageVisits: async (params?: {
    user_id?: number
    page_category?: string
    visitor_type?: string
    device_type?: string
    country?: string
    city?: string
    date_from?: string
    date_to?: string
    search?: string
    page?: number
    per_page?: number
  }) => {
    return apiService.get<any>('/audit/page-visits', { params })
  },
}