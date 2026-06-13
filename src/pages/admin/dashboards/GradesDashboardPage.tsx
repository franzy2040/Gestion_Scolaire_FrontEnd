import React, { useState, useEffect } from "react";
import {
  BookOpen, TrendingUp, BarChart3, Trophy, FileText, Users, Calendar, Award,
  ArrowUpRight, ArrowDownRight, Loader2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { gradesApi, apiService } from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { useLang } from "@/hooks/useLang";

export default function GradesDashboardPage() {
  const { lang } = useLang();
  const { roleName, isAdmin, isSuperAdmin } = useAuthStore();

  const t = {
    fr: {
      title: 'Tableau de bord - Notes',
      subtitle: "Vue d'ensemble des performances scolaires",
      totalStudents: 'Élèves',
      totalGrades: 'Notes saisies',
      avgGeneral: 'Moy. générale',
      sequences: 'Séquences',
      recentActivity: 'Activité récente',
      topStudents: 'Meilleurs élèves',
      distribution: 'Répartition des notes',
      bySubject: 'Par matière',
      loading: 'Chargement...',
      noData: 'Aucune donnée',
    },
    en: {
      title: 'Dashboard - Grades',
      subtitle: 'Overview of academic performance',
      totalStudents: 'Students',
      totalGrades: 'Grades entered',
      avgGeneral: 'Gen. avg',
      sequences: 'Sequences',
      recentActivity: 'Recent activity',
      topStudents: 'Top students',
      distribution: 'Grade distribution',
      bySubject: 'By subject',
      loading: 'Loading...',
      noData: 'No data',
    }
  }[lang];

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalGrades: 0,
    avgGeneral: 0,
    sequences: 0,
  });
  const [topStudents, setTopStudents] = useState<any[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<any[]>([]);
  const [subjectAverages, setSubjectAverages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        // Load stats from various endpoints
        const [studentsRes, gradesRes, seqRes] = await Promise.all([
          apiService.get('/students/stats/summary').catch(() => ({ data: {} })),
          apiService.get('/grades').catch(() => ({ data: [] })),
          apiService.get('/grades/sequences').catch(() => ({ data: [] })),
        ]);

        const studentsData = studentsRes?.data || {};
        const gradesData = Array.isArray(gradesRes.data) ? gradesRes.data : [];
        const seqData = Array.isArray(seqRes.data) ? seqRes.data : [];

        setStats({
          totalStudents: studentsData.total || 0,
          totalGrades: gradesData.length,
          avgGeneral: gradesData.length > 0 
            ? gradesData.reduce((sum: number, g: any) => sum + (g.value || g.score || 0), 0) / gradesData.length 
            : 0,
          sequences: seqData.length,
        });

        // Grade distribution
        const distribution = [
          { range: '0-5', count: 0, color: '#ef4444' },
          { range: '5-8', count: 0, color: '#f97316' },
          { range: '8-10', count: 0, color: '#f59e0b' },
          { range: '10-12', count: 0, color: '#84cc16' },
          { range: '12-14', count: 0, color: '#06b6d4' },
          { range: '14-16', count: 0, color: '#3b82f6' },
          { range: '16-20', count: 0, color: '#10b981' },
        ];

        gradesData.forEach((g: any) => {
          const val = g.value || g.score || 0;
          if (val < 5) distribution[0].count++;
          else if (val < 8) distribution[1].count++;
          else if (val < 10) distribution[2].count++;
          else if (val < 12) distribution[3].count++;
          else if (val < 14) distribution[4].count++;
          else if (val < 16) distribution[5].count++;
          else distribution[6].count++;
        });

        setGradeDistribution(distribution);

        // Try to load rankings for top students
        try {
          const rankingRes = await apiService.get('/grades/honor-board').catch(() => ({ data: null }));
          const hb = rankingRes?.data;
          const top: any[] = [];
          if (hb?.felicitations) top.push(...hb.felicitations.slice(0, 3));
          if (hb?.encouragements && top.length < 5) top.push(...hb.encouragements.slice(0, 5 - top.length));
          setTopStudents(top);
        } catch (e) { setTopStudents([]); }

        // Subject averages
        try {
          const classesRes = await apiService.get('/classes').catch(() => ({ data: [] }));
          const classes = Array.isArray(classesRes.data) ? classesRes.data : [];
          if (classes.length > 0) {
            const avgRes = await apiService.get(`/grades/averages/${classes[0].id}`).catch(() => ({ data: null }));
            setSubjectAverages(avgRes?.data?.subject_averages || []);
          }
        } catch (e) { setSubjectAverages([]); }

      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const statCards = [
    { label: t.totalStudents, value: stats.totalStudents.toString(), icon: Users, color: 'bg-blue-500', trend: '' },
    { label: t.totalGrades, value: stats.totalGrades.toString(), icon: BookOpen, color: 'bg-emerald-500', trend: '' },
    { label: t.avgGeneral, value: stats.avgGeneral.toFixed(2), icon: TrendingUp, color: 'bg-amber-500', trend: '/20' },
    { label: t.sequences, value: stats.sequences.toString(), icon: Calendar, color: 'bg-purple-500', trend: '' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-[#1e3a8a]" />
          {t.title}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{t.subtitle}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center shadow-sm`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              {s.trend && <span className="text-xs text-gray-400">{s.trend}</span>}
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#1e3a8a]" />
            {t.distribution}
          </h3>
          {gradeDistribution.length > 0 && gradeDistribution.some(d => d.count > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">{t.noData}</div>
          )}
        </div>

        {/* Top Students */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#1e3a8a]" />
            {t.topStudents}
          </h3>
          {topStudents.length > 0 ? (
            <div className="space-y-3">
              {topStudents.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i === 0 ? 'bg-yellow-100 text-yellow-700' : 
                    i === 1 ? 'bg-gray-100 text-gray-700' : 
                    i === 2 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.matricule} — {s.class_name}</p>
                  </div>
                  <span className="text-lg font-bold text-[#1e3a8a]">{s.average.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">{t.noData}</div>
          )}
        </div>

        {/* Subject Averages */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#1e3a8a]" />
            {t.bySubject}
          </h3>
          {subjectAverages.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectAverages}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="subject_name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis domain={[0, 20]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => [value.toFixed(2), 'Moyenne']} />
                  <Bar dataKey="average" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">{t.noData}</div>
          )}
        </div>
      </div>
    </div>
  );
}