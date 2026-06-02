import React from 'react'
import { BudgetSummary } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { formatCurrency } from '@/utils/format'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Wallet, ArrowDown, ArrowUp, Percent } from 'lucide-react'

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

interface BudgetSummaryProps {
  summary: BudgetSummary
}

export function BudgetSummaryCard({ summary }: BudgetSummaryProps) {
  const chartData = summary.categories.map((c) => ({
    name: c.category_name,
    value: c.spent,
    remaining: c.remaining,
  }))

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.total_budget)}</p>
                <p className="text-xs text-gray-500">Budget total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <ArrowDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.total_expenses)}</p>
                <p className="text-xs text-gray-500">Dépenses totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <ArrowUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(summary.total_remaining)}</p>
                <p className="text-xs text-gray-500">Solde restant</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Percent className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{summary.utilization_rate.toFixed(1)}%</p>
                <p className="text-xs text-gray-500">Taux d'utilisation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Répartition des dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Détail par rubrique</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.categories.map((cat) => (
                <div key={cat.category_id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{cat.category_name}</span>
                    <span className="text-gray-500">{cat.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-primary-500"
                      style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{formatCurrency(cat.spent)} dépensé</span>
                    <span>{formatCurrency(cat.remaining)} restant</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
