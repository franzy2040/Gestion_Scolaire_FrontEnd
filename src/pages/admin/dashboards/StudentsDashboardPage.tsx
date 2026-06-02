import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, UserPlus, GraduationCap, TrendingUp, UsersRound,
  ArrowLeftRight, Ban, HeartPulse, School,
  BarChart3, PieChart, Activity, ArrowUpRight, ArrowDownRight,
  Loader2, AlertCircle
} from 'lucide-react'
import { useLang } from '@/hooks/useLang'
import { toast } from 'sonner'
import { studentsApi, apiService } from '@/services/api'
import { useAuthStore } from '@/store/authStore'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════
interface DashboardStats {
  total_students: number
  by_status: Record<string, number>
  by_sex: Record<string, number>
  social_cases: number
  handicaps: number
  school_id?: number
  academic_year_id?: number
}

// Pas de sélecteur d'année — affichage global

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT GRAPHIQUE BARRES (SVG natif, pas de dépendance externe)
// ═══════════════════════════════════════════════════════════════════════════════
function BarChartSVG({ data, maxValue, color = '#3b82f6' }: { data: { label: string; value: number }[]; maxValue: number; color?: string }) {
  const barWidth = Math.max(20, 300 / data.length - 8)
  const chartHeight = 180
  const padding = 30

  return (
    <svg viewBox={`0 0 ${Math.max(300, data.length * (barWidth + 12))} ${chartHeight + padding}`} className="w-full h-full">
      {/* Lignes de grille */}
      {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
        <line key={i} x1="0" y1={chartHeight - ratio * chartHeight} x2="100%" y2={chartHeight - ratio * chartHeight} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
      ))}
      {/* Barres */}
      {data.map((item, i) => {
        const barHeight = maxValue > 0 ? (item.value / maxValue) * chartHeight : 0
        const x = i * (barWidth + 12) + 6
        const y = chartHeight - barHeight
        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx={4} fill={color} opacity={0.85} />
            <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill="#374151">{item.value}</text>
            <text x={x + barWidth / 2} y={chartHeight + 18} textAnchor="middle" fontSize="10" fill="#6b7280">{item.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT GRAPHIQUE CAMEMBERT (SVG natif)
// ═══════════════════════════════════════════════════════════════════════════════
function PieChartSVG({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const radius = 70
  const cx = 100
  const cy = 100
  let currentAngle = 0

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Aucune donnée
      </div>
    )
  }

  return (
    <div className="flex items-center gap-6 h-full">
      <svg viewBox="0 0 200 200" className="w-40 h-40">
        {data.map((item, i) => {
          const angle = (item.value / total) * 360
          const startAngle = currentAngle
          const endAngle = currentAngle + angle
          currentAngle = endAngle

          const startRad = (startAngle - 90) * Math.PI / 180
          const endRad = (endAngle - 90) * Math.PI / 180

          const x1 = cx + radius * Math.cos(startRad)
          const y1 = cy + radius * Math.sin(startRad)
          const x2 = cx + radius * Math.cos(endRad)
          const y2 = cy + radius * Math.sin(endRad)

          const largeArc = angle > 180 ? 1 : 0

          return (
            <path
              key={i}
              d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={item.color}
              stroke="white"
              strokeWidth="2"
            />
          )
        })}
        {/* Cercle central (donut) */}
        <circle cx={cx} cy={cy} r={40} fill="white" />
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize="16" fontWeight="700" fill="#1f2937">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="#6b7280">Total</text>
      </svg>

      {/* Légende */}
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-gray-600">{item.label}</span>
            <span className="font-semibold text-gray-900 ml-auto">{item.value}</span>
            <span className="text-xs text-gray-400">({total > 0 ? Math.round((item.value / total) * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT CARTE STATISTIQUE
// ═══════════════════════════════════════════════════════════════════════════════
function StatCard({ label, value, icon: Icon, color, change, onClick }: {
  label: string
  value: string | number
  icon: any
  color: string
  change?: string
  onClick?: () => void
}) {
  const isPositive = change?.startsWith('+')
  const isNegative = change?.startsWith('-')

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 transition-all hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center shadow-sm`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
            isPositive ? 'bg-green-100 text-green-700' :
            isNegative ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> :
             isNegative ? <ArrowDownRight className="w-3 h-3" /> : null}
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════════
export default function StudentsDashboardPage() {
  const { lang } = useLang()
  const navigate = useNavigate()
  const auth = useAuthStore()

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  // Pas de sélecteur d'année — affichage global

  // ─── TRADUCTIONS ───
  const $t = {
    fr: {
      title: 'Tableau de bord - Inscription des élèves',
      subtitle: "Vue d'ensemble des apprenants",
      totalStudents: 'Total élèves',
      newThisYear: 'Nouveaux cette année',
      boys: 'Garçons',
      girls: 'Filles',
      byLevel: 'Répartition par statut',
      byClass: 'Répartition par genre',
      transferred: 'Transférés',
      expelled: 'Renvoyés',
      socialCases: 'Cas sociaux',
      handicaps: 'Handicaps',
      loading: 'Chargement...',
      error: 'Erreur de chargement',
      distribution: 'Distribution',
      details: 'Voir les détails',
    },
    en: {
      title: 'Dashboard - Student Enrollment',
      subtitle: 'Learners overview',
      totalStudents: 'Total students',
      newThisYear: 'New this year',
      boys: 'Boys',
      girls: 'Girls',
      byLevel: 'Distribution by status',
      byClass: 'Distribution by gender',
      transferred: 'Transferred',
      expelled: 'Expelled',
      socialCases: 'Social cases',
      handicaps: 'Disabilities',
      loading: 'Loading...',
      error: 'Loading error',
      distribution: 'Distribution',
      details: 'View details',
    }
  }[lang]

  // ─── CHARGEMENT DES DONNÉES ───
  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const schoolId = auth.user?.school_id || 1

      // Essayer différentes routes selon le backend
      let res: any = null
      try {
        // Route 1: /students/stats/summary (avec school_id)
        res = await studentsApi.getStats({ school_id: schoolId })
      } catch (e1) {
        try {
          // Route 2: /students/stats (sans paramètres)
          res = await studentsApi.getStats()
        } catch (e2) {
          // Route 3: /students/stats/summary (sans paramètres)
          res = await apiService.get('/students/stats/summary')
        }
      }

      setStats(res)
    } catch (err) {
      console.error('Erreur chargement stats:', err)
      toast.error($t.error)
    } finally {
      setLoading(false)
    }
  }, [$t.error, auth.user?.school_id])

  useEffect(() => { loadStats() }, [loadStats])



  // ─── DONNÉES CALCULÉES ───
  const totalStudents = stats?.total_students || 0
  const boysCount = stats?.by_sex?.M || stats?.by_sex?.m || 0
  const girlsCount = stats?.by_sex?.F || stats?.by_sex?.f || 0
  const socialCasesCount = stats?.social_cases || 0
  const handicapsCount = stats?.handicaps || 0

  // Données pour le graphique par statut
  const statusData = useMemo(() => {
    if (!stats?.by_status) return []
    const colors: Record<string, string> = {
      active: '#22c55e', nouveau: '#3b82f6', inscrit: '#10b981',
      demission: '#f59e0b', exclu: '#ef4444', renvoye: '#f97316',
      reintegre: '#8b5cf6', transfere: '#06b6d4'
    }
    return Object.entries(stats.by_status)
      .map(([key, value]: [string, any]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value: Number(value),
        color: colors[key.toLowerCase()] || '#6b7280'
      }))
      .filter((d: { value: number }) => d.value > 0)
      .sort((a: { value: number }, b: { value: number }) => b.value - a.value)
  }, [stats])

  // Données pour le graphique par genre
  const genderData = useMemo(() => [
    { label: lang === 'fr' ? 'Garçons' : 'Boys', value: boysCount, color: '#3b82f6' },
    { label: lang === 'fr' ? 'Filles' : 'Girls', value: girlsCount, color: '#ec4899' },
  ] as { label: string; value: number; color: string }[], [boysCount, girlsCount, lang])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">{$t.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-amber-50/10 p-6">
      {/* ═══════════════════════ HEADER ═══════════════════════ */}
      <div className="page-header bg-white/80 backdrop-blur-md border-b border-blue-100 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="page-title text-2xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent">
                {$t.title}
              </h1>
              <p className="page-subtitle text-sm text-gray-500 mt-0.5">{$t.subtitle}</p>
            </div>
          </div>

          {/* Actions header */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/students')}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-md shadow-blue-200 flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              {lang === 'fr' ? 'Liste des élèves' : 'Student list'}
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════ STATS CARDS ═══════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard
          label={$t.totalStudents}
          value={totalStudents.toLocaleString()}
          icon={Users}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          change="+5.2%"
          onClick={() => navigate('/students')}
        />
        <StatCard
          label={$t.boys}
          value={boysCount.toLocaleString()}
          icon={Users}
          color="bg-gradient-to-br from-sky-500 to-blue-500"
          change={`${totalStudents > 0 ? Math.round((boysCount / totalStudents) * 100) : 0}%`}
        />
        <StatCard
          label={$t.girls}
          value={girlsCount.toLocaleString()}
          icon={Users}
          color="bg-gradient-to-br from-pink-500 to-rose-500"
          change={`${totalStudents > 0 ? Math.round((girlsCount / totalStudents) * 100) : 0}%`}
        />
        <StatCard
          label={$t.socialCases}
          value={socialCasesCount}
          icon={HeartPulse}
          color="bg-gradient-to-br from-purple-500 to-violet-500"
        />
        <StatCard
          label={$t.handicaps}
          value={handicapsCount}
          icon={AlertCircle}
          color="bg-gradient-to-br from-amber-500 to-orange-500"
        />
        <StatCard
          label={$t.transferred}
          value={stats?.by_status?.transfere || stats?.by_status?.TRANSFERE || 0}
          icon={ArrowLeftRight}
          color="bg-gradient-to-br from-cyan-500 to-teal-500"
        />
      </div>

      {/* ═══════════════════════ GRAPHIQUES ═══════════════════════ */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Graphique par statut */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">{$t.byLevel}</h3>
            </div>
            <span className="text-xs text-gray-400">{$t.distribution}</span>
          </div>
          <div className="p-5 h-72">
            {statusData.length > 0 ? (
              <BarChartSVG
                data={statusData}
                maxValue={Math.max(...statusData.map(d => d.value), 1)}
                color="#3b82f6"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <Activity className="w-10 h-10 mb-2" />
                <p>Aucune donnée</p>
              </div>
            )}
          </div>
        </div>

        {/* Graphique par genre */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-pink-600" />
              <h3 className="font-semibold text-gray-800">{$t.byClass}</h3>
            </div>
            <span className="text-xs text-gray-400">{$t.distribution}</span>
          </div>
          <div className="p-5 h-72">
            <PieChartSVG data={genderData} />
          </div>
        </div>
      </div>

      {/* ═══════════════════════ TABLEAU RÉCAPITULATIF ═══════════════════════ */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersRound className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-gray-800">
              {lang === 'fr' ? 'Récapitulatif par statut' : 'Status summary'}
            </h3>
          </div>
          <button
            onClick={() => navigate('/students')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            {$t.details} <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{lang === 'fr' ? 'Statut' : 'Status'}</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{lang === 'fr' ? 'Nombre' : 'Count'}</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{lang === 'fr' ? 'Pourcentage' : 'Percentage'}</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{lang === 'fr' ? 'Visuel' : 'Visual'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {statusData.map((item: { label: string; value: number; color: string }, i: number) => {
                const pct = totalStudents > 0 ? Math.round((item.value / totalStudents) * 100) : 0
                return (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-medium text-gray-700">{item.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">{item.value}</td>
                    <td className="px-5 py-3 text-right text-gray-500">{pct}%</td>
                    <td className="px-5 py-3 w-48">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
              {statusData.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                    {lang === 'fr' ? 'Aucune donnée disponible' : 'No data available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}