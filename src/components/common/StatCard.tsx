import type { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string
  icon: ReactNode
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  subtitle?: string
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    icon: 'text-blue-600',
    border: 'border-blue-200',
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    icon: 'text-green-600',
    border: 'border-green-200',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    icon: 'text-red-600',
    border: 'border-red-200',
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    icon: 'text-yellow-600',
    border: 'border-yellow-200',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    icon: 'text-purple-600',
    border: 'border-purple-200',
  },
}

export default function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  const colors = colorMap[color]

  return (
    <div className={`card p-5 border ${colors.border}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className={`mt-1 text-2xl font-bold ${colors.text}`}>{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
          )}
        </div>
        <div className={`flex-shrink-0 p-2 rounded-lg ${colors.bg}`}>
          <div className={colors.icon}>{icon}</div>
        </div>
      </div>
    </div>
  )
}