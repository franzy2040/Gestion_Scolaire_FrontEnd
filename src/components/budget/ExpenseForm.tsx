import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

const schema = z.object({
  category_id: z.number().min(1, 'Rubrique requise'),
  sub_line_id: z.number().optional(),
  date: z.string().min(1, 'Date requise'),
  amount: z.number().min(0.01, 'Montant doit être > 0'),
  description: z.string().min(3, 'Description requise'),
  beneficiary: z.string().optional(),
  payment_method: z.enum(['espèces', 'chèque', 'virement', 'mobile_money']),
  reference_number: z.string().optional(),
  is_recurring: z.boolean().default(false),
  recurrence_frequency: z.enum(['mensuel', 'trimestriel', 'annuel']).optional(),
})

type FormData = z.infer<typeof schema>

interface ExpenseFormProps {
  categories: { id: number; name: string; current_balance: number }[]
  subLines: { id: number; name: string; category_id: number; remaining_amount: number }[]
  onSubmit: (data: FormData) => void
  onCancel: () => void
}

export function ExpenseForm({ categories, subLines, onSubmit, onCancel }: ExpenseFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      payment_method: 'espèces',
      is_recurring: false,
    },
  })

  const selectedCategoryId = watch('category_id')
  const isRecurring = watch('is_recurring')

  const filteredSubLines = subLines.filter((sl) => sl.category_id === selectedCategoryId)
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {selectedCategory && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Solde disponible:</strong> {selectedCategory.current_balance.toLocaleString('fr-FR')} FCFA
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Rubrique"
          {...register('category_id', { valueAsNumber: true })}
          options={categories.map((c) => ({ value: c.id, label: `${c.name} (${c.current_balance.toLocaleString('fr-FR')} FCFA)` }))}
          error={errors.category_id?.message}
        />
        <Select
          label="Sous-rubrique (optionnel)"
          {...register('sub_line_id', { valueAsNumber: true })}
          options={[
            { value: 0, label: 'Aucune' },
            ...filteredSubLines.map((sl) => ({ value: sl.id, label: `${sl.name} (${sl.remaining_amount.toLocaleString('fr-FR')} FCFA)` })),
          ]}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Date"
          type="date"
          {...register('date')}
          error={errors.date?.message}
        />
        <Input
          label="Montant (FCFA)"
          type="number"
          step="0.01"
          {...register('amount', { valueAsNumber: true })}
          error={errors.amount?.message}
        />
      </div>

      <Input
        label="Description"
        {...register('description')}
        error={errors.description?.message}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Bénéficiaire"
          {...register('beneficiary')}
        />
        <Select
          label="Mode de paiement"
          {...register('payment_method')}
          options={[
            { value: 'espèces', label: 'Espèces' },
            { value: 'chèque', label: 'Chèque' },
            { value: 'virement', label: 'Virement bancaire' },
            { value: 'mobile_money', label: 'Mobile Money' },
          ]}
        />
      </div>

      <Input
        label="Référence / N° chèque"
        {...register('reference_number')}
        helper="Numéro de chèque, référence virement, etc."
      />

      <div className="flex items-center gap-2">
        <input type="checkbox" id="recurring" {...register('is_recurring')} />
        <label htmlFor="recurring" className="text-sm text-gray-700">Dépense récurrente</label>
      </div>

      {isRecurring && (
        <Select
          label="Fréquence"
          {...register('recurrence_frequency')}
          options={[
            { value: 'mensuel', label: 'Mensuel' },
            { value: 'trimestriel', label: 'Trimestriel' },
            { value: 'annuel', label: 'Annuel' },
          ]}
        />
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          Enregistrer la dépense
        </Button>
      </div>
    </form>
  )
}
