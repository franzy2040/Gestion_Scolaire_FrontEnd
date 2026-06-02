import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen, Plus, X, Edit2, Trash2, Search, Filter, Download,
  FileText, ChevronDown, ChevronUp, Trophy, AlertTriangle,
  CheckCircle, Printer, TrendingUp, BarChart3, GraduationCap,
  Lock, Unlock, Eye, Save, RotateCcw
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { gradesApi, classesApi, subjectsApi, studentsApi } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

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
}

interface GradeSequence {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_open: boolean;
  academic_year_id: number;
}

interface Subject {
  id: number;
  name: string;
  coefficient: number;
  section: "FR" | "EN";
}

interface Student {
  id: number;
  matricule: string;
  first_name: string;
  last_name: string;
  full_name?: string;
}

interface ClassOption {
  id: number;
  name: string;
}

interface RankingStudent {
  student_id: number;
  student_name: string;
  matricule: string;
  average: number;
  rank: number;
  appreciation: string;
  subject_grades: Array<{ subject: string; value: number; coefficient: number }>;
}

interface HonorBoard {
  felicitations: Array<{ id: number; name: string; matricule: string; class_name: string; average: number }>;
  encouragements: Array<{ id: number; name: string; matricule: string; class_name: string; average: number }>;
  tableau_honneur: Array<{ id: number; name: string; matricule: string; class_name: string; average: number }>;
  avertissements: Array<{ id: number; name: string; matricule: string; class_name: string; average: number }>;
  blames: Array<{ id: number; name: string; matricule: string; class_name: string; average: number }>;
}

