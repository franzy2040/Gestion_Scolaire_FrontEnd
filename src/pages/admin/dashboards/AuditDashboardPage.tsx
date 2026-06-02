import { FileSearch, TrendingUp, Users, Shield, AlertTriangle, Activity } from 'lucide-react'
import { useLang } from '@/hooks/useLang'

export default function AuditDashboardPage() {
  const { lang } = useLang()
  const $t = {
    fr: { title: 'Tableau de bord - Audit & Logs', subtitle: 'Sécurité et traçabilité', totalLogs: 'Logs total', logins: 'Connexions', errors: 'Erreurs', alerts: 'Alertes' },
    en: { title: 'Dashboard - Audit & Logs', subtitle: 'Security and traceability', totalLogs: 'Total logs', logins: 'Logins', errors: 'Errors', alerts: 'Alerts' }
  }[lang]

  const stats = [
    { label: $t.totalLogs, value: '12,450', icon: FileSearch, color: 'bg-cyan-500' },
    { label: $t.logins, value: '856', icon: Users, color: 'bg-blue-500' },
    { label: $t.errors, value: '12', icon: AlertTriangle, color: 'bg-red-500' },
    { label: $t.alerts, value: '3', icon: Shield, color: 'bg-amber-500' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header mb-6">
        <h1 className="page-title flex items-center gap-2"><TrendingUp className="w-6 h-6 text-cyan-600" />{$t.title}</h1>
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
