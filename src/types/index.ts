/** """
Types TypeScript pour l'application Lycée Bilingue de Baleng
""" */

// ============================================
// AUTH
// ============================================
// src/types/index.ts
export * from './budgetTypes'
// ... autres exports
export interface User {
  id: number
  email: string
  full_name: string
  first_name?: string
  last_name?: string
  phone?: string
  matricule?: string
  role_id?: number
  role_name?: string
  role: 'superadmin' | 'admin' | 'teacher' | 'secretary' | 'accountant' | 'readonly'
  school_id?: number
  avatar_url?: string
  preferred_language?: string
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification'
  is_2fa_enabled: boolean
  is_active: boolean
  last_login?: string
  login_count?: number
  created_at: string
  updated_at?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: User
   requires_2fa?: boolean  // ✅ AJOUTER
}

// ============================================
// PAGINATION
// ============================================
export interface PaginatedResponse<T> {
  items: T[]
  data?: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

// ============================================
// SCHOOL
// ============================================
export interface School {
  id: number
  name: string
  name_en?: string
  acronym?: string
  address?: string
  city: string
  region?: string
  country: string
  phone?: string
  email?: string
  logo_url?: string
  website?: string
  founded_year?: number
  foundation_year?: number
  principal_name: string
  principal_name_en?: string
  accreditation?: string
  accreditation_number?: string
  tax_id?: string
  status: string
}

export interface AcademicYear {
  id: number
  school_id: number
  label: string
  start_date: string
  end_date: string
  is_current: boolean
  status: string
}

// ============================================
// SECTIONS & CYCLES & LEVELS
// ============================================
export interface Section {
  id: number
  school_id?: number
  code: 'FR' | 'EN'
  label_fr: string
  label_en: string
  name?: string
  name_en?: string
  language?: 'francophone' | 'anglophone'
  description?: string
}

export interface Cycle {
  id: number
  section_id: number
  code: 'C1' | 'C2'
  label_fr: string
  label_en: string
  order_index: number
}

export interface Level {
  id: number
  cycle_id?: number
  code: string
  label_fr?: string
  label_en?: string
  name: string
  name_en?: string
  order: number
  order_index?: number
  section_id?: number
}

// ============================================
// STUDENTS
// ============================================
export type StudentStatus = 'nouveau' | 'ancien' | 'inscrit' | 'démission' | 'exclu' | 'transféré' | 'réintégré' | 'active' | 'inactive' | 'graduated'
export type Gender = 'M' | 'F'
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'

export interface Student {
  id: number
  matricule: string
  first_name: string
  last_name: string
  sex?: 'M' | 'F'
  gender: Gender
  date_of_birth: string
  place_of_birth: string
  nationality: string

  // Contact
  address: string
  phone?: string
  email?: string

  // Parents
  father_name?: string
  father_phone?: string
  father_occupation?: string
  mother_name: string
  mother_phone?: string
  mother_occupation?: string
  guardian_name?: string
  guardian_phone?: string
  guardian_relation?: string

  // Académique
  registration_date?: string
  class_id?: number
  class_name?: string
  level_id?: number
  level_name?: string
  section_id?: number
  section_name?: string
  previous_school?: string
  previous_level?: string

  // Santé
  blood_group?: BloodGroup
  allergies?: string
  medical_conditions?: string
  emergency_contact?: string
  emergency_phone: string

  // Documents
  birth_certificate_ref?: string
  civil_status_center?: string
  birth_certificate_issuer?: string
  birth_certificate_url?: string
  photo_url?: string

  // Statut
  status: StudentStatus
  status_date?: string
  status_reason?: string

  // Discipline
  discipline_points?: number
  total_warnings?: number
  total_suspensions?: number
  handicap?: boolean
  handicap_details?: string
  social_case?: boolean
  social_case_details?: string
  matricule_national?: string
  matricule_type?: string

