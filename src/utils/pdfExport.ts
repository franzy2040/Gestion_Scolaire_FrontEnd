import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { Student, BudgetSummary, ReportCard, TermResults } from '@/types'

// ==================== ÉLÈVES ====================
export function exportStudentsPDF(students: Student[], title: string) {
  const doc = new jsPDF()

  // En-tête
  doc.setFontSize(16)
  doc.text(title, 14, 20)

  doc.setFontSize(10)
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 30)

  // Tableau
  const headers = [['Matricule', 'Nom', 'Prénom', 'Classe', 'Statut']]
  const data = students.map(s => [
    s.matricule,
    s.last_name,
    s.first_name,
    s.class_name || '-',
    s.status,
  ])

  ;(doc as any).autoTable({
    head: headers,
    body: data,
    startY: 40,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 58, 138] },
  })

  doc.save(`${title.replace(/\s+/g, '_')}.pdf`)
}

// ==================== BUDGET ====================
export function exportBudgetPDF(summary: BudgetSummary, filename: string) {
  const doc = new jsPDF()

  // En-tête
  doc.setFontSize(16)
  doc.text('Rapport de Dépenses', 14, 20)

  doc.setFontSize(10)
  doc.text(`Période: ${new Date().toLocaleDateString('fr-FR')}`, 14, 30)

  // Résumé
  doc.setFontSize(12)
  doc.text('Résumé', 14, 45)

  doc.setFontSize(10)
  doc.text(`Budget total: ${summary.total_budget?.toLocaleString() || 0} FCFA`, 14, 55)
  doc.text(`Total dépensé: ${summary.total_expenses?.toLocaleString() || 0} FCFA`, 14, 62)
  doc.text(`Restant: ${summary.total_remaining?.toLocaleString() || 0} FCFA`, 14, 69)
  doc.text(`Taux d'utilisation: ${summary.utilization_rate?.toFixed(1) || 0}%`, 14, 76)

  // Tableau par catégorie
  if (summary.categories && summary.categories.length > 0) {
    const headers = [['Catégorie', 'Budget', 'Dépensé', 'Restant', '%']]
    const data = summary.categories.map(c => [
      c.category_name,
      c.initial_amount?.toLocaleString() || '0',
      c.spent?.toLocaleString() || '0',
      c.remaining?.toLocaleString() || '0',
      `${c.percentage?.toFixed(1) || 0}%`,
    ])

    ;(doc as any).autoTable({
      head: headers,
      body: data,
      startY: 85,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 58, 138] },
    })
  }

  doc.save(`${filename}.pdf`)
}

// ==================== BULLETINS ====================
export function exportReportCardPDF(report: ReportCard) {
  const doc = new jsPDF()

  // En-tête école
  doc.setFontSize(18)
  doc.text('LYCÉE BILINGUE DE BALENG', 105, 20, { align: 'center' })

  doc.setFontSize(12)
  doc.text('BULLETIN DE NOTES', 105, 30, { align: 'center' })

  // Informations élève
  doc.setFontSize(10)
  let y = 45
  doc.text(`Nom: ${report.student_name || ''}`, 14, y)
  y += 7
  doc.text(`Matricule: ${report.student_matricule || report.matricule || ''}`, 14, y)
  y += 7
  doc.text(`Classe: ${report.class_name || ''}`, 14, y)
  y += 7
  doc.text(`Année académique: ${report.academic_year || ''}`, 14, y)
  y += 7
  doc.text(`Trimestre: ${report.term || ''}`, 14, y)

  // Tableau des matières
  if (report.subjects && report.subjects.length > 0) {
    const headers = [['Matière', 'Coef.', 'Note classe', 'Note exam', 'Moy.', 'Appréciation']]
    const data = report.subjects.map(s => [
      s.subject_name || '',
      String(s.coefficient || 0),
      s.class_mark !== undefined ? String(s.class_mark) : '-',
      s.exam_mark !== undefined ? String(s.exam_mark) : '-',
      s.average !== undefined ? String(s.average) : '-',
      s.appreciation || '',
    ])

    ;(doc as any).autoTable({
      head: headers,
      body: data,
      startY: y + 10,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 58, 138] },
    })
  }

  // Résumé
  const finalY = (doc as any).lastAutoTable?.finalY || y + 50

  doc.setFontSize(12)
  doc.text(`Moyenne générale: ${report.term_average || 0}`, 14, finalY + 15)
  doc.text(`Rang: ${report.term_rank || 0} / ${report.class_size || 0}`, 14, finalY + 22)

  // Décision
  doc.setFontSize(11)
  doc.text(`Décision: ${report.decision || ''}`, 14, finalY + 35)

  // Distinctions
  if (report.is_honor_roll) doc.text('🏆 Tableau d\'honneur', 14, finalY + 45)
  if (report.is_encouragement) doc.text('👏 Encouragement', 14, finalY + 52)
  if (report.is_congratulations) doc.text('🎉 Félicitations', 14, finalY + 59)
  if (report.is_warning) doc.text('⚠️ Avertissement', 14, finalY + 66)
  if (report.is_blame) doc.text('❌ Blâme', 14, finalY + 73)

  // Signature
  doc.setFontSize(10)
  const principalName = report.principal_name || ''
  if (principalName) {
    doc.text(`Le Principal: ${principalName}`, 120, 270)
  }

  doc.save(`bulletin_${report.student_matricule || report.matricule || 'unknown'}.pdf`)
}

// ==================== RÉSULTATS DE CLASSE ====================
export function exportClassResultsPDF(results: TermResults, filename: string) {
  const doc = new jsPDF()

  // En-tête
  doc.setFontSize(16)
  doc.text(`Résultats - ${results.class_name || ''}`, 14, 20)

  doc.setFontSize(10)
  doc.text(`Trimestre ${results.term || ''} - ${results.academic_year || ''}`, 14, 30)

  // Statistiques
  doc.setFontSize(12)
  doc.text('Statistiques', 14, 45)

  doc.setFontSize(10)
  doc.text(`Moyenne classe: ${results.class_average?.toFixed(2) || 0}`, 14, 55)
  doc.text(`Admis: ${results.pass_count || 0}`, 14, 62)
  doc.text(`Échec: ${results.fail_count || 0}`, 14, 69)
  doc.text(`Taux de réussite: ${results.pass_rate?.toFixed(1) || 0}%`, 14, 76)

  // Tableau des élèves
  if (results.students && results.students.length > 0) {
    const headers = [['Rang', 'Matricule', 'Nom', 'Moyenne', 'Décision']]
    const data = results.students.map((s, i) => [
      String(s.rank || i + 1),
      s.matricule || '',
      s.student_name || '',
      s.average !== undefined ? String(s.average) : '-',
      s.decision || '',
    ])

    ;(doc as any).autoTable({
      head: headers,
      body: data,
      startY: 85,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 58, 138] },
    })
  }

  doc.save(`${filename}.pdf`)
}