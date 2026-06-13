import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  BookOpen, Plus, X, Edit2, Trash2, Search, Filter, Download, Upload,
  FileText, ChevronDown, ChevronUp, Trophy, AlertTriangle, CheckCircle,
  Printer, TrendingUp, BarChart3, GraduationCap, Lock, Unlock, Eye, Save,
  RotateCcw, FileDown, Table2, UserCheck, Users, Calendar, Award,
  ArrowUpDown, CheckCircle2, XCircle, Loader2, FileSpreadsheet,
  School, BookMarked, Clock, LayoutList, ArrowLeft, Layers, Pencil
} from "lucide-react";
import { gradesApi, classesApi, subjectsApi, studentsApi, teachersApi, apiService } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { useLang } from "@/hooks/useLang";


// ==================== API RESPONSE HELPER ====================
const extractData = (res: any): any[] => {
  if (Array.isArray(res)) return res;
  if (res && typeof res === 'object') {
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.items)) return res.items;
    if (Array.isArray(res.results)) return res.results;
  }
  return [];
};

const getErrorDetail = (err: any, fallback: string = ''): string => {
  const data = (err as any)?.response?.data as any;
  return data?.detail || data?.message || err?.message || fallback;
};

// ==================== TYPES ====================
interface Grade {
  id: number;
  student_id: number;
  student_name?: string;
  matricule?: string;
  subject_id: number;
  subject_name?: string;
  sequence_id: number;
  sequence_name?: string;
  value: number;
  grade_type: string;
  teacher_name?: string;
  comment?: string;
  appreciation_fr?: string;
  appreciation_en?: string;
  is_validated?: boolean;
}

interface GradeSequence {
  id: number;
  name: string;
  label?: string;
  code?: string;
  start_date: string;
  end_date: string;
  is_open: boolean;
  academic_year_id: number;
  evaluation_period_id?: number;
  max_score?: number;
}

interface EvaluationPeriod {
  id: number;
  code: string;
  label_fr: string;
  label_en: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  sequences?: GradeSequence[];
}

interface Subject {
  id: number;
  name: string;
  label_fr?: string;
  label_en?: string;
  code?: string;
  coefficient: number;
  section?: string;
  specialty_id?: number;
  is_core?: boolean;
}

interface Student {
  id: number;
  matricule: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  class_id?: number;
  class_name?: string;
  gender?: string;
}

interface ClassOption {
  id: number;
  name: string;
  level_name?: string;
  cycle_name?: string;
  student_count?: number;
}

interface TeacherAssignment {
  id: number;
  teacher_id: number;
  subject_id: number;
  class_id: number;
  hours_per_week?: number;
  is_principal_teacher?: boolean;
  subject_name?: string;
  class_name?: string;
}

interface GradeEntry {
  student_id: number;
  value: number | null;
  appreciation: string;
  comment: string;
}

// ==================== HELPER FUNCTIONS ====================

const getSubjectDisplayName = (subject: Subject, lang: 'fr' | 'en'): string => {
  if (lang === 'fr' && subject.label_fr) return subject.label_fr;
  if (lang === 'en' && subject.label_en) return subject.label_en;
  return subject.name || subject.label_fr || subject.label_en || `Matiere #${subject.id}`;
};

const getAppreciation = (value: number | null, lang: 'fr' | 'en' = 'fr'): string => {
  if (value === null || value === undefined || isNaN(value)) return '';
  if (lang === 'fr') {
    if (value >= 18) return 'Excellent';
    if (value >= 16) return 'Tres Bien';
    if (value >= 14) return 'Bien';
    if (value >= 12) return 'Assez Bien';
    if (value >= 10) return 'Passable';
    if (value >= 8) return 'Insuffisant';
    if (value >= 6) return 'Faible';
    return 'Tres Faible';
  } else {
    if (value >= 18) return 'Excellent';
    if (value >= 16) return 'Very Good';
    if (value >= 14) return 'Good';
    if (value >= 12) return 'Fairly Good';
    if (value >= 10) return 'Pass';
    if (value >= 8) return 'Insufficient';
    if (value >= 6) return 'Weak';
    return 'Very Weak';
  }
};

const getAppreciationColor = (value: number | null): string => {
  if (value === null || value === undefined || isNaN(value)) return 'text-gray-400 bg-gray-50';
  if (value >= 16) return 'text-emerald-700 bg-emerald-50';
  if (value >= 14) return 'text-blue-700 bg-blue-50';
  if (value >= 12) return 'text-cyan-700 bg-cyan-50';
  if (value >= 10) return 'text-gray-700 bg-gray-50';
  if (value >= 8) return 'text-orange-700 bg-orange-50';
  return 'text-red-700 bg-red-50';
};

const getAppreciationBadgeColor = (value: number | null): string => {
  if (value === null || value === undefined || isNaN(value)) return 'bg-gray-100 text-gray-500';
  if (value >= 16) return 'bg-emerald-100 text-emerald-700';
  if (value >= 14) return 'bg-blue-100 text-blue-700';
  if (value >= 12) return 'bg-cyan-100 text-cyan-700';
  if (value >= 10) return 'bg-gray-100 text-gray-700';
  if (value >= 8) return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
};

// ==================== MAIN COMPONENT ====================