  created_at: string
  updated_at?: string
}

export interface StudentCreate {
  matricule: string
  first_name: string
  last_name: string
  sex: 'M' | 'F'
  gender?: Gender
  date_of_birth: string
  place_of_birth: string
  nationality?: string
  father_name?: string
  mother_name: string
  emergency_contact?: string
  emergency_phone: string
  birth_certificate_ref: string
  civil_status_center: string
  birth_certificate_issuer: string
  handicap?: boolean
  handicap_details?: string
  social_case?: boolean
  social_case_details?: string
  class_id: number
  academic_year_id: number
}

export interface StudentFormData {
  matricule: string
  first_name: string
  last_name: string
  gender: Gender
  date_of_birth: string
  place_of_birth: string
  nationality: string
  address: string
  phone?: string
  email?: string
  father_name?: string
  father_phone?: string
  father_occupation?: string
  mother_name?: string
  mother_phone?: string
  mother_occupation?: string
  guardian_name?: string
  guardian_phone?: string
  guardian_relation?: string
  class_id: number
  level_id?: number
  section_id?: number
  previous_school?: string
  previous_level?: string
  blood_group?: BloodGroup
  allergies?: string
  medical_conditions?: string
  emergency_contact?: string
  emergency_phone?: string
  birth_certificate?: File
  photo?: File
   // ✅ AJOUTE CECI
  photo_url?: string;
}

export interface StudentSearchFilters {
  matricule?: string
  name?: string
  date_of_birth?: string
  class_id?: number
  level_id?: number
  section_id?: number
  status?: StudentStatus
  gender?: Gender
}

// ============================================
// TEACHERS
// ============================================
export interface Teacher {
  id: number
  employee_id?: string
  user_id?: number
  first_name?: string
  last_name?: string
  full_name?: string
  gender: Gender
  date_of_birth: string
  place_of_birth: string
  nationality: string
  address: string
  phone?: string
  email?: string

  // Professionnel
  qualification: string
  qualifications?: string[]
  specialization: string
  subjects_specialization?: string[]
  hire_date?: string
  contract_type?: 'CDI' | 'CDD' | 'Vacataire'
  status: 'actif' | 'suspendu' | 'démission' | 'retraite' | 'active' | 'inactive' | 'suspended' | 'retired'

  // Affectations
  subjects?: Subject[]
  classes?: Class[]

  // Discipline
  total_delays?: number
  delay_hours?: number

  photo_url?: string
  created_at: string
  updated_at?: string
  matricule?: string
}

// ============================================
// CLASSES
// ============================================
export interface Class {
  id: number
  name: string
  level_id: number
  level_name?: string
  section_id: number
  section_name?: string
  capacity: number
  room?: string
  class_teacher_id?: number
  class_teacher_name?: string
  student_count?: number
  academic_year?: string
}

export interface SubClass {
  id: number
  name: string
  class_id: number
  capacity: number
}

// ============================================
// SUBJECTS
// ============================================
export interface Subject {
  id: number
  name: string
  name_en?: string
  code: string
  abbreviation?: string
  coefficient: number
  section_id?: number
  section_name?: string
  level_ids?: number[]
  hours_per_week?: number
  is_core?: boolean
  is_active: boolean
  max_score?: number
  specialty_id?: number
  label_fr?: string
  label_en?: string
}

export interface TeacherSubjectClass {
  id: number
  teacher_id: number
  teacher_name?: string
  subject_id: number
  subject_name?: string
  class_id: number
  class_name?: string
  hours_per_week: number
  academic_year?: string
}

// ============================================
// TIMETABLE
// ============================================
export type DayOfWeek = 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi'

export interface Timetable {
  id: number
  class_id: number
  academic_year_id: number
  label: string
  is_active: boolean
  is_template: boolean
  class_name?: string
  academic_year_label?: string
}

export interface TimeSlot {
  id: number
  day?: DayOfWeek
  day_of_week?: number
  start_time: string
  end_time: string
  is_break: boolean
  break_type?: 'petite' | 'grande'
}

export interface TimetableSlot {
  id: number
  timetable_id?: number
  day_of_week: number
  start_time: string
  end_time: string
  subject_id?: number
  teacher_id?: number
  room?: string
  slot_type: string
  subject_name?: string
  subject_abbreviation?: string
  teacher_name?: string
  day_name?: string
}

export interface TimetableEntry {
  id: number
  time_slot_id?: number
  day?: DayOfWeek
  day_of_week?: number
  start_time: string
  end_time: string
  subject_id: number
  subject_name?: string
  subject_code?: string
  teacher_id: number
  teacher_name?: string
  class_id: number
  class_name?: string
  room_id?: number
  room_name?: string
  academic_year?: string
  term?: number
}

export interface Room {
  id: number
  name: string
  capacity: number
  type: 'salle' | 'labo' | 'bibliothèque' | 'sports'
  building?: string
}

export interface TeacherDelay {
  id: number
  teacher_id: number
  teacher_name?: string
  date: string
  scheduled_time: string
  actual_time: string
  delay_minutes: number
  reason?: string
  is_justified: boolean
  recorded_by: number
  created_at: string
}

// ============================================
// GRADES
// ============================================
export type Sequence = 'seq1' | 'seq2' | 'seq3' | 'seq4' | 'seq5' | 'seq6'
export type Term = 1 | 2 | 3

export interface Grade {
  id: number
  student_id: number
  subject_id: number
  sequence_id?: number
  teacher_id?: number
  class_id?: number
  score?: number
  max_score?: number
  coefficient?: number
  class_mark?: number
  exam_mark?: number
  final_mark?: number
  appreciation_fr?: string
  appreciation_en?: string
  appreciation?: string
  is_validated: boolean
  is_published?: boolean
  academic_year_id?: number
  student_name?: string
  subject_name?: string
  subject_coefficient?: number
  sequence_label?: string
  teacher_name?: string
  class_name?: string
  points?: number
  rank?: number
  sequence?: Sequence
  term?: Term
  academic_year?: string
  entered_by?: number
  entered_by_name?: string
  entered_at?: string
  modified_by?: number
  modified_at?: string
  published_at?: string
}

export interface GradeEntry {
  student_id: number
  class_mark?: number
  exam_mark?: number
}

export interface GradeConfig {
  id: number
  academic_year?: string
  term?: Term
  sequence?: Sequence
  subject_id?: number
  class_id?: number
  is_open: boolean
  opened_at?: string
  opened_by?: number
  closed_at?: string
  closed_by?: number
  deadline?: string
}

export interface StudentAverage {
  id: number
  student_id: number
  class_id?: number
  evaluation_period_id?: number
  average_score?: number
  rank?: number
  total_coefficient?: number
  total_points?: number
  appreciation_fr?: string
  appreciation_en?: string
  decision?: string
  is_published: boolean
  student_name?: string
  class_name?: string
  evaluation_period_label?: string
}

export interface StudentTermAverage {
  student_id: number
  student_name: string
  student_matricule?: string
  matricule?: string
  class_id: number
  class_name: string
  term: Term
  academic_year: string