export default function GradesPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"entry" | "averages" | "ranking" | "bulletins" | "honor">("entry");
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sequences, setSequences] = useState<GradeSequence[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedSequence, setSelectedSequence] = useState<string>("");

  // Data views
  const [rankings, setRankings] = useState<RankingStudent[]>([]);
  const [honorBoard, setHonorBoard] = useState<HonorBoard | null>(null);
  const [classAverage, setClassAverage] = useState<any>(null);

  // Entry mode
  const [entryMode, setEntryMode] = useState(false);
  const [entryGrades, setEntryGrades] = useState<Record<number, number>>({});

  // Modals
  const [showSequenceModal, setShowSequenceModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [gradesRes, sequencesRes, subjectsRes, classesRes] = await Promise.all([
        gradesApi.getGrades({
          class_id: selectedClass || undefined,
          subject_id: selectedSubject || undefined,
          sequence_id: selectedSequence || undefined,
        }),
        gradesApi.getSequences(),
        subjectsApi.getAll(),
        classesApi.getAll(),
      ]);
      setGrades(gradesRes?.data || []);
      setSequences(sequencesRes?.data || []);
      setSubjects(subjectsRes?.data || []);
      setClasses(classesRes?.data || []);

      // Load students if class selected
      if (selectedClass) {
        const studentsRes = await studentsApi.getAll({ class_id: selectedClass ? parseInt(selectedClass) : undefined, per_page: 100 });
        setStudents(studentsRes?.data?.data || studentsRes?.data || []);
      }
    } catch (err) {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedSubject, selectedSequence]);

  const loadRankings = useCallback(async () => {
    if (!selectedClass) return;
    try {
      const res = await gradesApi.getClassRanking(parseInt(selectedClass), {
        sequence_id: selectedSequence ? parseInt(selectedSequence) : undefined,
      });
      setRankings(res?.data || []);
    } catch (err) {
      console.error(err);
    }
  }, [selectedClass, selectedSequence]);

  const loadHonorBoard = useCallback(async () => {
    try {
      const res = await gradesApi.getHonorBoard({
        class_id: selectedClass ? parseInt(selectedClass) : undefined,
        sequence_id: selectedSequence ? parseInt(selectedSequence) : undefined,
      });
      setHonorBoard(res?.data || null);
    } catch (err) {
      console.error(err);
    }
  }, [selectedClass, selectedSequence]);

  const loadClassAverage = useCallback(async () => {
    if (!selectedClass) return;
    try {
      const res = await gradesApi.getClassAverage(parseInt(selectedClass), {
        sequence_id: selectedSequence ? parseInt(selectedSequence) : undefined,
      });
      setClassAverage(res?.data || null);
    } catch (err) {
      console.error(err);
    }
  }, [selectedClass, selectedSequence]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === "ranking") loadRankings();
    if (activeTab === "honor") loadHonorBoard();
    if (activeTab === "averages") loadClassAverage();
  }, [activeTab, loadRankings, loadHonorBoard, loadClassAverage]);

  const handleToggleSequence = async (id: number) => {
    try {
      await gradesApi.toggleSequence(id);
      toast.success("Séquence mise à jour");
      loadData();
    } catch (err) {
      toast.error("Erreur");
    }
  };

  const handleBulkSave = async () => {
    const entries = Object.entries(entryGrades).filter(([_, v]) => v !== undefined && v !== null);
    if (entries.length === 0) {
      toast.error("Aucune note à sauvegarder");
      return;
    }

    try {
      for (const [studentId, value] of entries) {
        await gradesApi.createGrade({
          student_id: parseInt(studentId),
          subject_id: parseInt(selectedSubject),
          sequence_id: parseInt(selectedSequence),
          academic_year_id: 1,
          value: value,
          grade_type: "devoir",
        });
      }
      toast.success(`${entries.length} note(s) enregistrée(s)`);
      setEntryGrades({});
      setEntryMode(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Erreur lors de la sauvegarde");
    }
  };

  const handleGenerateBulletin = async (studentId: number) => {
    try {
      const response = await gradesApi.generateBulletin(studentId, {
        sequence_id: selectedSequence ? parseInt(selectedSequence) : undefined,
        academic_year_id: 1,
      });
      //const blob = new Blob([response.data], { type: 'application/pdf' });
      const blob = await gradesApi.generateBulletin(studentId, {
        sequence_id: selectedSequence ? parseInt(selectedSequence) : undefined,
        academic_year_id: 1,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bulletin_${studentId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Bulletin généré");
    } catch (err) {
      toast.error("Erreur lors de la génération");
    }
  };

  const getAppreciationColor = (avg: number) => {
    if (avg >= 16) return "text-emerald-600 bg-emerald-50";
    if (avg >= 14) return "text-blue-600 bg-blue-50";
    if (avg >= 12) return "text-cyan-600 bg-cyan-50";
    if (avg >= 10) return "text-gray-600 bg-gray-50";
    if (avg >= 8) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-[#1e3a8a]" />
              Gestion des Notes
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Saisie, calcul automatique et bulletins
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSequenceModal(true)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm font-medium"
            >
              <Lock className="w-4 h-4" />
              Séquences
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mt-4 border-b border-gray-200">
          {[
            { id: "entry", label: "Saisie des Notes", icon: Edit2 },
            { id: "averages", label: "Moyennes", icon: BarChart3 },
            { id: "ranking", label: "Classement", icon: TrendingUp },
            { id: "bulletins", label: "Bulletins", icon: FileText },
            { id: "honor", label: "Tableau d'Honneur", icon: Trophy },
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
        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a]"
            >
              <option value="">Sélectionner une classe</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a]"
            >
              <option value="">Matière</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select
              value={selectedSequence}
              onChange={(e) => setSelectedSequence(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a]"
            >
              <option value="">Séquence</option>
              {sequences.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.is_open ? "(Ouverte)" : "(Fermée)"}
                </option>
              ))}
            </select>

            {activeTab === "entry" && selectedClass && selectedSubject && selectedSequence && (
              <button
                onClick={() => setEntryMode(!entryMode)}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  entryMode
                    ? "bg-amber-100 text-amber-700"
                    : "bg-[#1e3a8a] text-white hover:bg-[#152a5e]"
                }`}
              >
                {entryMode ? <RotateCcw className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                {entryMode ? "Annuler" : "Mode Saisie"}
              </button>
            )}

            {entryMode && (
              <button
                onClick={handleBulkSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Sauvegarder
              </button>
            )}
          </div>
        </div>

        {/* TAB: ENTRY */}
        {activeTab === "entry" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Matricule</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Élève</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Matière</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Séquence</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Note</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Appréciation</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center">Chargement...</td></tr>
                ) : grades.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      {selectedClass && selectedSubject && selectedSequence
                        ? "Aucune note. Activez le mode saisie pour entrer les notes."
                        : "Sélectionnez une classe, matière et séquence"}
                    </td>
                  </tr>
                ) : (
                  grades.map((grade) => {
                    const appreciation = grade.value >= 16 ? "Excellent" :
                      grade.value >= 14 ? "Très bien" :
                      grade.value >= 12 ? "Bien" :
                      grade.value >= 10 ? "Passable" :
                      grade.value >= 8 ? "Insuffisant" : "Faible";

                    return (
                      <tr key={grade.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono text-[#1e3a8a]">{grade.matricule}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{grade.student_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{grade.subject_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{grade.sequence_name}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold ${
                            grade.value >= 10 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          }`}>
                            {grade.value.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{appreciation}</td>
                        <td className="px-4 py-3 text-right">
                          <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* Entry Mode Rows */}
                {entryMode && students.map((student) => {
                  const existingGrade = grades.find((g) => g.student_id === student.id);
                  return (
                    <tr key={`entry-${student.id}`} className="bg-amber-50">
                      <td className="px-4 py-3 text-sm font-mono text-[#1e3a8a]">{student.matricule}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.full_name || `${student.first_name} ${student.last_name}`}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {subjects.find((s) => s.id === parseInt(selectedSubject))?.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {sequences.find((s) => s.id === parseInt(selectedSequence))?.name}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={0}
                          max={20}
                          step={0.25}
                          defaultValue={existingGrade?.value || ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setEntryGrades((prev) => ({ ...prev, [student.id]: val }));
                          }}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-center font-bold"
                        />
                      </td>
                      <td colSpan={2} />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: AVERAGES */}
        {activeTab === "averages" && classAverage && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Moyenne Générale de la Classe</h3>
                <div className="text-right">
                  <p className="text-3xl font-bold text-[#1e3a8a]">{(classAverage.general_average ?? 0).toFixed(2)}</p>
                  <p className="text-sm text-gray-500">/ 20</p>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classAverage.subject_averages || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="subject_name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                    <YAxis domain={[0, 20]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="average" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Matière</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Coefficient</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Moyenne</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Élèves</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classAverage.subject_averages?.map((subj: any) => (
                    <tr key={subj.subject_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{subj.subject_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{subj.coefficient}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          (subj.average ?? 0) >= 10 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {(subj.average ?? 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{subj.students_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: RANKING */}
        {activeTab === "ranking" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rang</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Matricule</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Élève</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Moyenne</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Appréciation</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rankings.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">Sélectionnez une classe</td></tr>
                ) : (
                  rankings.map((student) => (
                    <tr key={student.student_id} className={`hover:bg-gray-50 ${student.rank <= 3 ? "bg-yellow-50/50" : ""}`}>
                      <td className="px-4 py-3">
                        {student.rank === 1 && <Trophy className="w-5 h-5 text-yellow-500" />}
                        {student.rank === 2 && <span className="text-lg font-bold text-gray-400">2</span>}
                        {student.rank === 3 && <span className="text-lg font-bold text-amber-600">3</span>}
                        {student.rank > 3 && <span className="text-sm text-gray-500">{student.rank}</span>}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-[#1e3a8a]">{student.matricule}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.student_name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-sm font-bold ${getAppreciationColor(student.average)}`}>
                          {student.average.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{student.appreciation}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleGenerateBulletin(student.student_id)}
                          className="p-1.5 hover:bg-blue-50 rounded-lg text-[#1e3a8a]"
                          title="Générer bulletin"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: BULLETINS */}
        {activeTab === "bulletins" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">Génération de Bulletins</h3>
            <p className="text-gray-500 mt-1 mb-4">
              Sélectionnez une classe et une séquence, puis allez dans l'onglet "Classement" pour générer les bulletins individuels.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setActiveTab("ranking")}
                className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg text-sm font-medium hover:bg-[#152a5e]"
              >
                Aller au Classement
              </button>
            </div>
          </div>
        )}

        {/* TAB: HONOR BOARD */}
        {activeTab === "honor" && honorBoard && (
          <div className="space-y-6">
            {/* Félicitations */}
            {honorBoard.felicitations.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-emerald-700 flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5" />
                  Félicitations (Moyenne ≥ 16)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {honorBoard.felicitations.map((s) => (
                    <div key={s.id} className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-sm text-gray-500">{s.matricule} — {s.class_name}</p>
                      <p className="text-lg font-bold text-emerald-600 mt-1">{s.average.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Encouragements */}
            {honorBoard.encouragements.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-blue-700 flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5" />
                  Encouragements (Moyenne ≥ 14)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {honorBoard.encouragements.map((s) => (
                    <div key={s.id} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-sm text-gray-500">{s.matricule} — {s.class_name}</p>
                      <p className="text-lg font-bold text-blue-600 mt-1">{s.average.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tableau d'honneur */}
            {honorBoard.tableau_honneur.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-cyan-700 flex items-center gap-2 mb-4">
                  <GraduationCap className="w-5 h-5" />
                  Tableau d'Honneur (Moyenne ≥ 12)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {honorBoard.tableau_honneur.map((s) => (
                    <div key={s.id} className="bg-cyan-50 rounded-lg p-3 border border-cyan-200">
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-sm text-gray-500">{s.matricule} — {s.class_name}</p>
                      <p className="text-lg font-bold text-cyan-600 mt-1">{s.average.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Avertissements */}
            {honorBoard.avertissements.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-orange-700 flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5" />
                  Avertissements (Moyenne 8-10)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {honorBoard.avertissements.map((s) => (
                    <div key={s.id} className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-sm text-gray-500">{s.matricule} — {s.class_name}</p>
                      <p className="text-lg font-bold text-orange-600 mt-1">{s.average.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Blâmes */}
            {honorBoard.blames.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-red-700 flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5" />
                  {"Blâmes (Moyenne < 8)"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {honorBoard.blames.map((s) => (
                    <div key={s.id} className="bg-red-50 rounded-lg p-3 border border-red-200">
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-sm text-gray-500">{s.matricule} — {s.class_name}</p>
                      <p className="text-lg font-bold text-red-600 mt-1">{s.average.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sequence Modal */}
      {showSequenceModal && (
        <SequenceModal
          sequences={sequences}
          onClose={() => setShowSequenceModal(false)}
          onToggle={handleToggleSequence}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}

// ==================== SEQUENCE MODAL ====================
function SequenceModal({
  sequences,
  onClose,
  onToggle,
  onSuccess,
}: {
  sequences: GradeSequence[];
  onClose: () => void;
  onToggle: (id: number) => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({ name: "", start_date: "", end_date: "", description: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await gradesApi.createSequence({
        ...formData,
        academic_year_id: 1,
        is_open: true,
      });
      toast.success("Séquence créée");
      onSuccess();
      setFormData({ name: "", start_date: "", end_date: "", description: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Erreur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Gestion des Séquences</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3 border-b border-gray-200 pb-4">
            <h3 className="text-sm font-medium text-gray-700">Nouvelle Séquence</h3>
            <input
              placeholder="Nom (ex: Séquence 1)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                placeholder="Date début"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="date"
                placeholder="Date fin"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg text-sm disabled:opacity-50"
            >
              {saving ? "Création..." : "Créer"}
            </button>
          </form>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Séquences existantes</h3>
            {sequences.map((seq) => (
              <div key={seq.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div>
                  <p className="font-medium text-sm">{seq.name}</p>
                  <p className="text-xs text-gray-500">{seq.start_date} → {seq.end_date}</p>
                </div>
                <button
                  onClick={() => onToggle(seq.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    seq.is_open
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-red-100 text-red-700 hover:bg-red-200"
                  }`}
                >
                  {seq.is_open ? (
                    <span className="flex items-center gap-1"><Unlock className="w-3 h-3" /> Ouverte</span>
                  ) : (
                    <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Fermée</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}