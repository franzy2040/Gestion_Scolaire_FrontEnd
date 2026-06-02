import { CalendarDays, Clock, Users, BookOpen, TrendingUp } from 'lucide-react'
import { useLang } from '@/hooks/useLang'

export default function TimetableDashboardPage() {
  const { lang } = useLang()
  const $t = {
    fr: { title: 'Tableau de bord - Emploi du temps', subtitle: 'Planification des cours', totalSlots: 'Créneaux', conflicts: 'Conflits', teachers: 'Enseignants', rooms: 'Salles', occupancy: 'Taux occupation' },
    en: { title: 'Dashboard - Timetable', subtitle: 'Course planning', totalSlots: 'Time slots', conflicts: 'Conflicts', teachers: 'Teachers', rooms: 'Rooms', occupancy: 'Occupancy rate' }
  }[lang]

  const stats = [
    { label: $t.totalSlots, value: '156', icon: Clock, color: 'bg-emerald-500' },
    { label: $t.conflicts, value: '3', icon: CalendarDays, color: 'bg-red-500' },
    { label: $t.teachers, value: '48', icon: Users, color: 'bg-blue-500' },
    { label: $t.rooms, value: '24', icon: BookOpen, color: 'bg-purple-500' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header mb-6">
        <h1 className="page-title flex items-center gap-2"><TrendingUp className="w-6 h-6 text-emerald-600" />{$t.title}</h1>
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
