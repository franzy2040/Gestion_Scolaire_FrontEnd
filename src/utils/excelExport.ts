import * as XLSX from 'xlsx'
import { Student, BudgetExpense, TermResults } from '@/types'

export function exportStudentsExcel(students: Student[], filename: string) {
  const data = students.map(s => ({
    'Matricule': s.matricule,
    'Nom': s.last_name,
    'Prénom': s.first_name,
    'Sexe': s.gender,
    'Date de naissance': s.date_of_birth,
    'Lieu de naissance': s.place_of_birth,
    'Nationalité': s.nationality,
    'Classe': s.class_name,
    'Niveau': s.level_name,
    'Section': s.section_name,
    'Statut': s.status,
    'Adresse': s.address,
    'Téléphone': s.phone || '',
    'Email': s.email || '',
    'Nom du père': s.father_name || '',
    'Tél. père': s.father_phone || '',
    'Nom de la mère': s.mother_name || '',
    'Tél. mère': s.mother_phone || '',
    'Groupe sanguin': s.blood_group || '',
    'Allergies': s.allergies || '',
    "Date d'inscription": s.registration_date,
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Élèves')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function exportBudgetExcel(expenses: BudgetExpense[], filename: string) {
  const data = expenses.map(e => ({
    'Date': e.date || e.expense_date || '',
    'Rubrique': e.category_name || e.main_line_name || '',
    'Sous-rubrique': e.sub_line_name || e.main_line_code || '',
    'Description': e.description || e.name || '',
    'Bénéficiaire': e.beneficiary || '',
    'Montant': e.amount || e.total_amount || 0,
    'Mode de paiement': e.payment_method || '',
    'Référence': e.reference_number || e.expense_number || e.receipt_number || '',
    'Enregistré par': e.recorded_by_name || '',
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Dépenses')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function downloadStudentTemplate() {
  const template = [
    {
      'Matricule': '202600001',
      'Nom': 'DUPONT',
      'Prénom': 'Jean',
      'Sexe': 'M',
      'Date de naissance': '2008-01-15',
      'Lieu de naissance': 'Douala',
      'Nationalité': 'Camerounaise',
      'Adresse': 'Baleng',
      'Téléphone': '6XX XXX XXX',
      'Email': 'jean@email.com',
      'Nom du père': 'Martin DUPONT',
      'Tél. père': '6XX XXX XXX',
      'Nom de la mère': 'Marie DUPONT',
      'Tél. mère': '6XX XXX XXX',
      'Groupe sanguin': 'O+',
      'Allergies': 'Aucune',
      'Conditions médicales': 'Aucune',
      'Contact urgence': 'Martin DUPONT',
      'Tél. urgence': '6XX XXX XXX',
      'Classe ID': '1',
      'Niveau ID': '1',
      'Section ID': '1',
      'École précédente': '',
      'Niveau précédent': '',
    }
  ]

  const ws = XLSX.utils.json_to_sheet(template)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Modèle')
  XLSX.writeFile(wb, 'modele_import_eleves.xlsx')
}

export function parseStudentExcel(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][]

        if (json.length < 2) {
          reject(new Error('Fichier vide ou invalide'))
          return
        }

        const headers = json[0]
        const rows = json.slice(1).map(row => {
          const obj: Record<string, string> = {}
          headers.forEach((h, i) => {
            obj[h] = String(row[i] || '')
          })
          return obj
        })

        resolve(rows)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsBinaryString(file)
  })
}