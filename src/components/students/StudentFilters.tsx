import React from 'react'
import { StudentSearchFilters } from '@/types'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Search, X } from 'lucide-react'

interface StudentFiltersProps {
  filters: StudentSearchFilters
  onChange: (filters: StudentSearchFilters) => void
  classes: { id: number; name: string }[]
  levels: { id: number; name: string }[]
  sections: { id: number; name: string }[]
}

export function StudentFilters({ filters, onChange, classes, levels, sections }: StudentFiltersProps) {
  const handleChange = (field: keyof StudentSearchFilters, value: any) => {
    onChange({ ...filters, [field]: value })
  }

  const handleReset = () => {
    onChange({})
  }

  const hasFilters = Object.values(filters).some((v) => v !== undefined && v !== '')

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Input
          placeholder="Matricule..."
          value={filters.matricule || ''}
          onChange={(e) => handleChange('matricule', e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
        <Input
          placeholder="Nom..."
          value={filters.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
        />
        <Input
          type="date"
          placeholder="Date de naissance"
          value={filters.date_of_birth || ''}
          onChange={(e) => handleChange('date_of_birth', e.target.value)}
        />
        <Select
          options={classes.map((c) => ({ value: c.id, label: c.name }))}
          value={filters.class_id || ''}
          onChange={(e) => handleChange('class_id', e.target.value ? Number(e.target.value) : undefined)}
        />
        <Select
          options={levels.map((l) => ({ value: l.id, label: l.name }))}
          value={filters.level_id || ''}
          onChange={(e) => handleChange('level_id', e.target.value ? Number(e.target.value) : undefined)}
        />
        <Select
          options={[
            { value: 'nouveau', label: 'Nouveau' },
            { value: 'ancien', label: 'Ancien' },
            { value: 'inscrit', label: 'Inscrit' },
            { value: 'démission', label: 'Démission' },
            { value: 'exclu', label: 'Exclu' },
            { value: 'transféré', label: 'Transféré' },
            { value: 'réintégré', label: 'Réintégré' },
          ]}
          value={filters.status || ''}
          onChange={(e) => handleChange('status', e.target.value || undefined)}
        />
      </div>
      {hasFilters && (
        <div className="flex justify-end mt-3">
          <Button variant="ghost" size="sm" onClick={handleReset} leftIcon={<X className="w-4 h-4" />}>
            Réinitialiser
          </Button>
        </div>
      )}
    </div>
  )
}
