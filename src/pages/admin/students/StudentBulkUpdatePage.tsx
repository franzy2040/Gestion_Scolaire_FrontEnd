import { UsersRound, RefreshCw } from 'lucide-react'
import { useLang } from '@/hooks/useLang'

export default function StudentBulkUpdatePage() {
  const { lang } = useLang()
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2">
          <UsersRound className="w-6 h-6 text-orange-600" />
          {lang === 'fr' ? 'Mise à jour groupés' : 'Bulk Update'}
        </h1>
        <p className="page-subtitle">
          {lang === 'fr' ? 'Modifier plusieurs élèves simultanément' : 'Update multiple students at once'}
        </p>
      </div>
      <div className="card">
        <div className="card-body text-center py-16">
          <RefreshCw className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {lang === 'fr' ? 'Mise à jour en masse' : 'Bulk Update'}
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {lang === 'fr' 
              ? 'Cette page permettra de modifier des informations communes pour plusieurs élèves en une seule opération (classe, statut, etc.).' 
              : 'This page will allow updating common information for multiple students in a single operation (class, status, etc.).'}
          </p>
        </div>
      </div>
    </div>
  )
}