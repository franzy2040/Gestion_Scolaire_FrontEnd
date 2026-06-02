import React, { useState, useEffect } from 'react'
import { Grade, GradeConfig, Sequence, Term } from '@/types'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import toast from 'react-hot-toast'
import { Save, Lock, Unlock } from 'lucide-react'

interface GradeEntryProps {
  config: GradeConfig
  students: { id: number; matricule: string; last_name: string; first_name: string }[]
  existingGrades: Grade[]
  onSave: (grades: { student_id: number; class_mark?: number; exam_mark?: number }[]) => void
  onPublish: () => void
  onClose: () => void
}

export function GradeEntryForm({ config, students, existingGrades, onSave, onPublish, onClose }: GradeEntryProps) {
  const [grades, setGrades] = useState<Record<number, { class_mark?: number; exam_mark?: number }>>({})

  useEffect(() => {
    const initial: Record<number, { class_mark?: number; exam_mark?: number }> = {}
    students.forEach((student) => {
      const existing = existingGrades.find((g) => g.student_id === student.id)
      initial[student.id] = {
        class_mark: existing?.class_mark,
        exam_mark: existing?.exam_mark,
      }
    })
    setGrades(initial)
  }, [students, existingGrades])

  const handleGradeChange = (studentId: number, field: 'class_mark' | 'exam_mark', value: string) => {
    const num = parseFloat(value)
    if (value === '' || isNaN(num)) {
      setGrades((prev) => ({
        ...prev,
        [studentId]: { ...prev[studentId], [field]: undefined },
      }))
      return
    }
    if (num < 0 || num > 20) {
      toast.error('La note doit être entre 0 et 20')
      return
    }
    setGrades((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: num },
    }))
  }

  const calculateAverage = (classMark?: number, examMark?: number) => {
    if (classMark === undefined && examMark === undefined) return '-'
    if (classMark === undefined) return examMark?.toFixed(2)
    if (examMark === undefined) return classMark?.toFixed(2)
    // Moyenne pondérée: 60% CC + 40% Exam (configurable)
    return ((classMark * 0.6) + (examMark * 0.4)).toFixed(2)
  }

  const handleSave = () => {
    const data = Object.entries(grades)
      .filter(([_, g]) => g.class_mark !== undefined || g.exam_mark !== undefined)
      .map(([studentId, g]) => ({
        student_id: Number(studentId),
        class_mark: g.class_mark,
        exam_mark: g.exam_mark,
      }))
    onSave(data)
  }

  const getAppreciation = (avg: number): string => {
    if (avg >= 16) return 'Excellent'
    if (avg >= 14) return 'Très bien'
    if (avg >= 12) return 'Bien'
    if (avg >= 10) return 'Passable'
    if (avg >= 8) return 'Insuffisant'
    return 'Faible'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
        <div>
          <h3 className="font-semibold text-gray-900">
            Saisie des notes - {config.subject_name}
          </h3>
          <p className="text-sm text-gray-500">
            {config.class_name} | {config.sequence} | Trimestre {config.term}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={config.is_open ? 'success' : 'danger'}>
            {config.is_open ? (
              <><Unlock className="w-3 h-3 mr-1" /> Ouvert</>
            ) : (
              <><Lock className="w-3 h-3 mr-1" /> Fermé</>
            )}
          </Badge>
          {config.deadline && (
            <span className="text-sm text-gray-500">
              Deadline: {config.deadline}
            </span>
          )}
        </div>
      </div>

      {!config.is_open && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
          <p className="text-sm text-amber-800">
            La saisie est fermée. Contactez l'administrateur pour l'ouvrir.
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">N°</TableHead>
              <TableHead>Matricule</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead className="w-24">CC /20</TableHead>
              <TableHead className="w-24">Exam /20</TableHead>
              <TableHead className="w-24">Moyenne</TableHead>
              <TableHead>Appréciation</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student, index) => {
              const g = grades[student.id] || {}
              const avg = calculateAverage(g.class_mark, g.exam_mark)
              const avgNum = avg !== '-' ? parseFloat(avg) : 0

              return (
                <TableRow key={student.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-mono text-sm">{student.matricule}</TableCell>
                  <TableCell>{student.last_name} {student.first_name}</TableCell>
                  <TableCell>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.25"
                      value={g.class_mark ?? ''}
                      onChange={(e) => handleGradeChange(student.id, 'class_mark', e.target.value)}
                      disabled={!config.is_open}
                      className="w-20 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.25"
                      value={g.exam_mark ?? ''}
                      onChange={(e) => handleGradeChange(student.id, 'exam_mark', e.target.value)}
                      disabled={!config.is_open}
                      className="w-20 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                  </TableCell>
                  <TableCell className="font-bold">
                    {avg !== '-' ? (
                      <span className={avgNum >= 10 ? 'text-success' : 'text-danger'}>
                        {avg}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {avg !== '-' && (
                      <Badge variant={avgNum >= 10 ? 'success' : 'danger'} size="sm">
                        {getAppreciation(avgNum)}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center pt-4">
        <Button variant="ghost" onClick={onClose}>
          Fermer
        </Button>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={handleSave}
            disabled={!config.is_open}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Enregistrer
          </Button>
          <Button
            variant="success"
            onClick={onPublish}
            disabled={!config.is_open}
          >
            Publier les notes
          </Button>
        </div>
      </div>
    </div>
  )
}
