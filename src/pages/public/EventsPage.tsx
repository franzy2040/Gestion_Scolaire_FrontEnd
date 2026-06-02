import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, MapPin, Clock, Users, ChevronRight, Star,
  Heart, BookOpen, Globe, GraduationCap, PartyPopper,
  DoorOpen, Briefcase, X, Music, Sparkles,
  ArrowRight, Search, SlidersHorizontal, XCircle,
  Filter, SortAsc, CalendarDays, CalendarRange,
  ImageIcon, ChevronDown, ChevronUp, ZoomIn,
  Camera
} from 'lucide-react'
import { usePageVisit, recordPageVisit } from '../../hooks/usePageVisit'
import { useLang } from '../../hooks/useLang'

/* ───────────────────────────────────────────────
   Lycée Bilingue de Baleng — EventsPage V4
   Événements avec recherche, tri, filtres
   + Galerie d'images pliable par événement
   + BILINGUAL FR/EN
   ─────────────────────────────────────────────── */

type Lang = 'fr' | 'en'
type EventStatus = 'upcoming' | 'past' | 'ongoing'

type EventItem = {
  id: number
  title: { fr: string; en: string }
  date: { fr: string; en: string }
  month: string
  day: string
  year: string
  type: { fr: string; en: string }
  description: { fr: string; en: string }
  activities: { fr: string[]; en: string[] }
  color: string
  icon: React.ElementType
  bgGradient: string
  status: EventStatus
}

const t = {
  fr: {
    pageTitle: 'Événements du LYBIBAL',
    pageSubtitle: 'Découvrez la riche vie culturelle, sportive et éducative du Lycée Bilingue de Baleng',
    slogan: "Lorsque c'est Excellent, c'est le LYBIBAL",
    searchPlaceholder: 'Rechercher un événement par nom, type, mois...',
    filters: 'Filtres',
    status: 'Statut',
    all: 'Tous',
    upcoming: 'À venir',
    past: 'Passés',
    category: 'Catégorie',
    month: 'Mois',
    allMonths: 'Tous les mois',
    year: 'Année',
    allYears: 'Toutes les années',
    sortBy: 'Trier par :',
    dateDesc: 'Date ↓',
    dateAsc: 'Date ↑',
    nameAsc: 'Nom A-Z',
    nameDesc: 'Nom Z-A',
    reset: 'Réinitialiser',
    noEvents: 'Aucun événement trouvé',
    noEventsDesc: "Aucun résultat ne correspond à vos critères de recherche.",
    resetFilters: 'Réinitialiser les filtres',
    eventCount: 'événement',
    eventsCount: 'événements',
    forQuery: 'pour',
    details: 'Détails',
    activitiesLabel: 'activités',
    close: 'Fermer',
    viewImages: 'Voir les images',
    learnMore: 'En savoir plus',
    galleryTitle: 'Galerie des événements',
    gallerySubtitle: 'événements • photos disponibles',
    expand: 'Déplier',
    collapse: 'Réduire',
    mainImage: 'Image principale',
    photosSoon: "Les photos seront disponibles après l'événement",
    clickToEnlarge: "Cliquez sur une image pour l'agrandir",
    activity: 'Activités prévues',
    where: 'LYBIBAL',
    who: 'Tous les élèves',
    statusUpcoming: 'À venir',
    statusPast: 'Terminé',
  },
  en: {
    pageTitle: 'LYBIBAL Events',
    pageSubtitle: 'Discover the rich cultural, sports and educational life of the Bilingual High School of Baleng',
    slogan: "When it's Excellent, it's LYBIBAL",
    searchPlaceholder: 'Search an event by name, type, month...',
    filters: 'Filters',
    status: 'Status',
    all: 'All',
    upcoming: 'Upcoming',
    past: 'Past',
    category: 'Category',
    month: 'Month',
    allMonths: 'All months',
    year: 'Year',
    allYears: 'All years',
    sortBy: 'Sort by:',
    dateDesc: 'Date ↓',
    dateAsc: 'Date ↑',
    nameAsc: 'Name A-Z',
    nameDesc: 'Name Z-A',
    reset: 'Reset',
    noEvents: 'No events found',
    noEventsDesc: 'No results match your search criteria.',
    resetFilters: 'Reset filters',
    eventCount: 'event',
    eventsCount: 'events',
    forQuery: 'for',
    details: 'Details',
    activitiesLabel: 'activities',
    close: 'Close',
    viewImages: 'View images',
    learnMore: 'Learn more',
    galleryTitle: 'Events Gallery',
    gallerySubtitle: 'events • photos available',
    expand: 'Expand',
    collapse: 'Collapse',
    mainImage: 'Main image',
    photosSoon: 'Photos will be available after the event',
    clickToEnlarge: 'Click on an image to enlarge',
    activity: 'Planned activities',
    where: 'LYBIBAL',
    who: 'All students',
    statusUpcoming: 'Upcoming',
    statusPast: 'Completed',
  },
}

