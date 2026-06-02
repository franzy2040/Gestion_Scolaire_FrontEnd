import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageSquare, Search, ThumbsUp, MessageCircle, Share2, Bookmark,
  Filter, XCircle, TrendingUp, Clock, User, ChevronDown, ChevronUp,
  Eye, Hash, ArrowRight, Send, MoreHorizontal, Flag,
  GraduationCap, AlertTriangle, BookOpen, Users, DollarSign,
  Globe, Shield, Zap, Brain, School, BarChart3, Trophy, X
} from 'lucide-react'
import { usePageVisit, recordPageVisit } from '../../hooks/usePageVisit'
import { useLang } from '../../hooks/useLang'

/* ───────────────────────────────────────────────
   Lycée Bilingue de Baleng — ForumPage V2
   Forum de discussion style LinkedIn — sans connexion
   Sujets réels de l'éducation au Cameroun
   + BILINGUAL FR/EN
   ─────────────────────────────────────────────── */

type Lang = 'fr' | 'en'

type Comment = {
  id: number
  author: string
  avatar: string
  role: string
  content: string
  likes: number
  time: string
}

type Topic = {
  id: number
  author: string
  avatar: string
  role: string
  time: string
  category: { fr: string; en: string }
  categoryColor: string
  title: { fr: string; en: string }
  content: { fr: string; en: string }
  likes: number
  comments: Comment[]
  views: number
  tags: string[]
  icon: React.ElementType
}

const t = {
  fr: {
    pageTitle: 'Forum du LYBIBAL',
    pageSubtitle: "Échangez, débattez et partagez sur l'éducation au Cameroun — Sans inscription",
    searchPlaceholder: 'Rechercher une discussion par titre, auteur, tag...',
    filters: 'Filtres',
    category: 'Catégorie',
    all: 'Tous',
    sortBy: 'Trier par',
    trending: 'Tendance',
    popular: 'Populaire',
    recent: 'Récent',
    reset: 'Réinitialiser',
    discussions: 'discussions',
    discussion: 'discussion',
    forQuery: 'pour',
    noTopics: 'Aucune discussion trouvée',
    noTopicsDesc: 'Aucun résultat ne correspond à votre recherche.',
    resetFilters: 'Réinitialiser',
    likes: 'likes',
    comments: 'commentaires',
    views: 'vues',
    reply: 'Répondre',
    replyAsGuest: "Répondre en tant qu'invité (sans connexion)",
    shareOpinion: 'Partagez votre opinion...',
    publish: 'Publier',
    close: 'Fermer',
    hoursAgo: 'Il y a {n} heure{plural}',
    daysAgo: 'Il y a {n} jour{plural}',
    weekAgo: 'Il y a 1 semaine',
    weeksAgo: 'Il y a {n} semaines',
  },
  en: {
    pageTitle: 'LYBIBAL Forum',
    pageSubtitle: 'Exchange, debate and share about education in Cameroon — No registration required',
    searchPlaceholder: 'Search a discussion by title, author, tag...',
    filters: 'Filters',
    category: 'Category',
    all: 'All',
    sortBy: 'Sort by',
    trending: 'Trending',
    popular: 'Popular',
    recent: 'Recent',
    reset: 'Reset',
    discussions: 'discussions',
    discussion: 'discussion',
    forQuery: 'for',
    noTopics: 'No discussions found',
    noTopicsDesc: 'No results match your search.',
    resetFilters: 'Reset',
    likes: 'likes',
    comments: 'comments',
    views: 'views',
    reply: 'Reply',
    replyAsGuest: 'Reply as guest (no login required)',
    shareOpinion: 'Share your opinion...',
    publish: 'Publish',
    close: 'Close',
    hoursAgo: '{n} hour{plural} ago',
    daysAgo: '{n} day{plural} ago',
    weekAgo: '1 week ago',
    weeksAgo: '{n} weeks ago',
  },
}

