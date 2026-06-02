import { Ban, AlertTriangle } from 'lucide-react'
import { useLang } from '@/hooks/useLang'

export default function StudentExpelledPage() {
  const { lang } = useLang()
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          {lang === 'fr' ? 'Élèves renvoyés' : 'Expelled Students'}
        </h1>
        <p className="page-subtitle">
          {lang === 'fr' ? 'Liste des élèves exclus définitivement' : 'List of permanently excluded students'}
        </p>
      </div>
      <div className="card">
        <div className="card-body text-center py-16">
          <Ban className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {lang === 'fr' ? 'Registre des exclusions' : 'Exclusion Registry'}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {lang === 'fr' 
              ? 'Cette page listera les élèves ayant été définitivement exclus avec les motifs, dates et décisions du conseil de discipline.' 
              : 'This page will list permanently excluded students with reasons, dates, and discipline council decisions.'}
          </p>
        </div>
      </div>
    </div>
  )
}