import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

const schema = z.object({
  academic_year: z.string().min(1, 'Année requise'),
  term: z.number().min(1).max(3),
  sequence: z.enum(['seq1', 'seq2', 'seq3', 'seq4', 'seq5', 'seq6']),
  subject_id: z.number().min(1, 'Matière requise'),
  class_id: z.number().min(1, 'Classe requise'),
  deadline: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface GradeConfigFormProps {
  subjects: { id: number; name: string }[]
  classes: { id: number; name: string }[]
  onSubmit: (data: FormData) => void
  onCancel: () => void
}

export function GradeConfigForm({ subjects, classes, onSubmit, onCancel }: GradeConfigFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      term: 1,
      sequence: 'seq1',
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Année académique"
          {...register('academic_year')}
          error={errors.academic_year?.message}
        />
        <Select
          label="Trimestre"
          {...register('term', { valueAsNumber: true })}
          options={[
            { value: 1, label: '1er Trimestre' },
            { value: 2, label: '2ème Trimestre' },
            { value: 3, label: '3ème Trimestre' },
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Séquence"
          {...register('sequence')}
          options={[
            { value: 'seq1', label: 'Séquence 1' },
            { value: 'seq2', label: 'Séquence 2' },
            { value: 'seq3', label: 'Séquence 3' },
            { value: 'seq4', label: 'Séquence 4' },
            { value: 'seq5', label: 'Séquence 5' },
            { value: 'seq6', label: 'Séquence 6' },
          ]}
        />
        <Input
          label="Deadline de saisie"
          type="date"
          {...register('deadline')}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Matière"
          {...register('subject_id', { valueAsNumber: true })}
          options={subjects.map((s) => ({ value: s.id, label: s.name }))}
          error={errors.subject_id?.message}
        />
        <Select
          label="Classe"
          {...register('class_id', { valueAsNumber: true })}
          options={classes.map((c) => ({ value: c.id, label: c.name }))}
          error={errors.class_id?.message}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          Ouvrir la saisie
        </Button>
      </div>
    </form>
  )
}