export default function GradesPage() {
  const { user, role, roleName, isAdmin, isSuperAdmin, hasPermission } = useAuthStore();
  const { lang } = useLang();

  const t = {
    fr: {
      title: 'Saisie des Notes',
      subtitle: 'Entree, modification et gestion des notes des eleves',
      selectClass: 'Selectionner une classe',
      selectSubject: 'Selectionner une matiere',
      selectPeriod: 'Selectionner une periode',
      selectSequence: 'Selectionner une sequence',
      allClasses: 'Toutes les classes',
      allSubjects: 'Toutes les matieres',
      allPeriods: 'Toutes les periodes',
      allSequences: 'Toutes les sequences',
      allStudents: 'Tous les eleves',
      searchStudent: 'Rechercher un eleve...',
      matricule: 'Matricule',
      student: 'Eleve',
      subject: 'Matiere',
      sequence: 'Sequence',
      grade: 'Note',
      appreciation: 'Appreciation',
      comment: 'Commentaire',
      actions: 'Actions',
      save: 'Enregistrer',
      cancel: 'Annuler',
      edit: 'Modifier',
      delete: 'Supprimer',
      validate: 'Valider',
      export: 'Exporter Excel',
      import: 'Importer Excel',
      downloadTemplate: 'Modele Excel',
      entryMode: 'Mode Saisie',
      exitEntryMode: 'Quitter le mode saisie',
      noData: 'Aucune donnee',
      noStudents: 'Aucun eleve trouve',
      noGrades: 'Aucune note enregistree',
      selectFilters: 'Selectionnez une sequence, classe et matiere pour voir les notes',
      loading: 'Chargement...',
      saveSuccess: 'Notes sauvegardees avec succes',
      saveError: 'Erreur lors de la sauvegarde',
      confirmDelete: 'Etes-vous sur de vouloir supprimer cette note ?',
      sequenceOpen: 'Ouverte',
      sequenceClosed: 'Fermee',
      newSequence: 'Nouvelle Sequence',
      sequenceName: 'Nom de la sequence',
      startDate: 'Date de debut',
      endDate: 'Date de fin',
      create: 'Creer',
      period: 'Periode',
      totalStudents: 'eleves',
      gradesEntered: 'notes saisies',
      remaining: 'restantes',
      avg: 'Moy',
      min: 'Min',
      max: 'Max',
      success: 'Succes',
      error: 'Erreur',
      importSuccess: 'Import reussi',
      importError: "Erreur lors de l'import",
      exportSuccess: 'Export reussi',
      fileRequired: 'Veuillez selectionner un fichier',
      invalidFile: 'Fichier invalide',
      dragDrop: 'Glissez-deposez un fichier Excel ici',
      orClick: 'ou cliquez pour selectionner',
      processing: 'Traitement en cours...',
      class: 'Classe',
      refresh: 'Actualiser',
      sequences: 'Sequences',
      showAllStudents: "Afficher tous les eleves de l'etablissement",
      studentCount: 'eleve(s)',
      modifiedGrades: 'notes modifiees',
      editGrade: 'Modifier la note',
      deleteGrade: 'Supprimer la note',
      saveGrade: 'Sauvegarder la note',
      cancelEdit: 'Annuler',
      autoAppreciation: 'Appreciation auto',
      outOf: 'sur',
      gradePlaceholder: '0-20',
      optionalComment: 'Commentaire optionnel...',
      sequencesManagement: 'Gestion des Sequences',
      existingSequences: 'Sequences existantes',
      addSequence: 'Ajouter une sequence',
      sequenceCreated: 'Sequence creee',
      sequenceUpdated: 'Sequence mise a jour',
      sequenceDeleted: 'Sequence supprimee',
      confirmDeleteSequence: 'Supprimer cette sequence ?',
      editSequence: 'Modifier',
      deleteSequence: 'Supprimer',
      close: 'Fermer',
      sequencesTitle: "Sequences d'evaluation",
      subjectsWithoutGrades: 'Matieres sans notes',
      notFilled: 'non remplies',
      complete: 'complet',
      allSubjectsHaveGrades: 'Toutes les matieres ont des notes',
      trimester1: 'Trimestre 1',
      trimester2: 'Trimestre 2',
      trimester3: 'Trimestre 3',
      devoir1: 'Devoir 1',
      composition1: 'Composition 1',
      devoir2: 'Devoir 2',
      composition2: 'Composition 2',
      noSequences: 'Aucune sequence creee',
      createFirstSequence: 'Creez votre premiere sequence',
      sequenceTable: 'Tableau des sequences',
      sequenceDetails: 'Details de la sequence',
      back: 'Retour',
      status: 'Statut',
      open: 'Ouvrir',
      noOpenSequences: 'Aucune sequence ouverte',
      openSequenceRequired: 'Veuillez ouvrir une sequence pour saisir des notes',
      periods: 'Periodes',
      periodName: 'Nom de la periode',
      newPeriod: 'Nouvelle Periode',
      periodCreated: 'Periode creee',
      periodDeleted: 'Periode supprimee',
      confirmDeletePeriod: 'Supprimer cette periode ?',
      code: 'Code',
      order: 'Ordre',
      managePeriods: 'Gerer les periodes',
      manageSequences: 'Gerer les sequences',
    },
    en: {
      title: 'Grade Entry',
      subtitle: 'Entry, modification and management of student grades',
      selectClass: 'Select a class',
      selectSubject: 'Select a subject',
      selectPeriod: 'Select a period',
      selectSequence: 'Select a sequence',
      allClasses: 'All classes',
      allSubjects: 'All subjects',
      allPeriods: 'All periods',
      allSequences: 'All sequences',
      allStudents: 'All students',
      searchStudent: 'Search for a student...',
      matricule: 'ID',
      student: 'Student',
      subject: 'Subject',
      sequence: 'Sequence',
      grade: 'Grade',
      appreciation: 'Appreciation',
      comment: 'Comment',
      actions: 'Actions',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      validate: 'Validate',
      export: 'Export Excel',
      import: 'Import Excel',
      downloadTemplate: 'Excel Template',
      entryMode: 'Entry Mode',
      exitEntryMode: 'Exit Entry Mode',
      noData: 'No data',
      noStudents: 'No students found',
      noGrades: 'No grades recorded',
      selectFilters: 'Select a sequence, class and subject to view grades',
      loading: 'Loading...',
      saveSuccess: 'Grades saved successfully',
      saveError: 'Error saving grades',
      confirmDelete: 'Are you sure you want to delete this grade?',
      sequenceOpen: 'Open',
      sequenceClosed: 'Closed',
      newSequence: 'New Sequence',
      sequenceName: 'Sequence name',
      startDate: 'Start date',
      endDate: 'End date',
      create: 'Create',
      period: 'Period',
      totalStudents: 'students',
      gradesEntered: 'grades entered',
      remaining: 'remaining',
      avg: 'Avg',
      min: 'Min',
      max: 'Max',
      success: 'Success',
      error: 'Error',
      importSuccess: 'Import successful',
      importError: 'Import error',
      exportSuccess: 'Export successful',
      fileRequired: 'Please select a file',
      invalidFile: 'Invalid file',
      dragDrop: 'Drag and drop an Excel file here',
      orClick: 'or click to select',
      processing: 'Processing...',
      class: 'Class',
      refresh: 'Refresh',
      sequences: 'Sequences',
      showAllStudents: 'Show all school students',
      studentCount: 'student(s)',
      modifiedGrades: 'grades modified',
      editGrade: 'Edit grade',
      deleteGrade: 'Delete grade',
      saveGrade: 'Save grade',
      cancelEdit: 'Cancel',
      autoAppreciation: 'Auto appreciation',
      outOf: 'out of',
      gradePlaceholder: '0-20',
      optionalComment: 'Optional comment...',
      sequencesManagement: 'Sequence Management',
      existingSequences: 'Existing sequences',
      addSequence: 'Add sequence',
      sequenceCreated: 'Sequence created',
      sequenceUpdated: 'Sequence updated',
      sequenceDeleted: 'Sequence deleted',
      confirmDeleteSequence: 'Delete this sequence?',
      editSequence: 'Edit',
      deleteSequence: 'Delete',
      close: 'Close',
      sequencesTitle: 'Evaluation Sequences',
      subjectsWithoutGrades: 'Subjects without grades',
      notFilled: 'not filled',
      complete: 'complete',
      allSubjectsHaveGrades: 'All subjects have grades',
      trimester2: 'Term 2',
      trimester3: 'Term 3',
      devoir1: 'Homework 1',
      composition1: 'Exam 1',
      devoir2: 'Homework 2',
      composition2: 'Exam 2',
      noSequences: 'No sequences created',
      createFirstSequence: 'Create your first sequence',
      sequenceTable: 'Sequence table',
      sequenceDetails: 'Sequence details',
      back: 'Back',
      status: 'Status',
      open: 'Open',
      noOpenSequences: 'No open sequence',
      openSequenceRequired: 'Please open a sequence to enter grades',
      periods: 'Periods',
      periodName: 'Period name',
      newPeriod: 'New Period',
      periodCreated: 'Period created',
      periodDeleted: 'Period deleted',
      confirmDeletePeriod: 'Delete this period?',
      code: 'Code',
      order: 'Order',
      managePeriods: 'Manage periods',
      manageSequences: 'Manage sequences',
    }
  }[lang];

  // ==================== STATE ====================
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sequences, setSequences] = useState<GradeSequence[]>([]);
  const [evaluationPeriods, setEvaluationPeriods] = useState<EvaluationPeriod[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filters
  const [selectedSequence, setSelectedSequence] = useState<string>("");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAllStudents, setShowAllStudents] = useState(false);

  // Entry mode
  const [entryMode, setEntryMode] = useState(false);
  const [entryGrades, setEntryGrades] = useState<Record<number, GradeEntry>>({});
  const [editedGrades, setEditedGrades] = useState<Record<number, { value: number; appreciation: string; comment: string }>>({});

  // Modals
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [loadingSubjectsStatus, setLoadingSubjectsStatus] = useState(false);

  // Stats
  const [stats, setStats] = useState({ total: 0, entered: 0, remaining: 0, avg: 0, min: 0, max: 0 });

  // Tri des élèves
  const [sortBy, setSortBy] = useState<'name' | 'grade'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // NOUVEAU: Matieres sans notes
  const [subjectsStatus, setSubjectsStatus] = useState<Array<{
    subject_id: number;
    subject_label: string;
    coefficient: number;
    grade_count: number;
    student_count: number;
    has_grades: boolean;
  }>>([]);
  
  // ==================== ROLE-BASED ACCESS ====================
  const isAdminRole = isAdmin || isSuperAdmin || roleName === 'proviseur';
  const isCenseurRole = roleName === 'censeur' || roleName === 'responsable_pedagogique';
  const isTeacherRole = roleName === 'teacher' || roleName === 'enseignant';
  const canManageSequences = isAdmin || isSuperAdmin || roleName === 'proviseur' || isCenseurRole;

  // CORRECTION: Récupération robuste du teacher_id depuis le user
  const teacherId = useMemo(() => {
    if ((user as any)?.teacher_id) return (user as any).teacher_id;
    if ((user as any)?.teacher?.id) return (user as any).teacher.id;
    if (isTeacherRole && user?.id) return user.id;
    return null;
  }, [user, isTeacherRole]);

  // ==================== DATA LOADING ====================

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      let periodsData: any[] = [];
      try {
        const res = await apiService.get<any>('/grades/periods');
        periodsData = Array.isArray(res) ? res : (extractData(res));
      } catch { periodsData = []; }

      const periods: EvaluationPeriod[] = Array.isArray(periodsData) ? periodsData.map((p: any) => ({
        id: p.id, code: p.code || 'T1', label_fr: p.label_fr || `Trimestre ${p.id}`,
        label_en: p.label_en || `Term ${p.id}`, start_date: p.start_date || '',
        end_date: p.end_date || '', is_active: p.is_active !== false, sequences: []
      })) : [];

      let seqsData: any[] = [];
      try {
        let res: any;
        if (gradesApi.getSequences) { res = await gradesApi.getSequences(); }
        else { res = await apiService.get<any>('/grades/sequences'); }
        seqsData = Array.isArray(res) ? res : (extractData(res));
      } catch { seqsData = []; }

      const seqs: GradeSequence[] = Array.isArray(seqsData) ? seqsData.map((s: any) => ({
        id: s.id, name: s.label || s.name || `Sequence ${s.id}`, label: s.label,
        code: s.code, start_date: s.start_date, end_date: s.end_date,
        is_open: s.is_active !== false, academic_year_id: s.academic_year_id || 1,
        evaluation_period_id: s.evaluation_period_id, max_score: s.max_score || 20
      })) : [];

      periods.forEach(p => { p.sequences = seqs.filter(s => s.evaluation_period_id === p.id); });
      setEvaluationPeriods(periods);
      setSequences(seqs);

      let classesData: any[] = [];
      try {
        let res: any;
        if (classesApi.getAll) { res = await classesApi.getAll(); }
        else { res = await apiService.get<any>('/classes'); }
        classesData = Array.isArray(res) ? res : (extractData(res));
      } catch { classesData = []; }
      setClasses(Array.isArray(classesData) ? classesData : []);

      let allSubjectsData: any[] = [];
      try {
        let res: any;
        if (teachersApi.getSubjects) { res = await teachersApi.getSubjects(); }
        else { res = await apiService.get<any>('/teachers/subjects'); }
        allSubjectsData = Array.isArray(res) ? res : (extractData(res));
      } catch { allSubjectsData = []; }

      const mappedSubjects: Subject[] = Array.isArray(allSubjectsData) ? allSubjectsData.map((s: any) => ({
        id: s.id, name: s.label_fr || s.label_en || s.name || `Matiere #${s.id}`,
        label_fr: s.label_fr, label_en: s.label_en, code: s.code,
        coefficient: s.coefficient || 1, section: s.section,
        specialty_id: s.specialty_id, is_core: s.is_core,
      })) : [];
      setAllSubjects(mappedSubjects);

      if (isTeacherRole && teacherId) {
        let assignData: any[] = [];
        try {
          let res: any;
          if (teachersApi.getAssignments) { res = await teachersApi.getAssignments({ teacher_id: teacherId }); }
          else { res = await apiService.get<any>('/teachers/assignments', { params: { teacher_id: teacherId } }); }
          assignData = Array.isArray(res) ? res : (extractData(res));
        } catch { assignData = []; }
        setTeacherAssignments(Array.isArray(assignData) ? assignData : []);
      }

      if (isAdminRole || isCenseurRole) {
        let allStudentsData: any[] = [];
        try {
          let res: any;
          if (studentsApi.getAll) { res = await studentsApi.getAll(); }
          else { res = await apiService.get<any>('/students'); }
          allStudentsData = Array.isArray(res) ? res : (extractData(res));
        } catch { allStudentsData = []; }
        setAllStudents(Array.isArray(allStudentsData) ? allStudentsData : []);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
      toast.error(t.error);
    } finally { setLoading(false); }
  }, [isTeacherRole, isAdminRole, isCenseurRole, teacherId, lang]);

  const loadStudents = useCallback(async () => {
    if (!selectedClass) {
      if (showAllStudents) { setStudents(allStudents); }
      else { setStudents([]); }
      return;
    }
    try {
      const classId = parseInt(selectedClass);
      let data: any[] = [];
      if (studentsApi.getAll) {
        const res = await studentsApi.getAll({ class_id: classId });
        data = Array.isArray(res) ? res : (extractData(res));
      } else {
        const res = await apiService.get<any>('/students', { params: { class_id: classId } });
        data = Array.isArray(res) ? res : (extractData(res));
      }
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading students:', err);
      setStudents([]);
    }
  }, [selectedClass, showAllStudents, allStudents]);

  // NOUVEAU: Charger le statut des matieres (avec/sans notes)
  const loadSubjectsStatus = useCallback(async () => {
    if (!selectedClass || !selectedSequence) {
      setSubjectsStatus([]);
      return;
    }
    // Accessible uniquement aux admins, proviseur, censeur
    if (!isAdminRole && !isCenseurRole && roleName !== 'proviseur') {
      return;
    }
    setLoadingSubjectsStatus(true);
    try {
      const res = await apiService.get(`/grades/subjects-status`, {
        params: {
          class_id: parseInt(selectedClass),
          sequence_id: parseInt(selectedSequence),
        }
      });
      const data = Array.isArray(res) ? res : (extractData(res));
      setSubjectsStatus(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading subjects status:', err);
    } finally {
      setLoadingSubjectsStatus(false);
    }
  }, [selectedClass, selectedSequence, isAdminRole, isCenseurRole, roleName]);

  // CORRECTION: Suppression du grade_type des params GET pour éviter l'erreur 500
  const loadGrades = useCallback(async () => {
    if (!selectedClass || !selectedSubject || !selectedSequence) {
      setGrades([]);
      return;
    }
    setLoading(true);
    try {
      const params: any = {
        class_id: parseInt(selectedClass),
        subject_id: parseInt(selectedSubject),
        sequence_id: parseInt(selectedSequence),
      };
      // SUPPRESSION: grade_type retiré car cause erreur 500 backend

      let data: any[] = [];
      if (gradesApi.getGrades) {
        const res = await gradesApi.getGrades(params);
        data = Array.isArray(res) ? res : (extractData(res));
      } else {
        const res = await apiService.get<any>('/grades', { params });
        data = Array.isArray(res) ? res : (extractData(res));
      }
      setGrades(Array.isArray(data) ? data : []);

      if (Array.isArray(data) && data.length > 0) {
        const values = data.map((g: any) => g.value || g.score || 0).filter((v: number) => !isNaN(v));
        setStats({
          total: students.length, entered: data.length,
          remaining: Math.max(0, students.length - data.length),
          avg: values.length > 0 ? values.reduce((a: number, b: number) => a + b, 0) / values.length : 0,
          min: values.length > 0 ? Math.min(...values) : 0,
          max: values.length > 0 ? Math.max(...values) : 0,
        });
      } else {
        setStats({ total: students.length, entered: 0, remaining: students.length, avg: 0, min: 0, max: 0 });
      }
    } catch (err: any) {
      console.error('Error loading grades:', err);
      const status = err.response?.status;
      const detail = getErrorDetail(err);
      if (status === 500) {
        toast.error(lang === 'fr' 
          ? `Erreur serveur (500). Détail: ${detail || "GradeResponse schema mismatch - contactez l'admin"}` 
          : `Server error (500). Detail: ${detail || 'GradeResponse schema mismatch'}`);
      }
      setGrades([]);
    } finally { setLoading(false); }
  }, [selectedClass, selectedSubject, selectedSequence, students.length]);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);
  useEffect(() => { loadStudents(); }, [loadStudents]);
  useEffect(() => { loadGrades(); }, [loadGrades]);
  
  const openSequences = useMemo(() => sequences.filter(s => s.is_open), [sequences]);

  const availableSubjects = useMemo(() => {
    if (isAdminRole || isCenseurRole) return allSubjects;
    if (isTeacherRole && teacherAssignments.length > 0) {
      const assignedSubjectIds = [...new Set(teacherAssignments.map(a => a.subject_id))];
      return allSubjects.filter(s => assignedSubjectIds.includes(s.id));
    }
    return allSubjects;
  }, [allSubjects, teacherAssignments, isAdminRole, isCenseurRole, isTeacherRole]);

  const availableClasses = useMemo(() => {
    if (isAdminRole || isCenseurRole) return classes;
    if (isTeacherRole && teacherAssignments.length > 0) {
      const assignedClassIds = [...new Set(teacherAssignments.map(a => a.class_id))];
      return classes.filter(c => assignedClassIds.includes(c.id));
    }
    return classes;
  }, [classes, teacherAssignments, isAdminRole, isTeacherRole, isCenseurRole]);

  const classFilteredSubjects = useMemo(() => {
    if (!selectedClass) return availableSubjects;
    if (isAdminRole || isCenseurRole) return availableSubjects;
    if (isTeacherRole && teacherAssignments.length > 0) {
      const classSubjectIds = teacherAssignments
        .filter(a => a.class_id.toString() === selectedClass)
        .map(a => a.subject_id);
      if (classSubjectIds.length > 0) {
        return availableSubjects.filter(s => classSubjectIds.includes(s.id));
      }
    }
    return availableSubjects;
  }, [availableSubjects, selectedClass, teacherAssignments, isAdminRole, isTeacherRole, isCenseurRole]);

  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(s =>
      (s.first_name?.toLowerCase().includes(q)) ||
      (s.last_name?.toLowerCase().includes(q)) ||
      (s.full_name?.toLowerCase().includes(q)) ||
      (s.matricule?.toLowerCase().includes(q))
    );
  }, [students, searchQuery]);

  const currentSequence = useMemo(() => {
    return sequences.find(s => s.id.toString() === selectedSequence);
  }, [sequences, selectedSequence]);

  // Tri des élèves
  const sortedStudents = useMemo(() => {
    let sorted = [...filteredStudents];
    if (sortBy === 'name') {
      sorted.sort((a, b) => {
        const nameA = (a.full_name || `${a.last_name || ''} ${a.first_name || ''}`).toLowerCase().trim();
        const nameB = (b.full_name || `${b.last_name || ''} ${b.first_name || ''}`).toLowerCase().trim();
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
    } else if (sortBy === 'grade') {
      sorted.sort((a, b) => {
        const gradeA = getExistingGrade(a.id)?.value ?? -1;
        const gradeB = getExistingGrade(b.id)?.value ?? -1;
        return sortOrder === 'asc' ? gradeA - gradeB : gradeB - gradeA;
      });
    }
    return sorted;
  }, [filteredStudents, sortBy, sortOrder, grades]);

  // ==================== HANDLERS ====================

  const handleSort = (field: 'name' | 'grade') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleGradeChange = (studentId: number, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    const appreciation = getAppreciation(numValue, lang);
    setEntryGrades(prev => ({
      ...prev,
      [studentId]: { student_id: studentId, value: numValue, appreciation, comment: prev[studentId]?.comment || '' }
    }));
  };

  const handleCommentChange = (studentId: number, comment: string) => {
    setEntryGrades(prev => ({ ...prev, [studentId]: { ...prev[studentId], student_id: studentId, comment } }));
  };

  const handleEditGrade = (gradeId: number, value: number) => {
    const appreciation = getAppreciation(value, lang);
    setEditedGrades(prev => ({ ...prev, [gradeId]: { value, appreciation, comment: prev[gradeId]?.comment || '' } }));
  };

  // CORRECTION: handleBulkSave avec payload corrigé et meilleure gestion teacher_id
  const handleBulkSave = async () => {
    const entries = Object.values(entryGrades).filter(e => e.value !== null && !isNaN(e.value));
    if (entries.length === 0) {
      toast.error(lang === 'fr' ? 'Aucune note a sauvegarder' : 'No grades to save');
      return;
    }
    if (currentSequence && !currentSequence.is_open) {
      toast.error(lang === 'fr' ? 'Cette sequence est fermee' : 'This sequence is closed');
      return;
    }

    const effectiveTeacherId = teacherId || (user?.id ?? 1);

    setSaving(true);
    try {
      const bulkData = {
        class_id: parseInt(selectedClass),
        subject_id: parseInt(selectedSubject),
        sequence_id: parseInt(selectedSequence),
        academic_year_id: 1,
        teacher_id: effectiveTeacherId,
        grades: entries.map(e => ({
          student_id: e.student_id,
          score: e.value,
          max_score: 20,
          coefficient: 1,
          appreciation_fr: e.appreciation,
          appreciation_en: getAppreciation(e.value, 'en'),
          class_id: parseInt(selectedClass),
          subject_id: parseInt(selectedSubject),
          sequence_id: parseInt(selectedSequence),
          teacher_id: effectiveTeacherId,
          academic_year_id: 1,
        }))
      };

      const res = await apiService.post('/grades/bulk', bulkData);
      const result = (res as any)?.data ?? res;

      const created = (result as any)?.created ?? 0;
      const updated = (result as any)?.updated ?? 0;

      if (created === 0 && updated === 0) {
        toast.warning(lang === 'fr' 
          ? "Aucune note creee/mise à jour. Causes possibles: (1) séquence fermée, (2) note déjà existante sans UPSERT backend, (3) teacher_id invalide." 
          : 'No grades created/updated. Possible causes: (1) sequence closed, (2) grade already exists without backend UPSERT, (3) invalid teacher_id.');
      } else {
        toast.success(`${created} ${lang === 'fr' ? 'creees' : 'created'}, ${updated} ${lang === 'fr' ? 'mises a jour' : 'updated'}`);
      }

      setEntryGrades({});
      setEntryMode(false);
      loadGrades();
    } catch (err: any) {
      const msg = getErrorDetail(err, t.saveError);
      toast.error(msg);
      console.error('Bulk save error:', err);
    } finally { setSaving(false); }
  };

  const handleUpdateGrade = async (gradeId: number) => {
    const edit = editedGrades[gradeId];
    if (!edit) return;
    try {
      await apiService.put(`/grades/${gradeId}`, {
        score: edit.value,
        appreciation_fr: edit.appreciation,
        appreciation_en: getAppreciation(edit.value, 'en'),
      });
      toast.success(t.success);
      setEditedGrades(prev => { const next = { ...prev }; delete next[gradeId]; return next; });
      loadGrades();
    } catch (err: any) {
      toast.error(getErrorDetail(err, t.error));
    }
  };

  const handleDeleteGrade = async (gradeId: number) => {
    try {
      await apiService.delete(`/grades/${gradeId}`);
      toast.success(t.success);
      setShowDeleteConfirm(null);
      loadGrades();
    } catch (err: any) {
      toast.error(getErrorDetail(err, t.error));
    }
  };

  const handleToggleSequence = async (id: number) => {
    try {
      await apiService.patch(`/grades/sequences/${id}/toggle`, {});
      toast.success(lang === 'fr' ? 'Sequence mise a jour' : 'Sequence updated');
      loadInitialData();
    } catch (err) { toast.error(t.error); }
  };

  // ==================== EXPORT/IMPORT ====================

  const handleExportExcel = () => {
    if (!selectedClass || !selectedSubject || !selectedSequence) {
      toast.error(lang === 'fr' ? 'Selectionnez classe, matiere et sequence' : 'Select class, subject and sequence');
      return;
    }
    const subjectObj = classFilteredSubjects.find(s => s.id.toString() === selectedSubject);
    const subjectName = subjectObj ? getSubjectDisplayName(subjectObj, lang) : 'Matiere';
    const className = classes.find(c => c.id.toString() === selectedClass)?.name || 'Classe';
    const sequenceName = sequences.find(s => s.id.toString() === selectedSequence)?.name || 'Sequence';

    const headers = ['Matricule', 'Nom', 'Prenom', 'Note (0-20)', 'Appreciation', 'Commentaire'];
    const rows = filteredStudents.map(s => [s.matricule, s.last_name, s.first_name, '', '', '']);
    const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes_${className}_${subjectName}_${sequenceName}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success(t.exportSuccess);
  };

  // CORRECTION: Import sans grade_type
  const handleImportExcel = async () => {
    if (!importFile) { toast.error(t.fileRequired); return; }
    if (!selectedClass || !selectedSubject || !selectedSequence) {
      toast.error(lang === 'fr' ? "Selectionnez classe, matiere et sequence avant l'import" : 'Select class, subject and sequence before import');
      return;
    }
    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('class_id', selectedClass);
      formData.append('subject_id', selectedSubject);
      formData.append('sequence_id', selectedSequence);
      formData.append('academic_year_id', '1');

      const res = await apiService.post('/grades/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const result = (res as any)?.data ?? res;
      const created = result.created || 0;
      const updated = result.updated || 0;

      if (created === 0 && updated === 0) {
        toast.warning(lang === 'fr' ? 'Aucune note importee' : 'No grades imported');
      } else {
        toast.success(`Import: ${created} ${lang === 'fr' ? 'creees' : 'created'}, ${updated} ${lang === 'fr' ? 'mises a jour' : 'updated'}`);
      }

      setShowImportModal(false);
      setImportFile(null);
      loadGrades();
    } catch (err: any) {
      const status = err.response?.status;
      const msg = getErrorDetail(err, t.importError);
      if (status === 405) {
        toast.error('Erreur 405: Endpoint /grades/import non disponible. Verifiez le backend.');
      } else { toast.error(msg); }
      console.error('Import error:', err);
    } finally { setImportLoading(false); }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setImportFile(file);
    } else { toast.error(t.invalidFile); }
  };

  const getExistingGrade = (studentId: number): Grade | undefined => {
    return grades.find(g => g.student_id === studentId);
  };

  const getEntryValue = (studentId: number): string => {
    const entry = entryGrades[studentId];
    if (entry && entry.value !== null) return entry.value.toString();
    const existing = getExistingGrade(studentId);
    if (existing && !editedGrades[existing.id]) return existing.value?.toString() || '';
    return '';
  };

  const getEntryAppreciation = (studentId: number): string => {
    const entry = entryGrades[studentId];
    if (entry && entry.appreciation) return entry.appreciation;
    const existing = getExistingGrade(studentId);
    if (existing && !editedGrades[existing.id]) return existing.appreciation_fr || existing.appreciation_en || '';
    return '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-[#1e3a8a]" />
              {t.title}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
          </div>
          {canManageSequences && (
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSequenceModal(true)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm font-medium transition-colors">
                <Calendar className="w-4 h-4" />
                {t.sequences}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Sequence Select */}
            <div className="relative">
              <select value={selectedSequence} onChange={(e) => {
                  setSelectedSequence(e.target.value);
                  const seq = sequences.find(s => s.id.toString() === e.target.value);
                  if (seq && seq.evaluation_period_id) { setSelectedPeriod(seq.evaluation_period_id.toString()); }
                  setSelectedClass(''); setSelectedSubject(''); setEntryGrades({}); setGrades([]);
                }}
                className="pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] bg-white min-w-[220px]">
                <option value="">{t.selectSequence}</option>
                {openSequences.length === 0 ? (
                  <option value="" disabled>{t.noOpenSequences}</option>
                ) : (
                  evaluationPeriods.map(period => {
                    const periodOpenSeqs = openSequences.filter(s => s.evaluation_period_id === period.id);
                    if (periodOpenSeqs.length === 0) return null;
                    return (
                      <optgroup key={period.id} label={lang === 'fr' ? period.label_fr : period.label_en}>
                        {periodOpenSeqs.map(seq => (
                          <option key={seq.id} value={seq.id}>{seq.name} {seq.code ? `(${seq.code})` : ''}</option>
                        ))}
                      </optgroup>
                    );
                  })
                )}
              </select>
              <Award className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Class Select */}
            <div className="relative">
              <select value={selectedClass} onChange={(e) => {
                  setSelectedClass(e.target.value); setSelectedSubject(''); setEntryGrades({}); setGrades([]);
                }} disabled={!selectedSequence}
                className="pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] bg-white min-w-[180px] disabled:bg-gray-100 disabled:cursor-not-allowed">
                <option value="">{t.selectClass}</option>
                {availableClasses.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
              <Users className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Subject Select */}
            <div className="relative">
              <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} disabled={!selectedClass}
                className="pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] bg-white min-w-[220px] disabled:bg-gray-100 disabled:cursor-not-allowed">
                <option value="">{t.selectSubject}</option>
                {classFilteredSubjects.map((s) => (
                  <option key={s.id} value={s.id}>{getSubjectDisplayName(s, lang)} {s.coefficient ? `(coef. ${s.coefficient})` : ''}</option>
                ))}
              </select>
              <BookOpen className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* SUPPRESSION: Select Composante (Devoir/Travail) retiré */}

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <input type="text" placeholder={t.searchStudent} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]" />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Action Buttons */}
            {selectedClass && selectedSubject && selectedSequence && (
              <>
                <button onClick={() => {
                    setEntryMode(!entryMode);
                    if (!entryMode) {
                      const initial: Record<number, GradeEntry> = {};
                      sortedStudents.forEach(s => {
                        const existing = getExistingGrade(s.id);
                        if (existing) {
                          initial[s.id] = { student_id: s.id, value: existing.value, appreciation: existing.appreciation_fr || getAppreciation(existing.value, lang), comment: existing.comment || '' };
                        }
                      });
                      setEntryGrades(initial);
                    } else { setEntryGrades({}); }
                  }}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${entryMode ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-[#1e3a8a] text-white hover:bg-[#152a5e]"}`}>
                  {entryMode ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                  {entryMode ? t.exitEntryMode : t.entryMode}
                </button>

                {entryMode && (
                  <button onClick={handleBulkSave} disabled={saving}
                    className="px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 transition-colors">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? t.processing : t.save}
                  </button>
                )}

                <button onClick={handleExportExcel}
                  className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2 transition-colors shadow-sm">
                  <FileDown className="w-4 h-4" />{t.export}
                </button>

                <button onClick={() => setShowImportModal(true)}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-sm">
                  <Upload className="w-4 h-4" />{t.import}
                </button>
              </>
            )}
          </div>

          {/* Stats Bar */}
          {selectedClass && selectedSubject && selectedSequence && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-xs"><Users className="w-3.5 h-3.5 text-gray-400" /><span className="text-gray-600">{stats.total} {t.totalStudents}</span></div>
              <div className="flex items-center gap-1.5 text-xs"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /><span className="text-emerald-600">{stats.entered} {t.gradesEntered}</span></div>
              <div className="flex items-center gap-1.5 text-xs"><XCircle className="w-3.5 h-3.5 text-orange-500" /><span className="text-orange-600">{stats.remaining} {t.remaining}</span></div>
              <div className="flex items-center gap-1.5 text-xs"><TrendingUp className="w-3.5 h-3.5 text-blue-500" /><span className="text-blue-600">{t.avg}: {stats.avg.toFixed(2)}</span></div>
              <div className="flex items-center gap-1.5 text-xs"><ArrowUpDown className="w-3.5 h-3.5 text-purple-500" /><span className="text-purple-600">{t.min}: {stats.min.toFixed(2)} | {t.max}: {stats.max.toFixed(2)}</span></div>
              {currentSequence && (
                <div className={`ml-auto flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${currentSequence.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {currentSequence.is_open ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {currentSequence.is_open ? t.sequenceOpen : t.sequenceClosed}
                </div>
              )}
            </div>
          )}

          {/* Stats supplémentaires - Classes et matières sans notes */}
          {(isAdminRole || isCenseurRole || roleName === 'proviseur') && selectedClass && selectedSequence && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-2">
                  <div className="text-xs text-blue-600 font-medium">{lang === 'fr' ? 'Classe' : 'Class'}</div>
                  <div className="text-sm font-bold text-blue-800">
                    {classes.find(c => c.id.toString() === selectedClass)?.name || '-'}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-2">
                  <div className="text-xs text-purple-600 font-medium">{lang === 'fr' ? 'Séquence' : 'Sequence'}</div>
                  <div className="text-sm font-bold text-purple-800">
                    {sequences.find(s => s.id.toString() === selectedSequence)?.name || '-'}
                  </div>
                </div>
                <div className="bg-amber-50 rounded-lg p-2">
                  <div className="text-xs text-amber-600 font-medium">{lang === 'fr' ? 'Matières sans notes' : 'Subjects without grades'}</div>
                  <div className="text-sm font-bold text-amber-800">
                    {subjectsStatus.filter(s => !s.has_grades).length} / {subjectsStatus.length}
                  </div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-2">
                  <div className="text-xs text-emerald-600 font-medium">{lang === 'fr' ? 'Taux de remplissage' : 'Fill rate'}</div>
                  <div className="text-sm font-bold text-emerald-800">
                    {subjectsStatus.length > 0 ? Math.round((subjectsStatus.filter(s => s.has_grades).length / subjectsStatus.length) * 100) : 0}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* NOUVEAU: Stats matieres - visible pour admin/proviseur/censeur */}
          {(isAdminRole || isCenseurRole || roleName === 'proviseur') && selectedClass && selectedSequence && subjectsStatus.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-semibold text-gray-700">
                    {lang === 'fr' ? 'Matieres sans notes' : 'Subjects without grades'}
                  </span>
                </div>
                {/* Stats */}
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
                    {subjectsStatus.filter(s => !s.has_grades).length} / {subjectsStatus.length} {lang === 'fr' ? 'non remplies' : 'not filled'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {Math.round((subjectsStatus.filter(s => s.has_grades).length / subjectsStatus.length) * 100)}% {lang === 'fr' ? 'complet' : 'complete'}
                  </span>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="w-full h-2 bg-gray-100 rounded-full mb-2 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${(subjectsStatus.filter(s => s.has_grades).length / subjectsStatus.length) * 100}%` }}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {subjectsStatus
                  .filter(s => !s.has_grades)
                  .map(sub => (
                    <button
                      key={sub.subject_id}
                      onClick={() => {
                        setSelectedSubject(sub.subject_id.toString());
                        setGrades([]);
                        setEntryGrades({});
                      }}
                      className="px-2 py-1 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700 hover:bg-amber-100 transition-colors flex items-center gap-1"
                      title={lang === 'fr' ? `Cliquez pour saisir les notes de ${sub.subject_label}` : `Click to enter grades for ${sub.subject_label}`}
                    >
                      <span className="font-medium">{sub.subject_label}</span>
                      <span className="text-amber-500">(coef. {sub.coefficient})</span>
                    </button>
                  ))}
                {subjectsStatus.filter(s => !s.has_grades).length === 0 && (
                  <span className="text-xs text-emerald-600 font-medium">
                    ✓ {lang === 'fr' ? 'Toutes les matieres ont des notes' : 'All subjects have grades'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="showAll" checked={showAllStudents} onChange={(e) => setShowAllStudents(e.target.checked)}
                className="w-4 h-4 text-[#1e3a8a] rounded border-gray-300 focus:ring-[#1e3a8a]" />
              <label htmlFor="showAll" className="text-sm text-gray-700 cursor-pointer">{t.showAllStudents}</label>
            </div>
            <span className="text-xs text-gray-500">{filteredStudents.length} {t.studentCount}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">{t.matricule}</th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      {t.student}
                      {sortBy === 'name' && (
                        <span className="text-[#1e3a8a]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t.class}</th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-28 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                    onClick={() => handleSort('grade')}
                  >
                    <div className="flex items-center gap-1">
                      {t.grade}
                      {sortBy === 'grade' && (
                        <span className="text-[#1e3a8a]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-40">{t.appreciation}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t.comment}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500"><Loader2 className="w-5 h-5 animate-spin" />{t.loading}</div>
                  </td></tr>
                ) : !selectedSequence ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">{t.noOpenSequences}</p><p className="text-xs text-gray-400 mt-1">{t.openSequenceRequired}</p>
                  </td></tr>
                ) : !selectedClass || !selectedSubject ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p className="text-sm">{t.selectFilters}</p>
                  </td></tr>
                ) : sortedStudents.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p className="text-sm">{t.noStudents}</p>
                  </td></tr>
                ) : (
                  sortedStudents.map((student) => {
                    const existingGrade = getExistingGrade(student.id);
                    const editedGrade = existingGrade ? editedGrades[existingGrade.id] : null;
                    return (
                      <tr key={student.id} className={`hover:bg-gray-50 transition-colors ${entryMode ? 'bg-amber-50/30' : ''}`}>
                        <td className="px-4 py-3 text-sm font-mono text-[#1e3a8a] font-medium">{student.matricule}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#1e3a8a]/10 flex items-center justify-center text-xs font-bold text-[#1e3a8a]">
                              {(student.first_name?.[0] || '') + (student.last_name?.[0] || '')}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{student.full_name || `${student.first_name} ${student.last_name}`}</p>
                              {student.gender && (<p className="text-xs text-gray-500">{student.gender === 'M' ? '♂' : '♀'}</p>)}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{student.class_name || classes.find(c => c.id === student.class_id)?.name || '-'}</td>
                        <td className="px-4 py-3">
                          {entryMode ? (
                            <input type="number" min={0} max={20} step={0.25}
                              value={entryGrades[student.id]?.value !== undefined ? entryGrades[student.id]?.value ?? '' : existingGrade?.value ?? ''}
                              onChange={(e) => handleGradeChange(student.id, e.target.value)}
                              className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-center font-bold text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a]"
                              placeholder={t.gradePlaceholder} />
                          ) : existingGrade ? (
                            editedGrade ? (
                              <input type="number" min={0} max={20} step={0.25} value={editedGrade.value}
                                onChange={(e) => handleEditGrade(existingGrade.id, parseFloat(e.target.value))}
                                className="w-24 px-2 py-1.5 border border-gray-300 rounded-lg text-center font-bold text-sm focus:ring-2 focus:ring-[#1e3a8a]" />
                            ) : (
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${getAppreciationBadgeColor(existingGrade.value)}`}>
                                {existingGrade.value?.toFixed(2) ?? '-'}
                              </span>
                            )
                          ) : (<span className="text-sm text-gray-400">-</span>)}
                        </td>
                        <td className="px-4 py-3">
                          {entryMode ? (
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${getAppreciationBadgeColor(entryGrades[student.id]?.value ?? null)}`}>
                              {entryGrades[student.id]?.appreciation || getAppreciation(entryGrades[student.id]?.value ?? null, lang) || '-'}
                            </span>
                          ) : existingGrade ? (
                            editedGrade ? (
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${getAppreciationBadgeColor(editedGrade.value)}`}>{editedGrade.appreciation}</span>
                            ) : (
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${getAppreciationBadgeColor(existingGrade.value)}`}>
                                {existingGrade.appreciation_fr || existingGrade.appreciation_en || getAppreciation(existingGrade.value, lang) || '-'}
                              </span>
                            )
                          ) : (<span className="text-xs text-gray-400">-</span>)}
                        </td>
                        <td className="px-4 py-3">
                          {entryMode ? (
                            <input type="text" value={entryGrades[student.id]?.comment || ''} onChange={(e) => handleCommentChange(student.id, e.target.value)}
                              placeholder={t.optionalComment} className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a]" />
                          ) : existingGrade && editedGrade ? (
                            <input type="text" value={editedGrade.comment}
                              onChange={(e) => setEditedGrades(prev => ({ ...prev, [existingGrade.id]: { ...prev[existingGrade.id], comment: e.target.value } }))}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a]" />
                          ) : (
                            <span className="text-sm text-gray-600 truncate max-w-[200px] block">{existingGrade?.comment || '-'}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {existingGrade && !entryMode && (
                            <div className="flex items-center justify-end gap-1">
                              {editedGrade ? (
                                <>
                                  <button onClick={() => handleUpdateGrade(existingGrade.id)} className="p-1.5 hover:bg-green-50 rounded-lg text-green-600 transition-colors" title={t.save}><Save className="w-4 h-4" /></button>
                                  <button onClick={() => setEditedGrades(prev => { const next = { ...prev }; delete next[existingGrade.id]; return next; })}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title={t.cancel}><X className="w-4 h-4" /></button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => handleEditGrade(existingGrade.id, existingGrade.value || 0)}
                                    className="p-1.5 hover:bg-blue-50 rounded-lg text-[#1e3a8a] transition-colors" title={t.edit}><Edit2 className="w-4 h-4" /></button>
                                  <button onClick={() => setShowDeleteConfirm(existingGrade.id)}
                                    className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors" title={t.delete}><Trash2 className="w-4 h-4" /></button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {entryMode && sortedStudents.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <span className="text-sm text-gray-600">{Object.values(entryGrades).filter(e => e.value !== null && !isNaN(e.value)).length} {t.modifiedGrades}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setEntryGrades({})} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">{t.cancel}</button>
                <button onClick={handleBulkSave} disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 transition-colors">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? t.processing : t.save}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sequence Modal */}
      {showSequenceModal && (
        <SequenceModal sequences={sequences} evaluationPeriods={evaluationPeriods} onClose={() => setShowSequenceModal(false)}
          onToggle={handleToggleSequence} onSuccess={loadInitialData} t={t} lang={lang} />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Upload className="w-5 h-5 text-[#1e3a8a]" />{t.import}</h2>
              <button onClick={() => { setShowImportModal(false); setImportFile(null); }} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div onDragOver={(e) => e.preventDefault()} onDrop={handleFileDrop}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#1e3a8a] hover:bg-blue-50/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById('fileInput')?.click()}>
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm text-gray-600 font-medium">{t.dragDrop}</p>
                <p className="text-xs text-gray-400 mt-1">{t.orClick}</p>
                <input id="fileInput" type="file" accept=".csv,.xlsx,.xls" onChange={(e) => e.target.files?.[0] && setImportFile(e.target.files[0])} className="hidden" />
              </div>

              {importFile && (
                <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{importFile.name}</p>
                    <p className="text-xs text-gray-500">{(importFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={() => setImportFile(null)} className="p-1 hover:bg-blue-100 rounded-lg text-blue-600"><X className="w-4 h-4" /></button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button onClick={handleImportExcel} disabled={!importFile || importLoading}
                  className="flex-1 px-4 py-2.5 bg-[#1e3a8a] text-white rounded-lg text-sm font-medium hover:bg-[#152a5e] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                  {importLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {importLoading ? t.processing : t.import}
                </button>
                <button onClick={() => { setShowImportModal(false); setImportFile(null); }}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">{t.cancel}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
              <h3 className="text-lg font-semibold text-gray-900">{lang === 'fr' ? 'Confirmation' : 'Confirm'}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">{t.confirmDelete}</p>
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">{t.cancel}</button>
              <button onClick={() => handleDeleteGrade(showDeleteConfirm)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">{t.delete}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== SEQUENCE MODAL ====================
function SequenceModal({
  sequences,
  evaluationPeriods,
  onClose,
  onToggle,
  onSuccess,
  t,
  lang,
}: {
  sequences: GradeSequence[];
  evaluationPeriods: EvaluationPeriod[];
  onClose: () => void;
  onToggle: (id: number) => void;
  onSuccess: () => void;
  t: any;
  lang: 'fr' | 'en';
}) {
  const [activeTab, setActiveTab] = useState<'sequences' | 'periods'>('sequences');
  const [seqForm, setSeqForm] = useState({ evaluation_period_id: "", label: "", code: "", start_date: "", end_date: "" });
  const [seqSaving, setSeqSaving] = useState(false);
  const [periodForm, setPeriodForm] = useState({ code: "T1", label_fr: "", label_en: "", start_date: "", end_date: "", order_index: "1" });
  const [periodSaving, setPeriodSaving] = useState(false);
  const [deletePeriodId, setDeletePeriodId] = useState<number | null>(null);
  const [deleteSequenceId, setDeleteSequenceId] = useState<number | null>(null);

  const handleCreateSequence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seqForm.evaluation_period_id) { toast.error(lang === 'fr' ? 'Selectionnez une periode' : 'Select a period'); return; }
    setSeqSaving(true);
    try {
      const sequenceData = {
        evaluation_period_id: parseInt(seqForm.evaluation_period_id),
        code: seqForm.code || seqForm.label?.toUpperCase().replace(/\s+/g, '_').substring(0, 20) || 'SEQ',
        label: seqForm.label,
        start_date: seqForm.start_date,
        end_date: seqForm.end_date,
        max_score: 20,
        weight: 1.0,
        is_active: true,
        order_index: 1,
      };
      await apiService.post('/grades/sequences', sequenceData);
      toast.success(lang === 'fr' ? 'Sequence creee' : 'Sequence created');
      onSuccess();
      setSeqForm({ evaluation_period_id: "", label: "", code: "", start_date: "", end_date: "" });
    } catch (err: any) { toast.error(getErrorDetail(err, t.error)); } finally { setSeqSaving(false); }
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setPeriodSaving(true);
    try {
      const periodData = {
        academic_year_id: 1,
        code: periodForm.code,
        label_fr: periodForm.label_fr,
        label_en: periodForm.label_en || periodForm.label_fr,
        start_date: periodForm.start_date,
        end_date: periodForm.end_date,
        is_active: true,
        order_index: parseInt(periodForm.order_index) || 1,
      };
      await apiService.post('/grades/periods', periodData);
      toast.success(lang === 'fr' ? 'Periode creee' : 'Period created');
      onSuccess();
      setPeriodForm({ code: "T1", label_fr: "", label_en: "", start_date: "", end_date: "", order_index: "1" });
    } catch (err: any) { toast.error(getErrorDetail(err, t.error)); } finally { setPeriodSaving(false); }
  };

  const handleDeletePeriod = async (periodId: number) => {
    try {
      await apiService.delete(`/grades/periods/${periodId}`);
      toast.success(lang === 'fr' ? 'Periode supprimee' : 'Period deleted');
      setDeletePeriodId(null);
      onSuccess();
    } catch (err: any) { toast.error(getErrorDetail(err, t.error)); }
  };

  const handleDeleteSequence = async (sequenceId: number) => {
    try {
      await apiService.delete(`/grades/sequences/${sequenceId}`);
      toast.success(lang === 'fr' ? 'Sequence supprimee' : 'Sequence deleted');
      setDeleteSequenceId(null);
      onSuccess();
    } catch (err: any) { toast.error(getErrorDetail(err, t.error)); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Calendar className="w-5 h-5 text-[#1e3a8a]" />{t.sequencesTitle}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="px-6 pt-4 flex gap-2 border-b border-gray-100">
          <button onClick={() => setActiveTab('sequences')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'sequences' ? 'bg-[#1e3a8a] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t.manageSequences}</button>
          <button onClick={() => setActiveTab('periods')} className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === 'periods' ? 'bg-[#1e3a8a] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t.managePeriods}</button>
        </div>

        <div className="p-6 space-y-6">
          {activeTab === 'sequences' ? (
            <>
              <form onSubmit={handleCreateSequence} className="space-y-4 border-b border-gray-200 pb-6">
                <h3 className="text-sm font-semibold text-gray-900">{t.newSequence}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.period}</label>
                    <select value={seqForm.evaluation_period_id} onChange={(e) => setSeqForm({ ...seqForm, evaluation_period_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a]" required>
                      <option value="">{t.selectPeriod}</option>
                      {evaluationPeriods.map((p) => (<option key={p.id} value={p.id}>{lang === 'fr' ? p.label_fr : p.label_en}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.sequenceName}</label>
                    <input placeholder={t.sequenceName} value={seqForm.label} onChange={(e) => setSeqForm({ ...seqForm, label: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a]" required />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.code}</label>
                    <input placeholder="SEQ1" value={seqForm.code} onChange={(e) => setSeqForm({ ...seqForm, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a]" maxLength={20} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.startDate}</label>
                    <input type="date" value={seqForm.start_date} onChange={(e) => setSeqForm({ ...seqForm, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a]" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.endDate}</label>
                    <input type="date" value={seqForm.end_date} onChange={(e) => setSeqForm({ ...seqForm, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a]" required />
                  </div>
                </div>
                <button type="submit" disabled={seqSaving} className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg text-sm disabled:opacity-50 hover:bg-[#152a5e] transition-colors">{seqSaving ? t.processing : t.create}</button>
              </form>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">{t.existingSequences}</h3>
                {evaluationPeriods.length === 0 ? (
                  <div className="text-center py-8">
                    <Layers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-gray-500">{lang === 'fr' ? 'Aucune periode creee' : 'No periods created'}</p>
                    <p className="text-xs text-gray-400 mt-1">{lang === 'fr' ? "Creez d'abord une periode" : 'Create a period first'}</p>
                  </div>
                ) : (
                  evaluationPeriods.map(period => {
                    const periodSequences = sequences.filter(s => s.evaluation_period_id === period.id);
                    return (
                      <div key={period.id} className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{lang === 'fr' ? period.label_fr : period.label_en}</h4>
                          <span className="text-xs text-gray-400">{periodSequences.length} sequence(s)</span>
                        </div>
                        {periodSequences.length === 0 ? (
                          <p className="text-xs text-gray-400 italic pl-2">{lang === 'fr' ? 'Aucune sequence' : 'No sequences'}</p>
                        ) : (
                          <div className="overflow-x-auto border rounded-lg">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">{t.sequenceName}</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">{t.code}</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">{t.startDate}</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">{t.endDate}</th>
                                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">{t.status}</th>
                                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">{t.actions}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {periodSequences.map((seq) => (
                                  <tr key={seq.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 font-medium">{seq.name}</td>
                                    <td className="px-3 py-2 text-gray-600 font-mono text-xs">{seq.code || '-'}</td>
                                    <td className="px-3 py-2 text-gray-600">{seq.start_date || '-'}</td>
                                    <td className="px-3 py-2 text-gray-600">{seq.end_date || '-'}</td>
                                    <td className="px-3 py-2 text-center">
                                      <button onClick={() => onToggle(seq.id)}
                                        className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${seq.is_open ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"}`}>
                                        {seq.is_open ? t.sequenceOpen : t.sequenceClosed}
                                      </button>
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      <div className="flex items-center justify-end gap-1">
                                        <button onClick={() => onToggle(seq.id)} className="p-1 hover:bg-blue-50 rounded text-blue-600" title={seq.is_open ? t.close : t.open}>
                                          {seq.is_open ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                                        </button>
                                        <button onClick={() => setDeleteSequenceId(seq.id)} className="p-1 hover:bg-red-50 rounded text-red-600" title={t.delete}><Trash2 className="w-3.5 h-3.5" /></button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                {sequences.length === 0 && evaluationPeriods.length > 0 && (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-gray-500">{t.noSequences}</p>
                    <p className="text-xs text-gray-400 mt-1">{t.createFirstSequence}</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <form onSubmit={handleCreatePeriod} className="space-y-4 border-b border-gray-200 pb-6">
                <h3 className="text-sm font-semibold text-gray-900">{t.newPeriod}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.code}</label>
                    <select value={periodForm.code} onChange={(e) => setPeriodForm({ ...periodForm, code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a]" required>
                      <option value="T1">T1 - {lang === 'fr' ? 'Trimestre 1' : 'Term 1'}</option>
                      <option value="T2">T2 - {lang === 'fr' ? 'Trimestre 2' : 'Term 2'}</option>
                      <option value="T3">T3 - {lang === 'fr' ? 'Trimestre 3' : 'Term 3'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.order}</label>
                    <input type="number" min={1} value={periodForm.order_index} onChange={(e) => setPeriodForm({ ...periodForm, order_index: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a]" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.periodName} (FR)</label>
                    <input placeholder={lang === 'fr' ? 'Trimestre 1' : 'Term 1'} value={periodForm.label_fr} onChange={(e) => setPeriodForm({ ...periodForm, label_fr: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a]" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.periodName} (EN)</label>
                    <input placeholder={lang === 'fr' ? 'Term 1' : 'Term 1'} value={periodForm.label_en} onChange={(e) => setPeriodForm({ ...periodForm, label_en: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.startDate}</label>
                    <input type="date" value={periodForm.start_date} onChange={(e) => setPeriodForm({ ...periodForm, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a]" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t.endDate}</label>
                    <input type="date" value={periodForm.end_date} onChange={(e) => setPeriodForm({ ...periodForm, end_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a]" required />
                  </div>
                </div>
                <button type="submit" disabled={periodSaving} className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg text-sm disabled:opacity-50 hover:bg-[#152a5e] transition-colors">{periodSaving ? t.processing : t.create}</button>
              </form>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900">{lang === 'fr' ? 'Periodes existantes' : 'Existing periods'}</h3>
                {evaluationPeriods.length === 0 ? (
                  <div className="text-center py-8">
                    <Layers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-gray-500">{lang === 'fr' ? 'Aucune periode creee' : 'No periods created'}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">{t.code}</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">{t.periodName}</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">{t.startDate}</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">{t.endDate}</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">{t.order}</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">{t.actions}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {evaluationPeriods.map((period) => (
                          <tr key={period.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-mono text-xs text-gray-600">{period.code}</td>
                            <td className="px-3 py-2 font-medium">{lang === 'fr' ? period.label_fr : period.label_en}</td>
                            <td className="px-3 py-2 text-gray-600">{period.start_date || '-'}</td>
                            <td className="px-3 py-2 text-gray-600">{period.end_date || '-'}</td>
                            <td className="px-3 py-2 text-center text-gray-600">{period.id}</td>
                            <td className="px-3 py-2 text-right">
                              <button onClick={() => setDeletePeriodId(period.id)} className="p-1 hover:bg-red-50 rounded text-red-600" title={t.delete}><Trash2 className="w-3.5 h-3.5" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Period Confirmation */}
      {deletePeriodId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
              <h3 className="text-lg font-semibold text-gray-900">{lang === 'fr' ? 'Confirmation' : 'Confirm'}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">{t.confirmDeletePeriod}</p>
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setDeletePeriodId(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">{t.cancel}</button>
              <button onClick={() => handleDeletePeriod(deletePeriodId)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">{t.delete}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Sequence Confirmation */}
      {deleteSequenceId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
              <h3 className="text-lg font-semibold text-gray-900">{lang === 'fr' ? 'Confirmation' : 'Confirm'}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">{t.confirmDeleteSequence}</p>
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setDeleteSequenceId(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">{t.cancel}</button>
              <button onClick={() => handleDeleteSequence(deleteSequenceId)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">{t.delete}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}