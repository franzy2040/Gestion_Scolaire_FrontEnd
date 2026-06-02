import { useState, useEffect } from 'react'

interface AcademicYear {
  id: number
  label: string
  start_date: string
  end_date: string
  is_current: boolean
}

const ACADEMIC_YEAR_KEY = 'lybibal-academic-year'

export function useAcademicYear() {
  const [selectedYear, setSelectedYearState] = useState<AcademicYear | null>(() => {
    try {
      const stored = localStorage.getItem(ACADEMIC_YEAR_KEY)
      if (stored) {
        // We only store the ID, so we need to get full data from API or context
        // For now return a minimal object with just the ID
        return { id: parseInt(stored), label: '', start_date: '', end_date: '', is_current: false }
      }
    } catch { /* ignore */ }
    return null
  })

  const setSelectedYear = (year: AcademicYear) => {
    localStorage.setItem(ACADEMIC_YEAR_KEY, year.id.toString())
    setSelectedYearState(year)
    window.dispatchEvent(new CustomEvent('lybibal-year-change', { detail: year }))
  }

  // Listen for changes from other components
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      setSelectedYearState(e.detail as AcademicYear)
    }
    window.addEventListener('lybibal-year-change', handler as EventListener)
    return () => window.removeEventListener('lybibal-year-change', handler as EventListener)
  }, [])

  const getYearId = () => {
    const stored = localStorage.getItem(ACADEMIC_YEAR_KEY)
    return stored ? parseInt(stored) : null
  }

  return { selectedYear, setSelectedYear, getYearId }
}