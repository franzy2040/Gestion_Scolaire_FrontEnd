import React, { useState, useEffect, useCallback } from "react";
import {
  Trophy, CheckCircle, GraduationCap, AlertTriangle, RotateCcw, Loader2
} from "lucide-react";
import { gradesApi, apiService } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { useLang } from "@/hooks/useLang";

interface HonorBoard {
  felicitations: Array<{ id: number; name: string; matricule: string; class_name: string; average: number }>;
  encouragements: Array<{ id: number; name: string; matricule: string; class_name: string; average: number }>;
  tableau_honneur: Array<{ id: number; name: string; matricule: string; class_name: string; average: number }>;
  avertissements: Array<{ id: number; name: string; matricule: string; class_name: string; average: number }>;
  blames: Array<{ id: number; name: string; matricule: string; class_name: string; average: number }>;
}

export default function GradesHonorRollPage() {
  const { user, roleName, isAdmin, isSuperAdmin } = useAuthStore();
  const { lang } = useLang();

  const t = {
    fr: {
      title: "Tableau d'Honneur",
      subtitle: 'Félicitations, encouragements et avertissements',
      congratulations: 'Félicitations',
      encouragement: 'Encouragements',
      honorBoard: "Tableau d'Honneur",
      warnings: 'Avertissements',
      blames: 'Blâmes',
      noData: 'Aucune donnée',
      selectClass: 'Sélectionnez une classe et une séquence',
      loading: 'Chargement...',
      refresh: 'Rafraîchir',
      error: 'Erreur',
    },
    en: {
      title: 'Honor Board',
      subtitle: 'Congratulations, encouragements and warnings',
      congratulations: 'Congratulations',
      encouragement: 'Encouragements',
      honorBoard: 'Honor Board',
      warnings: 'Warnings',
      blames: 'Blames',
      noData: 'No data',
      selectClass: 'Select a class and sequence',
      loading: 'Loading...',
      refresh: 'Refresh',
      error: 'Error',
    }
  }[lang];

  const [honorBoard, setHonorBoard] = useState<HonorBoard | null>(null);
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
          apiService.get('/grades/sequences').catch(() => ({ data: [] })),
        ]);
        setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);
        setSequences(Array.isArray(seqRes.data) ? seqRes.data : []);
      } catch (e) { console.error(e); }
    };
    loadFilters();
  }, []);

  const loadHonorBoard = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedClass) params.class_id = parseInt(selectedClass);
      if (selectedSequence) params.sequence_id = parseInt(selectedSequence);

      const res = await gradesApi.getHonorBoard?.(params) || 
        apiService.get('/grades/honor-board', { params }).catch(() => ({ data: null }));
      setHonorBoard(res?.data || null);
    } catch (err) {
      console.error(err);
      toast.error(t.error);
      setHonorBoard(null);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedSequence]);

  useEffect(() => {
    loadHonorBoard();
  }, [loadHonorBoard]);

  const renderSection = (
    title: string,
    icon: React.ReactNode,
    colorClass: string,
    bgClass: string,
    borderClass: string,
    items: any[]
  ) => {
    if (!items || items.length === 0) return null;
    return (
      <div className={`bg-white rounded-xl shadow-sm border ${borderClass} p-6`}>
        <h3 className={`text-lg font-semibold ${colorClass} flex items-center gap-2 mb-4`}>
          {icon}
          {title}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((s) => (
            <div key={s.id} className={`${bgClass} rounded-lg p-4 border ${borderClass} hover:shadow-md transition-shadow`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${bgClass} flex items-center justify-center ${colorClass} font-bold`}>
                  {s.name?.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{s.name}</p>
                  <p className="text-sm text-gray-500">{s.matricule} — {s.class_name}</p>
                </div>
                <span className={`text-lg font-bold ${colorClass}`}>{s.average.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="w-7 h-7 text-[#1e3a8a]" />
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
          <option value="">{lang === 'fr' ? 'Toutes les classes' : 'All classes'}</option>
          {classes.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={selectedSequence}
          onChange={(e) => setSelectedSequence(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] min-w-[180px]"
        >
          <option value="">{lang === 'fr' ? 'Toutes les séquences' : 'All sequences'}</option>
          {sequences.map((s: any) => (
            <option key={s.id} value={s.id}>{s.label || s.name}</option>
          ))}
        </select>
        <button
          onClick={loadHonorBoard}
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
      ) : !honorBoard ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">{t.selectClass}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {renderSection(
            `${t.congratulations} (≥ 16)`,
            <Trophy className="w-5 h-5" />,
            'text-emerald-700',
            'bg-emerald-50',
            'border-emerald-200',
            honorBoard.felicitations || []
          )}
          {renderSection(
            `${t.encouragement} (14-16)`,
            <CheckCircle className="w-5 h-5" />,
            'text-blue-700',
            'bg-blue-50',
            'border-blue-200',
            honorBoard.encouragements || []
          )}
          {renderSection(
            `${t.honorBoard} (12-14)`,
            <GraduationCap className="w-5 h-5" />,
            'text-cyan-700',
            'bg-cyan-50',
            'border-cyan-200',
            honorBoard.tableau_honneur || []
          )}
          {renderSection(
            `${t.warnings} (8-10)`,
            <AlertTriangle className="w-5 h-5" />,
            'text-orange-700',
            'bg-orange-50',
            'border-orange-200',
            honorBoard.avertissements || []
          )}
          {renderSection(
            `${t.blames} (< 8)`,
            <AlertTriangle className="w-5 h-5" />,
            'text-red-700',
            'bg-red-50',
            'border-red-200',
            honorBoard.blames || []
          )}
          {(!honorBoard.felicitations?.length && 
            !honorBoard.encouragements?.length && 
            !honorBoard.tableau_honneur?.length && 
            !honorBoard.avertissements?.length && 
            !honorBoard.blames?.length) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500">{t.noData}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}