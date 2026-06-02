import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Newspaper, Calendar, ArrowRight, X, FileText,
  ExternalLink, Download, ChevronRight, Search, Filter,
  BookOpen, GraduationCap, Award, FileSpreadsheet,
  Landmark, Clock, AlertTriangle, MapPin, Users,
  XCircle, SlidersHorizontal
} from 'lucide-react'
import { usePageVisit, recordPageVisit } from '../../hooks/usePageVisit'
import { useLang } from '../../hooks/useLang'

/* ───────────────────────────────────────────────
   Lycée Bilingue de Baleng — NewsPage V2
   Actualités MINESEC avec recherche professionnelle
   Bilingue FR/EN
   ─────────────────────────────────────────────── */

type NewsItem = {
  id: number
  type: string
  typeEn: string
  badgeColor: string
  icon: React.ElementType
  date: string
  title: string
  titleEn: string
  resume: string
  resumeEn: string
  detail: string
  detailEn: string
  link: string
  docLabel: string
  docLabelEn: string
  docUrl: string
  image: string
}

const t = {
  fr: {
    pageTitle: 'Actualités',
    pageSubtitle: 'Toutes les informations officielles du MINESEC et du Lycée Bilingue de Baleng',
    searchPlaceholder: 'Rechercher une actualité par titre, type, date ou contenu...',
    filtersBtn: 'Filtres',
    filterCategory: 'Filtrer par catégorie',
    sortByDate: 'Trier par date',
    recentFirst: 'Plus récent d\'abord',
    oldestFirst: 'Plus ancien d\'abord',
    resultsFound: 'résultat(s) trouvé(s)',
    forQuery: 'pour',
    inCategory: 'en',
    reset: 'Réinitialiser',
    resetSearch: 'Réinitialiser la recherche',
    noNewsFound: 'Aucune actualité trouvée',
    noNewsDesc: 'Aucun résultat ne correspond à votre recherche',
    seeMore: 'Voir plus',
    officialLink: 'Lien officiel MINESEC',
    officialDoc: 'Document officiel',
    source: 'Source : Ministère des Enseignements Secondaires — Cameroun',
    close: 'Fermer',
    minesecCameroon: 'MINESEC Cameroun',
    all: 'Tous',
  },
  en: {
    pageTitle: 'News',
    pageSubtitle: 'All official information from MINESEC and Lycée Bilingue de Baleng',
    searchPlaceholder: 'Search news by title, type, date or content...',
    filtersBtn: 'Filters',
    filterCategory: 'Filter by category',
    sortByDate: 'Sort by date',
    recentFirst: 'Most recent first',
    oldestFirst: 'Oldest first',
    resultsFound: 'result(s) found',
    forQuery: 'for',
    inCategory: 'in',
    reset: 'Reset',
    resetSearch: 'Reset search',
    noNewsFound: 'No news found',
    noNewsDesc: 'No results match your search',
    seeMore: 'See more',
    officialLink: 'Official MINESEC link',
    officialDoc: 'Official document',
    source: 'Source: Ministry of Secondary Education — Cameroon',
    close: 'Close',
    minesecCameroon: 'MINESEC Cameroon',
    all: 'All',
  }
}

