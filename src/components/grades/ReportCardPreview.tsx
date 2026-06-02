import React from 'react'
import { ReportCard } from '@/types'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { exportReportCardPDF } from '@/utils/pdfExport'
import { Printer, Download } from 'lucide-react'
import toast from 'react-hot-toast'

interface ReportCardPreviewProps {
  report: ReportCard
}

export function ReportCardPreview({ report }: ReportCardPreviewProps) {
  const handlePrint = () => {
    exportReportCardPDF(report)
    toast.success('Bulletin généré')
  }

  const getDecisionColor = (decision: string) => {
    if (decision.includes('Admis') || decision.includes('Pass')) return 'success'
    if (decision.includes('Redouble')) return 'warning'
    if (decision.includes('Exclu')) return 'danger'
    return 'default'
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={handlePrint} leftIcon={<Printer className="w-4 h-4" />}>
          Imprimer PDF
        </Button>
      </div>

      {/* Header */}
      <div className="text-center border-b-2 border-gray-800 pb-4">
        <h2 className="text-xl font-bold text-gray-900">LYCÉE BILINGUE DE BALENG</h2>
        <p className="text-sm text-gray-600">Baleng, Ouest-Cameroun</p>
        <h1 className="text-2xl font-bold mt-4 text-gray-900">BULLETIN DE NOTES</h1>
        <p className="text-sm text-gray-600">
          {report.section_name} - {report.term}ème Trimestre - {report.academic_year}
        </p>
      </div>

      {/* Student Info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p><strong>Nom:</strong> {report.student_name}</p>
          <p><strong>Matricule:</strong> {report.student_matricule}</p>
          <p><strong>Né(e) le:</strong> {report.date_of_birth} à {report.place_of_birth}</p>
          <p><strong>Sexe:</strong> {report.gender === 'M' ? 'Masculin' : 'Féminin'}</p>
        </div>
        <div>
          <p><strong>Classe:</strong> {report.class_name}</p>
          <p><strong>Effectif:</strong> {report.class_size} élèves</p>
          <p><strong>Enseignant:</strong> {report.class_teacher_name}</p>
        </div>
      </div>

      {/* Grades Table */}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100 border-b-2 border-gray-800">
            <th className="text-left p-2">Matière</th>
            <th className="text-center p-2">Coef.</th>
            <th className="text-center p-2">CC/20</th>
            <th className="text-center p-2">Exam/20</th>
            <th className="text-center p-2">Moy/20</th>
            <th className="text-center p-2">Rang</th>
            <th className="text-left p-2">Appréciation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {report.subjects.map((subject, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="p-2">
                <div>
                  <p className="font-medium">{subject.subject_name}</p>
                  {subject.subject_name_en && (
                    <p className="text-xs text-gray-500">{subject.subject_name_en}</p>
                  )}
                </div>
              </td>
              <td className="text-center p-2">{subject.coefficient}</td>
              <td className="text-center p-2">{subject.class_mark?.toFixed(2) || '-'}</td>
              <td className="text-center p-2">{subject.exam_mark?.toFixed(2) || '-'}</td>
              <td className="text-center p-2 font-bold">
                <span className={subject.average >= 10 ? 'text-success' : 'text-danger'}>
                  {subject.average.toFixed(2)}
                </span>
              </td>
              <td className="text-center p-2">{subject.rank || '-'}</td>
              <td className="p-2 text-xs">{subject.appreciation || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-6 border-t-2 border-gray-800 pt-4">
        <div>
          <p className="text-lg font-bold">
            Moyenne générale: <span className="text-primary-600">{report.term_average.toFixed(2)}/20</span>
          </p>
          <p className="text-sm text-gray-600">
            Rang: {report.term_rank}ème / {report.class_size}
          </p>
          <p className="text-sm text-gray-600">
            Total coefficients: {report.total_coefficient} | Total points: {report.total_points.toFixed(2)}
          </p>
        </div>
        <div className="text-right">
          <Badge variant={getDecisionColor(report.decision)} size="md">
            {report.decision}
          </Badge>
          <div className="mt-2 space-y-1">
            {report.is_honor_roll && <Badge variant="success">★ TABLEAU D'HONNEUR ★</Badge>}
            {report.is_encouragement && <Badge variant="success">★ ENCOURAGEMENTS ★</Badge>}
            {report.is_congratulations && <Badge variant="success">★ FÉLICITATIONS ★</Badge>}
            {report.is_warning && <Badge variant="warning">AVERTISSEMENT</Badge>}
            {report.is_blame && <Badge variant="danger">BLÂME</Badge>}
          </div>
        </div>
      </div>

      {/* Conduct */}
      <div className="grid grid-cols-3 gap-4 text-sm border-t pt-4">
        <div>
          <p><strong>Conduite:</strong> {report.conduct}/5</p>
          <p><strong>Assiduité:</strong> {report.work_attitude}/5</p>
        </div>
        <div>
          <p><strong>Absences:</strong> {report.absence_days} jours, {report.absence_hours}h</p>
          <p><strong>Retards:</strong> {report.delay_count}</p>
        </div>
        <div>
          <p><strong>Observations du Principal:</strong></p>
          <p className="text-gray-600 italic">{report.principal_observation || 'Aucune'}</p>
        </div>
      </div>

      {/* Signatures */}
      <div className="flex justify-between mt-8 pt-8 border-t text-sm">
        <div className="text-center">
          <p className="font-medium">Le Principal</p>
          <p className="mt-8 text-gray-600">{report.principal_name}</p>
        </div>
        <div className="text-center">
          <p className="font-medium">L'Enseignant de classe</p>
          <p className="mt-8 text-gray-600">{report.class_teacher_name}</p>
        </div>
        <div className="text-center">
          <p className="font-medium">Le Parent</p>
          <p className="mt-8 text-gray-600">Signature</p>
        </div>
      </div>
    </div>
  )
}
