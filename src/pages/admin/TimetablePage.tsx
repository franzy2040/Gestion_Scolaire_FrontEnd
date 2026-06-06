import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar, Clock, Plus, X, Edit2, Trash2, Search, Filter,
  ChevronLeft, ChevronRight, Users, BookOpen, MapPin, AlertCircle,
  TriangleAlert, CheckCircle, Download, Printer, Grid3X3, List, Loader2, FileDown, Table2
} from "lucide-react";
import { apiService, classesApi } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

// ==================== TYPES ====================
interface TimetableSlot {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject_id: number;
  subject_name?: string;
  subject_code?: string;
  teacher_id: number;
  teacher_name?: string;
  class_id: number;
  class_name?: string;
  classroom_id?: number;
  classroom_name?: string;
  slot_type?: string;
  notes?: string;
}

interface Subject {
  id: number;
  name: string;
  code?: string;
  section: "FR" | "EN";
  coefficient: number;
  label_fr?: string;
  label_en?: string;
  section_id?: number;
  specialty_id?: number;
  status?: string;
  is_active?: boolean;
}

interface Classroom {
  id: number;
  name: string;
  capacity?: number;
  building?: string;
}

interface Teacher {
  id: number;
  first_name: string;
  last_name: string;
  full_name?: string;
}

interface ClassOption {
  id: number;
  name: string;
  abbreviation: string;
  level_id: number;
  level_name?: string;
  section_id?: number;
  section_name?: string;
}

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const TIME_SLOTS = [
  "07:30", "08:30", "09:30", "10:30", "11:30", "12:30",
  "13:30", "14:30", "15:30", "16:30", "17:30"
];

// Couleurs par matière pour le PDF
const SUBJECT_COLORS_PDF: Record<string, { bg: string; border: string; text: string }> = {
  "Mathématiques": { bg: "#dbeafe", border: "#3b82f6", text: "#1e3a8a" },
  "Physique": { bg: "#e9d5ff", border: "#a855f7", text: "#6b21a8" },
  "Chimie": { bg: "#dcfce7", border: "#22c55e", text: "#15803d" },
  "Biologie": { bg: "#d1fae5", border: "#10b981", text: "#047857" },
  "Français": { bg: "#fee2e2", border: "#ef4444", text: "#b91c1c" },
  "Anglais": { bg: "#fef3c7", border: "#f59e0b", text: "#b45309" },
  "Histoire": { bg: "#ffedd5", border: "#f97316", text: "#c2410c" },
  "Géographie": { bg: "#cffafe", border: "#06b6d4", text: "#0e7490" },
  "Philosophie": { bg: "#fce7f3", border: "#ec4899", text: "#be185d" },
  "EPS": { bg: "#ecfccb", border: "#84cc16", text: "#4d7c0f" },
  "Informatique": { bg: "#e0e7ff", border: "#6366f1", text: "#4338ca" },
  "SVT": { bg: "#d1fae5", border: "#10b981", text: "#047857" },
  "Latin": { bg: "#f3e8ff", border: "#8b5cf6", text: "#6d28d9" },
  "Allemand": { bg: "#fef9c3", border: "#eab308", text: "#a16207" },
  "Espagnol": { bg: "#fecaca", border: "#f87171", text: "#dc2626" },
  "Musique": { bg: "#fce7f3", border: "#f472b6", text: "#db2777" },
  "Arts Plastiques": { bg: "#ddd6fe", border: "#8b5cf6", text: "#6d28d9" },
  "Éducation Civique": { bg: "#bfdbfe", border: "#60a5fa", text: "#2563eb" },
};

function getSubjectColorPDF(subjectName: string): { bg: string; border: string; text: string } {
  return SUBJECT_COLORS_PDF[subjectName] || { bg: "#f3f4f6", border: "#9ca3af", text: "#4b5563" };
}

// ==================== EXPORTS PDF / EXCEL ====================