  average: number
  total_coefficient: number
  total_points: number
  rank: number

  subject_averages?: {
    subject_id: number
    subject_name: string
    coefficient: number
    average: number
    class_mark?: number
    exam_mark?: number
    appreciation?: string
  }[]

  // Décisions
  decision: string
  decision_en?: string
  is_honor_roll: boolean
  is_encouragement: boolean
  is_congratulations: boolean
  is_warning: boolean
  is_blame: boolean
}

export interface HonorRollConfig {
  id: number
  academic_year?: string
  term?: Term
  honor_threshold: number
  encouragement_threshold: number
  congratulations_threshold: number
  warning_threshold: number
  blame_threshold: number
}

// ============================================
// REPORT CARDS
// ============================================
export interface ReportCard {
  student_id: number
  student_name: string
  student_matricule?: string
  matricule?: string
  date_of_birth?: string
  place_of_birth?: string
  gender?: Gender

  class_id: number
  class_name: string
  level_name?: string
  section_name?: string

  academic_year: string
  term: Term

  principal_name?: string
  class_teacher_name?: string

  subjects?: {
    subject_name: string
    subject_name_en?: string
    coefficient: number
    class_mark?: number
    exam_mark?: number
    average: number
    rank?: number
    appreciation: string
    appreciation_en?: string
    teacher_name?: string
  }[]

  term_average: number
  term_rank: number
  class_size: number

  total_coefficient: number
  total_points: number

  conduct?: number
  work_attitude?: number

  decision: string
  decision_en?: string

  is_honor_roll: boolean
  is_encouragement: boolean
  is_congratulations: boolean
  is_warning: boolean
  is_blame: boolean

  absence_days?: number
  absence_hours?: number
  delay_count?: number

  principal_observation?: string
  class_teacher_observation?: string

  generated_at: string

}

// ============================================
// DISCIPLINE
// ============================================
export type DisciplineType = 'retard' | 'absence' | 'exclusion' | 'convocation' | 'avertissement' | 'blâme'

export interface DisciplineRecord {
  id: number
  student_id: number
  student_name?: string
  student_matricule?: string
  class_name?: string
  class_id?: number

