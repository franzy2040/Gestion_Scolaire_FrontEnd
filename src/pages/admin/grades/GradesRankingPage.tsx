import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, RotateCcw, Loader2, Trophy, FileText, Users, Calendar, Award
} from "lucide-react";
import { gradesApi, apiService, classesApi } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { useLang } from "@/hooks/useLang";

// ==================== TYPES ====================
interface RankingStudent {
  student_id: number;
  student_name: string;
  matricule: string;
  average: number;
  rank: number;
  appreciation: string;
  subject_grades: Array<{ subject: string; value: number; coefficient: number }>;
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

interface ClassOption {
  id: number;
  name: string;
  level_name?: string;
  cycle_name?: string;
  student_count?: number;
}

// ==================== HELPER ====================
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
export default function GradesRankingPage() {
  const { lang } = useLang();
  const { isAdmin, isSuperAdmin, roleName } = useAuthStore();
  const isAdminRole = isAdmin || isSuperAdmin || roleName === 'proviseur' || roleName === 'censeur';

  const t = {
    fr: {
      title: 'Classement des Élèves',
      subtitle: 'Rang et moyennes par classe et séquence',
      selectClass: 'Sélectionner une classe',
      selectSequence: 'Séquence (optionnel)',
      allClasses: 'Toutes les classes',
      allSequences: 'Toutes les séquences',
      matricule: 'Matricule',
      student: 'Élève',
      avg: 'Moy',
      appreciation: 'Appréciation',
      actions: 'Actions',
      generateBulletin: 'Générer le bulletin',
      rankingTitle: 'Classement des Élèves',
      refresh: 'Actualiser',
      loading: 'Chargement...',
      noData: 'Aucune donnée',
      selectFilters: 'Sélectionnez une classe pour voir le classement',
      error: 'Erreur',
      success: 'Succès',
      rank: 'Rang',
    },
    en: {
      title: 'Student Ranking',
      subtitle: 'Rank and averages by class and sequence',
      selectClass: 'Select a class',
      selectSequence: 'Sequence (optional)',
      allClasses: 'All classes',
      allSequences: 'All sequences',
      matricule: 'ID',
      student: 'Student',
      avg: 'Avg',
      appreciation: 'Appreciation',
      actions: 'Actions',
      generateBulletin: 'Generate report card',
      rankingTitle: 'Student Ranking',
      refresh: 'Refresh',
      loading: 'Loading...',
      noData: 'No data',
      selectFilters: 'Select a class to view ranking',
      error: 'Error',
      success: 'Success',
      rank: 'Rank',
    }
  }[lang];

  // ==================== STATE ====================
  const [rankings, setRankings] = useState<RankingStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSequence, setSelectedSequence] = useState<string>("");
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [sequences, setSequences] = useState<GradeSequence[]>([]);

  // ==================== DATA LOADING ====================

  const loadFilters = useCallback(async () => {
    try {
      const [classesRes, seqRes] = await Promise.all([
        classesApi.getAll?.() || apiService.get('/classes').catch(() => ({ data: [] })),
        apiService.get('/grades/sequences').catch(() => ({ data: [] })),
      ]) as any[];
      setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
      setSequences(Array.isArray(seqRes.data) ? seqRes.data : []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadRankings = useCallback(async () => {
    if (!selectedClass) {
      setRankings([]);
      return;
    }
    setLoading(true);
    try {
      const res = await gradesApi.getClassRanking?.(parseInt(selectedClass), {
        sequence_id: selectedSequence ? parseInt(selectedSequence) : undefined,
      }).catch(() => ({ data: [] })) || 
        apiService.get(`/grades/ranking/${selectedClass}`, {
          params: { sequence_id: selectedSequence ? parseInt(selectedSequence) : undefined }
        }).catch(() => ({ data: [] }));
      setRankings(res?.data || []);
    } catch (err) {
      console.error(err);
      toast.error(t.error);
      setRankings([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedSequence]);

  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  useEffect(() => {
    loadRankings();
  }, [loadRankings]);

  // ==================== HANDLERS ====================

  const handleGenerateBulletin = async (studentId: number) => {
    try {
      const response = await gradesApi.generateBulletin?.(studentId, {
        sequence_id: selectedSequence ? parseInt(selectedSequence) : undefined,
        academic_year_id: 1,
      }) || apiService.get(`/grades/bulletin/${studentId}`, {
        params: {
          sequence_id: selectedSequence ? parseInt(selectedSequence) : undefined,
          academic_year_id: 1,
        },
        responseType: 'blob'
      });

      const resData = (response && (response as any).data !== undefined) ? (response as any).data : response;
      const blob = resData instanceof Blob ? resData : new Blob([resData], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bulletin_${studentId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(lang === 'fr' ? 'Bulletin généré' : 'Report card generated');
    } catch (err) {
      toast.error(lang === 'fr' ? 'Erreur lors de la génération' : 'Generation error');
    }
  };

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-[#1e3a8a]" />
          {t.title}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Select */}
          <div className="relative">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] bg-white min-w-[180px]"
            >
              <option value="">{t.selectClass}</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <Users className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Sequence Select */}
          <div className="relative">
            <select
              value={selectedSequence}
              onChange={(e) => setSelectedSequence(e.target.value)}
              className="pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] bg-white min-w-[180px]"
            >
              <option value="">{t.selectSequence}</option>
              {sequences.map((s) => (
                <option key={s.id} value={s.id}>{s.label || s.name}</option>
              ))}
            </select>
            <Award className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Refresh Button */}
          <button
            onClick={loadRankings}
            className="p-2.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            title={t.refresh}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ranking Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#1e3a8a]" />
            {t.rankingTitle}
          </h3>
          <button
            onClick={loadRankings}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            title={t.refresh}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-16">{t.rank}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t.matricule}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t.student}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t.avg}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t.appreciation}</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t.loading}
                    </div>
                  </td>
                </tr>
              ) : !selectedClass ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>{t.selectFilters}</p>
                  </td>
                </tr>
              ) : rankings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>{t.noData}</p>
                  </td>
                </tr>
              ) : (
                rankings.map((student) => (
                  <tr key={student.student_id} className={`hover:bg-gray-50 transition-colors ${student.rank <= 3 ? "bg-yellow-50/30" : ""}`}>
                    <td className="px-4 py-3">
                      {student.rank === 1 && <Trophy className="w-5 h-5 text-yellow-500" />}
                      {student.rank === 2 && <span className="text-lg font-bold text-gray-400">2</span>}
                      {student.rank === 3 && <span className="text-lg font-bold text-amber-600">3</span>}
                      {student.rank > 3 && <span className="text-sm text-gray-500 font-medium">{student.rank}</span>}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-[#1e3a8a]">{student.matricule}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.student_name}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-sm font-bold ${getAppreciationBadgeColor(student.average)}`}>
                        {student.average.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{student.appreciation}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleGenerateBulletin(student.student_id)}
                        className="p-1.5 hover:bg-blue-50 rounded-lg text-[#1e3a8a] transition-colors"
                        title={t.generateBulletin}
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
      </div>
    </div>
  );
}