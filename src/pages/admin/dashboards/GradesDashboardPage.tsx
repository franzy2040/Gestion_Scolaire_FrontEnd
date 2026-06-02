import { BookOpen, TrendingUp, CheckCircle, AlertTriangle, Users } from 'lucide-react'
import { useLang } from '@/hooks/useLang'

export default function GradesDashboardPage() {
  const { lang } = useLang()
  const $t = {
    fr: { title: 'Tableau de bord - Notes & Moyennes', subtitle: 'Suivi des évaluations', avgGrade: 'Moyenne générale', passRate: 'Taux de réussite', pending: 'Notes en attente', validated: 'Séquences validées' },
    en: { title: 'Dashboard - Grades & Averages', subtitle: 'Evaluation tracking', avgGrade: 'General average', passRate: 'Pass rate', pending: 'Pending grades', validated: 'Validated sequences' }
  }[lang]

  const stats = [
    { label: $t.avgGrade, value: '12.4', icon: BookOpen, color: 'bg-violet-500' },
    { label: $t.passRate, value: '78%', icon: CheckCircle, color: 'bg-green-500' },
    { label: $t.pending, value: '23', icon: AlertTriangle, color: 'bg-amber-500' },
    { label: $t.validated, value: '4', icon: Users, color: 'bg-blue-500' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header mb-6">
        <h1 className="page-title flex items-center gap-2"><TrendingUp className="w-6 h-6 text-violet-600" />{$t.title}</h1>
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
