import { UserCheck, Users } from 'lucide-react'
import { useLang } from '@/hooks/useLang'

export default function AcademicAssignPage() {
  const { lang } = useLang()
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-green-600" />
          {lang === 'fr' ? "Mettre l'élève en classe" : 'Assign Student to Class'}
        </h1>
        <p className="page-subtitle">
          {lang === 'fr' ? 'Affectation des élèves aux classes' : 'Student class assignment'}
        </p>
      </div>
      <div className="card">
        <div className="card-body text-center py-16">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {lang === 'fr' ? 'Affectation des classes' : 'Class Assignment'}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {lang === 'fr' 
              ? "Cette page permettra d'affecter les élèves aux classes pour l'année scolaire en cours avec gestion des effectifs." 
              : 'This page will allow assigning students to classes for the current school year with enrollment management.'}
          </p>
        </div>
      </div>
    </div>
  )
}