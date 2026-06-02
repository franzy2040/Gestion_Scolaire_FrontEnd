import React from 'react'
import { RolePermission } from '@/types'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Save } from 'lucide-react'
import toast from 'react-hot-toast'

interface PermissionMatrixProps {
  permissions: RolePermission[]
  onUpdate: (permissions: RolePermission[]) => void
}

const MODULES = [
  { key: 'students', label: 'Élèves' },
  { key: 'teachers', label: 'Enseignants' },
  { key: 'grades', label: 'Notes' },
  { key: 'timetable', label: 'Emploi du temps' },
  { key: 'discipline', label: 'Discipline' },
  { key: 'budget', label: 'Budget' },
  { key: 'reports', label: 'Rapports' },
  { key: 'messages', label: 'Messages' },
  { key: 'content', label: 'Contenu public' },
  { key: 'admin', label: 'Administration' },
]

const ROLES = ['superadmin', 'admin', 'teacher', 'secretary', 'accountant', 'readonly']

export function PermissionMatrix({ permissions, onUpdate }: PermissionMatrixProps) {
  const [localPerms, setLocalPerms] = React.useState<RolePermission[]>(permissions)

  React.useEffect(() => {
    setLocalPerms(permissions)
  }, [permissions])

  const togglePermission = (role: string, module: string, action: keyof RolePermission) => {
    setLocalPerms((prev) =>
      prev.map((p) =>
        p.role === role && p.module === module
          ? { ...p, [action]: !p[action] }
          : p
      )
    )
  }

  const handleSave = () => {
    onUpdate(localPerms)
    toast.success('Permissions mises à jour')
  }

  const getPerm = (role: string, module: string) => {
    return localPerms.find((p) => p.role === role && p.module === module) || {
      id: 0,
      role,
      module,
      can_read: false,
      can_write: false,
      can_delete: false,
      can_export: false,
      can_import: false,
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleSave} leftIcon={<Save className="w-4 h-4" />}>
          Enregistrer les modifications
        </Button>
      </div>

      {ROLES.map((role) => (
        <div key={role} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 capitalize">{role}</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead className="text-center">Lecture</TableHead>
                  <TableHead className="text-center">Écriture</TableHead>
                  <TableHead className="text-center">Suppression</TableHead>
                  <TableHead className="text-center">Export</TableHead>
                  <TableHead className="text-center">Import</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MODULES.map((mod) => {
                  const perm = getPerm(role, mod.key)
                  return (
                    <TableRow key={mod.key}>
                      <TableCell className="font-medium">{mod.label}</TableCell>
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          checked={perm.can_read}
                          onChange={() => togglePermission(role, mod.key, 'can_read')}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          checked={perm.can_write}
                          onChange={() => togglePermission(role, mod.key, 'can_write')}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          checked={perm.can_delete}
                          onChange={() => togglePermission(role, mod.key, 'can_delete')}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          checked={perm.can_export}
                          onChange={() => togglePermission(role, mod.key, 'can_export')}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          checked={perm.can_import}
                          onChange={() => togglePermission(role, mod.key, 'can_import')}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      ))}
    </div>
  )
}