export default function NewsPage() {
  const navigate = useNavigate()
  const { lang } = useLang()
  const txt = t[lang]

  usePageVisit('/news', 'public')

  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('Tous')
  const [sortOrder, setSortOrder] = useState<'recent' | 'ancien'>('recent')
  const [showFilters, setShowFilters] = useState(false)

  const handleNavClick = (path: string, category: string = 'public') => {
    recordPageVisit(path, category)
    navigate(path)
  }

  const newsItems: NewsItem[] = [
    {
      id: 1,
      type: 'Examens',
      typeEn: 'Exams',
      badgeColor: 'badge-blue',
      icon: BookOpen,
      date: '15 mai 2026',
      title: "Tirage au sort épreuve d'histoire ou de géographie pour Probatoire AF-F et BT IH 2026",
      titleEn: "Draw for history or geography exam for Probatoire AF-F and BT IH 2026",
      resume: "Le MINESEC procédera au tirage au sort des épreuves d'histoire-géographie pour les candidats du Probatoire série AF-F et du Brevet de technicien spécialité IH.",
      resumeEn: "MINESEC will proceed with the draw for history-geography exams for Probatoire series AF-F and Technician Certificate specialty IH candidates.",
      detail: "Le Ministère des Enseignements Secondaires informe les chefs d'établissements, les candidats et les parents d'élèves que le tirage au sort des épreuves d'histoire-géographie pour le Probatoire de l'enseignement général (séries AF-F) et le Brevet de technicien (spécialité IH) de la session 2026 aura lieu le 20 mai 2026 à 10h00 au siège du MINESEC à Yaoundé.",
      detailEn: "The Ministry of Secondary Education informs school principals, candidates and parents that the draw for history-geography exams for the General Education Probatoire (AF-F series) and Technician Certificate (IH specialty) of the 2026 session will take place on May 20, 2026 at 10:00 AM at the MINESEC headquarters in Yaoundé.",
      link: 'https://www.minesec.gov.cm/communiques/tirage-probatoire-ih-2026',
      docLabel: 'Arrêté N° 0126/MINESec/2026',
      docLabelEn: 'Decree No. 0126/MINESec/2026',
      docUrl: 'https://www.minesec.gov.cm/docs/arrete-tirage-probatoire-ih-2026.pdf',
      image: '/images/news/news1.jpg',
    },
    {
      id: 2,
      type: 'Examens',
      typeEn: 'Exams',
      badgeColor: 'badge-blue',
      icon: BookOpen,
      date: '15 mai 2026',
      title: "Tirage au sort épreuve d'histoire ou de géographie pour Baccalauréat AF-F et BT IH 2026",
      titleEn: "Draw for history or geography exam for Baccalaureate AF-F and BT IH 2026",
      resume: "Tirage au sort des épreuves d'histoire-géographie pour le Baccalauréat série AF-F et le Brevet de technicien IH 2026.",
      resumeEn: "Draw for history-geography exams for Baccalaureate series AF-F and Technician Certificate IH 2026.",
      detail: "Conformément au calendrier des examens officiels, le MINESEC organise le tirage au sort des épreuves d'histoire-géographie pour les candidats du Baccalauréat de l'enseignement général (séries AF-F) et du Brevet de technicien (spécialité IH). Les résultats du tirage seront publiés immédiatement sur le site du MINESEC.",
      detailEn: "In accordance with the official exam schedule, MINESEC organizes the draw for history-geography exams for General Education Baccalaureate (AF-F series) and Technician Certificate (IH specialty) candidates. The draw results will be published immediately on the MINESEC website.",
      link: 'https://www.minesec.gov.cm/communiques/tirage-bac-ih-2026',
      docLabel: 'Arrêté N° 0127/MINESec/2026',
      docLabelEn: 'Decree No. 0127/MINESec/2026',
      docUrl: 'https://www.minesec.gov.cm/docs/arrete-tirage-bac-ih-2026.pdf',
      image: '/images/news/news2.jpg',
    },
    {
      id: 3,
      type: 'Examens',
      typeEn: 'Exams',
      badgeColor: 'badge-blue',
      icon: BookOpen,
      date: '10 mai 2026',
      title: "Tirage au sort épreuve d'histoire ou de géographie pour Baccalauréat et BT STT 2026",
      titleEn: "Draw for history or geography exam for Baccalaureate and BT STT 2026",
      resume: "Tirage au sort des épreuves d'histoire-géographie pour le Baccalauréat et le BT STT session 2026.",
      resumeEn: "Draw for history-geography exams for Baccalaureate and BT STT 2026 session.",
      detail: "Le MINESEC porte à la connaissance des chefs d'établissements que le tirage au sort des épreuves d'histoire-géographie pour le Baccalauréat et le Brevet de technicien (série STT) de la session 2026 se tiendra le 18 mai 2026. Les épreuves retenues seront rendues publiques dès la fin de la cérémonie.",
      detailEn: "MINESEC informs school principals that the draw for history-geography exams for the Baccalaureate and Technician Certificate (STT series) of the 2026 session will take place on May 18, 2026. The selected exams will be made public immediately after the ceremony.",
      link: 'https://www.minesec.gov.cm/communiques/tirage-bac-stt-2026',
      docLabel: 'Communiqué N° 045/MINESec/2026',
      docLabelEn: 'Communiqué No. 045/MINESec/2026',
      docUrl: 'https://www.minesec.gov.cm/docs/communique-tirage-bac-stt-2026.pdf',
      image: '/images/news/news3.jpg',
    },
    {
      id: 4,
      type: 'Examens',
      typeEn: 'Exams',
      badgeColor: 'badge-green',
      icon: Award,
      date: '5 mai 2026',
      title: 'Dates des Brevets Professionnels industriels et Commerciaux 2026',
      titleEn: 'Dates for Industrial and Commercial Professional Certificates 2026',
      resume: "Publication du calendrier des examens des Brevets Professionnels industriels et commerciaux session 2026.",
      resumeEn: "Publication of the exam schedule for Industrial and Commercial Professional Certificates 2026 session.",
      detail: "Le MINESEC informe les candidats aux Brevets Professionnels (BP) industriels et commerciaux que les épreuves de la session 2026 se dérouleront du 15 juin au 10 juillet 2026. Les convocations seront disponibles dans les établissements d'accueil à partir du 1er juin 2026.",
      detailEn: "MINESEC informs candidates for Industrial and Commercial Professional Certificates (BP) that the 2026 session exams will take place from June 15 to July 10, 2026. Summons will be available at host institutions from June 1, 2026.",
      link: 'https://www.minesec.gov.cm/communiques/dates-bp-2026',
      docLabel: 'Note de service N° 089/MINESec/2026',
      docLabelEn: 'Service Note No. 089/MINESec/2026',
      docUrl: 'https://www.minesec.gov.cm/docs/note-bp-2026.pdf',
      image: '/images/news/news4.jpg',
    },
    {
      id: 5,
      type: 'Communiqué',
      typeEn: 'Communiqué',
      badgeColor: 'badge-gold',
      icon: FileText,
      date: '1 mai 2026',
      title: 'Communiqué MINESEC : Tirage au sort des épreuves de français et Philosophie pour le Bac général',
      titleEn: 'MINESEC Communiqué: Draw for French and Philosophy exams for General Baccalaureate',
      resume: "Tirage au sort des épreuves de français et de philosophie pour le Baccalauréat de l'enseignement général 2026.",
      resumeEn: "Draw for French and philosophy exams for the General Education Baccalaureate 2026.",
      detail: "Le Ministère des Enseignements Secondaires communique : le tirage au sort des épreuves de français et de philosophie pour le Baccalauréat de l'enseignement général (toutes séries) de la session 2026 aura lieu le 25 mai 2026 à 14h00 au siège du MINESEC. Les chefs d'établissements sont invités à suivre la cérémonie en direct sur la chaîne YouTube du MINESEC.",
      detailEn: "The Ministry of Secondary Education communicates: the draw for French and philosophy exams for the General Education Baccalaureate (all series) of the 2026 session will take place on May 25, 2026 at 2:00 PM at the MINESEC headquarters. School principals are invited to follow the ceremony live on the MINESEC YouTube channel.",
      link: 'https://www.minesec.gov.cm/communiques/tirage-francais-philosophie-2026',
      docLabel: 'Communiqué N° 042/MINESec/2026',
      docLabelEn: 'Communiqué No. 042/MINESec/2026',
      docUrl: 'https://www.minesec.gov.cm/docs/communique-tirage-fr-philo-2026.pdf',
      image: '/images/news/news5.jpg',
    },
    {
      id: 6,
      type: 'Examens',
      typeEn: 'Exams',
      badgeColor: 'badge-purple',
      icon: FileSpreadsheet,
      date: '28 avril 2026',
      title: 'Horaires de passage des épreuves du BAC Technique – Série F4/BA Génie civil',
      titleEn: 'Exam schedules for Technical BAC – F4/BA Civil Engineering series',
      resume: "Publication des horaires de passage des épreuves du Baccalauréat Technique série F4/BA Génie civil.",
      resumeEn: "Publication of exam schedules for Technical Baccalaureate F4/BA Civil Engineering series.",
      detail: "Le MINESEC publie les horaires de passage des épreuves du Baccalauréat Technique (série F4/BA – Génie civil, option Bâtiment) pour la session 2026. Les épreuves écrites débuteront le 22 juin 2026 et se termineront le 8 juillet 2026. Les épreuves pratiques se tiendront du 12 au 18 juillet 2026.",
      detailEn: "MINESEC publishes the exam schedules for the Technical Baccalaureate (F4/BA series – Civil Engineering, Building option) for the 2026 session. Written exams will begin on June 22, 2026 and end on July 8, 2026. Practical exams will take place from July 12 to 18, 2026.",
      link: 'https://www.minesec.gov.cm/communiques/horaires-bac-f4-2026',
      docLabel: 'Arrêté N° 0115/MINESec/2026',
      docLabelEn: 'Decree No. 0115/MINESec/2026',
      docUrl: 'https://www.minesec.gov.cm/docs/arrete-horaires-f4-2026.pdf',
      image: '/images/news/news6.jpg',
    },
    {
      id: 7,
      type: 'Examens',
      typeEn: 'Exams',
      badgeColor: 'badge-red',
      icon: Calendar,
      date: '20 avril 2026',
      title: 'Horaires de passages des épreuves BEPC, Probatoire, Bac Général',
      titleEn: 'Exam schedules for BEPC, Probatoire, General Baccalaureate',
      resume: "Publication officielle des horaires de passage des examens BEPC, Probatoire et Baccalauréat général 2026.",
      resumeEn: "Official publication of exam schedules for BEPC, Probatoire and General Baccalaureate 2026.",
      detail: "Le MINESEC porte à la connaissance des chefs d'établissements, des candidats et des parents d'élèves les horaires de passage des épreuves suivantes : BEPC (juin 2026), Probatoire (juin 2026), Baccalauréat général (juillet 2026). Les épreuves débuteront à 7h30 précises dans tous les centres d'examen.",
      detailEn: "MINESEC informs school principals, candidates and parents of the exam schedules for: BEPC (June 2026), Probatoire (June 2026), General Baccalaureate (July 2026). Exams will begin at 7:30 AM sharp in all examination centers.",
      link: 'https://www.minesec.gov.cm/communiques/horaires-bepc-prob-bac-2026',
      docLabel: 'Arrêté N° 0110/MINESec/2026',
      docLabelEn: 'Decree No. 0110/MINESec/2026',
      docUrl: 'https://www.minesec.gov.cm/docs/arrete-horaires-bepc-prob-bac-2026.pdf',
      image: '/images/news/news7.jpg',
    },
    {
      id: 8,
      type: 'Examens',
      typeEn: 'Exams',
      badgeColor: 'badge-orange',
      icon: GraduationCap,
      date: '15 avril 2026',
      title: 'Information sur les examens section anglophone – GCE O-Level et A-Level 2026',
      titleEn: 'Information on anglophone section exams – GCE O-Level and A-Level 2026',
      resume: "Informations importantes concernant les examens GCE O-Level et A-Level de la section anglophone 2026.",
      resumeEn: "Important information regarding GCE O-Level and A-Level exams for the anglophone section 2026.",
      detail: "Le MINESEC informe les chefs d'établissements de la section anglophone que les examens GCE O-Level et A-Level de la session 2026 se dérouleront selon le calendrier suivant : GCE O-Level (juin 2026), GCE A-Level (juillet 2026). Les inscriptions sont ouvertes du 15 avril au 15 mai 2026. Les frais d'inscription s'élèvent à 15.000 FCFA pour le O-Level et 20.000 FCFA pour le A-Level.",
      detailEn: "MINESEC informs anglophone section school principals that GCE O-Level and A-Level exams for the 2026 session will follow this schedule: GCE O-Level (June 2026), GCE A-Level (July 2026). Registrations are open from April 15 to May 15, 2026. Registration fees are 15,000 FCFA for O-Level and 20,000 FCFA for A-Level.",
      link: 'https://www.minesec.gov.cm/communiques/gce-2026',
      docLabel: 'Circulaire N° 056/MINESec/2026',
      docLabelEn: 'Circular No. 056/MINESec/2026',
      docUrl: 'https://www.minesec.gov.cm/docs/circulaire-gce-2026.pdf',
      image: '/images/news/news8.jpg',
    },
    {
      id: 9,
      type: 'Calendrier',
      typeEn: 'Calendar',
      badgeColor: 'badge-blue',
      icon: Clock,
      date: '15 avril 2026',
      title: 'MINESEC réajuste le calendrier des activités pédagogiques 2025-2026',
      titleEn: 'MINESEC readjusts the 2025-2026 academic activity calendar',
      resume: "Report de la rentrée du 3ème trimestre au 27 avril 2026 suite aux jeux FENASCO et visite du pape Léon XIV.",
      resumeEn: "Postponement of the 3rd term start to April 27, 2026 due to FENASCO games and Pope Leo XIV visit.",
      detail: "Le ministre des Enseignements Secondaires, Pauline Nalova Lyonga, a réajusté le calendrier scolaire suite au report de la rentrée du troisième trimestre au 27 avril 2026 (initialement prévue le 20 avril). Ce report est lié au glissement des jeux FENASCO et à la visite du pape Léon XIV au Cameroun du 15 au 18 avril 2026. Les épreuves zéro sont reprogrammées du 28 au 29 avril et le 2 mai 2026. Les épreuves pratiques d'EPS se dérouleront du 30 avril au 19 mai 2026.",
      detailEn: "The Minister of Secondary Education, Pauline Nalova Lyonga, has readjusted the school calendar following the postponement of the third term start to April 27, 2026 (initially scheduled for April 20). This postponement is linked to the FENASCO games and Pope Leo XIV's visit to Cameroon from April 15 to 18, 2026. Zero exams are rescheduled for April 28-29 and May 2, 2026. PE practical exams will take place from April 30 to May 19, 2026.",
      link: 'https://fr.journalducameroun.com/cameroun-le-minesec-reajuste-le-calendrier-des-activites-pedagogiques/',
      docLabel: 'Correspondance ministérielle',
      docLabelEn: 'Ministerial correspondence',
      docUrl: 'https://www.minesec.gov.cm/docs/reajustement-calendrier-2026.pdf',
      image: '/images/news/news9.jpg',
    },
    {
      id: 10,
      type: 'FENASCO',
      typeEn: 'FENASCO',
      badgeColor: 'badge-green',
      icon: Users,
      date: '9 avril 2026',
      title: 'FENASCO 2026 : Les finales nationales à Bafoussam et Bangangté',
      titleEn: 'FENASCO 2026: National finals in Bafoussam and Bangangté',
      resume: "La 19ème édition des finales nationales des jeux scolaires FENASCO se déroulera du 19 au 26 avril 2026 à Bafoussam et Bangangté.",
      resumeEn: "The 19th edition of the FENASCO national school games finals will take place from April 19 to 26, 2026 in Bafoussam and Bangangté.",
      detail: "Le MINESEC annonce que la 19ème édition des finales nationales des jeux scolaires FENASCO (Fédération Nationale des Sports Scolaires) se dérouleront du 19 au 26 avril 2026 à Bafoussam et Bangangté, dans la région de l'Ouest. Ces jeux regroupent les meilleurs athlètes scolaires du Cameroun dans diverses disciplines sportives. Le Lycée Bilingue de Baleng participera à ces finales avec une délégation de 25 élèves-athlètes.",
      detailEn: "MINESEC announces that the 19th edition of the FENASCO national school games finals (National Federation of School Sports) will take place from April 19 to 26, 2026 in Bafoussam and Bangangté, in the West region. These games bring together the best school athletes from Cameroon in various sports disciplines. Lycée Bilingue de Baleng will participate in these finals with a delegation of 25 student-athletes.",
      link: 'https://www.newsducamer.com/minesec-le-pape-leon-xiv-fait-reporter-la-rentree-du-3eme-trimestre/',
      docLabel: 'Communiqué FENASCO 2026',
      docLabelEn: 'FENASCO 2026 Communiqué',
      docUrl: 'https://www.minesec.gov.cm/docs/fenasco-2026.pdf',
      image: '/images/news/news10.jpg',
    },
    {
      id: 11,
      type: 'Sécurité',
      typeEn: 'Security',
      badgeColor: 'badge-red',
      icon: AlertTriangle,
      date: '29 octobre 2025',
      title: 'MINESEC : Démenti sur la suspension des cours dans des établissements',
      titleEn: 'MINESEC: Denial regarding suspension of classes in institutions',
      resume: "Le ministre Pauline Nalova Lyonga dément formellement un faux communiqué annonçant la suspension des activités scolaires.",
      resumeEn: "Minister Pauline Nalova Lyonga formally denies a fake communiqué announcing the suspension of school activities.",
      detail: "Le ministre des Enseignements Secondaires, Pauline Nalova Lyonga, dément formellement l'authenticité d'un faux communiqué annonçant la suspension des activités dans des établissements scolaires. Aucune directive officielle n'a été émise à cet effet. Le MINESEC invite la communauté éducative à ignorer tout document non autorisé et à signaler tout cas suspect. Des mesures sont prises pour traiter des cas isolés en raison de la situation sécuritaire locale.",
      detailEn: "The Minister of Secondary Education, Pauline Nalova Lyonga, formally denies the authenticity of a fake communiqué announcing the suspension of activities in school institutions. No official directive has been issued for this purpose. MINESEC invites the educational community to ignore any unauthorized document and to report any suspicious case. Measures are being taken to handle isolated cases due to the local security situation.",
      link: 'https://fr.journalducameroun.com/cameroun-le-minesec-dement-la-suspension-des-cours-dans-des-etablissements-scolaires/',
      docLabel: "Note d'information MINESEC",
      docLabelEn: 'MINESEC Information Note',
      docUrl: 'https://www.minesec.gov.cm/docs/dementi-suspension-cours.pdf',
      image: '/images/news/news11.jpg',
    },
    {
      id: 12,
      type: 'Rentrée',
      typeEn: 'Back to School',
      badgeColor: 'badge-gold',
      icon: MapPin,
      date: '8 septembre 2025',
      title: 'Rentrée scolaire 2025-2026 : 2 454 600 élèves dans 5 119 établissements',
      titleEn: '2025-2026 school year: 2,454,600 students in 5,119 institutions',
      resume: "La rentrée scolaire 2025-2026 est effective avec un thème sur l'IA et le digital. Le MINESEC dévoile les chiffres clés.",
      resumeEn: "The 2025-2026 school year is effective with a theme on AI and digital. MINESEC reveals the key figures.",
      detail: "La rentrée scolaire 2025-2026 s'est ouverte le 8 septembre 2025 sous le thème : « Sécurité, santé et apprentissage à l'ère de l'Intelligence Artificielle ». Le ministre Pauline Nalova Lyonga a dévoilé les chiffres clés : 2 454 600 élèves inscrits dans 2 930 établissements publics et 2 189 établissements privés, soit 5 119 établissements secondaires au total. La ministre a assisté à des leçons digitalisées au Lycée Technique de Génie Civil d'Ekounou, soulignant l'importance du digital dans l'amélioration des performances scolaires.",
      detailEn: "The 2025-2026 school year opened on September 8, 2025 under the theme: 'Safety, health and learning in the era of Artificial Intelligence'. Minister Pauline Nalova Lyonga revealed the key figures: 2,454,600 students enrolled in 2,930 public institutions and 2,189 private institutions, totaling 5,119 secondary institutions. The minister attended digitized lessons at the Civil Engineering Technical High School of Ekounou, emphasizing the importance of digital in improving school performance.",
      link: 'https://www.minesec.gov.cm/web/index.php/fr/actualites/664-la-nouvelle-annee-scolaire-est-effective',
      docLabel: 'Rapport rentrée 2025-2026',
      docLabelEn: '2025-2026 Back to School Report',
      docUrl: 'https://www.minesec.gov.cm/docs/rentree-2025-2026.pdf',
      image: '/images/news/news12.jpg',
    },
  ]

  // ── Types uniques pour le filtre ──
  const types = [txt.all, ...Array.from(new Set(newsItems.map(n => lang === 'fr' ? n.type : n.typeEn)))]

  // ── Filtrage et tri ──
  const filteredNews = useMemo(() => {
    let result = [...newsItems]

    // Filtre par type
    if (filterType !== txt.all && filterType !== 'Tous') {
      result = result.filter(n => (lang === 'fr' ? n.type : n.typeEn) === filterType)
    }

    // Recherche textuelle
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(n => {
        const title = lang === 'fr' ? n.title : n.titleEn
        const resume = lang === 'fr' ? n.resume : n.resumeEn
        const detail = lang === 'fr' ? n.detail : n.detailEn
        const type = lang === 'fr' ? n.type : n.typeEn
        return (
          title.toLowerCase().includes(q) ||
          resume.toLowerCase().includes(q) ||
          detail.toLowerCase().includes(q) ||
          type.toLowerCase().includes(q) ||
          n.date.toLowerCase().includes(q)
        )
      })
    }

    // Tri par date
    const parseDate = (d: string) => {
      const monthsFr: Record<string, string> = {
        'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
        'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
        'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
      }
      const parts = d.split(' ')
      const day = parts[0].padStart(2, '0')
      const month = monthsFr[parts[1]] || '01'
      const year = parts[2]
      return `${year}-${month}-${day}`
    }

    result.sort((a, b) => {
      const da = parseDate(a.date)
      const db = parseDate(b.date)
      return sortOrder === 'recent' ? (db > da ? 1 : -1) : (da > db ? 1 : -1)
    })

    return result
  }, [searchQuery, filterType, sortOrder, lang, txt.all])

  const clearSearch = () => {
    setSearchQuery('')
    setFilterType(txt.all)
    setSortOrder('recent')
  }

  // Reset filter type when language changes
  useMemo(() => {
    setFilterType(txt.all)
  }, [lang])

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="bg-school-blue text-white py-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-school-gold rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <Newspaper className="h-12 w-12 text-school-gold mx-auto mb-4" />
          <h1 className="text-3xl lg:text-4xl font-bold mb-3">{txt.pageTitle}</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            {txt.pageSubtitle}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <Newspaper className="h-8 w-8 text-primary-600" />
          {txt.pageTitle}
        </h1>

        {/* ═══════════════════════════════════════════
            BARRE DE RECHERCHE PROFESSIONNELLE
            ═══════════════════════════════════════════ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          {/* Ligne principale : recherche + bouton filtres */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={txt.searchPlaceholder}
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-school-blue focus:border-school-blue outline-none transition-all text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XCircle className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
                showFilters || (filterType !== txt.all && filterType !== 'Tous') || sortOrder !== 'recent'
                  ? 'bg-school-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {txt.filtersBtn}
              {(filterType !== txt.all && filterType !== 'Tous') && sortOrder !== 'recent' && (
                <span className="bg-school-gold text-school-blue text-xs px-1.5 py-0.5 rounded-full font-bold">
                  2
                </span>
              )}
              {((filterType !== txt.all && filterType !== 'Tous') || sortOrder !== 'recent') && !((filterType !== txt.all && filterType !== 'Tous') && sortOrder !== 'recent') && (
                <span className="bg-school-gold text-school-blue text-xs px-1.5 py-0.5 rounded-full font-bold">
                  1
                </span>
              )}
            </button>
          </div>

          {/* Panneau filtres avancés */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid sm:grid-cols-2 gap-4">
              {/* Filtre par type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <Filter className="h-4 w-4 text-school-blue" />
                  {txt.filterCategory}
                </label>
                <div className="flex flex-wrap gap-2">
                  {types.map((t) => (
                    <button
                      key={t}
                      onClick={() => setFilterType(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        filterType === t
                          ? 'bg-school-blue text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tri */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-school-blue" />
                  {txt.sortByDate}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortOrder('recent')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      sortOrder === 'recent'
                        ? 'bg-school-blue text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {txt.recentFirst}
                  </button>
                  <button
                    onClick={() => setSortOrder('ancien')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      sortOrder === 'ancien'
                        ? 'bg-school-blue text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {txt.oldestFirst}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Résumé des filtres actifs */}
          {(searchQuery || (filterType !== txt.all && filterType !== 'Tous') || sortOrder !== 'recent') && (
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-school-blue">{filteredNews.length}</span> {txt.resultsFound}
                {searchQuery && <span> {txt.forQuery} « <span className="font-medium">{searchQuery}</span> »</span>}
                {(filterType !== txt.all && filterType !== 'Tous') && <span> {txt.inCategory} <span className="font-medium">{filterType}</span></span>}
              </p>
              <button
                onClick={clearSearch}
                className="text-sm text-school-blue hover:text-school-gold font-medium flex items-center gap-1 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                {txt.reset}
              </button>
            </div>
          )}
        </div>

        {/* Grille des actualités */}
        {filteredNews.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNews.map((news) => {
              const displayTitle = lang === 'fr' ? news.title : news.titleEn
              const displayResume = lang === 'fr' ? news.resume : news.resumeEn
              const displayType = lang === 'fr' ? news.type : news.typeEn
              return (
                <div
                  key={news.id}
                  className="card hover:shadow-lg transition-all duration-300 hover:scale-[1.01] cursor-pointer hover:border-2 hover:border-school-gold/60"
                  onClick={() => setSelectedNews(news)}
                >
                  {/* Image */}
                  <div className="h-48 bg-gray-200 rounded-t-xl relative overflow-hidden">
                    <img
                      src={news.image}
                      alt={displayTitle}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-school-blue/5"><svg class="h-12 w-12 text-school-blue/20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg></div>`
                        }
                      }}
                    />
                  </div>

                  <div className="card-body">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`${news.badgeColor} text-xs`}>{displayType}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {news.date}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {displayTitle}
                    </h3>
                    <p className="text-gray-500 text-sm mb-3 line-clamp-3">
                      {displayResume}
                    </p>
                    <button className="inline-flex items-center gap-1.5 text-school-blue hover:text-school-gold text-sm font-semibold transition-colors">
                      {txt.seeMore}
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Aucun résultat */
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{txt.noNewsFound}</h3>
            <p className="text-gray-500 mb-4">
              {txt.noNewsDesc} « <span className="font-medium">{searchQuery}</span> »
              {(filterType !== txt.all && filterType !== 'Tous') && <span> {txt.inCategory} <span className="font-medium">{filterType}</span></span>}
            </p>
            <button
              onClick={clearSearch}
              className="bg-school-blue text-white hover:bg-[#162d4d] px-5 py-2.5 rounded-lg font-semibold transition-all hover:scale-105"
            >
              {txt.resetSearch}
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          POPUP DÉTAIL ACTUALITÉ
          ═══════════════════════════════════════════ */}
      {selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedNews(null)}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header image */}
            <div className="relative h-48 bg-gray-100 rounded-t-2xl overflow-hidden">
              <img
                src={selectedNews.image}
                alt={lang === 'fr' ? selectedNews.title : selectedNews.titleEn}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

              <span className={`absolute top-4 left-4 ${selectedNews.badgeColor} text-xs`}>
                {lang === 'fr' ? selectedNews.type : selectedNews.typeEn}
              </span>

              <button
                onClick={() => setSelectedNews(null)}
                className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/40 transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>

              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-white font-bold text-lg leading-snug drop-shadow-lg">
                  {lang === 'fr' ? selectedNews.title : selectedNews.titleEn}
                </h2>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              {/* Méta */}
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-school-gold" />
                  <span>{selectedNews.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Landmark className="h-4 w-4 text-school-gold" />
                  <span>{txt.minesecCameroon}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-school-gold" />
                  <span>{lang === 'fr' ? selectedNews.docLabel : selectedNews.docLabelEn}</span>
                </div>
              </div>

              {/* Texte détaillé */}
              <p className="text-gray-700 leading-relaxed text-sm mb-6">
                {lang === 'fr' ? selectedNews.detail : selectedNews.detailEn}
              </p>

              {/* Liens */}
              <div className="space-y-3">
                <a
                  href={selectedNews.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-school-blue/5 rounded-lg border border-school-blue/10 hover:bg-school-blue/10 transition-colors group"
                >
                  <div className="p-2 bg-school-blue/10 rounded-lg group-hover:bg-school-blue/20 transition-colors">
                    <ExternalLink className="h-5 w-5 text-school-blue" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-school-blue">{txt.officialLink}</p>
                    <p className="text-xs text-gray-500">{selectedNews.link}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-school-blue transition-colors" />
                </a>

                <a
                  href={selectedNews.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-school-gold/5 rounded-lg border border-school-gold/10 hover:bg-school-gold/10 transition-colors group"
                >
                  <div className="p-2 bg-school-gold/10 rounded-lg group-hover:bg-school-gold/20 transition-colors">
                    <Download className="h-5 w-5 text-school-gold" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-school-gold">{txt.officialDoc}</p>
                    <p className="text-xs text-gray-500">{lang === 'fr' ? selectedNews.docLabel : selectedNews.docLabelEn} — PDF</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-school-gold transition-colors" />
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {txt.source}
              </p>
              <button
                onClick={() => setSelectedNews(null)}
                className="px-4 py-2 bg-school-blue text-white text-sm rounded-lg hover:bg-[#162d4d] transition-colors"
              >
                {txt.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}