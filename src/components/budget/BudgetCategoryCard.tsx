import React from 'react'
import { BudgetCategory } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { formatCurrency } from '@/utils/format'
import { Wallet, TrendingDown, TrendingUp } from 'lucide-react'

interface BudgetCategoryCardProps {
  category: BudgetCategory
  onEdit: (category: BudgetCategory) => void
  onDelete: (id: number) => void
}

export function BudgetCategoryCard({ category, onEdit, onDelete }: BudgetCategoryCardProps) {
  const utilizationRate = category.initial_amount > 0
    ? (category.total_expenses / category.initial_amount) * 100
    : 0

  const getStatusColor = () => {
    if (utilizationRate >= 100) return 'danger'
    if (utilizationRate >= 80) return 'warning'
    return 'success'
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{category.name}</h3>
              <p className="text-xs text-gray-500">{category.code}</p>
            </div>
          </div>
          <Badge variant={getStatusColor()}>
            {utilizationRate.toFixed(1)}%
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Budget initial:</span>
            <span className="font-medium">{formatCurrency(category.initial_amount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Dépenses:</span>
            <span className="font-medium text-danger">{formatCurrency(category.total_expenses)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Solde:</span>
            <span className={`font-medium ${category.current_balance >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatCurrency(category.current_balance)}
            </span>
          </div>
        </div>

        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                utilizationRate >= 100 ? 'bg-danger' : utilizationRate >= 80 ? 'bg-warning' : 'bg-success'
              }`}
              style={{ width: `${Math.min(utilizationRate, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onEdit(category)}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            Modifier
          </button>
          <button
            onClick={() => onDelete(category.id)}
            className="text-sm text-danger hover:text-red-700"
          >
            Supprimer
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