  type?: DisciplineType
  record_type?: string
  reason: string
  description?: string
  date_recorded?: string
  date?: string

  // Exclusion
  duration_hours?: number
  duration_days?: number
  exclusion_days?: number
  exclusion_hours?: number
  exclusion_start?: string
  exclusion_end?: string
  trimester_id?: number
  trimester_label?: string

  // Retard
  delay_minutes?: number
  is_justified: boolean
  justification?: string

  // Convocation
  convocation_date?: string
  convocation_time?: string
  parent_present?: boolean
  parent_name?: string
  parent_notified?: boolean

  // Suivi
  follow_up?: string
  follow_up_date?: string

  // Points
  points_deducted?: number

  recorded_by: number
  recorded_by_name?: string
  approved_by?: number
  created_at: string
}

export interface DisciplineStats {
  student_id?: number
  student_name?: string
  total_records?: number
  total_delays?: number
  total_delay_minutes?: number
  total_absences?: number
  total_exclusions?: number
  total_exclusion_days?: number
  total_convocations?: number
  total_warnings?: number
  total_blames?: number
  current_points?: number
}

// ============================================
// BUDGET
// ============================================
export interface BudgetYear {
  id: number
  school_id?: number
  academic_year_id?: number
  label: string
  reference_number?: string
  initial_balance?: number
  total_income?: number
  total_expenses?: number
  current_balance?: number
  status: 'draft' | 'active' | 'closed' | 'archived' | string
  notes?: string
  approved_by?: number
  approved_at?: string
  school_name?: string
  academic_year_label?: string
  main_lines_count?: number
}

export interface BudgetMainLine {
  id: number
  budget_year_id?: number
  order_index: number
  code: string
  name: string
  description?: string
  planned_amount?: number
  actual_amount?: number
  remaining_amount?: number
  is_system: boolean
  is_active: boolean
  sub_lines_count?: number
  expenses_count?: number
  percentage_used?: number
}

export interface BudgetSubLine {
  id: number
  main_line_id?: number
  category_id?: number
  category_name?: string
  order_index: number
  code: string
  name: string
  description?: string
  quantity: number
  unit_price: number
  total_amount: number
  allocated_amount?: number
  spent_amount?: number
  remaining_amount?: number
  is_active: boolean
  main_line_name?: string
  main_line_code?: string
}

export interface BudgetExpense {
  id: number
  budget_year_id?: number
  main_line_id?: number
  sub_line_id?: number
  category_id?: number
  category_name?: string
  expense_number?: string
  expense_type?: 'initial' | 'expense' | 'adjustment' | 'income'
  name?: string
  description?: string
  quantity?: number
  unit_price?: number
  total_amount: number
  amount?: number
  balance_before?: number
  balance_after?: number
  expense_date?: string
  date?: string
  payment_reference?: string
  payment_method?: 'espèces' | 'chèque' | 'virement' | 'mobile_money'
  beneficiary?: string
  receipt_number?: string
  receipt_url?: string
  is_validated: boolean
  is_recurring?: boolean
  recurrence_frequency?: 'mensuel' | 'trimestriel' | 'annuel'
  recorded_by: number
  recorded_by_name?: string
  created_at: string
    // ✅ AJOUTER :
  sub_line_name?: string
  reference_number?: string
  main_line_name : string
  main_line_code : string
}

export interface BudgetSummary {
  total_budget: number
  total_expenses: number
  total_remaining: number
  utilization_rate: number

  categories?: {
    category_id: number
    category_name: string
    initial_amount: number
    spent: number
    remaining: number
    percentage: number
  }[]
}

export interface BudgetCategory {
  id: number
  code: string
  name: string
  name_en?: string
  description?: string
  initial_amount: number
  current_balance: number
  total_expenses: number
  is_active: boolean
  order_index: number
}

// ============================================
// STATISTICS
// ============================================
export interface DashboardStats {
  total_students: number
  total_teachers: number
  total_classes: number
  total_subjects: number

  students_by_gender?: { gender: Gender; count: number }[]
  students_by_level?: { level_id: number; level_name: string; count: number }[]
  students_by_section?: { section_id: number; section_name: string; count: number }[]

  new_students_this_year?: number
  new_students_month?: number
  transferred_students?: number
  excluded_students?: number

