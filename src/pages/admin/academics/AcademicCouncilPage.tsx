import { MessageSquare, Users } from 'lucide-react'
import { useLang } from '@/hooks/useLang'

export default function AcademicCouncilPage() {
  const { lang } = useLang()
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-amber-600" />
          {lang === 'fr' ? 'Conseil de classe' : 'Class Council'}
        </h1>
        <p className="page-subtitle">
          {lang === 'fr' ? 'Gestion des conseils de classe et décisions' : 'Class council management and decisions'}
        </p>
      </div>
      <div className="card">
        <div className="card-body text-center py-16">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {lang === 'fr' ? 'Conseils de classe' : 'Class Councils'}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {lang === 'fr' 
              ? 'Cette page permettra de planifier, tenir et archiver les conseils de classe avec les décisions (passage, redoublement, exclusion).' 
              : 'This page will allow planning, holding, and archiving class councils with decisions (promotion, repetition, exclusion).'}
          </p>
        </div>
      </div>
    </div>
  )
}