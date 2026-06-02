import { History, GraduationCap } from 'lucide-react'
import { useLang } from '@/hooks/useLang'

export default function StudentFormerPage() {
  const { lang } = useLang()
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <History className="w-6 h-6 text-amber-600" />
          {lang === 'fr' ? 'Anciens élèves' : 'Former Students'}
        </h1>
        <p className="page-subtitle">
          {lang === 'fr' ? 'Alumni et diplômés' : 'Alumni and graduates'}
        </p>
      </div>
      <div className="card">
        <div className="card-body text-center py-16">
          <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {lang === 'fr' ? 'Registre des anciens élèves' : 'Former Students Registry'}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {lang === 'fr' 
              ? 'Cette page contiendra le registre de tous les anciens élèves diplômés avec leurs parcours post-bac et coordonnées.' 
              : 'This page will contain the registry of all graduated former students with their post-bac paths and contact details.'}
          </p>
        </div>
      </div>
    </div>
  )
}