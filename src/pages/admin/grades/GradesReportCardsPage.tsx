import React, { useState, useEffect } from "react";
import {
  FileText, Printer, TrendingUp, Loader2, CheckCircle2
} from "lucide-react";
import { gradesApi, apiService } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { useLang } from "@/hooks/useLang";

export default function GradesReportCardsPage() {
  const { user, roleName, isAdmin, isSuperAdmin } = useAuthStore();
  const { lang } = useLang();

  const t = {
    fr: {
      title: 'Bulletins',
      subtitle: 'Génération et impression des bulletins de notes',
      selectClass: 'Sélectionner une classe',
      selectSequence: 'Sélectionner une séquence',
      generateAll: 'Générer tous les bulletins',
      generating: 'Génération en cours...',
      generated: 'Bulletins générés',
      student: 'Élève',
      matricule: 'Matricule',
      average: 'Moyenne',
      actions: 'Actions',
      generate: 'Générer',
      print: 'Imprimer',
      download: 'Télécharger',
      noStudents: 'Aucun élève dans cette classe',
      noData: 'Sélectionnez une classe pour voir les élèves',
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
    },
    en: {
      title: 'Report Cards',
      subtitle: 'Generate and print student report cards',
      selectClass: 'Select a class',
      selectSequence: 'Select a sequence',
      generateAll: 'Generate all report cards',
      generating: 'Generating...',
      generated: 'Report cards generated',
      student: 'Student',
      matricule: 'ID',
      average: 'Average',
      actions: 'Actions',
      generate: 'Generate',
      print: 'Print',
      download: 'Download',
      noStudents: 'No students in this class',
      noData: 'Select a class to see students',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
    }
  }[lang];

  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSequence, setSelectedSequence] = useState<string>("");
  const [classes, setClasses] = useState<any[]>([]);
  const [sequences, setSequences] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<Record<number, boolean>>({});
  const [generated, setGenerated] = useState<Record<number, boolean>>({});

  const isAdminRole = isAdmin || isSuperAdmin || roleName === 'proviseur' || roleName === 'censeur';

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [classesRes, seqRes] = await Promise.all([
          apiService.get('/classes').catch(() => ({ data: [] })),
          apiService.get('/grades/sequences').catch(() => ({ data: [] })),
        ]);
        setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
        setSequences(Array.isArray(seqRes.data) ? seqRes.data : []);
      } catch (e) { console.error(e); }
    };
    loadFilters();
  }, []);

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClass) {
        setStudents([]);
        return;
      }
      setLoading(true);
      try {
        const res = await apiService.get('/students', {
          params: { class_id: parseInt(selectedClass), per_page: 100 }
        }).catch(() => ({ data: [] }));
        const data = res?.data?.data || res?.data || res || [];
        setStudents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, [selectedClass]);

  const handleGenerateBulletin = async (studentId: number) => {
    setGenerating(prev => ({ ...prev, [studentId]: true }));
    try {
      const response = await gradesApi.generateBulletin?.(studentId, {
        sequence_id: selectedSequence ? parseInt(selectedSequence) : undefined,
        academic_year_id: 1,
      }) || apiService.get(`/grades/bulletin/${studentId}`, {
        params: { sequence_id: selectedSequence ? parseInt(selectedSequence) : undefined, academic_year_id: 1 },
        responseType: 'blob'
      });
      let blob: Blob;
      if (response && (response as any).data) blob = (response as any).data as Blob;
      else blob = response as Blob;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bulletin_${studentId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      setGenerated(prev => ({ ...prev, [studentId]: true }));
      toast.success(t.success);
    } catch (err) {
      toast.error(t.error);
    } finally {
      setGenerating(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const handleGenerateAll = async () => {
    if (!students.length) return;
    toast.info(lang === 'fr' ? 'Génération de tous les bulletins...' : 'Generating all report cards...');
    for (const student of students) {
      await handleGenerateBulletin(student.id);
    }
    toast.success(t.generated);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-7 h-7 text-[#1e3a8a]" />
          {t.title}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-wrap items-center gap-3">
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] min-w-[180px]"
        >
          <option value="">{t.selectClass}</option>
          {classes.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={selectedSequence}
          onChange={(e) => setSelectedSequence(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] min-w-[180px]"
        >
          <option value="">{t.selectSequence}</option>
          {sequences.map((s: any) => (
            <option key={s.id} value={s.id}>{s.label || s.name}</option>
          ))}
        </select>
        {selectedClass && students.length > 0 && (
          <button
            onClick={handleGenerateAll}
            className="px-4 py-2 bg-[#1e3a8a] text-white rounded-lg text-sm font-medium hover:bg-[#152a5e] flex items-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            {t.generateAll}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">{t.loading}</span>
        </div>
      ) : !selectedClass ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">{t.noData}</p>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">{t.noStudents}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t.matricule}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t.student}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t.average}</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-[#1e3a8a]">{student.matricule}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#1e3a8a]/10 flex items-center justify-center text-xs font-bold text-[#1e3a8a]">
                          {(student.first_name?.[0] || '') + (student.last_name?.[0] || '')}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {student.full_name || `${student.first_name} ${student.last_name}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">-</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {generated[student.id] && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                        <button
                          onClick={() => handleGenerateBulletin(student.id)}
                          disabled={generating[student.id]}
                          className="px-3 py-1.5 bg-[#1e3a8a] text-white rounded-lg text-xs font-medium hover:bg-[#152a5e] disabled:opacity-50 flex items-center gap-1.5 transition-colors"
                        >
                          {generating[student.id] ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <FileText className="w-3 h-3" />
                          )}
                          {generating[student.id] ? t.generating : t.generate}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}