function generateTimetableHTML(
  slots: TimetableSlot[],
  classes: ClassOption[],
  teachers: Teacher[],
  subjects: Subject[],
  filterType: "class" | "teacher" | "subject",
  filterId: string,
  title: string
): string {
  const filteredSlots = slots.filter((s) => {
    if (!filterId) return true;
    if (filterType === "class") return s.class_id?.toString() === filterId;
    if (filterType === "teacher") return s.teacher_id?.toString() === filterId;
    if (filterType === "subject") return s.subject_id?.toString() === filterId;
    return true;
  });

  const filterName =
    filterType === "class"
      ? classes.find((c) => c.id.toString() === filterId)?.name || "Toutes les classes"
      : filterType === "teacher"
      ? teachers.find((t) => t.id.toString() === filterId)?.full_name || "Tous les enseignants"
      : subjects.find((s) => s.id.toString() === filterId)?.name || "Toutes les matières";

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @page { size: landscape; margin: 1cm; }
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; color: #333; }

        .header { 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          margin-bottom: 20px; 
          padding-bottom: 15px; 
          border-bottom: 3px solid #1e3a8a;
        }
        .logo-section { display: flex; align-items: center; gap: 15px; }
        .logo-icon { 
          width: 60px; height: 60px; 
          background: linear-gradient(135deg, #1e3a8a, #3b82f6); 
          border-radius: 12px; 
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 28px; font-weight: bold;
        }
        .school-info h1 { 
          margin: 0; font-size: 20px; color: #1e3a8a; font-weight: 700;
        }
        .school-info p { 
          margin: 2px 0; font-size: 11px; color: #666;
        }
        .doc-title { 
          text-align: right; 
        }
        .doc-title h2 { 
          margin: 0; font-size: 16px; color: #1e3a8a; 
        }
        .doc-title p { 
          margin: 4px 0; font-size: 10px; color: #888;
        }

        .info-box { 
          background: #f8fafc; 
          border-left: 4px solid #1e3a8a; 
          padding: 12px 15px; 
          margin-bottom: 20px; 
          border-radius: 0 8px 8px 0;
        }
        .info-box p { margin: 3px 0; font-size: 11px; color: #444; }
        .info-box strong { color: #1e3a8a; }

        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { 
          background: linear-gradient(135deg, #1e3a8a, #2563eb); 
          color: white; 
          padding: 12px 8px; 
          font-size: 11px; 
          text-align: center; 
          border: 1px solid #1e3a8a;
          font-weight: 600;
        }
        td { 
          border: 1px solid #e5e7eb; 
          padding: 6px; 
          font-size: 9px; 
          vertical-align: top; 
          height: 70px; 
          width: 16%;
        }
        .time-col { 
          background: #f3f4f6; 
          font-weight: bold; 
          text-align: center; 
          width: 60px; 
          font-size: 10px;
          color: #374151;
        }

        .slot { 
          border-radius: 6px; 
          padding: 5px; 
          margin: 2px 0; 
          font-size: 9px; 
          border-left: 3px solid;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .slot-subject { font-weight: 700; font-size: 10px; margin-bottom: 2px; }
        .slot-teacher { font-size: 9px; opacity: 0.9; }
        .slot-room { font-size: 8px; opacity: 0.7; margin-top: 2px; }
        .slot-time { font-size: 8px; opacity: 0.6; margin-top: 1px; }

        .empty { color: #d1d5db; text-align: center; font-style: italic; font-size: 10px; }

        .footer { 
          margin-top: 40px; 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-end;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        .footer-left { font-size: 9px; color: #9ca3af; }
        .signature-section { text-align: center; }
        .signature-line { 
          width: 200px; 
          border-bottom: 1px solid #333; 
          margin-bottom: 5px; 
          height: 30px;
        }
        .signature-label { 
          font-size: 10px; 
          color: #666; 
          font-weight: 600;
        }
        .stamp { 
          display: inline-block; 
          padding: 8px 15px; 
          border: 2px solid #1e3a8a; 
          border-radius: 8px; 
          color: #1e3a8a; 
          font-size: 10px; 
          font-weight: 700;
          margin-top: 5px;
        }

        .legend { 
          margin-top: 15px; 
          padding: 10px; 
          background: #f9fafb; 
          border-radius: 8px; 
          font-size: 9px;
        }
        .legend-title { font-weight: 700; margin-bottom: 5px; color: #374151; }
        .legend-item { 
          display: inline-block; 
          margin-right: 10px; 
          margin-bottom: 3px;
        }
        .legend-color { 
          display: inline-block; 
          width: 12px; 
          height: 12px; 
          border-radius: 3px; 
          margin-right: 3px; 
          vertical-align: middle;
          border: 1px solid;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-section">
          <div class="logo-icon">LB</div>
          <div class="school-info">
            <h1>LYCÉE BILINGUE DE BALENG</h1>
            <p>Ministère des Enseignements Secondaires - République du Cameroun</p>
            <p>BP: 1234 Bafoussam | Tel: (+237) 233 45 67 89</p>
          </div>
        </div>
        <div class="doc-title">
          <h2>📅 EMPLOI DU TEMPS</h2>
          <p>Année Scolaire 2025-2026</p>
          <p>Semaine du ${new Date().toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <div class="info-box">
        <p><strong>Filtre appliqué:</strong> ${filterType === "class" ? "Classe" : filterType === "teacher" ? "Enseignant" : "Matière"} = ${filterName}</p>
        <p><strong>Nombre de créneaux:</strong> ${filteredSlots.length} | <strong>Généré le:</strong> ${new Date().toLocaleDateString("fr-FR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Heure</th>
            ${DAYS.map((d) => `<th>${d}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
  `;

  TIME_SLOTS.forEach((timeSlot) => {
    html += `<tr><td class="time-col">${timeSlot}</td>`;
    DAYS.forEach((_, dayIdx) => {
      const daySlots = filteredSlots.filter((s) => {
        const slotHour = parseInt(s.start_time.split(":")[0]);
        const filterHour = parseInt(timeSlot.split(":")[0]);
        return s.day_of_week === dayIdx + 1 && slotHour === filterHour;
      });

      if (daySlots.length === 0) {
        html += `<td class="empty">—</td>`;
      } else {
        html += `<td>`;
        daySlots.forEach((slot) => {
          const color = getSubjectColorPDF(slot.subject_name || "");
          html += `
            <div class="slot" style="background-color: ${color.bg}; border-color: ${color.border}; color: ${color.text};">
              <div class="slot-subject">${slot.subject_name || "Matière"}</div>
              <div class="slot-teacher">👤 ${slot.teacher_name || "Prof."}</div>
              <div class="slot-class">📚 ${slot.class_name || "Classe non définie"}</div>
              <div class="slot-room">🚪 ${slot.classroom_name || "Salle non attribuée"}</div>
              <div class="slot-time">${slot.start_time?.slice(0, 5)} - ${slot.end_time?.slice(0, 5)}</div>
            </div>
          `;
        });
        html += `</td>`;
      }
    });
    html += `</tr>`;
  });

  const usedSubjects = [...new Set(filteredSlots.map(s => s.subject_name).filter((s): s is string => typeof s === "string" && s.length > 0))];
  const legendHTML = usedSubjects.map((subj: string) => {
    const c = getSubjectColorPDF(subj);
    return `<span class="legend-item"><span class="legend-color" style="background:${c.bg};border-color:${c.border}"></span>${subj}</span>`;
  }).join("");

  html += `
        </tbody>
      </table>

      <div class="legend">
        <div class="legend-title">📚 Légende des matières</div>
        ${legendHTML}
      </div>

      <div class="footer">
        <div class="footer-left">
          <p>Document généré par le Système de Gestion Scolaire</p>
          <p>Lycée Bilingue de Baleng © ${new Date().getFullYear()}</p>
          <p>Ce document est confidentiel et destiné à un usage interne.</p>
        </div>
        <div class="signature-section">
          <div class="signature-line"></div>
          <div class="signature-label">Signature du Proviseur</div>
          <div class="stamp">VISA PROVISEUR</div>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}

function exportToPDF(
  slots: TimetableSlot[],
  classes: ClassOption[],
  teachers: Teacher[],
  subjects: Subject[],
  filterType: "class" | "teacher" | "subject",
  filterId: string
) {
  const filterName =
    filterType === "class"
      ? classes.find((c) => c.id.toString() === filterId)?.name || "Toutes les classes"
      : filterType === "teacher"
      ? teachers.find((t) => t.id.toString() === filterId)?.full_name || "Tous les enseignants"
      : subjects.find((s) => s.id.toString() === filterId)?.name || "Toutes les matières";

  const title = `Emploi du temps - ${filterName}`;
  const html = generateTimetableHTML(slots, classes, teachers, subjects, filterType, filterId, title);

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 800);
  }
}

function exportToExcel(
  slots: TimetableSlot[],
  classes: ClassOption[],
  teachers: Teacher[],
  subjects: Subject[],
  filterType: "class" | "teacher" | "subject",
  filterId: string
) {
  const filterName =
    filterType === "class"
      ? classes.find((c) => c.id.toString() === filterId)?.name || "Toutes les classes"
      : filterType === "teacher"
      ? teachers.find((t) => t.id.toString() === filterId)?.full_name || "Tous les enseignants"
      : subjects.find((s) => s.id.toString() === filterId)?.name || "Toutes les matières";

  let useXLSX = false;
  try {
    if (typeof (window as any).XLSX !== 'undefined') useXLSX = true;
  } catch (e) { useXLSX = false; }

  if (useXLSX) {
    exportToExcelXLSX(slots, classes, teachers, subjects, filterType, filterId, filterName);
  } else {
    exportToExcelCSV(slots, classes, teachers, subjects, filterType, filterId, filterName);
  }
}

function exportToExcelCSV(
  slots: TimetableSlot[],
  classes: ClassOption[],
  teachers: Teacher[],
  subjects: Subject[],
  filterType: "class" | "teacher" | "subject",
  filterId: string,
  filterName: string
) {
  let csv = "\uFEFF";
  csv += "LYCÉE BILINGUE DE BALENG\n";
  csv += "Emploi du temps - " + filterName + "\n";
  csv += "Année Scolaire 2025-2026\n";
  csv += "Généré le," + new Date().toLocaleDateString("fr-FR") + "\n\n";
  csv += "Jour,Horaire,Matière,Code Matière,Enseignant,Classe,Salle,Type\n";

  const filteredSlots = slots.filter((s) => {
    if (!filterId) return true;
    if (filterType === "class") return s.class_id?.toString() === filterId;
    if (filterType === "teacher") return s.teacher_id?.toString() === filterId;
    if (filterType === "subject") return s.subject_id?.toString() === filterId;
    return true;
  });

  const sortedSlots = [...filteredSlots].sort((a, b) => {
    if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
    return a.start_time.localeCompare(b.start_time);
  });

  sortedSlots.forEach((slot) => {
    csv += `${DAYS[slot.day_of_week - 1]},`;
    csv += `${slot.start_time?.slice(0, 5)}-${slot.end_time?.slice(0, 5)},`;
    csv += `"${slot.subject_name || ""}",`;
    csv += `"${slot.subject_code || ""}",`;
    csv += `"${slot.teacher_name || ""}",`;
    csv += `"${slot.class_name || ""}",`;
    csv += `"${slot.classroom_name || ""}",`;
    csv += `"${slot.slot_type || "course"}"\n`;
  });

  csv += `\n\n"Ce document est confidentiel - Lycée Bilingue de Baleng"\n`;
  csv += `"Signature du Proviseur: ___________________"\n`;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `emploi_du_temps_${filterName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportToExcelXLSX(
  slots: TimetableSlot[],
  classes: ClassOption[],
  teachers: Teacher[],
  subjects: Subject[],
  filterType: "class" | "teacher" | "subject",
  filterId: string,
  filterName: string
) {
  try {
    const XLSX = (window as any).XLSX || require('xlsx');

    const filteredSlots = slots.filter((s) => {
      if (!filterId) return true;
      if (filterType === "class") return s.class_id?.toString() === filterId;
      if (filterType === "teacher") return s.teacher_id?.toString() === filterId;
      if (filterType === "subject") return s.subject_id?.toString() === filterId;
      return true;
    });

    const sortedSlots = [...filteredSlots].sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
      return a.start_time.localeCompare(b.start_time);
    });

    const data = [
      ["LYCÉE BILINGUE DE BALENG", "", "", "", "", "", ""],
      ["Emploi du temps", filterName, "", "", "", "", ""],
      ["Année Scolaire 2025-2026", "", "", "", "", "", ""],
      ["Généré le", new Date().toLocaleDateString("fr-FR"), "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["Jour", "Horaire", "Matière", "Code", "Enseignant", "Classe", "Salle", "Type"],
    ];

    sortedSlots.forEach((slot) => {
      data.push([
        DAYS[slot.day_of_week - 1],
        `${slot.start_time?.slice(0, 5)}-${slot.end_time?.slice(0, 5)}`,
        slot.subject_name || "",
        slot.subject_code || "",
        slot.teacher_name || "",
        slot.class_name || "",
        slot.classroom_name || "",
        slot.slot_type || "course",
      ]);
    });

    data.push(["", "", "", "", "", "", ""]);
    data.push(["", "", "", "", "", "", ""]);
    data.push(["Signature du Proviseur:", "", "", "", "", "", ""]);
    data.push(["", "", "", "", "", "", ""]);
    data.push(["Ce document est confidentiel - Lycée Bilingue de Baleng", "", "", "", "", "", ""]);

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Emploi du temps");

    XLSX.writeFile(wb, `emploi_du_temps_${filterName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`);

    toast.success("Fichier Excel généré avec succès");
  } catch (e) {
    console.error("Erreur XLSX:", e);
    toast.error("Bibliothèque xlsx non disponible, utilisation du CSV");
    exportToExcelCSV(slots, classes, teachers, subjects, filterType, filterId, filterName);
  }
}

// ==================== COMPOSANT PRINCIPAL ====================

export default function TimetablePage() {
  const { user } = useAuthStore();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"timetable" | "subjects" | "classrooms" | "assignments">("timetable");
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("");

  // Modals
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showEditSubjectModal, setShowEditSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [showClassroomModal, setShowClassroomModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: number; name: string; type: string }>({ show: false, id: 0, name: '', type: '' });
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [slotsRes, subjectsRes, classroomsRes, teachersRes, classesRes] = await Promise.all([
        apiService.get('/timetable/slots', { 
          params: {
            class_id: selectedClass || undefined,
            teacher_id: selectedTeacher || undefined,
            day_of_week: selectedDay || undefined,
          }
        }) as Promise<any>,
        apiService.get('/teachers/subjects') as Promise<any>,
        apiService.get('/timetable/classrooms') as Promise<any>,
        apiService.get('/timetable/teachers') as Promise<any>,
        classesApi.getAll() as Promise<any>,
      ]);

      const parseResponse = (res: any): any[] => {
        if (Array.isArray(res)) return res;
        if (res && Array.isArray(res.items)) return res.items;
        if (res && Array.isArray(res.data)) return res.data;
        return [];
      };

      const slotsData = parseResponse(slotsRes);
      const subjectsRaw = parseResponse(subjectsRes);
      const subjectsData = subjectsRaw
        .filter((s: any) => {
          const st = (s.status || '').toString().toLowerCase();
          return st === '' || st === 'active' || st === 'null' || st === 'undefined';
        })
        .map((s: any) => {
          // Détection robuste de la section
          let section: "FR" | "EN" = "FR";
          if (s.section === "EN" || s.section === "Anglophone" || s.section_id === 2) {
            section = "EN";
          } else if (s.section === "FR" || s.section === "Francophone" || s.section_id === 1) {
            section = "FR";
          }
          return {
            id: s.id,
            name: s.label_fr || s.name || s.code || 'Matière sans nom',
            code: s.code || s.abbreviation || '',
            section: section,
            coefficient: s.coefficient || 1,
            label_fr: s.label_fr,
            label_en: s.label_en,
            section_id: s.section_id,
            specialty_id: s.specialty_id,
            status: s.status,
            is_active: s.is_active,
          };
        });
      const classroomsData = parseResponse(classroomsRes);
      const teachersData = parseResponse(teachersRes);
      const classesData = parseResponse(classesRes);

      console.log('Data loaded:', {
        slots: slotsData.length,
        subjects: subjectsData.length,
        classrooms: classroomsData.length,
        teachers: teachersData.length,
        classes: classesData.length,
      });

      setSlots(slotsData);
      setSubjects(subjectsData);
      setClassrooms(classroomsData);
      setTeachers(teachersData);
      setClasses(classesData);
    } catch (err: any) {
      console.error('Load data error:', err);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedTeacher, selectedDay]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteSlot = async (id: number) => {
    if (!confirm("Supprimer ce créneau ?")) return;
    try {
      await apiService.delete(`/timetable/slots/${id}`);
      toast.success("Créneau supprimé");
      loadData();
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleDeleteSubject = (id: number, name: string) => {
    setDeleteConfirm({ show: true, id, name: name || '', type: 'subject' });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      await apiService.patch(`/timetable/subjects/${deleteConfirm.id}/deactivate`);
      toast.success("Matière désactivée avec succès");
      loadData();
    } catch (err: any) {
      console.error('Erreur désactivation:', err);
      toast.error(err.response?.data?.detail || err.message || "Impossible de désactiver cette matière");
    } finally {
      setDeleteConfirm({ show: false, id: 0, name: '', type: '' });
    }
  };

  const getSubjectColor = (subjectName: string) => {
    return SUBJECT_COLORS_PDF[subjectName]?.bg || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getSlotsForDayAndTime = (dayIndex: number, timeSlot: string) => {
    return slots.filter((s) => {
      const slotHour = parseInt(s.start_time.split(":")[0]);
      const filterHour = parseInt(timeSlot.split(":")[0]);
      return s.day_of_week === dayIndex + 1 && slotHour === filterHour;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-7 h-7 text-[#1e3a8a]" />
              Emploi du Temps
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Gestion des créneaux, matières et affectations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "grid" ? "bg-white text-[#1e3a8a] shadow-sm" : "text-gray-500"
                }`}
              >
                <Grid3X3 className="w-4 h-4 inline mr-1" />
                Grille
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === "list" ? "bg-white text-[#1e3a8a] shadow-sm" : "text-gray-500"
                }`}
              >
                <List className="w-4 h-4 inline mr-1" />
                Liste
              </button>
            </div>
            <button
              onClick={() => { setEditingSlot(null); setShowSlotModal(true); }}
              className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg hover:bg-[#152a5e] flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Nouveau Créneau
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-4 border-b border-gray-200">
          {[
            { id: "timetable", label: "Emploi du Temps", icon: Calendar },
            { id: "subjects", label: "Matières", icon: BookOpen },
            { id: "classrooms", label: "Salles", icon: MapPin },
            { id: "assignments", label: "Affectations", icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[#1e3a8a] text-[#1e3a8a]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === "timetable" && (
          <>
            {/* Export Buttons */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Exporter:</span>
                  <button
                    onClick={() => exportToPDF(slots, classes, teachers, subjects, "class", selectedClass)}
                    className="px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center gap-2 border border-red-200"
                    title="Exporter le planning de la classe sélectionnée en PDF"
                  >
                    <FileDown className="w-4 h-4" />
                    PDF Classe
                  </button>
                  <button
                    onClick={() => exportToExcel(slots, classes, teachers, subjects, "class", selectedClass)}
                    className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 flex items-center gap-2 border border-green-200"
                    title="Exporter le planning de la classe sélectionnée en Excel"
                  >
                    <Table2 className="w-4 h-4" />
                    Excel Classe
                  </button>
                </div>
                <div className="w-px h-8 bg-gray-300" />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportToPDF(slots, classes, teachers, subjects, "teacher", selectedTeacher)}
                    className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 flex items-center gap-2 border border-blue-200"
                    title="Exporter le planning de l'enseignant sélectionné en PDF"
                  >
                    <FileDown className="w-4 h-4" />
                    PDF Prof
                  </button>
                  <button
                    onClick={() => exportToExcel(slots, classes, teachers, subjects, "teacher", selectedTeacher)}
                    className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 flex items-center gap-2 border border-green-200"
                    title="Exporter le planning de l'enseignant sélectionné en Excel"
                  >
                    <Table2 className="w-4 h-4" />
                    Excel Prof
                  </button>
                </div>
                <div className="w-px h-8 bg-gray-300" />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportToPDF(slots, classes, teachers, subjects, "subject", "")}
                    className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-100 flex items-center gap-2 border border-purple-200"
                    title="Exporter tout le planning en PDF"
                  >
                    <FileDown className="w-4 h-4" />
                    PDF Complet
                  </button>
                  <button
                    onClick={() => exportToExcel(slots, classes, teachers, subjects, "subject", "")}
                    className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100 flex items-center gap-2 border border-green-200"
                    title="Exporter tout le planning en Excel"
                  >
                    <Table2 className="w-4 h-4" />
                    Excel Complet
                  </button>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a]"
                >
                  <option value="">Toutes les classes</option>
                  {classes.length === 0 ? (
                    <option value="" disabled>Chargement...</option>
                  ) : (
                    classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.level_name ? `(${c.level_name})` : ''}
                      </option>
                    ))
                  )}
                </select>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a]"
                >
                  <option value="">Tous les enseignants</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.full_name || `${t.first_name} ${t.last_name}`}</option>
                  ))}
                </select>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a]"
                >
                  <option value="">Tous les jours</option>
                  {DAYS.map((day, i) => (
                    <option key={i} value={i + 1}>{day}</option>
                  ))}
                </select>
                <button
                  onClick={() => { setSelectedClass(""); setSelectedTeacher(""); setSelectedDay(""); }}
                  className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
                >
                  Réinitialiser
                </button>
              </div>
            </div>

            {viewMode === "grid" ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="px-3 py-3 bg-gray-50 border-b border-r border-gray-200 text-xs font-semibold text-gray-600 w-20">
                          Heure
                        </th>
                        {DAYS.map((day) => (
                          <th key={day} className="px-3 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 min-w-[180px]">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {TIME_SLOTS.map((timeSlot, timeIdx) => (
                        <tr key={timeSlot} className="border-b border-gray-100">
                          <td className="px-3 py-2 bg-gray-50 border-r border-gray-200 text-xs font-medium text-gray-600 text-center">
                            {timeSlot}
                          </td>
                          {DAYS.map((_, dayIdx) => {
                            const daySlots = getSlotsForDayAndTime(dayIdx, timeSlot);
                            return (
                              <td key={dayIdx} className="px-1 py-1 border-r border-gray-100 min-h-[80px] align-top">
                                <div className="space-y-1">
                                  {daySlots.map((slot) => (
                                    <div
                                      key={slot.id}
                                      className={`rounded-lg border p-2 text-xs cursor-pointer hover:shadow-md transition-shadow ${getSubjectColor(slot.subject_name || "")}`}
                                      onClick={() => { setEditingSlot(slot); setShowSlotModal(true); }}
                                    >
                                      <p className="font-semibold truncate">{slot.subject_name}</p>
                                      <p className="truncate opacity-80">{slot.teacher_name}</p>
                                      <p className="truncate opacity-70 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {slot.class_name || "Classe non définie"}
                                      </p>
                                      <p className="truncate opacity-60 text-[10px] flex items-center gap-1">
                                        🚪 {slot.classroom_name || "Salle non attribuée"}
                                      </p>
                                      <div className="flex items-center justify-between mt-1">
                                        <span className="text-[10px] opacity-60">
                                          {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                                        </span>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.id); }}
                                          className="p-0.5 hover:bg-red-100 rounded opacity-0 group-hover:opacity-100"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  {daySlots.length === 0 && (
                                    <div className="h-16 flex items-center justify-center">
                                      <button
                                        onClick={() => {
                                          setEditingSlot({
                                            id: 0,
                                            day_of_week: dayIdx + 1,
                                            start_time: timeSlot,
                                            end_time: `${parseInt(timeSlot.split(":")[0]) + 1}:00`,
                                            subject_id: 0,
                                            teacher_id: 0,
                                            class_id: selectedClass ? parseInt(selectedClass) : 0,
                                          } as TimetableSlot);
                                          setShowSlotModal(true);
                                        }}
                                        className="w-full h-full flex items-center justify-center text-gray-300 hover:text-[#1e3a8a] hover:bg-blue-50 rounded-lg transition-colors"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Jour</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Horaire</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Matière</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Enseignant</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Classe</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Salle</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading ? (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" /> Chargement...
                      </td></tr>
                    ) : slots.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">Aucun créneau</td></tr>
                    ) : (
                      slots.map((slot) => (
                        <tr key={slot.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {DAYS[slot.day_of_week - 1]}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <Clock className="w-3.5 h-3.5 inline mr-1" />
                            {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSubjectColor(slot.subject_name || "")}`}>
                              {slot.subject_name}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{slot.teacher_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{slot.class_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{slot.classroom_name || "-"}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => { setEditingSlot(slot); setShowSlotModal(true); }}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSlot(slot.id)}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === "subjects" && (
          <SubjectsTab 
            subjects={subjects} 
            onRefresh={loadData} 
            onCreate={() => setShowSubjectModal(true)} 
            onEdit={(s) => { setEditingSubject(s); setShowEditSubjectModal(true); }}
            onDelete={(id, name) => handleDeleteSubject(id, name)}
          />
        )}
        {activeTab === "classrooms" && (
          <ClassroomsTab classrooms={classrooms} onRefresh={loadData} onCreate={() => setShowClassroomModal(true)} />
        )}
        {activeTab === "assignments" && (
          <AssignmentsTab classes={classes} teachers={teachers} subjects={subjects} onRefresh={loadData} />
        )}
      </div>

      {showSlotModal && (
        <SlotModal slot={editingSlot} subjects={subjects} teachers={teachers} classes={classes} classrooms={classrooms}
          onClose={() => { setShowSlotModal(false); setEditingSlot(null); }}
          onSuccess={() => { loadData(); setShowSlotModal(false); setEditingSlot(null); }} />
      )}
      {showSubjectModal && (
        <SubjectModal onClose={() => setShowSubjectModal(false)} onSuccess={() => { loadData(); setShowSubjectModal(false); }} />
      )}
      {showClassroomModal && (
        <ClassroomModal onClose={() => setShowClassroomModal(false)} onSuccess={() => { loadData(); setShowClassroomModal(false); }} />
      )}
      {showEditSubjectModal && editingSubject && (
        <EditSubjectModal
          subject={editingSubject}
          onClose={() => { setShowEditSubjectModal(false); setEditingSubject(null); }}
          onSuccess={() => { loadData(); setShowEditSubjectModal(false); setEditingSubject(null); }}
        />
      )}
      {deleteConfirm.show && (
        <DeleteConfirmModal
          title={`Supprimer la matière « ${deleteConfirm.name} » ?`}
          message="Cette action est irréversible. La matière sera désactivée et ne pourra plus être utilisée dans les emplois du temps."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm({ show: false, id: 0, name: '', type: '' })}
        />
      )}
    </div>
  );
}

// ==================== SLOT MODAL ====================
function SlotModal({
  slot, subjects, teachers, classes, classrooms, onClose, onSuccess,
}: {
  slot: TimetableSlot | null;
  subjects: Subject[];
  teachers: Teacher[];
  classes: ClassOption[];
  classrooms: Classroom[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    day_of_week: slot?.day_of_week || 1,
    start_time: slot?.start_time?.slice(0, 5) || "07:30",
    end_time: slot?.end_time?.slice(0, 5) || "08:30",
    subject_id: slot?.subject_id?.toString() || "",
    teacher_id: slot?.teacher_id?.toString() || "",
    class_id: slot?.class_id?.toString() || "",
    classroom_id: slot?.classroom_id?.toString() || "",
    notes: slot?.notes || "",
    academic_year_id: 1,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        day_of_week: parseInt(formData.day_of_week.toString()),
        subject_id: parseInt(formData.subject_id),
        teacher_id: parseInt(formData.teacher_id),
        class_id: parseInt(formData.class_id),
        classroom_id: formData.classroom_id ? parseInt(formData.classroom_id) : null,
        academic_year_id: 1,
      };

      if (slot?.id) {
        await apiService.put(`/timetable/slots/${slot.id}`, payload);
        toast.success("Créneau mis à jour");
      } else {
        await apiService.post('/timetable/slots', payload);
        toast.success("Créneau créé");
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{slot?.id ? "Modifier le Créneau" : "Nouveau Créneau"}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jour *</label>
              <select required value={formData.day_of_week}
                onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a]">
                {DAYS.map((day, i) => <option key={i} value={i + 1}>{day}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Classe *</label>
              <select required value={formData.class_id}
                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a]">
                <option value="">{classes.length === 0 ? 'Chargement...' : 'Sélectionner...'}</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name} {c.level_name ? `(${c.level_name})` : ''}</option>)}
              </select>
              {classes.length === 0 && <p className="text-xs text-red-500 mt-1">Aucune classe chargée</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Début *</label>
              <input type="time" required value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fin *</label>
              <input type="time" required value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a]" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Matière *</label>
              <select required value={formData.subject_id}
                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a]">
                <option value="">Sélectionner...</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Enseignant *</label>
              <select required value={formData.teacher_id}
                onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a]">
                <option value="">Sélectionner...</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name || `${t.first_name} ${t.last_name}`}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salle</label>
            <select value={formData.classroom_id}
              onChange={(e) => setFormData({ ...formData, classroom_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a]">
              <option value="">Non définie</option>
              {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a]" placeholder="Remarques..." />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Annuler</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg text-sm font-medium hover:bg-[#152a5e] disabled:opacity-50 flex items-center gap-2">
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {slot?.id ? "Mettre à jour" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== SUBJECTS TAB ====================
function SubjectsTab({ subjects, onRefresh, onCreate, onEdit, onDelete }: { subjects: Subject[]; onRefresh: () => void; onCreate: () => void; onEdit: (subject: Subject) => void; onDelete: (id: number, name: string) => void }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSubjects = subjects.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (s.name || "").toLowerCase().includes(term) ||
      (s.code || "").toLowerCase().includes(term) ||
      (s.section || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Liste des Matières</h2>
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg hover:bg-[#152a5e] flex items-center gap-2 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nouvelle Matière
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une matière (nom, code, section...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {filteredSubjects.length} matière{filteredSubjects.length > 1 ? 's' : ''} trouvée{filteredSubjects.length > 1 ? 's' : ''} {searchTerm ? `(sur ${subjects.length})` : ''}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Code</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nom</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Section</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Coefficient</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSubjects.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                  {searchTerm ? "Aucune matière ne correspond à votre recherche" : "Aucune matière enregistrée"}
                </td>
              </tr>
            ) : (
              filteredSubjects.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{s.code || "-"}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.section === "FR" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                      {s.section}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <span className="font-semibold text-[#1e3a8a]">{s.coefficient}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => onEdit(s)}
                        className="p-1.5 hover:bg-amber-50 rounded-lg text-gray-500 hover:text-amber-600 transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(s.id, s.name || "")}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ClassroomsTab({ classrooms, onRefresh, onCreate }: { classrooms: Classroom[]; onRefresh: () => void; onCreate: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Liste des Salles</h2>
        <button onClick={onCreate}
          className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg hover:bg-[#152a5e] flex items-center gap-2 text-sm font-medium">
          <Plus className="w-4 h-4" />Nouvelle Salle
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classrooms.map((c) => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{c.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{c.building || "Bâtiment principal"}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#1e3a8a]" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1"><Users className="w-4 h-4" />{c.capacity || "-"} places</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== ASSIGNMENTS TAB ====================
function AssignmentsTab({ classes, teachers, subjects, onRefresh }: {
  classes: ClassOption[]; teachers: Teacher[]; subjects: Subject[]; onRefresh: () => void;
}) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: number; name: string }>({ show: false, id: 0, name: '' });

  useEffect(() => {
    let mounted = true;
    const loadAssignments = async () => {
      try {
        const res: any = await apiService.get('/timetable/assignments');
        const data = Array.isArray(res)
          ? res
          : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.data)
          ? res.data
          : [];
        if (mounted) setAssignments(data);
      } catch (err) {
        console.error('Load assignments error:', err);
        if (mounted) setAssignments([]);
      }
    };
    loadAssignments();
    return () => { mounted = false; };
  }, [onRefresh]);

  const handleDeleteAssignment = (id: number, name: string) => {
    setDeleteConfirm({ show: true, id, name });
  };

  const confirmDeleteAssignment = async () => {
    if (!deleteConfirm.id) return;
    try {
      await apiService.delete(`/timetable/assignments/${deleteConfirm.id}`);
      toast.success("Affectation supprimée");
      setDeleteConfirm({ show: false, id: 0, name: '' });
      // Recharger les assignments
      const res: any = await apiService.get('/timetable/assignments');
      const data = Array.isArray(res)
        ? res
        : Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.data)
        ? res.data
        : [];
      setAssignments(data);
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Erreur lors de la suppression");
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (a.teacher_name || "").toLowerCase().includes(term) ||
      (a.subject_name || "").toLowerCase().includes(term) ||
      (a.class_name || "").toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Affectations Enseignants</h2>
        <button onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg hover:bg-[#152a5e] flex items-center gap-2 text-sm font-medium">
          <Plus className="w-4 h-4" />Nouvelle Affectation
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une affectation (enseignant, matière, classe...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {filteredAssignments.length} affectation{filteredAssignments.length > 1 ? 's' : ''} trouvée{filteredAssignments.length > 1 ? 's' : ''} {searchTerm ? `(sur ${assignments.length})` : ''}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Enseignant</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Matière</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Classe</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Heures</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Principal</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredAssignments.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">Aucune affectation</td></tr>
            ) : (
              filteredAssignments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{a.teacher_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{a.subject_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{a.class_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{a.hours_assigned || "-"}h</td>
                  <td className="px-4 py-3">
                    {a.is_principal_teacher ? <CheckCircle className="w-5 h-5 text-green-500" /> : <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditingAssignment(a); setShowModal(true); }}
                        className="p-1.5 hover:bg-amber-50 rounded-lg text-gray-500 hover:text-amber-600 transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAssignment(a.id, `${a.teacher_name} - ${a.subject_name} (${a.class_name})`)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showModal && (
        <AssignmentModal 
          classes={classes} 
          teachers={teachers} 
          subjects={subjects}
          assignment={editingAssignment}
          onClose={() => { setShowModal(false); setEditingAssignment(null); }} 
          onSuccess={() => { onRefresh(); setShowModal(false); setEditingAssignment(null); }} 
        />
      )}
      {deleteConfirm.show && (
        <DeleteConfirmModal
          title="Supprimer l'affectation"
          message={`Êtes-vous sûr de vouloir supprimer l'affectation « ${deleteConfirm.name} » ? Cette action est irréversible.`}
          onConfirm={confirmDeleteAssignment}
          onCancel={() => setDeleteConfirm({ show: false, id: 0, name: '' })}
        />
      )}
    </div>
  );
}

// ==================== SUBJECT MODAL ====================
function SubjectModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    code: "", label_fr: "", label_en: "", coefficient: 1, section: "FR" as "FR" | "EN",
    is_core: true, max_score: 20,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiService.post('/timetable/subjects', {
        code: formData.code,
        label_fr: formData.label_fr,
        label_en: formData.label_en || formData.label_fr,
        name: formData.label_fr,
        coefficient: formData.coefficient,
        section: formData.section,  // FR ou EN - le backend mappera vers section_id
        is_core: formData.is_core,
        max_score: formData.max_score,
      });
      toast.success("Matière créée"); onSuccess();
    } catch (err: any) { toast.error(err.response?.data?.detail || "Erreur"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Nouvelle Matière</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
              <input required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="MATH" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coefficient</label>
              <input type="number" step="0.5" min="0.5" value={formData.coefficient}
                onChange={(e) => setFormData({ ...formData, coefficient: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom (Français) *</label>
            <input required value={formData.label_fr} onChange={(e) => setFormData({ ...formData, label_fr: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Mathématiques" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom (Anglais)</label>
            <input value={formData.label_en} onChange={(e) => setFormData({ ...formData, label_en: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Mathematics" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value as "FR" | "EN" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="FR">Francophone</option><option value="EN">Anglophone</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_core" checked={formData.is_core}
              onChange={(e) => setFormData({ ...formData, is_core: e.target.checked })} className="w-4 h-4 rounded" />
            <label htmlFor="is_core" className="text-sm text-gray-700">Notée</label>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Annuler</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg text-sm disabled:opacity-50">Créer</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== CLASSROOM MODAL ====================
function ClassroomModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({ name: "", capacity: "", building: "", floor: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiService.post('/timetable/classrooms', {
        ...formData, capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
      });
      toast.success("Salle créée"); onSuccess();
    } catch (err: any) { toast.error(err.response?.data?.detail || "Erreur"); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Nouvelle Salle</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacité</label>
              <input type="number" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Étage</label>
              <input value={formData.floor} onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bâtiment</label>
            <input value={formData.building} onChange={(e) => setFormData({ ...formData, building: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Annuler</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg text-sm disabled:opacity-50">Créer</button>
          </div>
        </form>
      </div>
    </div>
  );
}


// ==================== EDIT SUBJECT MODAL ====================
function EditSubjectModal({
  subject,
  onClose,
  onSuccess,
}: {
  subject: Subject;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    code: subject.code || "",
    label_fr: subject.name || "",
    label_en: subject.label_en || "",
    coefficient: subject.coefficient || 1,
    section: subject.section || "FR",
    is_core: true,
    max_score: 20,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiService.put(`/timetable/subjects/${subject.id}`, {
        code: formData.code,
        label_fr: formData.label_fr,
        label_en: formData.label_en || formData.label_fr,
        name: formData.label_fr,
        coefficient: formData.coefficient,
        section: formData.section,
        is_core: formData.is_core,
        max_score: formData.max_score,
      });
      toast.success("Matière mise à jour");
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Modifier la Matière</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
              <input required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="MATH" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coefficient</label>
              <input type="number" step="0.5" min="0.5" value={formData.coefficient}
                onChange={(e) => setFormData({ ...formData, coefficient: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom (Français) *</label>
            <input required value={formData.label_fr} onChange={(e) => setFormData({ ...formData, label_fr: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Mathématiques" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom (Anglais)</label>
            <input value={formData.label_en} onChange={(e) => setFormData({ ...formData, label_en: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Mathematics" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value as "FR" | "EN" })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="FR">Francophone</option>
              <option value="EN">Anglophone</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="edit_is_core" checked={formData.is_core}
              onChange={(e) => setFormData({ ...formData, is_core: e.target.checked })} className="w-4 h-4 rounded" />
            <label htmlFor="edit_is_core" className="text-sm text-gray-700">Notée</label>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Annuler</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg text-sm disabled:opacity-50">
              {saving ? "Enregistrement..." : "Mettre à jour"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== ASSIGNMENT MODAL ====================
function AssignmentModal({ classes, teachers, subjects, assignment, onClose, onSuccess }: {
  classes: ClassOption[]; teachers: Teacher[]; subjects: Subject[];
  assignment?: any;
  onClose: () => void; onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({ 
    teacher_id: assignment?.teacher_id?.toString() || "", 
    subject_id: assignment?.subject_id?.toString() || "", 
    selected_class_ids: assignment?.class_id ? [assignment.class_id] : [] as number[], 
    hours_assigned: assignment?.hours_assigned?.toString() || "", 
    is_principal: assignment?.is_principal_teacher || false 
  });
  const [saving, setSaving] = useState(false);
  const [saveMode, setSaveMode] = useState<'single' | 'batch'>('single');
  const [showClassList, setShowClassList] = useState(false);

  const toggleClass = (classId: number) => {
    setFormData(prev => ({
      ...prev,
      selected_class_ids: prev.selected_class_ids.includes(classId)
        ? prev.selected_class_ids.filter(id => id !== classId)
        : [...prev.selected_class_ids, classId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.selected_class_ids.length === 0) {
      toast.error("Veuillez sélectionner au moins une classe");
      return;
    }
    setSaving(true);
    try {
      if (assignment?.id) {
        // Mode modification
        await apiService.put(`/timetable/assignments/${assignment.id}`, {
          teacher_id: parseInt(formData.teacher_id), 
          subject_id: parseInt(formData.subject_id),
          class_id: formData.selected_class_ids[0],
          hours_assigned: formData.hours_assigned ? parseFloat(formData.hours_assigned) : undefined,
          is_principal_teacher: formData.is_principal, 
          academic_year_id: 1,
        });
        toast.success("Affectation mise à jour");
      } else if (saveMode === 'batch' && formData.selected_class_ids.length > 1) {
        // Affectation en lot: créer une affectation par classe
        const promises = formData.selected_class_ids.map(classId => 
          apiService.post('/timetable/assignments', {
            teacher_id: parseInt(formData.teacher_id), 
            subject_id: parseInt(formData.subject_id),
            class_id: classId,
            hours_assigned: formData.hours_assigned ? parseFloat(formData.hours_assigned) : undefined,
            is_principal_teacher: formData.is_principal, 
            academic_year_id: 1,
          })
        );
        await Promise.all(promises);
        toast.success(`${formData.selected_class_ids.length} affectations créées`);
      } else {
        // Affectation simple (première classe sélectionnée)
        await apiService.post('/timetable/assignments', {
          teacher_id: parseInt(formData.teacher_id), 
          subject_id: parseInt(formData.subject_id),
          class_id: formData.selected_class_ids[0],
          hours_assigned: formData.hours_assigned ? parseFloat(formData.hours_assigned) : undefined,
          is_principal_teacher: formData.is_principal, 
          academic_year_id: 1,
        });
        toast.success("Affectation créée");
      }
      onSuccess();
    } catch (err: any) { 
      toast.error(err.response?.data?.detail || "Erreur lors de l'enregistrement"); 
    }
    finally { setSaving(false); }
  };

  const selectedClasses = classes.filter(c => formData.selected_class_ids.includes(c.id));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">{assignment?.id ? "Modifier l'Affectation" : "Nouvelle Affectation"}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enseignant *</label>
            <select required value={formData.teacher_id} onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a]">
              <option value="">Sélectionner...</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name || `${t.first_name} ${t.last_name}`}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Matière *</label>
            <select required value={formData.subject_id} onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a]">
              <option value="">Sélectionner...</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Mode d'enregistrement */}
          <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Mode:</span>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input 
                type="radio" 
                name="saveMode" 
                checked={saveMode === 'single'} 
                onChange={() => { setSaveMode('single'); setFormData(prev => ({ ...prev, selected_class_ids: [] })); }}
                className="w-4 h-4 text-[#1e3a8a]"
              />
              Simple (1 classe)
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input 
                type="radio" 
                name="saveMode" 
                checked={saveMode === 'batch'} 
                onChange={() => setSaveMode('batch')}
                className="w-4 h-4 text-[#1e3a8a]"
              />
              Multiple (plusieurs classes)
            </label>
          </div>

          {/* Mode Simple: dropdown classique */}
          {saveMode === 'single' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Classe *</label>
              <select 
                required 
                value={formData.selected_class_ids[0] || ""} 
                onChange={(e) => setFormData({ ...formData, selected_class_ids: e.target.value ? [parseInt(e.target.value)] : [] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a]"
              >
                <option value="">{classes.length === 0 ? 'Chargement...' : 'Sélectionner...'}</option>
                {classes.length > 0 ? (
                  classes.map((c) => <option key={c.id} value={c.id}>{c.name} {c.level_name ? `(${c.level_name})` : ''}</option>)
                ) : (
                  <option value="" disabled>Aucune classe chargée</option>
                )}
              </select>
              {classes.length === 0 && <p className="text-xs text-red-500 mt-1">Aucune classe disponible</p>}
            </div>
          )}

          {/* Mode Multiple: cases à cocher avec section pliable */}
          {saveMode === 'batch' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Classes * 
                <span className="text-xs font-normal text-gray-500 ml-1">
                  ({formData.selected_class_ids.length} sélectionnée{formData.selected_class_ids.length > 1 ? 's' : ''})
                </span>
              </label>

              {/* Bouton plier/déplier */}
              <button
                type="button"
                onClick={() => setShowClassList(!showClassList)}
                className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 transition-colors"
              >
                <span className="text-gray-700">
                  {showClassList ? 'Masquer la liste des classes' : 'Afficher la liste des classes'}
                </span>
                <span className="text-gray-500">
                  {showClassList ? '▲' : '▼'}
                </span>
              </button>

              {/* Liste pliable */}
              {showClassList && (
                <div className="border border-gray-300 rounded-lg p-3 mt-2 max-h-48 overflow-y-auto bg-white">
                  {classes.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Chargement des classes...</p>
                  ) : (
                    <div className="space-y-1">
                      {classes.map((c) => (
                        <label 
                          key={c.id} 
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            formData.selected_class_ids.includes(c.id) 
                              ? 'bg-blue-50 border border-blue-200' 
                              : 'hover:bg-gray-50 border border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.selected_class_ids.includes(c.id)}
                            onChange={() => toggleClass(c.id)}
                            className="w-4 h-4 text-[#1e3a8a] rounded"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-900">{c.name}</span>
                            {c.level_name && <span className="text-xs text-gray-500 ml-2">({c.level_name})</span>}
                          </div>
                          {formData.selected_class_ids.includes(c.id) && (
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tags des classes sélectionnées */}
              {selectedClasses.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedClasses.map(c => (
                    <span key={c.id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {c.name}
                      <button 
                        type="button"
                        onClick={() => toggleClass(c.id)}
                        className="hover:text-blue-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {formData.selected_class_ids.length === 0 && (
                <p className="text-xs text-red-500 mt-1">Veuillez sélectionner au moins une classe</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Heures/semaine</label>
              <input type="number" value={formData.hours_assigned} 
                onChange={(e) => setFormData({ ...formData, hours_assigned: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e3a8a]" 
                placeholder="Ex: 4" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={formData.is_principal} 
              onChange={(e) => setFormData({ ...formData, is_principal: e.target.checked })}
              className="w-4 h-4 rounded" />
            Enseignant principal de la classe
          </label>
        </div>

        {/* Footer fixe avec les boutons */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex items-center justify-end gap-3 flex-shrink-0">
          <button type="button" onClick={onClose} 
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">Annuler</button>
          <button type="submit" disabled={saving || formData.selected_class_ids.length === 0}
            className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg text-sm font-medium hover:bg-[#152a5e] disabled:opacity-50 flex items-center gap-2">
            {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {assignment?.id 
              ? "Mettre à jour" 
              : saveMode === 'batch' && formData.selected_class_ids.length > 1 
              ? `Créer ${formData.selected_class_ids.length} affectations` 
              : "Créer"}
          </button>
        </div>
        </form>
      </div>
    </div>
  );
}

// ==================== DELETE CONFIRM MODAL ====================
function DeleteConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <TriangleAlert className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed ml-[60px]">{message}</p>
        </div>
        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {deleting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {deleting ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}