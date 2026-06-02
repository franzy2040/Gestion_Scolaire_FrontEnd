import { apiService } from './api'

export interface Student {
  id: number
  full_name: string
  gender: string
  birth_date: string
  birth_place: string
  nationality: string
  section_id: number
  cycle_id: number
  level_id: number
  class_id: number
  father_name?: string
  mother_name?: string
  emergency_contact?: string
  birth_certificate_ref?: string
  civil_registry_center?: string
  birth_certificate_issuer?: string
  disability?: string
  social_case?: string
  photo_url?: string
  status: string
  created_at: string
  updated_at: string
}

export interface StudentCreateData {
  full_name: string
  gender: string
  birth_date: string
  birth_place: string
  nationality: string
  section_id: number
  cycle_id: number
  level_id: number
  class_id: number
  father_name?: string
  mother_name?: string
  emergency_contact?: string
  birth_certificate_ref?: string
  civil_registry_center?: string
  birth_certificate_issuer?: string
  disability?: string
  social_case?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export const studentService = {
  getStudents: async (params?: Record<string, unknown>) => {
    return await apiService.get<PaginatedResponse<Student>>('/students', { params })
  },

  getStudent: async (id: number) => {
    return await apiService.get<Student>(`/students/${id}`)
  },

  createStudent: async (data: FormData | StudentCreateData) => {
    if (data instanceof FormData) {
      return await apiService.post<Student>('/students', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }
    return await apiService.post<Student>('/students', data)
  },

  updateStudent: async (id: number, data: FormData | Partial<StudentCreateData>) => {
    if (data instanceof FormData) {
      return await apiService.put<Student>(`/students/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }
    return await apiService.put<Student>(`/students/${id}`, data)
  },

  deleteStudent: async (id: number) => {
    return await apiService.delete(`/students/${id}`)
  },

  importStudents: async (file: File, classId: number, academicYearId: number) => {
    const formData = new FormData()
    formData.append('file', file)
    return await apiService.post('/students/import', formData, {
      params: { class_id: classId, academic_year_id: academicYearId },
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getStatistics: async () => {
    return await apiService.get('/students/stats/summary')
  },
}
