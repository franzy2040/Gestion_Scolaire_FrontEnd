import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { StudentFormData, Gender, BloodGroup } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { Upload, User, BookOpen, Heart, FileText, Users } from 'lucide-react'

const schema = z.object({
  matricule: z.string().regex(/^\d{9}$/, 'Le matricule doit contenir exactement 9 chiffres'),
  first_name: z.string().min(2, 'Prénom requis'),
  last_name: z.string().min(2, 'Nom requis'),
  gender: z.enum(['M', 'F']),
  date_of_birth: z.string().min(1, 'Date de naissance requise'),
  place_of_birth: z.string().min(2, 'Lieu de naissance requis'),
  nationality: z.string().min(2, 'Nationalité requise'),
  address: z.string().min(5, 'Adresse requise'),
  class_id: z.number().min(1, 'Classe requise'),
  level_id: z.number().min(1, 'Niveau requis'),
  section_id: z.number().min(1, 'Section requise'),
})

type FormData = z.infer<typeof schema>

interface StudentFormProps {
  initialData?: Partial<StudentFormData>
  classes: { id: number; name: string; level_id: number; section_id: number }[]
  levels: { id: number; name: string }[]
  sections: { id: number; name: string }[]
  onSubmit: (data: FormData & { photo?: File; birth_certificate?: File }) => void
  onCancel: () => void
  isLoading?: boolean
}

export function StudentForm({ initialData, classes, levels, sections, onSubmit, onCancel, isLoading }: StudentFormProps) {
  const [activeTab, setActiveTab] = useState('personal')
  const [photo, setPhoto] = useState<File | null>(null)
  const [birthCertificate, setBirthCertificate] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.photo_url || null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      matricule: initialData?.matricule || '',
      first_name: initialData?.first_name || '',
      last_name: initialData?.last_name || '',
      gender: initialData?.gender || 'M',
      date_of_birth: initialData?.date_of_birth || '',
      place_of_birth: initialData?.place_of_birth || '',
      nationality: initialData?.nationality || 'Camerounaise',
      address: initialData?.address || '',
      class_id: initialData?.class_id || 0,
      level_id: initialData?.level_id || 0,
      section_id: initialData?.section_id || 0,
    },
  })

  const selectedClassId = watch('class_id')
  const selectedLevelId = watch('level_id')

  // Auto-fill level and section when class changes
  React.useEffect(() => {
    if (selectedClassId) {
      const cls = classes.find((c) => c.id === selectedClassId)
      if (cls) {
        setValue('level_id', cls.level_id)
        setValue('section_id', cls.section_id)
      }
    }
  }, [selectedClassId, classes, setValue])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => setPhotoPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const tabs = [
    { id: 'personal', label: 'Informations personnelles', icon: <User className="w-4 h-4" /> },
    { id: 'academic', label: 'Académique', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'parents', label: 'Parents & Tuteur', icon: <Users className="w-4 h-4" /> },
    { id: 'health', label: 'Santé', icon: <Heart className="w-4 h-4" /> },
    { id: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
  ]

  const handleFormSubmit = (data: FormData) => {
    onSubmit({ ...data, photo: photo || undefined, birth_certificate: birthCertificate || undefined })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="mt-6">
        {/* Onglet Informations personnelles */}
        {activeTab === 'personal' && (
          <div className="space-y-4">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                <div className="w-32 h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 overflow-hidden">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-xs text-gray-500">Photo</span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="mt-2 block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary-50 file:text-primary-700"
                />
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                <Input
                  label="Matricule"
                  {...register('matricule')}
                  error={errors.matricule?.message}
                  helper="9 chiffres exactement"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Nom"
                    {...register('last_name')}
                    error={errors.last_name?.message}
                  />
                  <Input
                    label="Prénom"
                    {...register('first_name')}
                    error={errors.first_name?.message}
                  />
                </div>
                <Select
                  label="Sexe"
                  {...register('gender')}
                  options={[
                    { value: 'M', label: 'Masculin' },
                    { value: 'F', label: 'Féminin' },
                  ]}
                />
                <Input
                  label="Date de naissance"
                  type="date"
                  {...register('date_of_birth')}
                  error={errors.date_of_birth?.message}
                />
                <Input
                  label="Lieu de naissance"
                  {...register('place_of_birth')}
                  error={errors.place_of_birth?.message}
                />
                <Input
                  label="Nationalité"
                  {...register('nationality')}
                  error={errors.nationality?.message}
                />
                <Input
                  label="Adresse"
                  {...register('address')}
                  error={errors.address?.message}
                  className="col-span-2"
                />
                <Input
                  label="Téléphone"
                  {...register('phone' as any)}
                />
                <Input
                  label="Email"
                  type="email"
                  {...register('email' as any)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Onglet Académique */}
        {activeTab === 'academic' && (
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Classe"
              {...register('class_id', { valueAsNumber: true })}
              error={errors.class_id?.message}
              options={classes.map((c) => ({ value: c.id, label: c.name }))}
            />
            <Select
              label="Niveau"
              {...register('level_id', { valueAsNumber: true })}
              options={levels.map((l) => ({ value: l.id, label: l.name }))}
              disabled
            />
            <Select
              label="Section"
              {...register('section_id', { valueAsNumber: true })}
              options={sections.map((s) => ({ value: s.id, label: s.name }))}
              disabled
            />
            <Input
              label="École précédente"
              {...register('previous_school' as any)}
            />
            <Input
              label="Niveau précédent"
              {...register('previous_level' as any)}
            />
          </div>
        )}

        {/* Onglet Parents */}
        {activeTab === 'parents' && (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-4">Père</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Nom complet" {...register('father_name' as any)} />
                  <Input label="Téléphone" {...register('father_phone' as any)} />
                  <Input label="Profession" {...register('father_occupation' as any)} className="col-span-2" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-4">Mère</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Nom complet" {...register('mother_name' as any)} />
                  <Input label="Téléphone" {...register('mother_phone' as any)} />
                  <Input label="Profession" {...register('mother_occupation' as any)} className="col-span-2" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-4">Tuteur (si applicable)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Nom complet" {...register('guardian_name' as any)} />
                  <Input label="Téléphone" {...register('guardian_phone' as any)} />
                  <Input label="Lien de parenté" {...register('guardian_relation' as any)} className="col-span-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Onglet Santé */}
        {activeTab === 'health' && (
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Groupe sanguin"
              {...register('blood_group' as any)}
              options={[
                { value: 'A+', label: 'A+' },
                { value: 'A-', label: 'A-' },
                { value: 'B+', label: 'B+' },
                { value: 'B-', label: 'B-' },
                { value: 'AB+', label: 'AB+' },
                { value: 'AB-', label: 'AB-' },
                { value: 'O+', label: 'O+' },
                { value: 'O-', label: 'O-' },
              ]}
            />
            <Input
              label="Allergies"
              {...register('allergies' as any)}
              helper="Séparer par des virgules"
            />
            <Input
              label="Conditions médicales"
              {...register('medical_conditions' as any)}
              className="col-span-2"
            />
            <Input
              label="Contact d'urgence"
              {...register('emergency_contact' as any)}
            />
            <Input
              label="Téléphone d'urgence"
              {...register('emergency_phone' as any)}
            />
          </div>
        )}

        {/* Onglet Documents */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Acte de naissance
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setBirthCertificate(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {birthCertificate && (
                  <span className="text-sm text-success">{birthCertificate.name}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Mettre à jour' : "Créer l'élève"}
        </Button>
      </div>
    </form>
  )
}
