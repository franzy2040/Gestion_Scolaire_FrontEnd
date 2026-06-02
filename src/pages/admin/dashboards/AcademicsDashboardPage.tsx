import { GraduationCap, TrendingUp, Layers, Users, BookOpen } from 'lucide-react'
import { useLang } from '@/hooks/useLang'

export default function AcademicsDashboardPage() {
  const { lang } = useLang()
  const $t = {
    fr: { title: 'Tableau de bord - Académique', subtitle: 'Structure et organisation', specialties: 'Spécialités', levels: 'Niveaux', classes: 'Classes', students: 'Élèves' },
    en: { title: 'Dashboard - Academics', subtitle: 'Structure and organization', specialties: 'Specialties', levels: 'Levels', classes: 'Classes', students: 'Students' }
  }[lang]

  const stats = [
    { label: $t.specialties, value: '6', icon: GraduationCap, color: 'bg-rose-500' },
    { label: $t.levels, value: '7', icon: Layers, color: 'bg-indigo-500' },
    { label: $t.classes, value: '32', icon: BookOpen, color: 'bg-teal-500' },
    { label: $t.students, value: '2,450', icon: Users, color: 'bg-blue-500' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header mb-6">
        <h1 className="page-title flex items-center gap-2"><TrendingUp className="w-6 h-6 text-rose-600" />{$t.title}</h1>
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