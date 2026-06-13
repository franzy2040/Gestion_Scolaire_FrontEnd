import React, { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, BarChart3, RotateCcw, Loader2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { gradesApi, apiService } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { useLang } from "@/hooks/useLang";

const getAppreciationBadgeColor = (value: number | null): string => {
  if (value === null || value === undefined || isNaN(value)) return 'bg-gray-100 text-gray-500';
  if (value >= 16) return 'bg-emerald-100 text-emerald-700';
  if (value >= 14) return 'bg-blue-100 text-blue-700';
  if (value >= 12) return 'bg-cyan-100 text-cyan-700';
  if (value >= 10) return 'bg-gray-100 text-gray-700';
  if (value >= 8) return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
};

export default function GradesAveragePage() {
  const { user, roleName, isAdmin, isSuperAdmin } = useAuthStore();
  const { lang } = useLang();

  const t = {
    fr: {
      title: 'Moyennes',
      subtitle: 'Moyennes générales et par matière',
      generalAverage: 'Moyenne Générale',
      subjectAverages: 'Moyennes par Matière',
      subject: 'Matière',
      coefficient: 'Coefficient',
      avg: 'Moy',
      students: 'Élèves',
      min: 'Min',
      max: 'Max',
      noData: 'Aucune donnée',
      selectClass: 'Sélectionnez une classe et une séquence',
      loading: 'Chargement...',
      refresh: 'Rafraîchir',
      error: 'Erreur',
    },
    en: {
      title: 'Averages',
      subtitle: 'General and subject averages',
      generalAverage: 'General Average',
      subjectAverages: 'Subject Averages',
      subject: 'Subject',
      coefficient: 'Coefficient',
      avg: 'Avg',
      students: 'Students',
      min: 'Min',
      max: 'Max',
      noData: 'No data',
      selectClass: 'Select a class and sequence',
      loading: 'Loading...',
      refresh: 'Refresh',
      error: 'Error',
    }
  }[lang];

  const [classAverage, setClassAverage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSequence, setSelectedSequence] = useState<string>("");
  const [classes, setClasses] = useState<any[]>([]);
  const [sequences, setSequences] = useState<any[]>([]);

  const isAdminRole = isAdmin || isSuperAdmin || roleName === 'proviseur' || roleName === 'censeur';

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [classesRes, seqRes] = await Promise.all([
          apiService.get('/classes').catch(() => ({ data: [] })),
          gradesApi.getSequences?.().catch(() => ({ data: [] })) || apiService.get('/grades/sequences').catch(() => ({ data: [] })),
        ]) as any[];
        setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
        setSequences(Array.isArray(seqRes.data) ? seqRes.data : []);
      } catch (e) { console.error(e); }
    };
    loadFilters();
  }, []);

  const loadClassAverage = useCallback(async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const res = await gradesApi.getClassAverage?.(parseInt(selectedClass), {
        sequence_id: selectedSequence ? parseInt(selectedSequence) : undefined,
      }).catch(() => ({ data: null })) || 
        apiService.get(`/grades/averages/${selectedClass}`, {
          params: { sequence_id: selectedSequence ? parseInt(selectedSequence) : undefined }
        }).catch(() => ({ data: null }));
      setClassAverage(res?.data || null);
    } catch (err) {
      console.error(err);
      toast.error(t.error);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedSequence]);

  useEffect(() => {
    loadClassAverage();
  }, [loadClassAverage]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-[#1e3a8a]" />
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
          <option value="">{lang === 'fr' ? 'Sélectionner une classe' : 'Select a class'}</option>
          {classes.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={selectedSequence}
          onChange={(e) => setSelectedSequence(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] min-w-[180px]"
        >
          <option value="">{lang === 'fr' ? 'Séquence (optionnel)' : 'Sequence (optional)'}</option>
          {sequences.map((s: any) => (
            <option key={s.id} value={s.id}>{s.label || s.name}</option>
          ))}
        </select>
        <button
          onClick={loadClassAverage}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
          title={t.refresh}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">{t.loading}</span>
        </div>
      ) : !classAverage ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">{t.selectClass}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* General Average */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t.generalAverage}</h3>
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
                  <Tooltip formatter={(value: number) => [value.toFixed(2), 'Moyenne']} />
                  <Bar dataKey="average" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Subject Averages Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#1e3a8a]" />
                {t.subjectAverages}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t.subject}</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">{t.coefficient}</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">{t.avg}</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">{t.students}</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">{t.min}</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">{t.max}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classAverage.subject_averages?.map((subj: any) => (
                    <tr key={subj.subject_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{subj.subject_name}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">{subj.coefficient}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${getAppreciationBadgeColor(subj.average)}`}>
                          {(subj.average ?? 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">{subj.students_count}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">{subj.min?.toFixed(2) ?? '-'}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-700">{subj.max?.toFixed(2) ?? '-'}</td>
                    </tr>
                  )) || (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">{t.noData}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}