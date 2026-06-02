import { format, parseISO } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'

export function formatDate(date: string | Date, formatStr = 'dd/MM/yyyy'): string {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, formatStr, { locale: fr })
  } catch {
    return String(date)
  }
}

export function formatDateTime(date: string | Date): string {
  if (!date) return '-'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, 'dd/MM/yyyy HH:mm', { locale: fr })
  } catch {
    return String(date)
  }
}

export function formatCurrency(amount: number, currency = 'XAF'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatNumber(num: number, decimals = 0): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