  pass_rate?: number
  honor_rate?: number
  honor_roll_count?: number
}

export interface TermResults {
  class_id: number
  class_name: string
  term: Term
  academic_year: string

  students?: {
    student_id: number
    student_name: string
    matricule: string
    average: number
    rank: number
    decision: string
  }[]

  class_average?: number
  pass_count?: number
  fail_count?: number
  pass_rate: number

  honor_roll?: number
  encouragement?: number
  congratulations?: number
  warnings?: number
  blames?: number
}

export interface ClassCouncil {
  id: number
  class_id: number
  class_name: string
  term: Term
  academic_year: string
  meeting_date: string

  students?: {
    student_id: number
    student_name: string
    matricule: string
    average: number
    conduct: number
    decision: string
    observations?: string
  }[]

  class_teacher_report?: string
  principal_conclusion?: string

  created_by: number
  created_at: string
}

// ============================================
// MESSAGES
// ============================================
export interface MessageTemplate {
  id: number
  name: string
  subject?: string
  content_fr: string
  content_en?: string
  type: 'sms' | 'email' | 'both'
  variables: string[]
}

export interface SentMessage {
  id: number
  template_id?: number
  template_name?: string

  recipient_type: 'parent' | 'student' | 'teacher'
  recipient_id: number
  recipient_name?: string
  recipient_phone?: string
  recipient_email?: string

  type: 'sms' | 'email'
  subject?: string
  content: string

  status: 'pending' | 'sent' | 'failed' | 'delivered'
  sent_at?: string
  delivered_at?: string
  error_message?: string

  sms_credits_used: number

  sent_by: number
  sent_by_name?: string
  created_at: string
}

export interface SmsCredit {
  id: number
  total_credits: number
  used_credits: number
  remaining_credits: number
  provider: string
  last_purchase_date?: string
  alert_threshold: number
}

// ============================================
// AUDIT
// ============================================
export interface AuditLog {
  id: number
  user_id: number
  user_name?: string
  user_email?: string
  user_role?: string
  action: string
  entity_type: string
  entity_id?: number | string
  entity_description?: string
  details?: Record<string, unknown>
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
  timestamp: string
  created_at?: string
}

export interface RolePermission {
  id: number
  role: string
  module: string
  can_read: boolean
  can_write: boolean
  can_delete: boolean
  can_export: boolean
  can_import: boolean
}

// ============================================
// PUBLIC CONTENT
// ============================================
export interface NewsArticle {
  id: number
  title: string
  title_en?: string
  content: string
  content_en?: string
  summary?: string
  summary_en?: string
  image_url?: string
  category: string
  is_published: boolean
  published_at?: string
  author_id: number
  author_name?: string
  view_count: number
  created_at: string
  updated_at: string
}

export interface News {
  id: number
  title_fr: string
  title_en?: string
  content_fr: string
  content_en?: string
  summary_fr?: string
  summary_en?: string
  image_url?: string
  category: string
  is_featured: boolean
  status: string
  view_count: number
  published_at?: string
  creator_name?: string
}

export interface Event {
  id: number
  title_fr?: string
  title_en?: string
  title?: string
  description: string
  description_en?: string
  description_fr?: string
  event_type?: string
  location: string
  start_date: string
  end_date?: string
  image_url?: string
  image_urls?: string[]
  is_public: boolean
  status?: string
  created_by?: number
  created_at?: string
}

export interface ForumTopic {
  id: number
  title: string
  content: string
  author_id: number
  author_name?: string
  author_role?: string
  is_pinned: boolean
  is_locked: boolean
  reply_count: number
  view_count: number
  last_reply_at?: string
  created_at: string
}

export interface ForumReply {
  id: number
  topic_id: number
  content: string
  author_id: number
  author_name?: string
  author_role?: string
  is_solution: boolean
  created_at: string
}

export interface GalleryImage {
  id: number
  title: string
  description?: string
  image_url: string
  thumbnail_url?: string
  category: string
  is_public: boolean
  uploaded_by: number
  uploaded_by_name?: string
  created_at: string
}

// ============================================
// API RESPONSES
// ============================================
export interface ApiError {
  detail: string
  error_code?: string
  timestamp?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
  total?: number
  page?: number
  per_page?: number
}

export interface SelectOption {
  value: string | number
  label: string
}

export interface MenuItem {
  path: string
  label: string
  icon: string
  requiredPermission?: string
  children?: MenuItem[]
}