export default function ForumPage() {
  const navigate = useNavigate()
  const { lang } = useLang()
  const L = t[lang]

  usePageVisit('/forum', 'public')

  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('trending')
  const [showFilters, setShowFilters] = useState(false)
  const [likedTopics, setLikedTopics] = useState<Set<number>>(new Set())
  const [bookmarkedTopics, setBookmarkedTopics] = useState<Set<number>>(new Set())
  const [replyText, setReplyText] = useState('')

  const handleNavClick = (path: string, category: string = 'public') => {
    recordPageVisit(path, category)
    navigate(path)
  }

  const topics: Topic[] = [
    {
      id: 1,
      author: "Dr. Pauline Nalova Lyonga",
      avatar: "/images/avatars/ministre.jpg",
      role: lang === 'fr' ? "Ministre MINESEC" : "MINESEC Minister",
      time: lang === 'fr' ? "Il y a 2 heures" : "2 hours ago",
      category: { fr: "Politique éducative", en: "Education Policy" },
      categoryColor: "bg-blue-100 text-blue-700",
      title: {
        fr: "Taux de réussite au Bac 2024 : 37,2%, le plus bas depuis 20 ans. Comment inverser la courbe ?",
        en: "Baccalauréat 2024 pass rate: 37.2%, the lowest in 20 years. How to reverse the trend?"
      },
      content: {
        fr: "Les chiffres de l'OBC pour la session 2024 sont alarmants : sur 132 920 candidats, seuls 49 521 ont été admis (37,2%). Il faut remonter à 2004 pour trouver un résultat aussi faible. En 2023, nous avions atteint 75%. Cette chute drastique s'explique par plusieurs facteurs : la prolifération des réseaux sociaux chez les jeunes, l'indiscipline grandissante, le déficit d'enseignants dans les zones rurales (124 élèves/enseignant dans l'Extrême-Nord), et la faible qualité des apprentissages au primaire (72% des enfants ne peuvent pas lire une histoire simple). Le MINESEC lance un plan d'urgence : renforcement du digital (plateforme cartescolaire.cm), recrutement ciblé de 2 000 enseignants, et introduction de l'IA dans la pédagogie. Quelles solutions proposez-vous ?",
        en: "The OBC figures for the 2024 session are alarming: out of 132,920 candidates, only 49,521 were admitted (37.2%). We have to go back to 2004 to find such a low result. In 2023, we had reached 75%. This drastic drop is explained by several factors: the proliferation of social networks among young people, growing indiscipline, the deficit of teachers in rural areas (124 students/teacher in the Far North), and the poor quality of learning in primary school (72% of children cannot read a simple story). MINESEC is launching an emergency plan: digital strengthening (cartescolaire.cm platform), targeted recruitment of 2,000 teachers, and introduction of AI in pedagogy. What solutions do you propose?"
      },
      likes: 342,
      comments: [
        { id: 1, author: "M. Heuyam Claude", avatar: "/images/avatars/prov.jpg", role: lang === 'fr' ? "Proviseur LYBIBAL" : "LYBIBAL Principal", content: lang === 'fr' ? "Le LYBIBAL maintient 98% de réussite grâce au suivi individualisé. Il faut généraliser les tutorats et réduire les effectifs par classe." : "LYBIBAL maintains 98% pass rate thanks to individualized monitoring. Tutoring needs to be generalized and class sizes reduced.", likes: 89, time: lang === 'fr' ? "Il y a 1 heure" : "1 hour ago" },
        { id: 2, author: "Prof. Michel Tamo", avatar: "/images/avatars/prof1.jpg", role: "FESER", content: lang === 'fr' ? "Sans statut des enseignants et convention collective depuis 1964, impossible d'attirer les meilleurs. Le COREC réclame un Forum National de l'Éducation." : "Without teacher status and collective agreement since 1964, it is impossible to attract the best. COREC is demanding a National Education Forum.", likes: 156, time: lang === 'fr' ? "Il y a 45 min" : "45 min ago" },
      ],
      views: 1250,
      tags: ["#Bac2024", "#MINESEC", "#Réforme", "#Education"],
      icon: BarChart3,
    },
    {
      id: 2,
      author: "Collectif COREC",
      avatar: "/images/avatars/corec.jpg",
      role: lang === 'fr' ? "Syndicat enseignants" : "Teachers Union",
      time: lang === 'fr' ? "Il y a 5 heures" : "5 hours ago",
      category: { fr: "Grève & Revendications", en: "Strike & Demands" },
      categoryColor: "bg-red-100 text-red-700",
      title: {
        fr: "Opération 'Éducation en berne' : les enseignants camerounais à bout de souffle",
        en: "Operation 'Education at half-mast': Cameroonian teachers at breaking point"
      },
      content: {
        fr: "Depuis la rentrée 2025, le COREC (Collectif des Organisations des Enseignants du Cameroun) a entamé la 3ème phase de grève. Les revendications datent de 2012 : statut des enseignants, convention collective pour le privé (la dernière date de 1964 !), et Forum National de l'Éducation. Le gouvernement fait semblant d'ignorer nos doléances malgré les rendez-vous répétés. Le taux d'attrition atteint 5,3% (7,1% en milieu rural), et près de 9 000 enseignants sont détournés vers d'autres administrations. Comment peut-on construire un avenir avec des enseignants méprisés ?",
        en: "Since the start of the 2025 school year, COREC (Collective of Teachers' Organizations of Cameroon) has begun the 3rd phase of the strike. The demands date back to 2012: teacher status, collective agreement for the private sector (the last one dates from 1964!), and National Education Forum. The government pretends to ignore our grievances despite repeated meetings. The attrition rate reaches 5.3% (7.1% in rural areas), and nearly 9,000 teachers are diverted to other administrations. How can we build a future with despised teachers?"
      },
      likes: 567,
      comments: [
        { id: 1, author: "Mme Grace Ndjana", avatar: "/images/avatars/prof2.jpg", role: lang === 'fr' ? "Enseignante LYBIBAL" : "LYBIBAL Teacher", content: lang === 'fr' ? "Je gagne 180 000 FCFA après 15 ans de service. Comment rester motivée ? Le privé paie encore moins. C'est une honte." : "I earn 180,000 FCFA after 15 years of service. How to stay motivated? The private sector pays even less. It's a disgrace.", likes: 234, time: lang === 'fr' ? "Il y a 3 heures" : "3 hours ago" },
        { id: 2, author: "Parent d'élève", avatar: "/images/avatars/parent.jpg", role: lang === 'fr' ? "Parent" : "Parent", content: lang === 'fr' ? "Nos enfants sont pris en otage. Le gouvernement doit négocier sérieusement. L'éducation est l'avenir du pays." : "Our children are being held hostage. The government must negotiate seriously. Education is the future of the country.", likes: 178, time: lang === 'fr' ? "Il y a 2 heures" : "2 hours ago" },
      ],
      views: 3400,
      tags: ["#Grève", "#COREC", "#Enseignants", "#Salaires"],
      icon: AlertTriangle,
    },
    {
      id: 3,
      author: "Dr. Laurent Etoundi Ngoa",
      avatar: "/images/avatars/minedu.jpg",
      role: lang === 'fr' ? "Ministre MINEDUB" : "MINEDUB Minister",
      time: lang === 'fr' ? "Il y a 1 jour" : "1 day ago",
      category: { fr: "Innovation", en: "Innovation" },
      categoryColor: "bg-green-100 text-green-700",
      title: {
        fr: "Digitalisation de l'éducation : cartescolaire.cm et le paiement électronique des frais scolaires",
        en: "Education digitalization: cartescolaire.cm and electronic payment of school fees"
      },
      content: {
        fr: "Le MINESEC lance pour l'année 2024-2025 une révolution numérique : chaque élève de 6ème à Terminale reçoit un matricule unique. La plateforme cartescolaire.cm permet le paiement des frais via mobile money. Objectifs : lutter contre la distraction des fonds, les fraudes, et les longues files d'attente. Plus de 2 454 600 élèves sont concernés dans 5 119 établissements. Le LYBIBAL a déjà adopté le système. Quel est votre avis sur cette digitalisation ? Les zones rurales seront-elles incluses ?",
        en: "MINESEC is launching a digital revolution for the 2024-2025 school year: each student from 6th grade to 12th grade receives a unique registration number. The cartescolaire.cm platform allows fee payment via mobile money. Objectives: combat fund diversion, fraud, and long queues. More than 2,454,600 students are affected in 5,119 institutions. LYBIBAL has already adopted the system. What is your opinion on this digitalization? Will rural areas be included?"
      },
      likes: 289,
      comments: [
        { id: 1, author: "Technicien IT", avatar: "/images/avatars/tech.jpg", role: lang === 'fr' ? "Développeur" : "Developer", content: lang === 'fr' ? "Bonne initiative, mais la connectivité internet manque dans 60% des établissements ruraux. Il faut d'abord équiper en infras." : "Good initiative, but internet connectivity is lacking in 60% of rural institutions. Infrastructure must be equipped first.", likes: 67, time: lang === 'fr' ? "Il y a 12 heures" : "12 hours ago" },
      ],
      views: 980,
      tags: ["#Digital", "#CarteScolaire", "#Innovation", "#MINESEC"],
      icon: Zap,
    },
    {
      id: 4,
      author: "UNESCO Cameroun",
      avatar: "/images/avatars/unesco.jpg",
      role: lang === 'fr' ? "Organisation internationale" : "International Organization",
      time: lang === 'fr' ? "Il y a 3 jours" : "3 days ago",
      category: { fr: "Inclusion", en: "Inclusion" },
      categoryColor: "bg-purple-100 text-purple-700",
      title: {
        fr: "Inégalités scolaires : 77% des non-scolarisés sont issus des familles les plus pauvres",
        en: "School inequalities: 77% of out-of-school children come from the poorest families"
      },
      content: {
        fr: "Le rapport sectoriel 2022 révèle des inégalités criantes : 47% des adolescents en âge de fréquenter le 1er cycle secondaire sont en dehors des écoles. Les filles sont désavantagées (IPS 0,9 au primaire). Seuls 23,3% des enfants pauvres accèdent au 1er cycle secondaire contre 53,5% des riches. Dans les régions en crise (Nord-Ouest, Sud-Ouest, Extrême-Nord), 2 000 écoles sont sans effectifs. Le projet PAEQUE du GPE vise à réduire ces écarts. Comment le LYBIBAL, école d'excellence, peut-il contribuer à l'inclusion ?",
        en: "The 2022 sector report reveals glaring inequalities: 47% of adolescents of age to attend the first cycle of secondary school are out of school. Girls are disadvantaged (GPI 0.9 in primary school). Only 23.3% of poor children access the first cycle of secondary school compared to 53.5% of the rich. In crisis regions (North-West, South-West, Far-North), 2,000 schools have no students. The GPE's PAEQUE project aims to reduce these gaps. How can LYBIBAL, a school of excellence, contribute to inclusion?"
      },
      likes: 412,
      comments: [
        { id: 1, author: "ONG Education", avatar: "/images/avatars/ong.jpg", role: lang === 'fr' ? "Association" : "Association", content: lang === 'fr' ? "Le LYBIBAL pourrait créer un fonds de bourses pour les élèves des zones défavorisées. Le modèle 'un élève parrainé' fonctionne bien." : "LYBIBAL could create a scholarship fund for students from disadvantaged areas. The 'one sponsored student' model works well.", likes: 98, time: lang === 'fr' ? "Il y a 2 jours" : "2 days ago" },
      ],
      views: 2100,
      tags: ["#Inclusion", "#ODD4", "#Pauvreté", "#Filles"],
      icon: Users,
    },
    {
      id: 5,
      author: "Prof. Magloire Onana",
      avatar: "/images/avatars/prof3.jpg",
      role: lang === 'fr' ? "Chercheur ENS Yaoundé" : "Researcher ENS Yaoundé",
      time: lang === 'fr' ? "Il y a 4 jours" : "4 days ago",
      category: { fr: "Qualité", en: "Quality" },
      categoryColor: "bg-amber-100 text-amber-700",
      title: {
        fr: "Qualité de l'enseignement : 72% des enfants de CM2 ne lisent pas une histoire simple",
        en: "Teaching quality: 72% of 5th grade children cannot read a simple story"
      },
      content: {
        fr: "L'étude PASEC 2019 et la Banque Mondiale 2022 confirment : un élève sur deux ne sait ni lire ni calculer en fin de primaire. 72% des enfants en âge de fin de cycle primaire ne peuvent pas lire et comprendre une courte histoire (contre 58% dans les pays comparables). Le taux de transition primaire→secondaire est passé de 84% (2011) à 70% (2022). Les causes : surpopulation des classes (100+ élèves dans les ZEP), manque de manuels, et formation initiale insuffisante des enseignants. Le LYBIBAL, avec ses 98% de réussite, démontre que l'excellence est possible. Quelles sont ses recettes ?",
        en: "The PASEC 2019 study and the World Bank 2022 confirm: one in two students cannot read or calculate at the end of primary school. 72% of children of age at the end of the primary cycle cannot read and understand a short story (compared to 58% in comparable countries). The primary→secondary transition rate dropped from 84% (2011) to 70% (2022). Causes: overcrowded classes (100+ students in ZEP), lack of textbooks, and insufficient initial teacher training. LYBIBAL, with its 98% pass rate, demonstrates that excellence is possible. What are its recipes?"
      },
      likes: 378,
      comments: [
        { id: 1, author: "M. Heuyam Claude", avatar: "/images/avatars/prov.jpg", role: lang === 'fr' ? "Proviseur LYBIBAL" : "LYBIBAL Principal", content: lang === 'fr' ? "Recette du LYBIBAL : (1) Effectifs plafonnés à 45 élèves/classe, (2) Formation continue mensuelle des enseignants, (3) Suivi parental digitalisé, (4) Bibliothèque ouverte 7j/7." : "LYBIBAL recipe: (1) Class sizes capped at 45 students, (2) Monthly continuing education for teachers, (3) Digitalized parental monitoring, (4) Library open 7 days a week.", likes: 245, time: lang === 'fr' ? "Il y a 3 jours" : "3 days ago" },
      ],
      views: 1890,
      tags: ["#PASEC", "#Qualité", "#Lecture", "#LYBIBAL"],
      icon: BookOpen,
    },
    {
      id: 6,
      author: "Parent inquiet",
      avatar: "/images/avatars/parent2.jpg",
      role: lang === 'fr' ? "Parent d'élève" : "Parent",
      time: lang === 'fr' ? "Il y a 5 jours" : "5 days ago",
      category: { fr: "Sécurité", en: "Security" },
      categoryColor: "bg-red-100 text-red-700",
      title: {
        fr: "Crise sécuritaire dans les écoles : faux communiqués et menaces Boko Haram",
        en: "Security crisis in schools: fake announcements and Boko Haram threats"
      },
      content: {
        fr: "Le MINESEC a dû démentir un faux communiqué annonçant la suspension des cours (octobre 2025). Dans les régions du Nord-Ouest et Sud-Ouest, plus de 2000 écoles sont fermées. Boko Haram attaque toujours dans l'Extrême-Nord. Comment protéger nos enfants ? Le LYBIBAL à Bafoussam est relativement épargné, mais la psychose s'installe. Faut-il renforcer la sécurité dans tous les établissements ? Déployer des agents de sécurité formés ?",
        en: "MINESEC had to deny a fake announcement announcing the suspension of classes (October 2025). In the North-West and South-West regions, more than 2,000 schools are closed. Boko Haram still attacks in the Far North. How to protect our children? LYBIBAL in Bafoussam is relatively spared, but paranoia is setting in. Should security be strengthened in all institutions? Deploy trained security agents?"
      },
      likes: 198,
      comments: [
        { id: 1, author: "Gendarme", avatar: "/images/avatars/gendarme.jpg", role: lang === 'fr' ? "Forces de l'ordre" : "Law enforcement", content: lang === 'fr' ? "Le dispositif 'École sans violence' est en cours de déploiement. 500 écoles pilotes seront sécurisées d'ici 2026." : "The 'School without violence' system is being deployed. 500 pilot schools will be secured by 2026.", likes: 45, time: lang === 'fr' ? "Il y a 4 jours" : "4 days ago" },
      ],
      views: 1560,
      tags: ["#Sécurité", "#BokoHaram", "#NOSO", "#Écoles"],
      icon: Shield,
    },
    {
      id: 7,
      author: "Étudiant LYBIBAL",
      avatar: "/images/avatars/eleve.jpg",
      role: lang === 'fr' ? "Élève Tle C" : "12th Grade Student",
      time: lang === 'fr' ? "Il y a 6 jours" : "6 days ago",
      category: { fr: "Vie lycéenne", en: "School Life" },
      categoryColor: "bg-school-gold/20 text-school-gold",
      title: {
        fr: "Frais de scolarité : 32 500 FCFA annuel, mais les charges cachées explosent",
        en: "Tuition fees: 32,500 FCFA per year, but hidden charges explode"
      },
      content: {
        fr: "Le MINESEC a fixé les frais officiels (32 500 FCFA pour le 1er cycle, 45 000 FCFA pour le 3ème avec examen). Mais dans la réalité, les parents payent : manuels scolaires (15 000 FCFA), uniformes (10 000 FCFA), cotisations APEE (25 000 FCFA), frais de devoirs surveillés, et 'contributions' diverses. Total réel : souvent 100 000+ FCFA. La plateforme cartescolaire.cm devrait inclure toutes ces charges pour la transparence. Le LYBIBAL est-il plus transparent que les autres ?",
        en: "MINESEC has set the official fees (32,500 FCFA for the first cycle, 45,000 FCFA for 9th grade with exam). But in reality, parents pay for: textbooks (15,000 FCFA), uniforms (10,000 FCFA), APEE contributions (25,000 FCFA), supervised homework fees, and various 'contributions'. Real total: often 100,000+ FCFA. The cartescolaire.cm platform should include all these charges for transparency. Is LYBIBAL more transparent than others?"
      },
      likes: 267,
      comments: [
        { id: 1, author: "M. Heuyam Claude", avatar: "/images/avatars/prov.jpg", role: lang === 'fr' ? "Proviseur LYBIBAL" : "LYBIBAL Principal", content: lang === 'fr' ? "Au LYBIBAL, toutes les charges sont publiées sur le site et affichées au secrétariat. Nous pratiquons la gratuité des manuels en prêt. L'APEE est la seule cotisation obligatoire." : "At LYBIBAL, all charges are published on the website and displayed at the secretariat. We practice free textbook lending. APEE is the only mandatory contribution.", likes: 134, time: lang === 'fr' ? "Il y a 5 jours" : "5 days ago" },
      ],
      views: 2300,
      tags: ["#Frais", "#CarteScolaire", "#Transparence", "#Parents"],
      icon: DollarSign,
    },
    {
      id: 8,
      author: "Fédération FENASCO",
      avatar: "/images/avatars/fenasco.jpg",
      role: lang === 'fr' ? "Sports scolaires" : "School Sports",
      time: lang === 'fr' ? "Il y a 1 semaine" : "1 week ago",
      category: { fr: "Sport", en: "Sports" },
      categoryColor: "bg-green-100 text-green-700",
      title: {
        fr: "FENASCO 2026 : Bafoussam et Bangangté accueillent les finales nationales",
        en: "FENASCO 2026: Bafoussam and Bangangté host the national finals"
      },
      content: {
        fr: "La 19ème édition des finales nationales des jeux scolaires se déroule du 19 au 26 avril 2026 dans la région de l'Ouest. Le LYBIBAL participe avec 25 athlètes dans 8 disciplines. Les jeux FENASCO sont essentiels pour la cohésion nationale et la détection des talents sportifs. Cependant, le manque de financement limite la participation des écoles rurales. Le MINESEC a alloué 50 millions FCFA pour cette édition. Suffisant ?",
        en: "The 19th edition of the national school games finals takes place from April 19 to 26, 2026 in the West region. LYBIBAL participates with 25 athletes in 8 disciplines. The FENASCO games are essential for national cohesion and the detection of sports talents. However, the lack of funding limits the participation of rural schools. MINESEC has allocated 50 million FCFA for this edition. Is it enough?"
      },
      likes: 145,
      comments: [
        { id: 1, author: "Coach sportif", avatar: "/images/avatars/coach.jpg", role: lang === 'fr' ? "Entraîneur" : "Coach", content: lang === 'fr' ? "50 millions pour 5 119 établissements, c'est 9 700 FCFA par école. Ridicule. Il faut au moins 500 millions et des partenariats privés." : "50 million for 5,119 institutions, that's 9,700 FCFA per school. Ridiculous. We need at least 500 million and private partnerships.", likes: 89, time: lang === 'fr' ? "Il y a 6 jours" : "6 days ago" },
      ],
      views: 780,
      tags: ["#FENASCO", "#Sport", "#Bafoussam", "#Jeunesse"],
      icon: Trophy,
    },
    {
      id: 9,
      author: "Expert IA",
      avatar: "/images/avatars/ia.jpg",
      role: lang === 'fr' ? "Consultant digital" : "Digital Consultant",
      time: lang === 'fr' ? "Il y a 1 semaine" : "1 week ago",
      category: { fr: "Innovation", en: "Innovation" },
      categoryColor: "bg-indigo-100 text-indigo-700",
      title: {
        fr: "Intelligence Artificielle dans l'éducation camerounaise : opportunité ou danger ?",
        en: "Artificial Intelligence in Cameroonian education: opportunity or danger?"
      },
      content: {
        fr: "Le thème de la rentrée 2025-2026 est : 'Sécurité, santé et apprentissage à l'ère de l'IA'. Le MINESEC veut introduire l'IA dans les salles de classe. Mais 60% des écoles n'ont pas d'électricité stable, 70% pas d'internet, et les enseignants ne sont pas formés. ChatGPT et les IA génératives facilitent la triche aux examens. Comment concilier innovation et réalité du terrain ? Le LYBIBAL a déjà équipé toutes ses salles de tableaux interactifs. Est-ce un modèle reproductible ?",
        en: "The theme for the 2025-2026 school year is: 'Security, health and learning in the AI era'. MINESEC wants to introduce AI in classrooms. But 60% of schools don't have stable electricity, 70% don't have internet, and teachers are not trained. ChatGPT and generative AI facilitate exam cheating. How to reconcile innovation with field reality? LYBIBAL has already equipped all its rooms with interactive whiteboards. Is this a reproducible model?"
      },
      likes: 312,
      comments: [
        { id: 1, author: "Prof. Informatique", avatar: "/images/avatars/info.jpg", role: lang === 'fr' ? "Enseignant LYBIBAL" : "LYBIBAL Teacher", content: lang === 'fr' ? "Nos tableaux interactifs fonctionnent avec du contenu local hors-ligne. L'IA doit être un outil, pas un remplacement. Formons d'abord les enseignants." : "Our interactive whiteboards work with local offline content. AI must be a tool, not a replacement. Let's train teachers first.", likes: 156, time: lang === 'fr' ? "Il y a 5 jours" : "5 days ago" },
      ],
      views: 1670,
      tags: ["#IA", "#Digital", "#Innovation", "#TableauxInteractifs"],
      icon: Brain,
    },
    {
      id: 10,
      author: "Association des Parents",
      avatar: "/images/avatars/apee.jpg",
      role: "APEE LYBIBAL",
      time: lang === 'fr' ? "Il y a 2 semaines" : "2 weeks ago",
      category: { fr: "Vie lycéenne", en: "School Life" },
      categoryColor: "bg-school-gold/20 text-school-gold",
      title: {
        fr: "Bilinguisme effectif : mythe ou réalité dans les écoles camerounaises ?",
        en: "Effective bilingualism: myth or reality in Cameroonian schools?"
      },
      content: {
        fr: "Le Cameroun est officiellement bilingue depuis 1961, mais la réalité est autre. 80% des écoles francophones n'offrent pas de cours d'anglais qualitatifs, et inversement. Le LYBIBAL est une exception avec ses deux sections complètes (FR et EN) et son taux de bilinguisme réel de 85% parmi les diplômés. Le MINESEC a lancé le Programme National d'Effectivité du Bilinguisme (PNEB) en 2021. Quel est votre constat dans votre région ? Le bilinguisme est-il vraiment effectif ?",
        en: "Cameroon has been officially bilingual since 1961, but the reality is different. 80% of Francophone schools do not offer quality English courses, and vice versa. LYBIBAL is an exception with its two complete sections (FR and EN) and its real bilingualism rate of 85% among graduates. MINESEC launched the National Program for the Effectiveness of Bilingualism (PNEB) in 2021. What is your observation in your region? Is bilingualism really effective?"
      },
      likes: 445,
      comments: [
        { id: 1, author: "Enseignant anglophone", avatar: "/images/avatars/anglo.jpg", role: lang === 'fr' ? "Section EN LYBIBAL" : "LYBIBAL EN Section", content: lang === 'fr' ? "Au LYBIBAL, les élèves francophones suivent 6h d'anglais par semaine et vice-versa. Les échanges inter-sections sont obligatoires. Ça marche." : "At LYBIBAL, Francophone students take 6 hours of English per week and vice versa. Cross-section exchanges are mandatory. It works.", likes: 198, time: lang === 'fr' ? "Il y a 1 semaine" : "1 week ago" },
      ],
      views: 2900,
      tags: ["#Bilinguisme", "#PNEB", "#Francais", "#Anglais"],
      icon: Globe,
    },
  ]

  const categories = ['all', ...Array.from(new Set(topics.map(t => t.category[lang])))]

  const filteredTopics = useMemo(() => {
    let result = [...topics]

    if (filterCategory !== 'all') {
      result = result.filter(t => t.category[lang] === filterCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(t =>
        t.title[lang].toLowerCase().includes(q) ||
        t.content[lang].toLowerCase().includes(q) ||
        t.category[lang].toLowerCase().includes(q) ||
        t.author.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      )
    }

    switch (sortBy) {
      case 'recent':
        break
      case 'popular':
        result.sort((a, b) => b.likes - a.likes)
        break
      case 'trending':
        result.sort((a, b) => (b.likes + b.comments.length * 10 + b.views / 100) - (a.likes + a.comments.length * 10 + a.views / 100))
        break
    }

    return result
  }, [searchQuery, filterCategory, sortBy, lang])

  const toggleLike = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setLikedTopics(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleBookmark = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setBookmarkedTopics(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearAll = () => {
    setSearchQuery('')
    setFilterCategory('all')
    setSortBy('trending')
  }

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="bg-school-blue text-white py-14 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-school-gold rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <MessageSquare className="h-14 w-14 text-school-gold mx-auto mb-4" />
          <h1 className="text-3xl lg:text-5xl font-bold mb-3">{L.pageTitle}</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">{L.pageSubtitle}</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Barre de recherche et filtres */}
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
                showFilters || filterCategory !== 'all' || sortBy !== 'trending'
                  ? 'bg-school-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-4 w-4" />
              {L.filters}
              {(filterCategory !== 'all' || sortBy !== 'trending') && (
                <span className="bg-school-gold text-school-blue text-xs px-1.5 py-0.5 rounded-full font-bold">
                  {(filterCategory !== 'all' ? 1 : 0) + (sortBy !== 'trending' ? 1 : 0)}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <Hash className="h-4 w-4 text-school-blue" />{L.category}
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setFilterCategory(c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        filterCategory === c ? 'bg-school-blue text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {c === 'all' ? L.all : c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-school-blue" />{L.sortBy}
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'trending' as const, label: L.trending },
                    { value: 'popular' as const, label: L.popular },
                    { value: 'recent' as const, label: L.recent },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSortBy(opt.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        sortBy === opt.value ? 'bg-school-blue text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(searchQuery || filterCategory !== 'all' || sortBy !== 'trending') && (
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-school-blue">{filteredTopics.length}</span>{' '}
                {filteredTopics.length > 1 ? L.discussions : L.discussion}
                {searchQuery && <span> {L.forQuery} « <span className="font-medium">{searchQuery}</span> »</span>}
              </p>
              <button onClick={clearAll} className="text-sm text-school-blue hover:text-school-gold font-medium flex items-center gap-1 transition-colors">
                <XCircle className="h-4 w-4" />{L.reset}
              </button>
            </div>
          )}
        </div>

        {/* Grille des discussions */}
        {filteredTopics.length > 0 ? (
          <div className="space-y-4">
            {filteredTopics.map((topic) => (
              <div
                key={topic.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-school-gold/40 transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedTopic(topic)}
              >
                {/* Header */}
                <div className="p-5 pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                      <User className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-gray-900 text-sm">{topic.author}</h4>
                        <span className="text-xs text-gray-500">• {topic.role}</span>
                        <span className="text-xs text-gray-400">• {topic.time}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${topic.categoryColor}`}>
                          {topic.category[lang]}
                        </span>
                      </div>
                    </div>
                    <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                      <MoreHorizontal className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-5 pb-3">
                  <h3 className="font-bold text-gray-900 text-base mb-2 hover:text-school-blue transition-colors">
                    {topic.title[lang]}
                  </h3>
                  <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                    {topic.content[lang]}
                  </p>
                </div>

                {/* Tags */}
                <div className="px-5 pb-3 flex flex-wrap gap-2">
                  {topic.tags.map((tag) => (
                    <span key={tag} className="text-xs text-school-blue bg-school-blue/5 px-2 py-1 rounded-md hover:bg-school-blue/10 transition-colors">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => toggleLike(topic.id, e)}
                      className={`flex items-center gap-1.5 text-sm transition-colors ${
                        likedTopics.has(topic.id) ? 'text-school-blue' : 'text-gray-500 hover:text-school-blue'
                      }`}
                    >
                      <ThumbsUp className={`h-4 w-4 ${likedTopics.has(topic.id) ? 'fill-current' : ''}`} />
                      <span>{topic.likes + (likedTopics.has(topic.id) ? 1 : 0)}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-school-blue transition-colors">
                      <MessageCircle className="h-4 w-4" />
                      <span>{topic.comments.length}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-school-blue transition-colors">
                      <Eye className="h-4 w-4" />
                      <span>{topic.views}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => toggleBookmark(topic.id, e)}
                      className={`p-1.5 rounded-full transition-colors ${
                        bookmarkedTopics.has(topic.id) ? 'text-school-gold bg-school-gold/10' : 'text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      <Bookmark className={`h-4 w-4 ${bookmarkedTopics.has(topic.id) ? 'fill-current' : ''}`} />
                    </button>
                    <button className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 transition-colors">
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">{L.noTopics}</h3>
            <p className="text-gray-500 mb-4">{L.noTopicsDesc}</p>
            <button onClick={clearAll} className="bg-school-blue text-white hover:bg-[#162d4d] px-5 py-2.5 rounded-lg font-semibold transition-all hover:scale-105">
              {L.resetFilters}
            </button>
          </div>
        )}
      </div>

      {/* Popup détail discussion */}
      {selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTopic(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 rounded-t-2xl flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{selectedTopic.author}</h4>
                  <p className="text-xs text-gray-500">{selectedTopic.role} • {selectedTopic.time}</p>
                </div>
              </div>
              <button onClick={() => setSelectedTopic(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {/* Catégorie */}
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${selectedTopic.categoryColor}`}>
                {selectedTopic.category[lang]}
              </span>

              {/* Titre */}
              <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedTopic.title[lang]}</h2>

              {/* Contenu */}
              <p className="text-gray-700 leading-relaxed text-sm mb-6 whitespace-pre-line">
                {selectedTopic.content[lang]}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedTopic.tags.map((tag) => (
                  <span key={tag} className="text-xs text-school-blue bg-school-blue/5 px-2 py-1 rounded-md">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
                <span className="flex items-center gap-1.5">
                  <ThumbsUp className="h-4 w-4 text-school-gold" />
                  {selectedTopic.likes} {L.likes}
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4 text-school-gold" />
                  {selectedTopic.comments.length} {L.comments}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-school-gold" />
                  {selectedTopic.views} {L.views}
                </span>
              </div>

              {/* Commentaires */}
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-school-blue" />
                  {L.comments} ({selectedTopic.comments.length})
                </h4>
                <div className="space-y-4">
                  {selectedTopic.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-gray-900">{comment.author}</span>
                          <span className="text-xs text-gray-500">{comment.role}</span>
                          <span className="text-xs text-gray-400">• {comment.time}</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-school-blue transition-colors">
                            <ThumbsUp className="h-3 w-3" />
                            {comment.likes}
                          </button>
                          <button className="text-xs text-gray-500 hover:text-school-blue transition-colors">
                            {L.reply}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Zone de réponse */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-2">{L.replyAsGuest}</p>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-school-blue/10 flex items-center justify-center shrink-0">
                    <User className="h-5 w-5 text-school-blue" />
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={L.shareOpinion}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-school-blue focus:border-school-blue outline-none text-sm resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <button className="bg-school-blue text-white hover:bg-[#162d4d] px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        {L.publish}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}