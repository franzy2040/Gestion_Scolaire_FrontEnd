import { 
      Users, GraduationCap, BookOpen, CalendarDays, 
      ShieldAlert, Newspaper, FileSearch, Settings 
   } from 'lucide-react'

    const icons = {
      'Élèves': Users,
      'Enseignants': GraduationCap,
      'Notes': BookOpen,
      'Emploi du temps': CalendarDays,
      'Discipline': ShieldAlert,
      'Contenu': Newspaper,
      'Audit': FileSearch,
      'Paramètres': Settings,
    }

    const Icon = icons['Élèves'] || Settings

    export default function StudentsPage() {
      return (
        <div className="animate-fade-in">
          <div className="page-header">
            <h1 className="page-title flex items-center gap-3">
              <Icon className="h-7 w-7 text-primary-600" />
              Élèves
            </h1>
            <p className="page-subtitle">Module élèves</p>
          </div>
          <div className="card">
            <div className="card-body text-center py-12">
              <Icon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Module Élèves</h3>
              <p className="text-gray-500">
                Cette section est en cours de développement. Les fonctionnalités seront disponibles prochainement.
              </p>
            </div>
          </div>
        </div>
      )
    }
    