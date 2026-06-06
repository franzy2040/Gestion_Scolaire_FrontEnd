import { useState, useEffect, useMemo } from 'react'
import { 
  CalendarDays, Clock, Users, BookOpen, TrendingUp, AlertTriangle, 
  CheckCircle2, BarChart3, PieChart as PieChartIcon, Activity,
  GraduationCap, DoorOpen, Layers, ArrowUpRight, ArrowDownRight,
  Calendar, Search, Filter, Download, RefreshCw, WifiOff
} from 'lucide-react'
import { useLang } from '@/hooks/useLang'
import { apiService } from '@/services/api'

// Types
interface TimetableSlot {
  id: number
  day_of_week: number
  start_time: string
  end_time: string
  subject_id: number
  subject_name: string
  subject_color?: string
  teacher_id: number
  teacher_name: string
  class_id: number
  class_name: string
  room_id: number
  room_name: string
  room_type?: string
  academic_year_id: number
  is_active: boolean
}

interface Teacher {
  id: number
  first_name: string
  last_name: string
  email: string
  specialty_name?: string
  hours_assigned?: number
  hours_max?: number
}

interface Room {
  id: number
  name: string
  capacity: number
  room_type: string
  building?: string
  floor?: number
}

interface Class {
  id: number
  name: string
  level_name?: string
  cycle_name?: string
  student_count?: number
}

interface Subject {
  id: number
  name: string
  code?: string
  color?: string
  hours_per_week?: number
}

interface DashboardStats {
  totalSlots: number
  totalTeachers: number
  totalRooms: number
  totalClasses: number
  totalSubjects: number
  conflicts: number
  occupancyRate: number
  avgSlotsPerDay: number
  busiestDay: { day: string; count: number }
  mostUsedRoom: { name: string; count: number }
  mostBusyTeacher: { name: string; count: number }
  freeRooms: number
  unassignedSlots: number
}

interface DayDistribution {
  day: string
  count: number
  percentage: number
}

interface HourDistribution {
  hour: string
  count: number
}

interface RoomUsage {
  room_name: string
  usage_count: number
  capacity: number
  occupancy_rate: number
}

