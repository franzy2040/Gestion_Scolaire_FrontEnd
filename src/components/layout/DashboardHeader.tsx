import { useState, useEffect, useRef } from 'react'
import { Menu, Bell, Search, LogOut, Globe, CalendarCheck, ChevronDown } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useAuth } from '../../hooks/useAuth'
import { useLang } from '../../hooks/useLang'
import toast from 'react-hot-toast'
import { schoolApi } from '../../services/api'

/* ───────────────────────────────────────────────
   Lycee Bilingue de Baleng — DashboardHeader
   Header Admin — Bilingue FR/EN + Selecteur annee scolaire
   ─────────────────────────────────────────────── */

interface HeaderProps {
  onMenuClick: () => void
  onClose?: () => void
  mobile?: boolean
}

interface AcademicYear {
  id: number
  label: string
  start_date: string
  end_date: string
  is_current: boolean
}

const ACADEMIC_YEAR_KEY = 'lybibal-academic-year'

const t = {
  fr: {
    searchPlaceholder: 'Rechercher...',
    logout: 'Deconnexion',
    logoutSuccess: 'Deconnecte',
    academicYear: 'Annee scolaire',
    selectYear: 'Selectionner',
    current: 'Actuel',
  },
  en: {
    searchPlaceholder: 'Search...',
    logout: 'Logout',
    logoutSuccess: 'Logged out',
    academicYear: 'Academic Year',
    selectYear: 'Select',
    current: 'Current',
  }
}

export default function DashboardHeader({ onMenuClick }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { user } = useAuthStore()
  const { handleLogout } = useAuth()
  const { lang, toggleLang } = useLang()
  const txt = t[lang]

  // Academic year state
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null)
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false)
  const [yearsLoading, setYearsLoading] = useState(true)
  const yearDropdownRef = useRef<HTMLDivElement>(null)

  // Load academic years
  useEffect(() => {
    const loadYears = async () => {
      try {
        const schoolsRes = await schoolApi.getSchools()
        const schools = Array.isArray(schoolsRes) ? schoolsRes : schoolsRes?.data || []

        if (schools.length > 0) {
          const yearsRes = await schoolApi.getAcademicYears(schools[0].id)
          const years = Array.isArray(yearsRes) ? yearsRes : yearsRes?.data || []

          if (years.length > 0) {
            setAcademicYears(years)
            const storedId = localStorage.getItem(ACADEMIC_YEAR_KEY)
            const found = storedId
              ? years.find((y: AcademicYear) => y.id.toString() === storedId)
              : years.find((y: AcademicYear) => y.is_current)
            setSelectedYear(found || years[0])
          }
        } else {
          // Fallback
          const currentYear = new Date().getFullYear()
          const fallback: AcademicYear[] = [
            { id: 1, label: `${currentYear}-${currentYear + 1}`, start_date: `${currentYear}-09-01`, end_date: `${currentYear + 1}-06-30`, is_current: true },
            { id: 2, label: `${currentYear - 1}-${currentYear}`, start_date: `${currentYear - 1}-09-01`, end_date: `${currentYear}-06-30`, is_current: false },
          ]
          setAcademicYears(fallback)
          setSelectedYear(fallback[0])
        }
      } catch (err) {
        console.error('Error loading years:', err)
        const currentYear = new Date().getFullYear()
        const fallback: AcademicYear[] = [
          { id: 1, label: `${currentYear}-${currentYear + 1}`, start_date: `${currentYear}-09-01`, end_date: `${currentYear + 1}-06-30`, is_current: true },
        ]
        setAcademicYears(fallback)
        setSelectedYear(fallback[0])
      } finally {
        setYearsLoading(false)
      }
    }
    loadYears()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(e.target as Node)) {
        setYearDropdownOpen(false)
      }
    }
    if (yearDropdownOpen) {
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }
  }, [yearDropdownOpen])

  const handleYearSelect = (year: AcademicYear) => {
    setSelectedYear(year)
    setYearDropdownOpen(false)
    localStorage.setItem(ACADEMIC_YEAR_KEY, year.id.toString())
    toast.success(
      lang === 'fr'
        ? `Annee "${year.label}" selectionnee`
        : `Year "${year.label}" selected`
    )
    window.dispatchEvent(new CustomEvent('lybibal-year-change', { detail: year }))
  }

  const onLogout = () => {
    localStorage.removeItem(ACADEMIC_YEAR_KEY)
    handleLogout()
    toast.success(txt.logoutSuccess)
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Search */}
          <div className="hidden md:flex items-center bg-gray-100 rounded-lg px-3 py-2">
            <Search className="h-4 w-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder={txt.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-64 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Academic Year Selector */}
          <div className="relative hidden sm:block" ref={yearDropdownRef}>
            <button
              onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 transition-colors"
            >
              <CalendarCheck className="h-4 w-4" />
              <span className="max-w-[120px] truncate">
                {yearsLoading
                  ? (lang === 'fr' ? 'Chargement...' : 'Loading...')
                  : selectedYear
                    ? selectedYear.label
                    : txt.selectYear
                }
              </span>
              {selectedYear?.is_current && (
                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase">
                  {txt.current}
                </span>
              )}
              <ChevronDown className={`h-4 w-4 transition-transform ${yearDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Year Dropdown */}
            {yearDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {txt.academicYear}
                  </p>
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {academicYears.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      {lang === 'fr' ? 'Aucune annee' : 'No years'}
                    </div>
                  ) : (
                    academicYears.map((year) => (
                      <button
                        key={year.id}
                        onClick={() => handleYearSelect(year)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-50 transition-colors ${
                          selectedYear?.id === year.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{year.label}</span>
                          {year.is_current && (
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">
                              {txt.current}
                            </span>
                          )}
                        </div>
                        {selectedYear?.id === year.id && (
                          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Language Toggle */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 px-2.5 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            title={lang === 'fr' ? 'Switch to English' : 'Passer en Francais'}
          >
            <Globe className="h-4 w-4" />
            <span className="font-bold">{lang === 'fr' ? 'FR' : 'EN'}</span>
          </button>

          {/* Notifications */}
          <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
          </button>

          {/* Avatar only (no name text) */}
          <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm cursor-default" title={`${user?.first_name || ''} ${user?.last_name || ''}`}>
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg text-sm font-medium transition-colors"
            title={txt.logout}
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}