import { ShieldAlert, TrendingUp, AlertTriangle, Ban, UsersRound } from 'lucide-react'
import { useLang } from '@/hooks/useLang'

export default function DisciplineDashboardPage() {
  const { lang } = useLang()
  const $t = {
    fr: { title: 'Tableau de bord - Discipline', subtitle: 'Suivi des incidents', totalIncidents: 'Incidents', sanctions: 'Sanctions', convocations: 'Convocations', exclusions: 'Exclusions' },
    en: { title: 'Dashboard - Discipline', subtitle: 'Incident tracking', totalIncidents: 'Incidents', sanctions: 'Sanctions', convocations: 'Convocations', exclusions: 'Exclusions' }
  }[lang]

  const stats = [
    { label: $t.totalIncidents, value: '12', icon: AlertTriangle, color: 'bg-amber-500' },
    { label: $t.sanctions, value: '8', icon: ShieldAlert, color: 'bg-orange-500' },
    { label: $t.convocations, value: '5', icon: UsersRound, color: 'bg-blue-500' },
    { label: $t.exclusions, value: '2', icon: Ban, color: 'bg-red-500' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header mb-6">
        <h1 className="page-title flex items-center gap-2"><TrendingUp className="w-6 h-6 text-amber-600" />{$t.title}</h1>
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