const monthOrder: Record<string, number> = {
  'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4, 'mai': 5, 'juin': 6,
  'juillet': 7, 'août': 8, 'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12
}

const monthLabels: Record<string, { fr: string; en: string }> = {
  'janvier': { fr: 'janvier', en: 'January' },
  'février': { fr: 'février', en: 'February' },
  'mars': { fr: 'mars', en: 'March' },
  'avril': { fr: 'avril', en: 'April' },
  'mai': { fr: 'mai', en: 'May' },
  'juin': { fr: 'juin', en: 'June' },
  'juillet': { fr: 'juillet', en: 'July' },
  'août': { fr: 'août', en: 'August' },
  'septembre': { fr: 'septembre', en: 'September' },
  'octobre': { fr: 'octobre', en: 'October' },
  'novembre': { fr: 'novembre', en: 'November' },
  'décembre': { fr: 'décembre', en: 'December' },
}

export default function EventsPage() {
  const navigate = useNavigate()
  const { lang } = useLang()
  const L = t[lang]

  usePageVisit('/events', 'public')

  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const [galleryEvent, setGalleryEvent] = useState<EventItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'past'>('all')
  const [filterType, setFilterType] = useState('all')
  const [filterMonth, setFilterMonth] = useState('all')
  const [filterYear, setFilterYear] = useState('all')
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'name-asc' | 'name-desc'>('date-desc')
  const [showFilters, setShowFilters] = useState(false)
  const [galleryExpanded, setGalleryExpanded] = useState(true)

  const handleNavClick = (path: string, category: string = 'public') => {
    recordPageVisit(path, category)
    navigate(path)
  }

  const events: EventItem[] = [
    {
      id: 1,
      title: { fr: "Semaine de la Jeunesse", en: "Youth Week" },
      date: { fr: "10 — 14 février 2026", en: "Feb 10 — 14, 2026" },
      month: "février", day: "10", year: "2026",
      type: { fr: "Célébration", en: "Celebration" },
      description: {
        fr: "Une semaine dédiée à la jeunesse camerounaise, marquée par des activités sportives, culturelles et intellectuelles.",
        en: "A week dedicated to Cameroonian youth, marked by sports, cultural and intellectual activities."
      },
      activities: {
        fr: ["Compétitions sportives", "Concours de débat", "Spectacles culturels", "Expositions des talents", "Conférences citoyenneté"],
        en: ["Sports competitions", "Debate contest", "Cultural shows", "Talent exhibitions", "Citizenship conferences"]
      },
      color: "from-orange-500 to-red-500", icon: PartyPopper,
      bgGradient: "bg-gradient-to-br from-orange-400 to-red-500", status: "past"
    },
    {
      id: 2,
      title: { fr: "8 Mars — Journée de la Femme au LYBIBAL", en: "March 8 — Women's Day at LYBIBAL" },
      date: { fr: "8 mars 2026", en: "Mar 8, 2026" },
      month: "mars", day: "08", year: "2026",
      type: { fr: "Commémoration", en: "Commemoration" },
      description: {
        fr: "Célébration de la Journée Internationale des Droits des Femmes au sein du lycée.",
        en: "Celebration of International Women's Rights Day within the school."
      },
      activities: {
        fr: ["Conférence leadership féminin", "Témoignages d'anciennes élèves", "Concours d'essai", "Exposition sciences", "Spectacle danse et théâtre"],
        en: ["Women's leadership conference", "Alumni testimonials", "Essay contest", "Science exhibition", "Dance and theater show"]
      },
      color: "from-pink-500 to-rose-500", icon: Heart,
      bgGradient: "bg-gradient-to-br from-pink-400 to-rose-500", status: "past"
    },
    {
      id: 3,
      title: { fr: "20 Mai — Fête de l'Unité Nationale", en: "May 20 — National Unity Day" },
      date: { fr: "20 mai 2026", en: "May 20, 2026" },
      month: "mai", day: "20", year: "2026",
      type: { fr: "Fête nationale", en: "National Holiday" },
      description: {
        fr: "Commémoration de la création de l'État unitaire camerounais le 20 mai 1972.",
        en: "Commemoration of the creation of the unitary Cameroonian state on May 20, 1972."
      },
      activities: {
        fr: ["Défilé en tenue traditionnelle", "Chant hymne national", "Discours du proviseur", "Concours histoire Cameroun", "Repas communautaire"],
        en: ["Traditional attire parade", "National anthem singing", "Principal's speech", "Cameroon history contest", "Community meal"]
      },
      color: "from-green-500 to-emerald-600", icon: Sparkles,
      bgGradient: "bg-gradient-to-br from-green-400 to-emerald-600", status: "upcoming"
    },
    {
      id: 4,
      title: { fr: "Semaine du Bilinguisme", en: "Bilingualism Week" },
      date: { fr: "15 — 19 mars 2026", en: "Mar 15 — 19, 2026" },
      month: "mars", day: "15", year: "2026",
      type: { fr: "Éducation", en: "Education" },
      description: {
        fr: "Semaine dédiée à la promotion du bilinguisme français-anglais.",
        en: "Week dedicated to promoting French-English bilingualism."
      },
      activities: {
        fr: ["Concours d'orthographe", "Débats parlementaires bilingues", "Théâtre bilingue", "Journée immersion anglaise", "Conférences bilinguisme"],
        en: ["Spelling contest", "Bilingual parliamentary debates", "Bilingual theater", "English immersion day", "Bilingualism conferences"]
      },
      color: "from-blue-500 to-indigo-500", icon: Globe,
      bgGradient: "bg-gradient-to-br from-blue-400 to-indigo-500", status: "past"
    },
    {
      id: 5,
      title: { fr: "Semaine de la Langue Maternelle", en: "Mother Tongue Week" },
      date: { fr: "21 — 25 avril 2026", en: "Apr 21 — 25, 2026" },
      month: "avril", day: "21", year: "2026",
      type: { fr: "Culture", en: "Culture" },
      description: {
        fr: "Célébration de la diversité linguistique du Cameroun.",
        en: "Celebration of Cameroon's linguistic diversity."
      },
      activities: {
        fr: ["Concours de contes", "Exposition gastronomie", "Spectacles ethniques", "Ateliers alphabets locaux", "Conférences préservation"],
        en: ["Storytelling contest", "Gastronomy exhibition", "Ethnic shows", "Local alphabet workshops", "Preservation conferences"]
      },
      color: "from-amber-500 to-yellow-600", icon: Music,
      bgGradient: "bg-gradient-to-br from-amber-400 to-yellow-500", status: "upcoming"
    },
    {
      id: 6,
      title: { fr: "Fête des Mères et des Pères", en: "Mother's & Father's Day" },
      date: { fr: "Mai & Juin 2026", en: "May & Jun 2026" },
      month: "mai", day: "??", year: "2026",
      type: { fr: "Famille", en: "Family" },
      description: {
        fr: "Double célébration honorant les parents d'élèves du LYBIBAL.",
        en: "Double celebration honoring LYBIBAL students' parents."
      },
      activities: {
        fr: ["Remise diplômes aux mères", "Concours parents modèles", "Spectacle des élèves", "Repas de communion", "Cadeaux aux parents"],
        en: ["Diplomas for mothers", "Model parents contest", "Student show", "Communion meal", "Gifts for parents"]
      },
      color: "from-rose-400 to-pink-600", icon: Heart,
      bgGradient: "bg-gradient-to-br from-rose-300 to-pink-500", status: "upcoming"
    },
    {
      id: 7,
      title: { fr: "Fête de la Réunification", en: "Reunification Day" },
      date: { fr: "1er octobre 2026", en: "Oct 1, 2026" },
      month: "octobre", day: "01", year: "2026",
      type: { fr: "Fête nationale", en: "National Holiday" },
      description: {
        fr: "Commémoration de la réunification du Cameroun anglophone et francophone.",
        en: "Commemoration of the reunification of Anglophone and Francophone Cameroon."
      },
      activities: {
        fr: ["Cérémonie deux hymnes", "Débat historique", "Exposition photo", "Spectacle bilingue", "Concours réunification"],
        en: ["Two anthems ceremony", "Historical debate", "Photo exhibition", "Bilingual show", "Reunification contest"]
      },
      color: "from-red-500 to-orange-500", icon: Sparkles,
      bgGradient: "bg-gradient-to-br from-red-400 to-orange-500", status: "upcoming"
    },
    {
      id: 8,
      title: { fr: "Journée des Enseignants", en: "Teachers' Day" },
      date: { fr: "5 octobre 2026", en: "Oct 5, 2026" },
      month: "octobre", day: "05", year: "2026",
      type: { fr: "Reconnaissance", en: "Recognition" },
      description: {
        fr: "Journée mondiale des enseignants dédiée au corps professoral du LYBIBAL.",
        en: "World Teachers' Day dedicated to the LYBIBAL teaching staff."
      },
      activities: {
        fr: ["Remise médailles", "Discours élèves", "Spectacle reconnaissance", "Buffet administration", "Moments de partage"],
        en: ["Medal ceremony", "Students' speeches", "Recognition show", "Administration buffet", "Sharing moments"]
      },
      color: "from-violet-500 to-purple-600", icon: GraduationCap,
      bgGradient: "bg-gradient-to-br from-violet-400 to-purple-600", status: "upcoming"
    },
    {
      id: 9,
      title: { fr: "Journée Porte Ouverte", en: "Open House Day" },
      date: { fr: "15 novembre 2026", en: "Nov 15, 2026" },
      month: "novembre", day: "15", year: "2026",
      type: { fr: "Ouverture", en: "Openness" },
      description: {
        fr: "Le LYBIBAL ouvre ses portes aux parents, futurs élèves et partenaires.",
        en: "LYBIBAL opens its doors to parents, future students and partners."
      },
      activities: {
        fr: ["Visite laboratoires", "Présentation résultats", "Démonstrations projets", "Stand admissions", "Rencontre proviseur"],
        en: ["Lab tours", "Results presentation", "Project demonstrations", "Admissions booth", "Meet the principal"]
      },
      color: "from-cyan-500 to-blue-600", icon: DoorOpen,
      bgGradient: "bg-gradient-to-br from-cyan-400 to-blue-600", status: "upcoming"
    },
    {
      id: 10,
      title: { fr: "Journée de l'Entrepreneuriat au LYBIBAL", en: "Entrepreneurship Day at LYBIBAL" },
      date: { fr: "15 décembre 2026", en: "Dec 15, 2026" },
      month: "décembre", day: "15", year: "2026",
      type: { fr: "Innovation", en: "Innovation" },
      description: {
        fr: "Journée dédiée à la promotion de l'esprit entrepreneurial chez les élèves.",
        en: "Day dedicated to promoting the entrepreneurial spirit among students."
      },
      activities: {
        fr: ["Concours business plan", "Ateliers start-ups", "Conférences entrepreneurs", "Foire projets innovants", "Prix Jeune Entrepreneur"],
        en: ["Business plan contest", "Start-up workshops", "Entrepreneur conferences", "Innovative projects fair", "Young Entrepreneur Award"]
      },
      color: "from-school-gold to-yellow-500", icon: Briefcase,
      bgGradient: "bg-gradient-to-br from-yellow-400 to-amber-500", status: "upcoming"
    }
  ]

  // ── Valeurs uniques pour les filtres ──
  const types = ['all', ...Array.from(new Set(events.map(e => e.type[lang])))]
  const months = ['all', ...Array.from(new Set(events.map(e => e.month)))]
  const years = ['all', ...Array.from(new Set(events.map(e => e.year)))]

  // ── Filtrage et tri ──
  const filteredEvents = useMemo(() => {
    let result = [...events]

    if (filterStatus !== 'all') {
      result = result.filter(e => e.status === filterStatus)
    }
    if (filterType !== 'all') {
      result = result.filter(e => e.type[lang] === filterType)
    }
    if (filterMonth !== 'all') {
      result = result.filter(e => e.month === filterMonth)
    }
    if (filterYear !== 'all') {
      result = result.filter(e => e.year === filterYear)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(e =>
        e.title[lang].toLowerCase().includes(q) ||
        e.description[lang].toLowerCase().includes(q) ||
        e.type[lang].toLowerCase().includes(q) ||
        e.date[lang].toLowerCase().includes(q) ||
        e.month.toLowerCase().includes(q)
      )
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return (monthOrder[b.month] || 0) - (monthOrder[a.month] || 0)
        case 'date-asc':
          return (monthOrder[a.month] || 0) - (monthOrder[b.month] || 0)
        case 'name-asc':
          return a.title[lang].localeCompare(b.title[lang])
        case 'name-desc':
          return b.title[lang].localeCompare(a.title[lang])
        default:
          return 0
      }
    })

    return result
  }, [searchQuery, filterStatus, filterType, filterMonth, filterYear, sortBy, lang])

  const clearAll = () => {
    setSearchQuery('')
    setFilterStatus('all')
    setFilterType('all')
    setFilterMonth('all')
    setFilterYear('all')
    setSortBy('date-desc')
  }

  const activeFiltersCount = [
    filterStatus !== 'all',
    filterType !== 'all',
    filterMonth !== 'all',
    filterYear !== 'all',
    sortBy !== 'date-desc'
  ].filter(Boolean).length

  const getStatusLabel = (status: EventStatus) => {
    if (status === 'upcoming') return L.statusUpcoming
    if (status === 'past') return L.statusPast
    return ''
  }

  const getMonthLabel = (m: string) => {
    if (m === 'all') return L.allMonths
    return monthLabels[m]?.[lang] || m
  }

  // ── Composant placeholder image stable ──
  const ImagePlaceholder = ({ event, className = "" }: { event: EventItem; className?: string }) => (
    <div className={`${event.bgGradient} flex items-center justify-center ${className}`}>
      <div className="text-center text-white/80">
        <event.icon className="h-10 w-10 mx-auto mb-2 opacity-60" />
        <p className="text-xs font-medium opacity-70">{event.type[lang]}</p>
      </div>
    </div>
  )

  return (
    <div className="animate-fade-in">
      {/* Hero avec slogan */}
      <section className="bg-school-blue text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-school-gold rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-school-gold rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <Calendar className="h-14 w-14 text-school-gold mx-auto mb-4" />
          <h1 className="text-3xl lg:text-5xl font-bold mb-4">{L.pageTitle}</h1>
          <div className="inline-flex items-center gap-3 bg-school-gold/20 backdrop-blur-md border border-school-gold/40 rounded-full px-6 py-2.5 mb-6">
            <Star className="h-4 w-4 text-school-gold animate-pulse" />
            <span className="text-school-gold font-bold text-sm tracking-wide uppercase">{L.slogan}</span>
            <Star className="h-4 w-4 text-school-gold animate-pulse" />
          </div>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">{L.pageSubtitle}</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* BARRE DE RECHERCHE ET FILTRES */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={L.searchPlaceholder}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-school-blue focus:border-school-blue outline-none transition-all text-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors">
                  <XCircle className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
                showFilters || activeFiltersCount > 0 ? 'bg-school-blue text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {L.filters}
              {activeFiltersCount > 0 && (
                <span className="bg-school-gold text-school-blue text-xs px-1.5 py-0.5 rounded-full font-bold">{activeFiltersCount}</span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtre statut */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <Filter className="h-4 w-4 text-school-blue" />{L.status}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['all', 'upcoming', 'past'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        filterStatus === s ? 'bg-school-blue text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {s === 'all' ? L.all : s === 'upcoming' ? L.upcoming : L.past}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtre type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <Filter className="h-4 w-4 text-school-blue" />{L.category}
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-school-blue focus:border-school-blue outline-none bg-white"
                >
                  {types.map((t) => (
                    <option key={t} value={t}>{t === 'all' ? L.all : t}</option>
                  ))}
                </select>
              </div>

              {/* Filtre mois */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-school-blue" />{L.month}
                </label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-school-blue focus:border-school-blue outline-none bg-white capitalize"
                >
                  {months.map((m) => (
                    <option key={m} value={m}>{getMonthLabel(m)}</option>
                  ))}
                </select>
              </div>

              {/* Filtre année */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <CalendarRange className="h-4 w-4 text-school-gold" />{L.year}
                </label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-school-blue focus:border-school-blue outline-none bg-white"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y === 'all' ? L.allYears : y}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Ligne tri + résumé */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <SortAsc className="h-4 w-4 text-school-blue" />
                <span className="text-sm text-gray-600">{L.sortBy}</span>
              </div>
              <div className="flex gap-2">
                {[
                  { value: 'date-desc' as const, label: L.dateDesc },
                  { value: 'date-asc' as const, label: L.dateAsc },
                  { value: 'name-asc' as const, label: L.nameAsc },
                  { value: 'name-desc' as const, label: L.nameDesc },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSortBy(opt.value)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      sortBy === opt.value ? 'bg-school-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {(searchQuery || activeFiltersCount > 0) && (
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-school-blue">{filteredEvents.length}</span>{' '}
                  {filteredEvents.length > 1 ? L.eventsCount : L.eventCount}
                  {searchQuery && <span> {L.forQuery} « <span className="font-medium">{searchQuery}</span> »</span>}
                </p>
                <button onClick={clearAll} className="text-sm text-school-blue hover:text-school-gold font-medium flex items-center gap-1 transition-colors">
                  <XCircle className="h-4 w-4" />{L.reset}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Grille des événements */}
        {filteredEvents.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="group bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:border-school-gold/60 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() => setSelectedEvent(event)}
              >
                <div className={`h-32 bg-gradient-to-r ${event.color} relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-2 right-2 w-20 h-20 bg-white rounded-full blur-2xl" />
                    <div className="absolute bottom-2 left-2 w-16 h-16 bg-white rounded-full blur-xl" />
                  </div>

                  <div className="absolute top-3 right-3">
                    {event.status === 'upcoming' && (
                      <span className="px-2 py-1 bg-white/90 text-green-600 text-xs font-bold rounded-full flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />{L.statusUpcoming}
                      </span>
                    )}
                    {event.status === 'past' && (
                      <span className="px-2 py-1 bg-white/90 text-gray-500 text-xs font-bold rounded-full">{L.statusPast}</span>
                    )}
                  </div>

                  <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg">
                    <p className="text-xs font-bold text-gray-500 uppercase">{event.month.slice(0, 3)}</p>
                    <p className="text-2xl font-bold text-school-blue">{event.day}</p>
                  </div>

                  <div className="absolute bottom-3 right-3 p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                    <event.icon className="h-6 w-6 text-white" />
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-md">{event.type[lang]}</span>
                    <span className="text-xs text-gray-400">{event.year}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-school-blue transition-colors line-clamp-2">{event.title[lang]}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <Calendar className="h-4 w-4 text-school-gold" />
                    <span>{event.date[lang]}</span>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">{event.description[lang]}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{event.activities[lang].length} {L.activitiesLabel}</span>
                    <span className="inline-flex items-center gap-1 text-school-blue group-hover:text-school-gold text-sm font-semibold transition-colors">
                      {L.details}<ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">{L.noEvents}</h3>
            <p className="text-gray-500 mb-4">{L.noEventsDesc}</p>
            <button onClick={clearAll} className="bg-school-blue text-white hover:bg-[#162d4d] px-5 py-2.5 rounded-lg font-semibold transition-all hover:scale-105">{L.resetFilters}</button>
          </div>
        )}

        {/* GALERIE PLIABLE */}
        <div className="mt-16">
          <button
            onClick={() => setGalleryExpanded(!galleryExpanded)}
            className="w-full flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-school-blue/10 rounded-lg">
                <ImageIcon className="h-5 w-5 text-school-blue" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-gray-900 group-hover:text-school-blue transition-colors">{L.galleryTitle}</h2>
                <p className="text-sm text-gray-500">{events.length} {L.gallerySubtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 font-medium">{galleryExpanded ? L.collapse : L.expand}</span>
              {galleryExpanded ? <ChevronUp className="h-5 w-5 text-school-blue transition-transform" /> : <ChevronDown className="h-5 w-5 text-school-blue transition-transform" />}
            </div>
          </button>

          {galleryExpanded && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 animate-fade-in">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden shadow-sm border border-gray-200 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                  onClick={() => setGalleryEvent(event)}
                >
                  <ImagePlaceholder event={event} className="w-full h-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white font-bold text-xs line-clamp-2">{event.title[lang]}</p>
                    <p className="text-white/70 text-xs mt-0.5">{event.date[lang]}</p>
                  </div>
                  <div className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ZoomIn className="h-3.5 w-3.5 text-school-blue" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* POPUP DÉTAIL ÉVÉNEMENT */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedEvent(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className={`h-40 bg-gradient-to-r ${selectedEvent.color} relative overflow-hidden rounded-t-2xl`}>
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-4 right-4 w-32 h-32 bg-white rounded-full blur-3xl" />
              </div>
              <button onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/40 transition-colors z-10">
                <X className="h-5 w-5 text-white" />
              </button>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
                    <p className="text-xs font-bold text-gray-500 uppercase">{selectedEvent.month.slice(0, 3)}</p>
                    <p className="text-3xl font-bold text-school-blue">{selectedEvent.day}</p>
                  </div>
                  <div>
                    <span className="px-2 py-1 bg-white/90 text-gray-700 text-xs font-bold rounded-md">{selectedEvent.type[lang]}</span>
                    <h2 className="text-white font-bold text-xl mt-1 drop-shadow-lg">{selectedEvent.title[lang]}</h2>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-school-gold" /><span>{selectedEvent.date[lang]}</span></div>
                <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-school-gold" /><span>{L.where}</span></div>
                <div className="flex items-center gap-1.5"><Users className="h-4 w-4 text-school-gold" /><span>{L.who}</span></div>
              </div>
              <p className="text-gray-700 leading-relaxed text-sm mb-6">{selectedEvent.description[lang]}</p>
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-school-gold" />{L.activity}
                </h4>
                <div className="space-y-2">
                  {selectedEvent.activities[lang].map((activity, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-school-gold/5 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-school-blue/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-school-blue">{i + 1}</span>
                      </div>
                      <p className="text-sm text-gray-700">{activity}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSelectedEvent(null)} className="flex-1 bg-school-blue text-white hover:bg-[#162d4d] py-2.5 rounded-lg font-semibold transition-colors">{L.close}</button>
                <button
                  onClick={() => { setGalleryEvent(selectedEvent) }}
                  className="flex-1 border-2 border-school-blue text-school-blue hover:bg-school-blue/10 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <ImageIcon className="h-4 w-4" />{L.viewImages}
                </button>
                <button onClick={() => handleNavClick('/about', 'public')} className="flex-1 border-2 border-school-gold text-school-gold hover:bg-school-gold/10 py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                  {L.learnMore}<ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP GALERIE IMAGES */}
      {galleryEvent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setGalleryEvent(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${galleryEvent.color}`}>
                  <ImageIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{galleryEvent.title[lang]}</h3>
                  <p className="text-sm text-gray-500">{galleryEvent.date[lang]}</p>
                </div>
              </div>
              <button onClick={() => setGalleryEvent(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="col-span-2 md:col-span-3 relative aspect-video rounded-xl overflow-hidden group">
                  <ImagePlaceholder event={galleryEvent} className="w-full h-full" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-school-blue text-white text-xs font-bold rounded-lg">{L.mainImage}</div>
                </div>
                {galleryEvent.activities[lang].map((activity, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group bg-gray-100 border border-gray-200">
                    <ImagePlaceholder event={galleryEvent} className="w-full h-full opacity-70" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <p className="text-white text-xs font-medium">{activity}</p>
                    </div>
                    <div className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn className="h-3 w-3 text-school-blue" />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-sm text-gray-400 mt-4">{L.photosSoon}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}