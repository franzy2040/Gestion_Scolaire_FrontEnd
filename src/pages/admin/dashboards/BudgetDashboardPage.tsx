import { Wallet, TrendingUp, ArrowDownRight, ArrowUpRight, PiggyBank, Receipt } from 'lucide-react'
import { useLang } from '@/hooks/useLang'

export default function BudgetDashboardPage() {
  const { lang } = useLang()
  const $t = {
    fr: { title: 'Tableau de bord - Budget Scolaire', subtitle: 'Suivi budgétaire', totalBudget: 'Budget total', spent: 'Dépensé', remaining: 'Restant', expenses: 'Dépenses' },
    en: { title: 'Dashboard - School Budget', subtitle: 'Budget tracking', totalBudget: 'Total budget', spent: 'Spent', remaining: 'Remaining', expenses: 'Expenses' }
  }[lang]

  const stats = [
    { label: $t.totalBudget, value: '45M', icon: Wallet, color: 'bg-teal-500' },
    { label: $t.spent, value: '22.5M', icon: ArrowDownRight, color: 'bg-red-500' },
    { label: $t.remaining, value: '22.5M', icon: PiggyBank, color: 'bg-green-500' },
    { label: $t.expenses, value: '156', icon: Receipt, color: 'bg-amber-500' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header mb-6">
        <h1 className="page-title flex items-center gap-2"><TrendingUp className="w-6 h-6 text-teal-600" />{$t.title}</h1>
        <p className="page-subtitle">{$t.subtitle}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <div key={i} className="card hover:shadow-md transition-shadow">
            <div className="card-body">
              <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center mb-3`}><s.icon className="w-5 h-5 text-white" /></div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
