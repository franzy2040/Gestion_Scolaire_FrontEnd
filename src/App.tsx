import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { Toaster } from 'sonner'

// Layouts
import PublicLayout from './components/layout/PublicLayout'
import DashboardLayout from './components/layout/DashboardLayout'

// Pages publiques
import HomePage from './pages/public/HomePage'
import NewsPage from './pages/public/NewsPage'
import EventsPage from './pages/public/EventsPage'
import ForumPage from './pages/public/ForumPage'
import AboutPage from './pages/public/AboutPage'
import LoginPage from './pages/public/LoginPage'
import HistoryPage from './pages/public/HistoryPage'

// Pages admin - Dashboard & Modules principaux
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import DashboardPage from './pages/admin/DashboardPage'
import {StudentsPage}  from './pages/admin/StudentsPage'
import TeachersPage from './pages/admin/TeachersPage'
import GradesPage from './pages/admin/GradesPage'
import TimetablePage from './pages/admin/TimetablePage'
import DisciplinePage from './pages/admin/DisciplinePage'
import BudgetPage from './pages/admin/BudgetPage'
import ContentPage from './pages/admin/ContentPage'
import AuditPage from './pages/admin/AuditPage'
import SettingsPage from './pages/admin/SettingsPage'

// ========== TABLEAUX DE BORD PAR MODULE ==========
import StudentsDashboardPage from './pages/admin/dashboards/StudentsDashboardPage'
import TimetableDashboardPage from './pages/admin/dashboards/TimetableDashboardPage'
import GradesDashboardPage from './pages/admin/dashboards/GradesDashboardPage'
import DisciplineDashboardPage from './pages/admin/dashboards/DisciplineDashboardPage'
import AcademicsDashboardPage from './pages/admin/dashboards/AcademicsDashboardPage'
import AdministrationDashboardPage from './pages/admin/dashboards/AdministrationDashboardPage'
import BudgetDashboardPage from './pages/admin/dashboards/BudgetDashboardPage'
import ContentDashboardPage from './pages/admin/dashboards/ContentDashboardPage'
import AuditDashboardPage from './pages/admin/dashboards/AuditDashboardPage'

// ========== SOUS-MENUS INSCRIPTION DES ÉLÈVES ==========
import StudentSearchPage from './pages/admin/students/StudentSearchPage'
import StudentCreatePage from './pages/admin/students/StudentCreatePage'
import StudentImportPage from './pages/admin/students/StudentImportPage'
import StudentBulkUpdatePage from './pages/admin/students/StudentBulkUpdatePage'
import StudentSocialCasesPage from './pages/admin/students/StudentSocialCasesPage'
import StudentTransferredPage from './pages/admin/students/StudentTransferredPage'
import StudentFormerPage from './pages/admin/students/StudentFormerPage'
import StudentExpelledPage from './pages/admin/students/StudentExpelledPage'

// ========== SOUS-MENUS ACADÉMIQUE ==========
import AcademicSpecialtiesPage from './pages/admin/academics/AcademicSpecialtiesPage'
import AcademicLevelsPage from './pages/admin/academics/AcademicLevelsPage'
import AcademicAssignPage from './pages/admin/academics/AcademicAssignPage'
import AcademicCouncilPage from './pages/admin/academics/AcademicCouncilPage'

// Composants
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* ==================== ROUTES PUBLIQUES ==================== */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Route>

        {/* ==================== LOGIN ==================== */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/admin" replace /> : <LoginPage />} 
        />

        {/* ==================== ROUTES PROTÉGÉES (DashboardLayout) ==================== */}
        <Route element={<ProtectedRoute />}>
          {/* Page d'accueil admin : les modules */}
          <Route path="/admin" element={<AdminDashboardPage />} />

          <Route element={<DashboardLayout />}>
            {/* Dashboard avec tabs */}
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* ========== MODULES PRINCIPAUX ========== */}
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/teachers" element={<TeachersPage />} />
            <Route path="/grades" element={<GradesPage />} />
            <Route path="/timetable" element={<TimetablePage />} />
            <Route path="/discipline" element={<DisciplinePage />} />
            <Route path="/budget" element={<BudgetPage />} />
            <Route path="/content" element={<ContentPage />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* ========== TABLEAUX DE BORD PAR MODULE ========== */}
            <Route path="/students/dashboard" element={<StudentsDashboardPage />} />
            <Route path="/timetable/dashboard" element={<TimetableDashboardPage />} />
            <Route path="/grades/dashboard" element={<GradesDashboardPage />} />
            <Route path="/discipline/dashboard" element={<DisciplineDashboardPage />} />
            <Route path="/academics/dashboard" element={<AcademicsDashboardPage />} />
            <Route path="/administration/dashboard" element={<AdministrationDashboardPage />} />
            <Route path="/budget/dashboard" element={<BudgetDashboardPage />} />
            <Route path="/content/dashboard" element={<ContentDashboardPage />} />
            <Route path="/audit/dashboard" element={<AuditDashboardPage />} />

            {/* ========== SOUS-MENUS ÉLÈVES ========== */}
            <Route path="/students/search" element={<StudentSearchPage />} />
            <Route path="/students/create" element={<StudentCreatePage />} />
            <Route path="/students/import" element={<StudentImportPage />} />
            <Route path="/students/bulk-update" element={<StudentBulkUpdatePage />} />
            <Route path="/students/social-cases" element={<StudentSocialCasesPage />} />
            <Route path="/students/transferred" element={<StudentTransferredPage />} />
            <Route path="/students/former" element={<StudentFormerPage />} />
            <Route path="/students/expelled" element={<StudentExpelledPage />} />

            {/* ========== SOUS-MENUS ACADÉMIQUE ========== */}
            <Route path="/academics/specialties" element={<AcademicSpecialtiesPage />} />
            <Route path="/academics/levels" element={<AcademicLevelsPage />} />
            <Route path="/academics/assign" element={<AcademicAssignPage />} />
            <Route path="/academics/council" element={<AcademicCouncilPage />} />
          </Route>
        </Route>

        {/* ==================== REDIRECTIONS ==================== */}
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Navigate to="/admin" replace /> : <Navigate to="/login" replace />} 
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/admin" : "/"} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App