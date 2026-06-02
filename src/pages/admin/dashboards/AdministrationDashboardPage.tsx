import { Settings, TrendingUp, Users, FileSearch, Newspaper, Shield } from 'lucide-react'
import { useLang } from '@/hooks/useLang'

export default function AdministrationDashboardPage() {
  const { lang } = useLang()
  const $t = {
    fr: { title: 'Tableau de bord - Administration', subtitle: 'Gestion et paramètres', users: 'Utilisateurs', roles: 'Rôles', auditLogs: 'Logs audit', content: 'Contenu publié' },
    en: { title: 'Dashboard - Administration', subtitle: 'Management and settings', users: 'Users', roles: 'Roles', auditLogs: 'Audit logs', content: 'Published content' }
  }[lang]

  const stats = [
    { label: $t.users, value: '156', icon: Users, color: 'bg-slate-500' },
    { label: $t.roles, value: '10', icon: Shield, color: 'bg-purple-500' },
    { label: $t.auditLogs, value: '1,240', icon: FileSearch, color: 'bg-cyan-500' },
    { label: $t.content, value: '45', icon: Newspaper, color: 'bg-indigo-500' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header mb-6">
        <h1 className="page-title flex items-center gap-2"><TrendingUp className="w-6 h-6 text-slate-600" />{$t.title}</h1>
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
