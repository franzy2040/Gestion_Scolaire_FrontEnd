import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { downloadStudentTemplate, parseStudentExcel } from '@/utils/excelExport'
import { Upload, Download, FileSpreadsheet } from 'lucide-react'
import toast from 'react-hot-toast'

interface ImportExportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (data: Record<string, string>[]) => void
  onExportExcel: () => void
  onExportPDF: () => void
}

export function ImportExportModal({ isOpen, onClose, onImport, onExportExcel, onExportPDF }: ImportExportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<Record<string, string>[] | null>(null)
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'confirm'>('upload')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)

    try {
      const data = await parseStudentExcel(selectedFile)
      setImportData(data)
      setImportStep('preview')
      toast.success(`${data.length} élèves trouvés dans le fichier`)
    } catch (err) {
      toast.error('Erreur lors de la lecture du fichier')
    }
  }

  const handleConfirmImport = () => {
    if (importData) {
      onImport(importData)
      setFile(null)
      setImportData(null)
      setImportStep('upload')
      onClose()
    }
  }

  const handleDownloadTemplate = () => {
    downloadStudentTemplate()
    toast.success('Modèle téléchargé')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Import / Export"
      size="lg"
      footer={
        importStep === 'preview' && (
          <>
            <Button variant="ghost" onClick={() => setImportStep('upload')}>
              Retour
            </Button>
            <Button onClick={handleConfirmImport}>
              Confirmer l'import ({importData?.length} élèves)
            </Button>
          </>
        )
      }
    >
      <div className="space-y-6">
        {/* Export */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Exporter</h4>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onExportExcel} leftIcon={<FileSpreadsheet className="w-4 h-4" />}>
              Excel
            </Button>
            <Button variant="outline" onClick={onExportPDF} leftIcon={<Download className="w-4 h-4" />}>
              PDF
            </Button>
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* Import */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">Importer</h4>
            <Button variant="ghost" size="sm" onClick={handleDownloadTemplate} leftIcon={<Download className="w-4 h-4" />}>
              Télécharger le modèle
            </Button>
          </div>

          {importStep === 'upload' && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors">
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-2">
                Glissez un fichier Excel ici ou cliquez pour sélectionner
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
              />
            </div>
          )}

          {importStep === 'preview' && importData && (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Aperçu des {importData.length} élèves à importer :
              </p>
              <div className="max-h-64 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Matricule</th>
                      <th className="px-3 py-2 text-left">Nom</th>
                      <th className="px-3 py-2 text-left">Prénom</th>
                      <th className="px-3 py-2 text-left">Classe ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {importData.slice(0, 10).map((row, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">{row.Matricule || row.matricule || '-'}</td>
                        <td className="px-3 py-2">{row.Nom || row.last_name || '-'}</td>
                        <td className="px-3 py-2">{row.Prénom || row.first_name || '-'}</td>
                        <td className="px-3 py-2">{row['Classe ID'] || row.class_id || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importData.length > 10 && (
                  <p className="text-center text-sm text-gray-500 py-2">
                    ... et {importData.length - 10} autres élèves
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
