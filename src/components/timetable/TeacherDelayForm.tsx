import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

const schema = z.object({
  teacher_id: z.number().min(1, 'Enseignant requis'),
  date: z.string().min(1, 'Date requise'),
  scheduled_time: z.string().min(1, 'Heure prévue requise'),
  actual_time: z.string().min(1, 'Heure réelle requise'),
  reason: z.string().optional(),
  is_justified: z.boolean().default(false),
})

type FormData = z.infer<typeof schema>

interface TeacherDelayFormProps {
  teachers: { id: number; first_name: string; last_name: string }[]
  onSubmit: (data: FormData) => void
  onCancel: () => void
}

export function TeacherDelayForm({ teachers, onSubmit, onCancel }: TeacherDelayFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      scheduled_time: '08:00',
      actual_time: '08:00',
      is_justified: false,
    },
  })

  const scheduled = watch('scheduled_time')
  const actual = watch('actual_time')

  const delayMinutes = React.useMemo(() => {
    if (!scheduled || !actual) return 0
    const [sH, sM] = scheduled.split(':').map(Number)
    const [aH, aM] = actual.split(':').map(Number)
    return (aH * 60 + aM) - (sH * 60 + sM)
  }, [scheduled, actual])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Select
        label="Enseignant"
        {...register('teacher_id', { valueAsNumber: true })}
        options={teachers.map((t) => ({ value: t.id, label: `${t.last_name} ${t.first_name}` }))}
        error={errors.teacher_id?.message}
      />

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Date"
          type="date"
          {...register('date')}
          error={errors.date?.message}
        />
        <Input
          label="Heure prévue"
          type="time"
          {...register('scheduled_time')}
          error={errors.scheduled_time?.message}
        />
        <Input
          label="Heure réelle"
          type="time"
          {...register('actual_time')}
          error={errors.actual_time?.message}
        />
      </div>

      {delayMinutes > 0 && (
        <div className="bg-amber-50 p-3 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Retard calculé:</strong> {delayMinutes} minutes
          </p>
        </div>
      )}

      <Input
        label="Motif"
        {...register('reason')}
        helper="Optionnel - Raison du retard"
      />

      <div className="flex items-center gap-2">
        <input type="checkbox" id="justified" {...register('is_justified')} />
        <label htmlFor="justified" className="text-sm text-gray-700">Retard justifié</label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" variant="warning">
          Enregistrer le retard
        </Button>
      </div>
    </form>
  )
}
