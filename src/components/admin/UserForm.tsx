import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { User } from '@/types'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

const schema = z.object({
  email: z.string().email('Email invalide'),
  full_name: z.string().min(3, 'Nom complet requis'),
  role: z.enum(['superadmin', 'admin', 'teacher', 'secretary', 'accountant', 'readonly']),
  password: z.string().min(6, 'Mot de passe minimum 6 caractères').optional(),
  is_active: z.boolean().default(true),
})

type FormData = z.infer<typeof schema>

interface UserFormProps {
  initialData?: Partial<User>
  onSubmit: (data: FormData) => void
  onCancel: () => void
}

export function UserForm({ initialData, onSubmit, onCancel }: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: initialData?.email || '',
      full_name: initialData?.full_name || '',
      role: (initialData?.role as any) || 'teacher',
      is_active: initialData?.is_active ?? true,
    },
  })

  const roleOptions = [
    { value: 'superadmin', label: 'Super Admin' },
    { value: 'admin', label: 'Administrateur' },
    { value: 'teacher', label: 'Enseignant' },
    { value: 'secretary', label: 'Secrétaire' },
    { value: 'accountant', label: 'Comptable' },
    { value: 'readonly', label: 'Lecture seule' },
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Email"
        type="email"
        {...register('email')}
        error={errors.email?.message}
      />
      <Input
        label="Nom complet"
        {...register('full_name')}
        error={errors.full_name?.message}
      />
      <Select
        label="Rôle"
        {...register('role')}
        options={roleOptions}
        error={errors.role?.message}
      />
      {!initialData && (
        <Input
          label="Mot de passe"
          type="password"
          {...register('password')}
          error={errors.password?.message}
          helper="Minimum 6 caractères"
        />
      )}
      <div className="flex items-center gap-2">
        <input type="checkbox" id="is_active" {...register('is_active')} />
        <label htmlFor="is_active" className="text-sm text-gray-700">Compte actif</label>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit">
          {initialData ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  )
}
