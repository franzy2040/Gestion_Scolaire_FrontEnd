import React, { useState } from 'react'
import { Student, StudentStatus } from '@/types'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { ConfirmModal } from '@/components/ui/Modal'
import { formatDate } from '@/utils/format'
import { Edit, Trash2, Eye, FileText, Send } from 'lucide-react'

interface StudentListProps {
  students: Student[]
  total: number
  page: number
  perPage: number
  onPageChange: (page: number) => void
  onEdit: (student: Student) => void
  onDelete: (id: number) => void
  onView: (student: Student) => void
  onViewDiscipline: (student: Student) => void
  onSendMessage: (student: Student) => void
  loading?: boolean
}

const statusColors: Record<StudentStatus, any> = {
  nouveau: 'info',
  ancien: 'default',
  inscrit: 'success',
  démission: 'warning',
  exclu: 'danger',
  transféré: 'secondary',
  réintégré: 'success',
}

export function StudentList({
  students,
  total,
  page,
  perPage,
  onPageChange,
  onEdit,
  onDelete,
  onView,
  onViewDiscipline,
  onSendMessage,
  loading,
}: StudentListProps) {
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const totalPages = Math.ceil(total / perPage)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Matricule</TableHead>
            <TableHead>Nom complet</TableHead>
            <TableHead>Classe</TableHead>
            <TableHead>Sexe</TableHead>
            <TableHead>Date naiss.</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                Aucun élève trouvé
              </TableCell>
            </TableRow>
          ) : (
            students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-mono text-sm">{student.matricule}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {student.photo_url ? (
                      <img src={student.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700">
                        {student.first_name[0]}{student.last_name[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{student.last_name} {student.first_name}</p>
                      <p className="text-xs text-gray-500">{student.email || '-'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{student.class_name || '-'}</TableCell>
                <TableCell>{student.gender === 'M' ? 'M' : 'F'}</TableCell>
                <TableCell>{formatDate(student.date_of_birth)}</TableCell>
                <TableCell>
                  <Badge variant={statusColors[student.status] || 'default'}>
                    {student.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onView(student)} leftIcon={<Eye className="w-4 h-4" />} />
                    <Button variant="ghost" size="sm" onClick={() => onEdit(student)} leftIcon={<Edit className="w-4 h-4" />} />
                    <Button variant="ghost" size="sm" onClick={() => onViewDiscipline(student)} leftIcon={<FileText className="w-4 h-4" />} />
                    <Button variant="ghost" size="sm" onClick={() => onSendMessage(student)} leftIcon={<Send className="w-4 h-4" />} />
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(student.id)} leftIcon={<Trash2 className="w-4 h-4 text-danger" />} />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalItems={total}
          perPage={perPage}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            onDelete(deleteId)
            setDeleteId(null)
          }
        }}
        title="Confirmer la suppression"
        message="Êtes-vous sûr de vouloir supprimer cet élève ? Cette action est irréversible."
        confirmText="Supprimer"
        variant="danger"
      />
    </>
  )
}
