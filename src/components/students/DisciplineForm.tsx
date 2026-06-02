import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { DisciplineType } from '@/types'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

const schema = z.object({
  type: z.enum(['retard', 'absence', 'exclusion', 'convocation', 'avertissement', 'blâme']),
  date: z.string().min(1, 'Date requise'),
  reason: z.string().min(3, 'Motif requis'),
  description: z.string().optional(),
  exclusion_days: z.number().optional(),
  exclusion_hours: z.number().optional(),
  exclusion_start: z.string().optional(),
  exclusion_end: z.string().optional(),
  delay_minutes: z.number().optional(),
  is_justified: z.boolean().default(false),
  justification: z.string().optional(),
  convocation_date: z.string().optional(),
  convocation_time: z.string().optional(),
  points_deducted: z.number().default(0),
})

type FormData = z.infer<typeof schema>

interface DisciplineFormProps {
  studentId: number
  studentName: string
  onSubmit: (data: FormData) => void
  onCancel: () => void
}

export function DisciplineForm({ studentId, studentName, onSubmit, onCancel }: DisciplineFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'retard',
      date: new Date().toISOString().split('T')[0],
      is_justified: false,
      points_deducted: 0,
    },
  })

  const type = watch('type')

  const typeOptions = [
    { value: 'retard', label: 'Retard' },
    { value: 'absence', label: 'Absence' },
    { value: 'exclusion', label: 'Exclusion' },
    { value: 'convocation', label: 'Convocation parents' },
    { value: 'avertissement', label: 'Avertissement' },
    { value: 'blâme', label: 'Blâme' },
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="bg-blue-50 p-3 rounded-lg mb-4">
        <p className="text-sm text-blue-800">
          <strong>Élève:</strong> {studentName} (ID: {studentId})
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Type de sanction"
          {...register('type')}
          options={typeOptions}
          error={errors.type?.message}
        />
        <Input
          label="Date"
          type="date"
          {...register('date')}
          error={errors.date?.message}
        />
      </div>

      <Input
        label="Motif"
        {...register('reason')}
        error={errors.reason?.message}
      />

      <Input
        label="Description détaillée"
        {...register('description')}
        className="h-20"
      />

      {/* Champs spécifiques selon le type */}
      {type === 'exclusion' && (
        <div className="grid grid-cols-2 gap-4 bg-red-50 p-4 rounded-lg">
          <h4 className="col-span-2 font-semibold text-red-800">Détails de l'exclusion</h4>
          <Input label="Jours" type="number" {...register('exclusion_days', { valueAsNumber: true })} />
          <Input label="Heures" type="number" {...register('exclusion_hours', { valueAsNumber: true })} />
          <Input label="Date début" type="date" {...register('exclusion_start')} />
          <Input label="Date fin" type="date" {...register('exclusion_end')} />
        </div>
      )}

      {type === 'retard' && (
        <div className="grid grid-cols-2 gap-4 bg-amber-50 p-4 rounded-lg">
          <h4 className="col-span-2 font-semibold text-amber-800">Détails du retard</h4>
          <Input label="Minutes de retard" type="number" {...register('delay_minutes', { valueAsNumber: true })} />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="justified" {...register('is_justified')} />
            <label htmlFor="justified" className="text-sm">Justifié</label>
          </div>
          <Input label="Justification" {...register('justification')} className="col-span-2" />
        </div>
      )}

      {type === 'convocation' && (
        <div className="grid grid-cols-2 gap-4 bg-purple-50 p-4 rounded-lg">
          <h4 className="col-span-2 font-semibold text-purple-800">Détails de la convocation</h4>
          <Input label="Date convocation" type="date" {...register('convocation_date')} />
          <Input label="Heure convocation" type="time" {...register('convocation_time')} />
        </div>
      )}

      <Input
        label="Points déduits"
        type="number"
        {...register('points_deducted', { valueAsNumber: true })}
        helper="Points de discipline à déduire"
      />

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" variant="danger">
          Enregistrer la sanction
        </Button>
      </div>
    </form>
  )
}
