import { Newspaper, TrendingUp, FileText, Image, MessageSquare, Calendar } from 'lucide-react'
import { useLang } from '@/hooks/useLang'

export default function ContentDashboardPage() {
  const { lang } = useLang()
  const $t = {
    fr: { title: 'Tableau de bord - Contenu', subtitle: 'Communication et publications', news: 'Actualités', events: 'Événements', forum: 'Forum', gallery: 'Galerie' },
    en: { title: 'Dashboard - Content', subtitle: 'Communication and publications', news: 'News', events: 'Events', forum: 'Forum', gallery: 'Gallery' }
  }[lang]

  const stats = [
    { label: $t.news, value: '24', icon: FileText, color: 'bg-indigo-500' },
    { label: $t.events, value: '8', icon: Calendar, color: 'bg-green-500' },
    { label: $t.forum, value: '156', icon: MessageSquare, color: 'bg-blue-500' },
    { label: $t.gallery, value: '340', icon: Image, color: 'bg-purple-500' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header mb-6">
        <h1 className="page-title flex items-center gap-2"><TrendingUp className="w-6 h-6 text-indigo-600" />{$t.title}</h1>
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