interface TeacherLoad {
  teacher_name: string
  hours_assigned: number
  hours_max: number
  load_percentage: number
  subject_count: number
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const DAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// CORRECT API paths based on backend router (prefix="/timetable")
const API_PATHS = {
  timetable: ['/timetable/slots', '/timetable', '/schedule/slots'],
  teachers: ['/timetable/teachers', '/teachers', '/enseignants'],
  rooms: ['/timetable/classrooms', '/rooms', '/classrooms', '/salles'],
  classes: ['/timetable/classes', '/classes', '/niveaux'],
  subjects: ['/timetable/subjects', '/subjects', '/matieres', '/teachers/subjects']
}

async function tryApiPaths(paths: string[]): Promise<any[]> {
  for (const path of paths) {
    try {
      const res = await apiService.get(path)
      const data = (res as any)?.data || res
      if (Array.isArray(data) && data.length > 0) {
        return data
      }
    } catch (e: any) {
      if (e.response?.status !== 404) {
        console.warn(`API path ${path} failed:`, e.message)
      }
    }
  }
  return []
}

export default function TimetableDashboardPage() {
  const { lang } = useLang()
  const t = {
    fr: {
      title: 'Tableau de bord - Emploi du temps',
      subtitle: "Vue d'ensemble de la planification des cours",
      totalSlots: 'Créneaux horaires',
      conflicts: 'Conflits détectés',
      teachers: 'Enseignants actifs',
      rooms: 'Salles utilisées',
      classes: 'Classes programmées',
      subjects: 'Matières enseignées',
      occupancy: "Taux d'occupation",
      freeRooms: 'Salles libres',
      unassigned: 'Créneaux non assignés',
      avgPerDay: 'Moyenne/jour',
      busiestDay: 'Jour le plus chargé',
      mostUsedRoom: 'Salle la plus utilisée',
      mostBusyTeacher: 'Enseignant le plus occupé',
      dayDistribution: 'Répartition par jour',
      hourDistribution: 'Répartition horaire',
      roomUsage: 'Utilisation des salles',
      teacherLoad: 'Charge des enseignants',
      subjectDistribution: 'Répartition par matière',
      classOverview: 'Vue par classe',
      refresh: 'Actualiser',
      lastUpdate: 'Dernière mise à jour',
      loading: 'Chargement...',
      error: 'Erreur de chargement',
      noData: 'Aucune donnée disponible',
      slots: 'créneaux',
      hours: 'heures',
      of: 'sur',
      room: 'Salle',
      teacher: 'Enseignant',
      class: 'Classe',
      subject: 'Matière',
      mon: 'Lun', tue: 'Mar', wed: 'Mer', thu: 'Jeu', fri: 'Ven', sat: 'Sam',
      offlineMode: 'Mode hors-ligne',
      offlineDesc: 'Données de démonstration affichées. Le backend est indisponible.',
      usingDemo: 'Données de démonstration'
    },
    en: {
      title: 'Dashboard - Timetable',
      subtitle: 'Course planning overview',
      totalSlots: 'Time slots',
      conflicts: 'Conflicts detected',
      teachers: 'Active teachers',
      rooms: 'Rooms in use',
      classes: 'Scheduled classes',
      subjects: 'Subjects taught',
      occupancy: 'Occupancy rate',
      freeRooms: 'Free rooms',
      unassigned: 'Unassigned slots',
      avgPerDay: 'Average/day',
      busiestDay: 'Busiest day',
      mostUsedRoom: 'Most used room',
      mostBusyTeacher: 'Busiest teacher',
      dayDistribution: 'Distribution by day',
      hourDistribution: 'Hourly distribution',
      roomUsage: 'Room usage',
      teacherLoad: 'Teacher workload',
      subjectDistribution: 'Distribution by subject',
      classOverview: 'Class overview',
      refresh: 'Refresh',
      lastUpdate: 'Last updated',
      loading: 'Loading...',
      error: 'Loading error',
      noData: 'No data available',
      slots: 'slots',
      hours: 'hours',
      of: 'of',
      room: 'Room',
      teacher: 'Teacher',
      class: 'Class',
      subject: 'Subject',
      mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat',
      offlineMode: 'Offline mode',
      offlineDesc: 'Demo data displayed. Backend is unavailable.',
      usingDemo: 'Demo data'
    }
  }[lang]

  const [slots, setSlots] = useState<TimetableSlot[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'rooms' | 'teachers'>('overview')
  const [usingDemoData, setUsingDemoData] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError('')
    setUsingDemoData(false)

    try {
      // Try multiple API paths for each resource - CORRECTED paths for /timetable router
      const [slotsRes, teachersRes, roomsRes, classesRes, subjectsRes] = await Promise.all([
        tryApiPaths(API_PATHS.timetable),
        tryApiPaths(API_PATHS.teachers),
        tryApiPaths(API_PATHS.rooms),
        tryApiPaths(API_PATHS.classes),
        tryApiPaths(API_PATHS.subjects)
      ])

      // If all APIs return empty, use demo data
      const hasAnyData = slotsRes.length > 0 || teachersRes.length > 0 || roomsRes.length > 0 || 
                         classesRes.length > 0 || subjectsRes.length > 0

      if (!hasAnyData) {
        console.log('No backend data available, switching to demo mode')
        setUsingDemoData(true)
        loadDemoData()
        setLastUpdate(new Date())
        setLoading(false)
        return
      }

      setSlots(slotsRes.length > 0 ? slotsRes : [])
      setTeachers(teachersRes.length > 0 ? teachersRes : [])
      setRooms(roomsRes.length > 0 ? roomsRes : [])
      setClasses(classesRes.length > 0 ? classesRes : [])
      setSubjects(subjectsRes.length > 0 ? subjectsRes : [])
      setLastUpdate(new Date())
    } catch (err: any) {
      console.error('Dashboard fetch error:', err)
      setError(err.message || t.error)
      setUsingDemoData(true)
      loadDemoData()
    } finally {
      setLoading(false)
    }
  }

  const loadDemoData = () => {
    // Demo data for visualization when backend is unavailable
    const demoSlots: TimetableSlot[] = Array.from({ length: 156 }, (_, i) => ({
      id: i + 1,
      day_of_week: (i % 6) + 1,
      start_time: `${8 + Math.floor((i % 8) / 2)}:${(i % 2) * 30 || '00'}`,
      end_time: `${8 + Math.floor((i % 8) / 2)}:${(i % 2) * 30 + 30 || '30'}`,
      subject_id: (i % 12) + 1,
      subject_name: ['Mathématiques', 'Physique', 'Chimie', 'Français', 'Anglais', 'Histoire', 'Géographie', 'SVT', 'EPS', 'Philosophie', 'Informatique', 'Arts'][i % 12],
      subject_color: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#d946ef'][i % 12],
      teacher_id: (i % 20) + 1,
      teacher_name: `Prof. ${String.fromCharCode(65 + (i % 20))}`,
      class_id: (i % 15) + 1,
      class_name: `Terminale ${String.fromCharCode(65 + (i % 5))}`,
      room_id: (i % 24) + 1,
      room_name: `Salle ${101 + (i % 24)}`,
      room_type: ['Classroom', 'Lab', 'Computer', 'Gym', 'Art'][i % 5],
      academic_year_id: 1,
      is_active: true
    }))
    setSlots(demoSlots)
    setTeachers(Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      first_name: 'Jean',
      last_name: `Dupont ${i + 1}`,
      email: `teacher${i + 1}@school.com`,
      specialty_name: ['Math', 'Physics', 'Chemistry', 'French', 'English'][i % 5],
      hours_assigned: 15 + (i % 10),
      hours_max: 24
    })))
    setRooms(Array.from({ length: 24 }, (_, i) => ({
      id: i + 1,
      name: `Salle ${101 + i}`,
      capacity: 20 + (i % 15) * 3,
      room_type: ['Classroom', 'Lab', 'Computer', 'Gym', 'Art'][i % 5],
      building: 'Bâtiment A',
      floor: 1 + (i % 3)
    })))
    setClasses(Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      name: `Terminale ${String.fromCharCode(65 + (i % 5))}`,
      level_name: 'Terminale',
      cycle_name: 'Secondaire',
      student_count: 25 + (i % 10)
    })))
    setSubjects(Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      name: ['Mathématiques', 'Physique', 'Chimie', 'Français', 'Anglais', 'Histoire', 'Géographie', 'SVT', 'EPS', 'Philosophie', 'Informatique', 'Arts'][i],
      code: ['MAT', 'PHY', 'CHI', 'FRA', 'ANG', 'HIS', 'GEO', 'SVT', 'EPS', 'PHI', 'INF', 'ART'][i],
      color: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#d946ef'][i],
      hours_per_week: 4 + (i % 4)
    })))
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Computed statistics
  const stats = useMemo<DashboardStats>(() => {
    if (!slots.length) {
      return {
        totalSlots: 0, totalTeachers: 0, totalRooms: 0, totalClasses: 0, totalSubjects: 0,
        conflicts: 0, occupancyRate: 0, avgSlotsPerDay: 0,
        busiestDay: { day: '-', count: 0 },
        mostUsedRoom: { name: '-', count: 0 },
        mostBusyTeacher: { name: '-', count: 0 },
        freeRooms: 0, unassignedSlots: 0
      }
    }

    const activeSlots = slots.filter(s => s.is_active !== false)
    const totalSlots = activeSlots.length

    // Day distribution
    const dayCounts = new Map<number, number>()
    activeSlots.forEach(s => {
      dayCounts.set(s.day_of_week, (dayCounts.get(s.day_of_week) || 0) + 1)
    })

    let busiestDayNum = 1
    let busiestCount = 0
    dayCounts.forEach((count, day) => {
      if (count > busiestCount) {
        busiestCount = count
        busiestDayNum = day
      }
    })

    // Room usage
    const roomCounts = new Map<string, number>()
    activeSlots.forEach(s => {
      roomCounts.set(s.room_name, (roomCounts.get(s.room_name) || 0) + 1)
    })

    let mostUsedRoomName = ''
    let mostUsedRoomCount = 0
    roomCounts.forEach((count, name) => {
      if (count > mostUsedRoomCount) {
        mostUsedRoomCount = count
        mostUsedRoomName = name
      }
    })

    // Teacher load
    const teacherCounts = new Map<string, number>()
    activeSlots.forEach(s => {
      teacherCounts.set(s.teacher_name, (teacherCounts.get(s.teacher_name) || 0) + 1)
    })

    let mostBusyTeacherName = ''
    let mostBusyTeacherCount = 0
    teacherCounts.forEach((count, name) => {
      if (count > mostBusyTeacherCount) {
        mostBusyTeacherCount = count
        mostBusyTeacherName = name
      }
    })

    // Conflicts: same teacher, same time, different room OR same room, same time, different teacher
    let conflicts = 0
    const slotMap = new Map<string, TimetableSlot[]>()
    activeSlots.forEach(s => {
      const key = `${s.day_of_week}-${s.start_time}`
      if (!slotMap.has(key)) slotMap.set(key, [])
      slotMap.get(key)!.push(s)
    })

    slotMap.forEach(group => {
      // Teacher conflicts
      const teacherSet = new Set<string>()
      group.forEach(s => {
        if (teacherSet.has(`${s.teacher_id}-${s.day_of_week}-${s.start_time}`)) {
          conflicts++
        }
        teacherSet.add(`${s.teacher_id}-${s.day_of_week}-${s.start_time}`)
      })

      // Room conflicts
      const roomSet = new Set<number>()
      group.forEach(s => {
        if (roomSet.has(s.room_id)) {
          conflicts++
        }
        roomSet.add(s.room_id)
      })
    })

    const uniqueTeachers = new Set(activeSlots.map(s => s.teacher_id)).size
    const uniqueRooms = new Set(activeSlots.map(s => s.room_id)).size
    const uniqueClasses = new Set(activeSlots.map(s => s.class_id)).size
    const uniqueSubjects = new Set(activeSlots.map(s => s.subject_id)).size

    // Occupancy: assume 6 days, 8 hours per day, rooms available
    const totalPossibleSlots = rooms.length * 6 * 8 // rooms * days * hours
    const occupancyRate = totalPossibleSlots > 0 ? Math.round((totalSlots / totalPossibleSlots) * 100) : 0

    const daysWithSlots = dayCounts.size || 1
    const avgSlotsPerDay = Math.round(totalSlots / daysWithSlots)

    const freeRooms = rooms.length - uniqueRooms

    return {
      totalSlots,
      totalTeachers: uniqueTeachers,
      totalRooms: uniqueRooms,
      totalClasses: uniqueClasses,
      totalSubjects: uniqueSubjects,
      conflicts,
      occupancyRate: Math.min(occupancyRate, 100),
      avgSlotsPerDay,
      busiestDay: { 
        day: lang === 'fr' ? DAYS[busiestDayNum - 1] : DAYS_EN[busiestDayNum - 1], 
        count: busiestCount 
      },
      mostUsedRoom: { name: mostUsedRoomName, count: mostUsedRoomCount },
      mostBusyTeacher: { name: mostBusyTeacherName, count: mostBusyTeacherCount },
      freeRooms: Math.max(0, freeRooms),
      unassignedSlots: 0
    }
  }, [slots, rooms, lang])

  // Day distribution data for bar chart
  const dayDistribution = useMemo<DayDistribution[]>(() => {
    const counts = new Map<number, number>()
    slots.filter(s => s.is_active !== false).forEach(s => {
      counts.set(s.day_of_week, (counts.get(s.day_of_week) || 0) + 1)
    })

    const dayLabels = lang === 'fr' 
      ? [t.mon, t.tue, t.wed, t.thu, t.fri, t.sat]
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    const total = slots.filter(s => s.is_active !== false).length || 1

    return [1, 2, 3, 4, 5, 6].map(day => {
      const count = counts.get(day) || 0
      return {
        day: dayLabels[day - 1],
        count,
        percentage: Math.round((count / total) * 100)
      }
    })
  }, [slots, lang, t])

  // Hour distribution
  const hourDistribution = useMemo<HourDistribution[]>(() => {
    const counts = new Map<string, number>()
    slots.filter(s => s.is_active !== false).forEach(s => {
      const hour = s.start_time?.split(':')[0] || '08'
      counts.set(hour, (counts.get(hour) || 0) + 1)
    })

    return Array.from(counts.entries())
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([hour, count]) => ({ hour: `${hour}h`, count }))
  }, [slots])

  // Room usage details
  const roomUsage = useMemo<RoomUsage[]>(() => {
    const counts = new Map<string, { count: number; capacity: number }>()
    slots.filter(s => s.is_active !== false).forEach(s => {
      const existing = counts.get(s.room_name) || { count: 0, capacity: rooms.find(r => r.id === s.room_id)?.capacity || 30 }
      counts.set(s.room_name, { count: existing.count + 1, capacity: existing.capacity })
    })

    return Array.from(counts.entries())
      .map(([room_name, data]) => ({
        room_name,
        usage_count: data.count,
        capacity: data.capacity,
        occupancy_rate: Math.round((data.count / 40) * 100) // Assume 40 slots max per week
      }))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10)
  }, [slots, rooms])

  // Teacher load details
  const teacherLoad = useMemo<TeacherLoad[]>(() => {
    const counts = new Map<string, { hours: number; subjects: Set<number> }>()
    slots.filter(s => s.is_active !== false).forEach(s => {
      const existing = counts.get(s.teacher_name) || { hours: 0, subjects: new Set<number>() }
      // Estimate 1 hour per slot (simplified)
      existing.hours += 1
      existing.subjects.add(s.subject_id)
      counts.set(s.teacher_name, existing)
    })

    return Array.from(counts.entries())
      .map(([teacher_name, data]) => {
        const teacher = teachers.find(t => `${t.first_name} ${t.last_name}` === teacher_name)
        const hoursMax = teacher?.hours_max || 24
        return {
          teacher_name,
          hours_assigned: data.hours,
          hours_max: hoursMax,
          load_percentage: Math.round((data.hours / hoursMax) * 100),
          subject_count: data.subjects.size
        }
      })
      .sort((a, b) => b.load_percentage - a.load_percentage)
      .slice(0, 10)
  }, [slots, teachers])

  // Subject distribution for pie chart
  const subjectDistribution = useMemo(() => {
    const counts = new Map<string, { count: number; color: string }>()
    slots.filter(s => s.is_active !== false).forEach(s => {
      const existing = counts.get(s.subject_name) || { count: 0, color: s.subject_color || '#6b7280' }
      existing.count += 1
      counts.set(s.subject_name, existing)
    })

    const total = slots.filter(s => s.is_active !== false).length || 1

    return Array.from(counts.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        percentage: Math.round((data.count / total) * 100),
        color: data.color
      }))
      .sort((a, b) => b.count - a.count)
  }, [slots])

  // Class overview
  const classOverview = useMemo(() => {
    const counts = new Map<string, { count: number; level?: string }>()
    slots.filter(s => s.is_active !== false).forEach(s => {
      const existing = counts.get(s.class_name) || { count: 0, level: classes.find(c => c.id === s.class_id)?.level_name }
      existing.count += 1
      counts.set(s.class_name, existing)
    })

    return Array.from(counts.entries())
      .map(([name, data]) => ({ name, count: data.count, level: data.level }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12)
  }, [slots, classes])

  // Simple SVG Bar Chart Component
  const BarChart = ({ data, maxValue, color }: { data: { label: string; value: number }[]; maxValue: number; color: string }) => {
    const height = 160
    const barWidth = Math.max(20, 300 / data.length - 8)

    return (
      <svg viewBox={`0 0 ${data.length * (barWidth + 8)} ${height}`} className="w-full h-40">
        {data.map((item, i) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * (height - 30) : 0
          return (
            <g key={i}>
              <rect
                x={i * (barWidth + 8) + 4}
                y={height - barHeight - 20}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={color}
                opacity={0.8 + (i % 3) * 0.1}
              />
              <text
                x={i * (barWidth + 8) + barWidth / 2 + 4}
                y={height - 5}
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                {item.label}
              </text>
              <text
                x={i * (barWidth + 8) + barWidth / 2 + 4}
                y={height - barHeight - 25}
                textAnchor="middle"
                fontSize="11"
                fill="#111827"
                fontWeight="600"
              >
                {item.value}
              </text>
            </g>
          )
        })}
      </svg>
    )
  }

  // Simple SVG Pie Chart
  const PieChart = ({ data }: { data: { name: string; count: number; color: string; percentage: number }[] }) => {
    const size = 140
    const radius = 60
    const center = size / 2
    let currentAngle = 0

    return (
      <div className="flex items-center gap-4">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-32 h-32 flex-shrink-0">
          <circle cx={center} cy={center} r={radius} fill="#f3f4f6" />
          {data.map((item, i) => {
            const angle = (item.percentage / 100) * 360
            const startAngle = currentAngle
            currentAngle += angle
            const endAngle = currentAngle

            const startRad = (startAngle - 90) * Math.PI / 180
            const endRad = (endAngle - 90) * Math.PI / 180

            const x1 = center + radius * Math.cos(startRad)
            const y1 = center + radius * Math.sin(startRad)
            const x2 = center + radius * Math.cos(endRad)
            const y2 = center + radius * Math.sin(endRad)

            const largeArc = angle > 180 ? 1 : 0

            return (
              <path
                key={i}
                d={`M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={item.color}
                stroke="white"
                strokeWidth="2"
              />
            )
          })}
          <circle cx={center} cy={center} r={25} fill="white" />
          <text x={center} y={center - 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="#111827">
            {data.reduce((sum, d) => sum + d.count, 0)}
          </text>
          <text x={center} y={center + 10} textAnchor="middle" fontSize="9" fill="#6b7280">
            {t.slots}
          </text>
        </svg>
        <div className="flex-1 space-y-1.5">
          {data.slice(0, 6).map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="flex-1 truncate text-gray-700">{item.name}</span>
              <span className="font-semibold text-gray-900">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Progress Bar Component
  const ProgressBar = ({ value, max, color, label }: { value: number; max: number; color: string; label: string }) => {
    const percentage = Math.min(100, Math.round((value / max) * 100))
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-600 truncate">{label}</span>
          <span className="font-medium text-gray-900">{value} {t.of} {max}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
        </div>
      </div>
    )
  }

  const statCards = [
    { label: t.totalSlots, value: stats.totalSlots.toString(), icon: Clock, color: 'bg-emerald-500', trend: '+12%' },
    { label: t.teachers, value: stats.totalTeachers.toString(), icon: Users, color: 'bg-blue-500', trend: '+2' },
    { label: t.rooms, value: stats.totalRooms.toString(), icon: DoorOpen, color: 'bg-purple-500', trend: '100%' },
    { label: t.classes, value: stats.totalClasses.toString(), icon: GraduationCap, color: 'bg-amber-500', trend: '+3' },
    { label: t.subjects, value: stats.totalSubjects.toString(), icon: BookOpen, color: 'bg-rose-500', trend: '0' },
    { label: t.conflicts, value: stats.conflicts.toString(), icon: AlertTriangle, color: stats.conflicts > 0 ? 'bg-red-500' : 'bg-emerald-500', trend: stats.conflicts > 0 ? '!' : '✓' },
  ]

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="page-header mb-6">
          <h1 className="page-title flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            {t.title}
          </h1>
          <p className="page-subtitle">{t.subtitle}</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-gray-500">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>{t.loading}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
              {t.title}
            </h1>
            <p className="page-subtitle">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            {usingDemoData && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200">
                <WifiOff className="w-3.5 h-3.5" />
                {t.usingDemo}
              </span>
            )}
            {lastUpdate && (
              <span className="text-xs text-gray-400">
                {t.lastUpdate}: {lastUpdate.toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-US')}
              </span>
            )}
            <button 
              onClick={fetchData}
              className="btn btn-secondary flex items-center gap-2 text-sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {t.refresh}
            </button>
          </div>
        </div>
      </div>

      {usingDemoData && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 text-amber-800">
          <WifiOff className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-sm">{t.offlineMode}</p>
            <p className="text-xs mt-0.5 opacity-80">{t.offlineDesc}</p>
          </div>
        </div>
      )}

      {error && !usingDemoData && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="card hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
            <div className="card-body p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center shadow-sm`}>
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  s.label === t.conflicts 
                    ? (stats.conflicts > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700')
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {s.trend}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Occupancy Rate */}
        <div className="card">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" />
                {t.occupancy}
              </h3>
              <span className="text-2xl font-bold text-emerald-600">{stats.occupancyRate}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                style={{ width: `${stats.occupancyRate}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{stats.totalSlots} {t.slots}</span>
              <span>{stats.freeRooms} {t.freeRooms}</span>
            </div>
          </div>
        </div>

        {/* Busiest Day */}
        <div className="card">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                {t.busiestDay}
              </h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center">
                <CalendarDays className="w-7 h-7 text-amber-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{stats.busiestDay.day}</p>
                <p className="text-sm text-gray-500">{stats.busiestDay.count} {t.slots}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Most Used Room */}
        <div className="card">
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-purple-500" />
                {t.mostUsedRoom}
              </h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-50 rounded-xl flex items-center justify-center">
                <Layers className="w-7 h-7 text-purple-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{stats.mostUsedRoom.name}</p>
                <p className="text-sm text-gray-500">{stats.mostUsedRoom.count} {t.slots}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'overview', label: lang === 'fr' ? "Vue d'ensemble" : 'Overview', icon: BarChart3 },
          { id: 'rooms', label: t.roomUsage, icon: DoorOpen },
          { id: 'teachers', label: t.teacherLoad, icon: Users }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id 
                ? 'border-emerald-500 text-emerald-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Day Distribution Bar Chart */}
          <div className="card">
            <div className="card-body p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                {t.dayDistribution}
              </h3>
              {dayDistribution.length > 0 ? (
                <BarChart 
                  data={dayDistribution.map(d => ({ label: d.day, value: d.count }))}
                  maxValue={Math.max(...dayDistribution.map(d => d.count), 1)}
                  color="#3b82f6"
                />
              ) : (
                <div className="h-40 flex items-center justify-center text-gray-400 text-sm">{t.noData}</div>
              )}
            </div>
          </div>

          {/* Subject Distribution Pie Chart */}
          <div className="card">
            <div className="card-body p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-rose-500" />
                {t.subjectDistribution}
              </h3>
              {subjectDistribution.length > 0 ? (
                <PieChart data={subjectDistribution} />
              ) : (
                <div className="h-40 flex items-center justify-center text-gray-400 text-sm">{t.noData}</div>
              )}
            </div>
          </div>

          {/* Hour Distribution */}
          <div className="card">
            <div className="card-body p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                {t.hourDistribution}
              </h3>
              {hourDistribution.length > 0 ? (
                <BarChart 
                  data={hourDistribution.map(d => ({ label: d.hour, value: d.count }))}
                  maxValue={Math.max(...hourDistribution.map(d => d.count), 1)}
                  color="#f59e0b"
                />
              ) : (
                <div className="h-40 flex items-center justify-center text-gray-400 text-sm">{t.noData}</div>
              )}
            </div>
          </div>

          {/* Class Overview */}
          <div className="card">
            <div className="card-body p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-500" />
                {t.classOverview}
              </h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {classOverview.length > 0 ? (
                  classOverview.map((cls, i) => (
                    <ProgressBar 
                      key={i}
                      value={cls.count}
                      max={Math.max(...classOverview.map(c => c.count))}
                      color={['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'][i % 5]}
                      label={`${cls.name} ${cls.level ? `(${cls.level})` : ''}`}
                    />
                  ))
                ) : (
                  <div className="text-center text-gray-400 text-sm py-8">{t.noData}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rooms' && (
        <div className="card">
          <div className="card-body p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DoorOpen className="w-4 h-4 text-purple-500" />
              {t.roomUsage}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">{t.room}</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">{t.slots}</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">{t.occupancy}</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">{t.hours}</th>
                  </tr>
                </thead>
                <tbody>
                  {roomUsage.length > 0 ? (
                    roomUsage.map((room, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2.5 px-3 font-medium text-gray-900">{room.room_name}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                            {room.usage_count}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-purple-500 rounded-full"
                                style={{ width: `${Math.min(100, room.occupancy_rate)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-10 text-right">{room.occupancy_rate}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right text-gray-600">{room.usage_count}h</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400">{t.noData}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'teachers' && (
        <div className="card">
          <div className="card-body p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              {t.teacherLoad}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 font-medium text-gray-600">{t.teacher}</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">{t.hours}</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-600">{t.subjects}</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-600">{t.occupancy}</th>
                  </tr>
                </thead>
                <tbody>
                  {teacherLoad.length > 0 ? (
                    teacherLoad.map((teacher, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2.5 px-3 font-medium text-gray-900">{teacher.teacher_name}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            {teacher.hours_assigned} / {teacher.hours_max}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-gray-600">{teacher.subject_count}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  teacher.load_percentage > 90 ? 'bg-red-500' : 
                                  teacher.load_percentage > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, teacher.load_percentage)}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium w-10 text-right ${
                              teacher.load_percentage > 90 ? 'text-red-600' : 
                              teacher.load_percentage > 75 ? 'text-amber-600' : 'text-emerald-600'
                            }`}>
                              {teacher.load_percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-400">{t.noData}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}