import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap, BookOpen, Users, Trophy, Calendar, ArrowRight,
  ChevronLeft, ChevronRight, MapPin, Phone, Mail, Globe,
  School, Award, Languages, Building2, FileText, Landmark,
  Clock, CheckCircle, Target, Lightbulb, MessageSquare, Send,
  User, X, Play, FlaskConical, Monitor, Microscope, Beaker,
  ChevronDown, ChevronUp, Video, Star, CreditCard, Receipt
} from 'lucide-react'
import { usePageVisit, recordPageVisit } from '../../hooks/usePageVisit'
import { useLang } from '../../hooks/useLang'
/* ───────────────────────────────────────────────
   Lycée Bilingue de Baleng — HomePage V8
   4 Slides + MINESEC + Mot Proviseur + Structure
   + Fiches + Popup + BILINGUAL FR/EN
   ─────────────────────────────────────────────── */

type Lang = 'fr' | 'en'

const SLIDE_IMAGES = [
  '/images/slides/slide1.jpg',
  '/images/slides/slide2.jpg',
  '/images/slides/slide3.jpg',
  '/images/slides/slide4.jpg',
]

const MINISTRE_PHOTO = '/images/ministre/nalova-lyonga.jpeg'
const PROVISEUR_PHOTO = '/images/proviseurs/prov7.jpg'
const VIDEO_THUMBNAIL = '/images/video-thumb.jpg'

/* ── Traductions ── */
const t = {
  fr: {
    langLabel: 'FR',
    langTitle: 'Changer de langue',
    slide1_title: 'Lycée Bilingue de',
    slide1_highlight: 'Baleng',
    slide1_subtitle: 'Excellence académique et bilinguisme au coeur de Bafoussam',
    slide1_desc: "Établissement public sous tutelle du MINESEC, offrant une formation bilingue de qualité dans la région de l'Ouest du Cameroun depuis 1985.",
    slide1_btn1: "Découvrir l'établissement",
    slide1_btn2: 'Espace Administration',
    slide2_title: 'Sections Francophone &',
    slide2_highlight: 'Anglophone',
    slide2_subtitle: 'Deux sous-systèmes éducatifs pour une formation complète',
    slide2_fr: 'Francophone',
    slide2_fr_desc: '6e à Terminale — Séries C, D, TI, A — Examens OBC',
    slide2_en: 'Anglophone',
    slide2_en_desc: 'Form 1 à Upper Sixth — GCE O-Level & A-Level',
    slide2_badge: 'Effectivité du bilinguisme dans tous les cursus',
    slide3_title: 'Excellence &',
    slide3_highlight: 'Résultats',
    slide3_subtitle: 'Un taux de réussite exceptionnel au service de la communauté',
    slide3_stat1: '2,500+',
    slide3_stat1_label: 'Élèves',
    slide3_stat2: '150+',
    slide3_stat2_label: 'Enseignants',
    slide3_stat3: '98%',
    slide3_stat3_label: 'Réussite',
    slide3_stat4: '47',
    slide3_stat4_label: 'Années',
    slide3_btn: 'En savoir plus',
    slide4_title: 'Fiches de',
    slide4_highlight: 'Renseignement',
    slide4_subtitle: "Frais exigibles, frais d'examen et frais APEE — Année scolaire 2025-2026",
    slide4_annual: '/ Annuel',
    slide4_btn: 'Voir les fiches détaillées',
    slogan: "Lorsque c'est Excellent, c'est le LYBIBAL",
    minesec_title: 'MINESEC Cameroun',
    minesec_subtitle: "Organisation et supervision de l'enseignement secondaire",
    minesec_mission: 'Mission',
    minesec_mission_desc: "Le MINESEC veille à l'organisation, au fonctionnement et au développement de l'enseignement secondaire général, technique et de l'enseignement normal au Cameroun.",
    minesec_minister: 'Ministre en exercice',
    minesec_minister_name: 'Mme Pauline Nalova Lyonga',
    minesec_minister_role: 'Ministre des Enseignements Secondaires',
    minesec_fact1: 'En poste depuis 2024 sous la présidence de Paul Biya',
    minesec_fact2: "Doctorat en Sciences de l'Éducation — Université de Yaoundé I",
    minesec_fact3: 'Enseignante de français avant sa nomination ministérielle',
    minesec_fact4: "Programme d'innovation numérique 2024-2025",
    minesec_exams: 'Examens officiels',
    minesec_obc: 'OBC — Francophone',
    minesec_obc_desc: 'BEPC, Probatoire, Baccalauréat',
    minesec_gce: 'GCE — Anglophone',
    minesec_gce_desc: 'O/L Ordinary, A/L Advanced Level',
    minesec_cap: 'CAP — Technique',
    minesec_cap_desc: "Certificat d'Aptitude Professionnelle",
    minesec_calendar: 'Calendrier examens 2025-2026',
    minesec_subjects: "Matières d'examen",
    minesec_common: 'Tronc commun :',
    minesec_specialty: 'Spécialités série C :',
    minesec_contact: 'Contacts MINESEC',
    minesec_location: 'Yaoundé, Cameroun',
    minesec_phone: '+237 222 23 40 11 / 12',
    minesec_web: 'www.minesec.cm',
    prov_title: "Mot du Chef d'Établissement",
    prov_name: 'M. Heuyam Claude',
    prov_role: 'Proviseur',
    prov_email: 'heuyam.claude@lycee-baleng.cm',
    prov_phone: '+237 655 60 63 84',
    prov_since: 'En poste depuis 2024',
    prov_formation: 'Formation',
    prov_degree: "Doctorat en Sciences de l'Éducation",
    prov_school: 'ENS Yaoundé — Promotion 1998',
    prov_welcome: 'Bienvenue à tous',
    prov_letter1: 'Chers parents, chers élèves, chers partenaires,',
    prov_letter2: "C'est avec une immense fierté que je vous accueille sur le site du Lycée Bilingue de Baleng, un établissement qui porte en lui plus de quatre décennies d'excellence académique. Depuis sa création en 1985, notre lycée n'a cessé de grandir et d'évoluer.",
    prov_letter3: "Sous la tutelle du MINESEC, nous formons chaque année plus de 2 500 jeunes camerounais avec un taux de réussite de 98%. Notre ambition est claire : faire du Lycée Bilingue de Baleng la référence nationale de l'éducation bilingue.",
    prov_letter4: "Avec le programme « Campus Intelligent 2025 », nous entrons dans une nouvelle ère : tableaux interactifs, laboratoires numériques, partenariats internationaux.",
    prov_letter5: "Bienvenue au Lycée Bilingue de Baleng. Bienvenue dans l'excellence.",
    prov_sign: 'Proviseur du Lycée Bilingue de Baleng',
    prov_date: 'Bafoussam, mai 2026',
    why_title: 'Pourquoi choisir le LYBIBAL ?',
    why_subtitle: 'Découvrez ce qui fait notre excellence en vidéo',
    why_video: 'Vidéo de présentation du Lycée Bilingue de Baleng — 2025-2026',
    why_item1_title: 'Bilinguisme effectif',
    why_item1_desc: "Tous nos élèves maîtrisent le français et l'anglais à la fin de leur cursus, conformément à la politique nationale du Cameroun.",
    why_item2_title: 'Excellence reconnue',
    why_item2_desc: "98% de réussite au Baccalauréat et au GCE A-Level. Labellisation MINESEC depuis 2018.",
    why_item3_title: 'Infrastructure moderne',
    why_item3_desc: 'Laboratoires équipés, salles informatiques, amphithéâtre de 500 places et fibre optique.',
    why_item4_title: "Corps professoral d'élite",
    why_item4_desc: '150+ enseignants certifiés par le MINESEC, dont 30% titulaires de doctorat ou master.',
    why_item5_title: 'Ouverture internationale',
    why_item5_desc: 'Partenariats avec des lycées du Québec, de Belgique et du Sénégal.',
    struct_title: 'Notre Structure',
    struct_subtitle: 'Deux sous-systèmes, infrastructures modernes et équipements de pointe',
    struct_cycle1: '1er Cycle Francophone',
    struct_cycle1_tag: 'Collège',
    struct_cycle1_items: ["6e — Classe d'adaptation", "5e — Classe de consolidation", "4e — Classe de transition", "3e — Classe d'orientation (BEPC)"],
    struct_cycle2: '2nd Cycle Francophone',
    struct_cycle2_tag: 'Lycée — Examens OBC',
    struct_cycle2_items: ['2nde — Classe de détermination', '1ère — Classe de première (Probatoire)', 'Tle C, D, TI, A — Terminales (Bac)'],
    struct_cycle3: '1st Cycle Anglophone',
    struct_cycle3_tag: 'Secondary School',
    struct_cycle3_items: ['Form 1 — Year 7', 'Form 2 — Year 8', 'Form 3 — Year 9 (GCE O-Level)', 'Form 4 — Year 10', 'Form 5 — Year 11'],
    struct_cycle4: '2nd Cycle Anglophone',
    struct_cycle4_tag: 'High School — GCE A-Level',
    struct_cycle4_items: ['Lower Sixth — Year 12', 'Upper Sixth — Year 13 (GCE A-Level)', 'Options : Arts, Science, Commercial'],
    struct_labs: 'Laboratoires Scientifiques',
    struct_labs_tag: 'Équipements modernes',
    struct_labs_items: ['Labo Physique — 40 postes expérimentaux', 'Labo Chimie — 35 paillasses + hottes', 'Labo SVT — Microscopes électroniques', 'Labo Technologie — Machines-outils'],
    struct_media: 'Centres Multimédia',
    struct_media_tag: 'Numérique & Informatique',
    struct_media_items: ['Salle Info 1 — 50 postes Windows 11', 'Salle Info 2 — 40 postes Linux/Ubuntu', 'Centre Multimédia — Vidéoprojecteurs interactifs', 'WiFi fibre optique sur tout le campus'],
    fees_title: 'Fiches de Renseignement',
    fees_subtitle: "Frais exigibles, frais d'examen et frais APEE par classe",
    fees_tag: 'Tarification 2025-2026',
    fees_total: 'Total :',
    fees_info1: 'Les frais sont payables en 3 tranches (septembre, novembre, février)',
    fees_info2: "Les frais d'examen couvrent l'inscription aux examens OBC ou GCE",
    fees_info3: "L'APEE (Association des Parents d'Élèves de l'Établissement) finance les activités parascolaires",
    fees_info4: 'Bourses disponibles pour les élèves méritants et les familles à revenus modestes',
    fees_label_exigible: 'Frais exigibles',
    fees_label_apee: 'Frais APEE',
    fees_label_exam: "Frais d'examen",
    cta_title: "Rejoignez l'excellence",
    cta_desc: "Inscrivez votre enfant au Lycée Bilingue de Baleng et offrez-lui un avenir brillant dans un établissement reconnu par le MINESEC.",
    cta_btn1: "Découvrir l'établissement",
    cta_btn2: 'Voir les événements',
    cta_btn3: 'Laisser un message au Sécretariat',
    popup_title: 'Message au Sécretariat',
    popup_role: 'Proviseur du Lycée Bilingue de Baleng',
    popup_sent: 'Message envoyé !',
    popup_sent_desc: 'Votre message a bien été transmis au sécrétariat.',
    popup_delay: 'Délai de réponse :',
    popup_hours: '48h',
    popup_call: 'Appel et visite :',
    popup_time: '8h00 — 16h30',
    popup_name: 'Nom complet',
    popup_name_ph: 'Votre nom et prénom',
    popup_email: 'Email',
    popup_email_ph: 'votre@email.com',
    popup_phone: 'Téléphone',
    popup_phone_ph: '+237 6XX XX XX XX',
    popup_service: 'Service demandé',
    popup_service_ph: 'Choisir...',
    popup_message: 'Message',
    popup_message_ph: 'Décrivez votre demande...',
    popup_send: 'Envoyer',
    popup_services: [
      'Inscription / Réinscription',
      'Demande de documents',
      'Renseignements pédagogiques',
      'Réclamation / Suggestion',
      'Partenariat / Collaboration',
      'Autre',
    ],
  },
  en: {
    langLabel: 'EN',
    langTitle: 'Switch language',
    slide1_title: 'Bilingual High School of',
    slide1_highlight: 'Baleng',
    slide1_subtitle: 'Academic excellence and bilingualism at the heart of Bafoussam',
    slide1_desc: 'Public institution under MINESEC supervision, offering quality bilingual education in the West Region of Cameroon since 1985.',
    slide1_btn1: 'Discover the institution',
    slide1_btn2: 'Administration Portal',
    slide2_title: 'Francophone &',
    slide2_highlight: 'Anglophone',
    slide2_subtitle: 'Two educational sub-systems for comprehensive training',
    slide2_fr: 'Francophone',
    slide2_fr_desc: '6th to 12th grade — Series C, D, TI, A — OBC Exams',
    slide2_en: 'Anglophone',
    slide2_en_desc: 'Form 1 to Upper Sixth — GCE O-Level & A-Level',
    slide2_badge: 'Effective bilingualism in all curricula',
    slide3_title: 'Excellence &',
    slide3_highlight: 'Results',
    slide3_subtitle: 'An exceptional pass rate serving the community',
    slide3_stat1: '2,500+',
    slide3_stat1_label: 'Students',
    slide3_stat2: '150+',
    slide3_stat2_label: 'Teachers',
    slide3_stat3: '98%',
    slide3_stat3_label: 'Pass Rate',
    slide3_stat4: '47',
    slide3_stat4_label: 'Years',
    slide3_btn: 'Learn more',
    slide4_title: 'Information',
    slide4_highlight: 'Sheets',
    slide4_subtitle: 'Required fees, exam fees and APEE fees — School Year 2025-2026',
    slide4_annual: '/ Year',
    slide4_btn: 'View detailed sheets',
    slogan: "When it's Excellent, it's LYBIBAL",
    minesec_title: 'MINESEC Cameroon',
    minesec_subtitle: 'Organization and supervision of secondary education',
    minesec_mission: 'Mission',
    minesec_mission_desc: 'MINESEC oversees the organization, operation and development of general, technical and teacher training secondary education in Cameroon.',
    minesec_minister: 'Current Minister',
    minesec_minister_name: 'Mrs. Pauline Nalova Lyonga',
    minesec_minister_role: 'Minister of Secondary Education',
    minesec_fact1: 'In office since 2024 under President Paul Biya',
    minesec_fact2: 'PhD in Education Sciences — University of Yaoundé I',
    minesec_fact3: 'French teacher before her ministerial appointment',
    minesec_fact4: 'Digital innovation program 2024-2025',
    minesec_exams: 'Official Exams',
    minesec_obc: 'OBC — Francophone',
    minesec_obc_desc: 'BEPC, Probatoire, Baccalauréat',
    minesec_gce: 'GCE — Anglophone',
    minesec_gce_desc: 'O/L Ordinary, A/L Advanced Level',
    minesec_cap: 'CAP — Technical',
    minesec_cap_desc: 'Professional Aptitude Certificate',
    minesec_calendar: 'Exam Calendar 2025-2026',
    minesec_subjects: 'Exam Subjects',
    minesec_common: 'Common core:',
    minesec_specialty: 'Series C specialties:',
    minesec_contact: 'MINESEC Contacts',
    minesec_location: 'Yaoundé, Cameroon',
    minesec_phone: '+237 222 23 40 11 / 12',
    minesec_web: 'www.minesec.cm',
    prov_title: "Principal's Message",
    prov_name: 'Mr. Heuyam Claude',
    prov_role: 'Principal',
    prov_email: 'heuyam.claude@lycee-baleng.cm',
    prov_phone: '+237 655 60 63 84',
    prov_since: 'In office since 2024',
    prov_formation: 'Education',
    prov_degree: 'PhD in Education Sciences',
    prov_school: 'ENS Yaoundé — Class of 1998',
    prov_welcome: 'Welcome to all',
    prov_letter1: 'Dear parents, dear students, dear partners,',
    prov_letter2: "It is with immense pride that I welcome you to the website of the Bilingual High School of Baleng, an institution that carries more than four decades of academic excellence. Since its creation in 1985, our high school has continued to grow and evolve.",
    prov_letter3: 'Under the supervision of MINESEC, we train more than 2,500 young Cameroonians each year with a 98% pass rate. Our ambition is clear: to make the Bilingual High School of Baleng the national reference for bilingual education.',
    prov_letter4: 'With the « Smart Campus 2025 » program, we are entering a new era: interactive whiteboards, digital laboratories, international partnerships.',
    prov_letter5: 'Welcome to the Bilingual High School of Baleng. Welcome to excellence.',
    prov_sign: 'Principal of the Bilingual High School of Baleng',
    prov_date: 'Bafoussam, May 2026',
    why_title: 'Why choose LYBIBAL ?',
    why_subtitle: 'Discover what makes our excellence in video',
    why_video: 'Presentation video of the Bilingual High School of Baleng — 2025-2026',
    why_item1_title: 'Effective Bilingualism',
    why_item1_desc: "All our students master French and English by the end of their studies, in accordance with Cameroon's national policy.",
    why_item2_title: 'Recognized Excellence',
    why_item2_desc: '98% pass rate at the Baccalauréat and GCE A-Level. MINESEC certified since 2018.',
    why_item3_title: 'Modern Infrastructure',
    why_item3_desc: 'Equipped laboratories, computer rooms, 500-seat amphitheater and fiber optic.',
    why_item4_title: 'Elite Teaching Staff',
    why_item4_desc: "150+ MINESEC certified teachers, 30% of whom hold a doctorate or master's degree.",
    why_item5_title: 'International Opening',
    why_item5_desc: 'Partnerships with high schools in Quebec, Belgium and Senegal.',
    struct_title: 'Our Structure',
    struct_subtitle: 'Two sub-systems, modern infrastructure and cutting-edge equipment',
    struct_cycle1: '1st Cycle Francophone',
    struct_cycle1_tag: 'Middle School',
    struct_cycle1_items: ['6th — Adaptation class', '5th — Consolidation class', '4th — Transition class', '3rd — Orientation class (BEPC)'],
    struct_cycle2: '2nd Cycle Francophone',
    struct_cycle2_tag: 'High School — OBC Exams',
    struct_cycle2_items: ['10th — Determination class', '11th — First class (Probatoire)', '12th C, D, TI, A — Terminals (Bac)'],
    struct_cycle3: '1st Cycle Anglophone',
    struct_cycle3_tag: 'Secondary School',
    struct_cycle3_items: ['Form 1 — Year 7', 'Form 2 — Year 8', 'Form 3 — Year 9 (GCE O-Level)', 'Form 4 — Year 10', 'Form 5 — Year 11'],
    struct_cycle4: '2nd Cycle Anglophone',
    struct_cycle4_tag: 'High School — GCE A-Level',
    struct_cycle4_items: ['Lower Sixth — Year 12', 'Upper Sixth — Year 13 (GCE A-Level)', 'Options: Arts, Science, Commercial'],
    struct_labs: 'Scientific Laboratories',
    struct_labs_tag: 'Modern equipment',
    struct_labs_items: ['Physics Lab — 40 experimental stations', 'Chemistry Lab — 35 benches + hoods', 'Life Sciences Lab — Electron microscopes', 'Technology Lab — Machine tools'],
    struct_media: 'Multimedia Centers',
    struct_media_tag: 'Digital & IT',
    struct_media_items: ['Computer Room 1 — 50 Windows 11 stations', 'Computer Room 2 — 40 Linux/Ubuntu stations', 'Multimedia Center — Interactive projectors', 'Fiber optic WiFi across the campus'],
    fees_title: 'Information Sheets',
    fees_subtitle: 'Required fees, exam fees and APEE fees by class',
    fees_tag: 'Pricing 2025-2026',
    fees_total: 'Total:',
    fees_info1: 'Fees are payable in 3 installments (September, November, February)',
    fees_info2: 'Exam fees cover registration for OBC or GCE exams',
    fees_info3: "APEE (School Parents' Association) funds extracurricular activities",
    fees_info4: 'Scholarships available for deserving students and low-income families',
    fees_label_exigible: 'Required fees',
    fees_label_apee: 'APEE fees',
    fees_label_exam: 'Exam fees',
    cta_title: 'Join excellence',
    cta_desc: 'Enroll your child at the Bilingual High School of Baleng and offer them a bright future in an institution recognized by MINESEC.',
    cta_btn1: 'Discover the institution',
    cta_btn2: 'View events',
    cta_btn3: 'Leave a message for the Secretariat',
    popup_title: 'Message to the Secretariat',
    popup_role: 'Principal of the Bilingual High School of Baleng',
    popup_sent: 'Message sent!',
    popup_sent_desc: 'Your message has been successfully transmitted to the secretariat.',
    popup_delay: 'Response time:',
    popup_hours: '48h',
    popup_call: 'Call and visit:',
    popup_time: '8:00 AM — 4:30 PM',
    popup_name: 'Full name',
    popup_name_ph: 'Your first and last name',
    popup_email: 'Email',
    popup_email_ph: 'your@email.com',
    popup_phone: 'Phone',
    popup_phone_ph: '+237 6XX XX XX XX',
    popup_service: 'Service requested',
    popup_service_ph: 'Choose...',
    popup_message: 'Message',
    popup_message_ph: 'Describe your request...',
    popup_send: 'Send',
    popup_services: [
      'Registration / Re-registration',
      'Document request',
      'Academic information',
      'Complaint / Suggestion',
      'Partnership / Collaboration',
      'Other',
    ],
  },
}

export default function HomePage() {
  const navigate = useNavigate()
  //const [lang, setLang] = useState<Lang>('fr')

// APRÈS Nouveau

// ...
const { lang } = useLang()

  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showMessagePopup, setShowMessagePopup] = useState(false)
  const [messageForm, setMessageForm] = useState({
    nom: '', email: '', telephone: '', service: '', message: ''
  })
  const [messageSent, setMessageSent] = useState(false)
  const [expandedFee, setExpandedFee] = useState<number | null>(null)

  const L = t[lang]

  usePageVisit('/', 'public')

  //const toggleLang = () => setLang(prev => prev === 'fr' ? 'en' : 'fr')

  const handleNavClick = (path: string, category: string = 'public') => {
    recordPageVisit(path, category)
    navigate(path)
  }

  const scrollToFiches = () => {
    const el = document.getElementById('fiches-renseignement')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const goToSlide = useCallback((index: number) => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentSlide(index)
    setTimeout(() => setIsAnimating(false), 600)
  }, [isAnimating])

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % 4)
  }, [currentSlide, goToSlide])

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide + 3) % 4)
  }, [currentSlide, goToSlide])

  useEffect(() => {
    const timer = setInterval(nextSlide, 7000)
    return () => clearInterval(timer)
  }, [nextSlide])

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Message au proviseur:', messageForm)
    setMessageSent(true)
    setTimeout(() => {
      setMessageSent(false)
      setMessageForm({ nom: '', email: '', telephone: '', service: '', message: '' })
      setShowMessagePopup(false)
    }, 4000)
  }

  const whyItems = [
    { icon: Languages, title: L.why_item1_title, desc: L.why_item1_desc },
    { icon: Trophy, title: L.why_item2_title, desc: L.why_item2_desc },
    { icon: Monitor, title: L.why_item3_title, desc: L.why_item3_desc },
    { icon: Users, title: L.why_item4_title, desc: L.why_item4_desc },
    { icon: Globe, title: L.why_item5_title, desc: L.why_item5_desc },
  ]

  const structCards = [
    { icon: BookOpen, color: 'blue', title: L.struct_cycle1, tag: L.struct_cycle1_tag, items: L.struct_cycle1_items },
    { icon: GraduationCap, color: 'blue', title: L.struct_cycle2, tag: L.struct_cycle2_tag, items: L.struct_cycle2_items },
    { icon: BookOpen, color: 'red', title: L.struct_cycle3, tag: L.struct_cycle3_tag, items: L.struct_cycle3_items },
    { icon: GraduationCap, color: 'red', title: L.struct_cycle4, tag: L.struct_cycle4_tag, items: L.struct_cycle4_items },
    { icon: FlaskConical, color: 'green', title: L.struct_labs, tag: L.struct_labs_tag, items: L.struct_labs_items },
    { icon: Monitor, color: 'purple', title: L.struct_media, tag: L.struct_media_tag, items: L.struct_media_items },
  ]

  const fiches = [
    {
      classe: '6ème, 5ème, 4ème',
      cycle: lang === 'fr' ? '1er cycle sans examen' : '1st cycle without exam',
      total: '32.500 FCFA / ' + (lang === 'fr' ? 'Annuel' : 'Year'),
      details: [
        { label: L.fees_label_exigible, value: '7.500 FCFA' },
        { label: L.fees_label_apee, value: '25.000 FCFA' },
      ],
    },
    {
      classe: '2nde',
      cycle: lang === 'fr' ? '2nd cycle sans examen' : '2nd cycle without exam',
      total: '35.500 FCFA / ' + (lang === 'fr' ? 'Annuel' : 'Year'),
      details: [
        { label: L.fees_label_exigible, value: '10.000 FCFA' },
        { label: L.fees_label_apee, value: '25.000 FCFA' },
      ],
    },
    {
      classe: '3ème',
      cycle: lang === 'fr' ? '1er cycle avec examen' : '1st cycle with exam',
      total: '45.000 FCFA / ' + (lang === 'fr' ? 'Annuel' : 'Year'),
      details: [
        { label: L.fees_label_exigible, value: '7.500 FCFA' },
        { label: L.fees_label_apee, value: '25.000 FCFA' },
        { label: L.fees_label_exam, value: '10.000 FCFA' },
      ],
    },
    {
      classe: '1ère',
      cycle: lang === 'fr' ? '2nd cycle avec examen' : '2nd cycle with exam',
      total: '32.500 FCFA / ' + (lang === 'fr' ? 'Annuel' : 'Year'),
      details: [
        { label: L.fees_label_exigible, value: '7.500 FCFA' },
        { label: L.fees_label_apee, value: '25.000 FCFA' },
        { label: L.fees_label_exam, value: '10.000 FCFA' },
      ],
    },
    {
      classe: 'Tle C, D et A4',
      cycle: lang === 'fr' ? '2nd cycle avec examen' : '2nd cycle with exam',
      total: '32.500 FCFA / ' + (lang === 'fr' ? 'Annuel' : 'Year'),
      details: [
        { label: L.fees_label_exigible, value: '7.500 FCFA' },
        { label: L.fees_label_apee, value: '25.000 FCFA' },
        { label: L.fees_label_exam, value: '10.000 FCFA' },
      ],
    },
    {
      classe: 'Tle TI',
      cycle: lang === 'fr' ? '2nd cycle avec examen' : '2nd cycle with exam',
      total: '32.500 FCFA / ' + (lang === 'fr' ? 'Annuel' : 'Year'),
      details: [
        { label: L.fees_label_exigible, value: '7.500 FCFA' },
        { label: L.fees_label_apee, value: '25.000 FCFA' },
        { label: L.fees_label_exam, value: '10.000 FCFA' },
      ],
    },
  ]

  const SloganBanner = () => (
    <div className="mt-4 animate-slogan-slide">
      <div className="inline-flex items-center gap-3 bg-school-gold/20 backdrop-blur-md border border-school-gold/40 rounded-full px-6 py-2.5">
        <Star className="h-4 w-4 text-school-gold animate-pulse" />
        <span className="text-school-gold font-bold text-sm tracking-wide uppercase">{L.slogan}</span>
        <Star className="h-4 w-4 text-school-gold animate-pulse" />
      </div>
    </div>
  )

  const slides = [
    {
      id: 0,
      title: L.slide1_title,
      highlight: L.slide1_highlight,
      subtitle: L.slide1_subtitle,
      image: SLIDE_IMAGES[0],
      content: (
        <div className="animate-slide-up">
          <p className="text-white/90 text-base mb-4 max-w-2xl mx-auto drop-shadow-lg">{L.slide1_desc}</p>
          <div className="flex justify-center gap-3 flex-wrap mb-3">
            <button onClick={() => handleNavClick('/about', 'public')} className="bg-school-gold text-school-blue hover:bg-yellow-400 inline-flex items-center px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg">
              {L.slide1_btn1}<ArrowRight className="ml-2 h-4 w-4" />
            </button>
            <button onClick={() => handleNavClick('/login', 'auth')} className="border-2 border-white text-white hover:bg-white/20 inline-flex items-center px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 hover:scale-105 backdrop-blur-sm">
              {L.slide1_btn2}
            </button>
          </div>
          <SloganBanner />
        </div>
      ),
    },
    {
      id: 1,
      title: L.slide2_title,
      highlight: L.slide2_highlight,
      subtitle: L.slide2_subtitle,
      image: SLIDE_IMAGES[1],
      content: (
        <div className="animate-slide-up">
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto mb-6">
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-5 border border-white/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg">FR</div>
                <h3 className="font-bold text-white text-lg">{L.slide2_fr}</h3>
              </div>
              <p className="text-white/80 text-sm">{L.slide2_fr_desc}</p>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-5 border border-white/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold shadow-lg">EN</div>
                <h3 className="font-bold text-white text-lg">{L.slide2_en}</h3>
              </div>
              <p className="text-white/80 text-sm">{L.slide2_en_desc}</p>
            </div>
          </div>
          <p className="text-school-gold text-sm flex items-center justify-center gap-2 bg-school-gold/20 backdrop-blur-sm rounded-lg py-2 px-4 inline-flex mb-4">
            <Languages className="h-4 w-4" /><span className="font-semibold">{L.slide2_badge}</span>
          </p>
          <SloganBanner />
        </div>
      ),
    },
    {
      id: 2,
      title: L.slide3_title,
      highlight: L.slide3_highlight,
      subtitle: L.slide3_subtitle,
      image: SLIDE_IMAGES[2],
      content: (
        <div className="animate-slide-up">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto mb-6">
            {[
              { icon: Users, value: L.slide3_stat1, label: L.slide3_stat1_label },
              { icon: GraduationCap, value: L.slide3_stat2, label: L.slide3_stat2_label },
              { icon: Trophy, value: L.slide3_stat3, label: L.slide3_stat3_label },
              { icon: BookOpen, value: L.slide3_stat4, label: L.slide3_stat4_label },
            ].map((stat, i) => (
              <div key={i} className="text-center p-3 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
                <stat.icon className="h-6 w-6 text-school-gold mx-auto mb-2" />
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/80">{stat.label}</p>
              </div>
            ))}
          </div>
          <button onClick={() => handleNavClick('/about', 'public')} className="border-2 border-school-gold text-school-gold hover:bg-school-gold/20 inline-flex items-center px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 hover:scale-105 backdrop-blur-sm mb-4">
            {L.slide3_btn}<ArrowRight className="ml-2 h-4 w-4" />
          </button>
          <SloganBanner />
        </div>
      ),
    },
    {
      id: 3,
      title: L.slide4_title,
      highlight: L.slide4_highlight,
      subtitle: L.slide4_subtitle,
      image: SLIDE_IMAGES[3],
      content: (
        <div className="animate-slide-up">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-2xl mx-auto mb-4">
            {[
              { classe: '6e, 5e, 4e', montant: '32.500 FCFA' },
              { classe: '2nde', montant: '35.500 FCFA' },
              { classe: '3ème', montant: '45.000 FCFA' },
              { classe: '1ère', montant: '32.500 FCFA' },
              { classe: 'Tle C, D, A4', montant: '32.500 FCFA' },
              { classe: 'Tle TI', montant: '32.500 FCFA' },
            ].map((item, i) => (
              <div key={i} className="bg-white/15 backdrop-blur-sm rounded-lg p-3 border border-white/20 text-center">
                <p className="text-white/80 text-xs mb-1">{item.classe}</p>
                <p className="text-school-gold font-bold text-sm">{item.montant}</p>
                <p className="text-white/60 text-xs">{L.slide4_annual}</p>
              </div>
            ))}
          </div>
          <button onClick={scrollToFiches} className="bg-school-gold text-school-blue hover:bg-yellow-400 inline-flex items-center px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg mb-4">
            <Receipt className="mr-2 h-4 w-4" />{L.slide4_btn}<ArrowRight className="ml-2 h-4 w-4" />
          </button>
          <SloganBanner />
        </div>
      ),
    },
  ]

  return (
    <div className="animate-fade-in relative">
     
      {/* SLIDER HERO */}
      <section className="relative overflow-hidden">
        <div className="relative h-[480px] lg:h-[520px]">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 flex items-center transition-all duration-700 ease-in-out ${
                index === currentSlide ? 'opacity-100 translate-x-0 z-10' : index < currentSlide ? 'opacity-0 -translate-x-full z-0' : 'opacity-0 translate-x-full z-0'
              }`}
            >
              <div className="absolute inset-0">
                <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <div className="absolute inset-0 bg-school-blue/75" />
                <div className="absolute inset-0 bg-gradient-to-t from-school-blue/90 via-transparent to-transparent" />
              </div>
              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full text-center">
                <h1 className="text-3xl lg:text-5xl font-bold leading-tight mb-4 text-white animate-slide-up drop-shadow-lg">{slide.title} <span className="text-school-gold">{slide.highlight}</span></h1>
                <p className="text-lg text-white/90 mb-6 animate-slide-up-delay drop-shadow-md">{slide.subtitle}</p>
                <div className="animate-slide-up-delay-2">{slide.content}</div>
              </div>
            </div>
          ))}
          <button onClick={prevSlide} disabled={isAnimating} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors z-20 disabled:opacity-50">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button onClick={nextSlide} disabled={isAnimating} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors z-20 disabled:opacity-50">
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {slides.map((_, i) => (
              <button key={i} onClick={() => goToSlide(i)} disabled={isAnimating} className={`h-2 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-8 bg-school-gold' : 'w-2 bg-white/50 hover:bg-white/80'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* MINESEC */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-school-blue/10 rounded-full mb-4">
              <Landmark className="h-5 w-5 text-school-blue" />
              <span className="text-sm font-semibold text-school-blue">{lang === 'fr' ? 'Ministère des Enseignements Secondaires' : 'Ministry of Secondary Education'}</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{L.minesec_title}</h2>
            <p className="mt-2 text-gray-600">{L.minesec_subtitle}</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div className="bg-school-blue/5 rounded-xl p-6 border border-school-blue/10">
                <div className="flex items-center gap-3 mb-4"><Target className="h-6 w-6 text-school-blue" /><h3 className="font-bold text-school-blue text-lg">{L.minesec_mission}</h3></div>
                <p className="text-gray-600 text-sm leading-relaxed">{L.minesec_mission_desc}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-school-gold/30 overflow-hidden">
                <div className="flex items-center gap-3 mb-4"><Award className="h-6 w-6 text-school-gold" /><h3 className="font-bold text-school-gold text-lg">{L.minesec_minister}</h3></div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-school-gold/30 shadow-md mb-4 bg-gray-100">
                    <img src={MINISTRE_PHOTO} alt={L.minesec_minister_name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                  <h4 className="font-bold text-gray-900 text-lg">{L.minesec_minister_name}</h4>
                  <p className="text-school-blue font-medium text-sm mb-3">{L.minesec_minister_role}</p>
                  <div className="text-left w-full space-y-2 text-sm text-gray-600">
                    <p className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-school-gold shrink-0 mt-0.5" /><span>{L.minesec_fact1}</span></p>
                    <p className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-school-gold shrink-0 mt-0.5" /><span>{L.minesec_fact2}</span></p>
                    <p className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-school-gold shrink-0 mt-0.5" /><span>{L.minesec_fact3}</span></p>
                    <p className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-school-gold shrink-0 mt-0.5" /><span>{L.minesec_fact4}</span></p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-5"><FileText className="h-6 w-6 text-school-blue" /><h3 className="font-bold text-gray-900 text-lg">{L.minesec_exams}</h3></div>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500"><p className="font-bold text-blue-700">{L.minesec_obc}</p><p className="text-xs text-gray-600 mt-1">{L.minesec_obc_desc}</p></div>
                  <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500"><p className="font-bold text-red-700">{L.minesec_gce}</p><p className="text-xs text-gray-600 mt-1">{L.minesec_gce_desc}</p></div>
                  <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500"><p className="font-bold text-green-700">{L.minesec_cap}</p><p className="text-xs text-gray-600 mt-1">{L.minesec_cap_desc}</p></div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-4"><Clock className="h-6 w-6 text-school-gold" /><h3 className="font-bold text-gray-900 text-lg">{L.minesec_calendar}</h3></div>
                <div className="space-y-3 text-sm">
                  {[
                    { exam: lang === 'fr' ? 'BEPC (OBC)' : 'BEPC (OBC)', date: lang === 'fr' ? 'Juin 2026' : 'June 2026' },
                    { exam: lang === 'fr' ? 'Probatoire (OBC)' : 'Probatoire (OBC)', date: lang === 'fr' ? 'Juin 2026' : 'June 2026' },
                    { exam: lang === 'fr' ? 'Baccalauréat (OBC)' : 'Baccalauréat (OBC)', date: lang === 'fr' ? 'Juillet 2026' : 'July 2026' },
                    { exam: 'GCE O-Level', date: lang === 'fr' ? 'Juin 2026' : 'June 2026' },
                    { exam: 'GCE A-Level', date: lang === 'fr' ? 'Juillet 2026' : 'July 2026' },
                  ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg"><span className="text-gray-700">{item.exam}</span><span className="font-semibold text-school-blue">{item.date}</span></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-4"><BookOpen className="h-6 w-6 text-school-blue" /><h3 className="font-bold text-gray-900 text-lg">{L.minesec_subjects}</h3></div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">{L.minesec_common}</p>
                  <div className="flex flex-wrap gap-2">
                    {['Mathématiques', 'Physique-Chimie', 'SVT', 'Français', 'Anglais', 'Histoire-Géo', 'Philosophie'].map((m) => (
                      <span key={m} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">{m}</span>
                    ))}
                  </div>
                  <p className="text-sm font-semibold text-gray-700 mt-3">{L.minesec_specialty}</p>
                  <div className="flex flex-wrap gap-2">
                    {['Maths approf.', 'Physique', 'Chimie'].map((m) => (
                      <span key={m} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100">{m}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-school-blue rounded-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4"><Building2 className="h-6 w-6 text-school-gold" /><h3 className="font-bold text-lg">{L.minesec_contact}</h3></div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3"><MapPin className="h-4 w-4 text-school-gold shrink-0 mt-0.5" /><span className="text-white/80">{L.minesec_location}</span></div>
                  <div className="flex items-start gap-3"><Phone className="h-4 w-4 text-school-gold shrink-0 mt-0.5" /><span className="text-white/80">{L.minesec_phone}</span></div>
                  <div className="flex items-start gap-3"><Globe className="h-4 w-4 text-school-gold shrink-0 mt-0.5" /><span className="text-white/80">{L.minesec_web}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MOT DU CHEF D'ÉTABLISSEMENT */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-school-gold/10 rounded-full mb-4">
              <MessageSquare className="h-5 w-5 text-school-gold" />
              <span className="text-sm font-semibold text-school-gold">{lang === 'fr' ? 'Direction' : 'Leadership'}</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{L.prov_title}</h2>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="grid lg:grid-cols-3 gap-0">
              <div className="lg:col-span-1 bg-school-blue p-8 text-white flex flex-col items-center text-center">
                <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-school-gold shadow-lg mb-5 bg-white/20">
                  <img src={PROVISEUR_PHOTO} alt={L.prov_name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </div>
                <h3 className="text-2xl font-bold mb-1">{L.prov_name}</h3>
                <p className="text-school-gold font-semibold mb-4">{L.prov_role}</p>
                <div className="w-full space-y-2 text-sm text-white/80">
                  <p className="flex items-center gap-2 justify-center"><Mail className="h-4 w-4 text-school-gold" /><span>{L.prov_email}</span></p>
                  <p className="flex items-center gap-2 justify-center"><Phone className="h-4 w-4 text-school-gold" /><span>{L.prov_phone}</span></p>
                  <p className="flex items-center gap-2 justify-center"><Clock className="h-4 w-4 text-school-gold" /><span>{L.prov_since}</span></p>
                </div>
                <div className="mt-6 pt-6 border-t border-white/20 w-full">
                  <p className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">{L.prov_formation}</p>
                  <p className="text-sm text-white/80">{L.prov_degree}</p>
                  <p className="text-sm text-white/80">{L.prov_school}</p>
                </div>
              </div>
              <div className="lg:col-span-2 p-8">
                <div className="flex items-center gap-2 mb-6"><MessageSquare className="h-6 w-6 text-school-blue" /><h4 className="text-xl font-bold text-gray-900">{L.prov_welcome}</h4></div>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <p className="text-lg text-school-blue font-semibold">« {L.prov_letter1}</p>
                  <p>{L.prov_letter2}</p>
                  <p>{L.prov_letter3}</p>
                  <p>{L.prov_letter4}</p>
                  <p className="text-lg text-school-blue font-semibold mt-6">{L.prov_letter5}</p>
                </div>
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <p className="text-gray-900 font-bold">{L.prov_name}</p>
                  <p className="text-gray-500 text-sm">{L.prov_sign}</p>
                  <p className="text-gray-400 text-xs">{L.prov_date}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POURQUOI CHOISIR */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-school-blue/10 rounded-full mb-4">
              <Star className="h-5 w-5 text-school-blue" />
              <span className="text-sm font-semibold text-school-blue">{lang === 'fr' ? 'Notre différence' : 'Our difference'}</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{L.why_title}</h2>
            <p className="mt-2 text-gray-600">{L.why_subtitle}</p>
          </div>
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="relative">
              <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-xl aspect-video relative group cursor-pointer">
                <img src={VIDEO_THUMBNAIL} alt="Video" className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-school-gold/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="h-8 w-8 text-school-blue ml-1" fill="currentColor" />
                  </div>
                </div>
                <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-2 py-1 rounded-md">3:45</div>
              </div>
              <p className="text-center text-sm text-gray-500 mt-3"><Video className="h-4 w-4 inline mr-1" />{L.why_video}</p>
            </div>
            <div className="space-y-5">
              {whyItems.map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="p-3 bg-school-blue/10 rounded-xl shrink-0 h-fit"><item.icon className="h-6 w-6 text-school-blue" /></div>
                  <div><h4 className="font-bold text-gray-900 mb-1">{item.title}</h4><p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* NOTRE STRUCTURE */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-school-gold/10 rounded-full mb-4">
              <School className="h-5 w-5 text-school-gold" />
              <span className="text-sm font-semibold text-school-gold">{lang === 'fr' ? 'Organisation pédagogique' : 'Educational organization'}</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{L.struct_title}</h2>
            <p className="mt-2 text-gray-600">{L.struct_subtitle}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {structCards.map((card, i) => (
              <div key={i} className={`bg-white rounded-xl p-6 shadow-sm border-2 border-transparent hover:border-${card.color}-300 transition-all duration-300 hover:shadow-lg hover:scale-[1.01]`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`h-12 w-12 rounded-full bg-${card.color}-100 flex items-center justify-center`}>
                    <card.icon className={`h-6 w-6 text-${card.color}-600`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{card.title}</h3>
                    <p className={`text-xs text-${card.color}-600 font-medium`}>{card.tag}</p>
                  </div>
                </div>
                <ul className="space-y-2 text-gray-600 text-sm">
                  {card.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2"><ChevronRight className={`h-4 w-4 text-${card.color}-500 shrink-0`} /><span>{item}</span></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FICHES DE RENSEIGNEMENT */}
      <section id="fiches-renseignement" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-school-gold/10 rounded-full mb-4">
              <CreditCard className="h-5 w-5 text-school-gold" />
              <span className="text-sm font-semibold text-school-gold">{L.fees_tag}</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{L.fees_title}</h2>
            <p className="mt-2 text-gray-600">{L.fees_subtitle}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {fiches.map((fiche, index) => (
              <div key={index} className={`bg-white rounded-xl border-2 overflow-hidden transition-all duration-300 ${expandedFee === index ? 'border-school-gold/50 shadow-lg' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'}`}>
                <button onClick={() => setExpandedFee(expandedFee === index ? null : index)} className="w-full flex items-center justify-between p-5 text-left">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${expandedFee === index ? 'bg-school-gold/10' : 'bg-gray-100'}`}>
                      <School className={`h-5 w-5 ${expandedFee === index ? 'text-school-gold' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{fiche.classe}</h3>
                      <p className="text-xs text-gray-500">{fiche.cycle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-school-blue">{fiche.total}</span>
                    {expandedFee === index ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </button>
                {expandedFee === index && (
                  <div className="px-5 pb-5 pt-0">
                    <div className="border-t border-gray-100 pt-3">
                      <div className="space-y-2">
                        {fiche.details.map((detail, i) => (
                          <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-600">{detail.label}</span>
                            <span className="font-semibold text-gray-900 text-sm">{detail.value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 p-2.5 bg-school-gold/10 rounded-lg">
                        <p className="text-sm text-school-gold font-semibold flex items-center gap-2"><CheckCircle className="h-4 w-4" />{L.fees_total} {fiche.total}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-8 bg-school-blue/5 rounded-xl p-5 border border-school-blue/10">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-school-blue shrink-0 mt-0.5" />
              <div className="text-sm text-gray-600">
                <p className="font-semibold text-gray-900 mb-1">{lang === 'fr' ? 'Informations importantes :' : 'Important information:'}</p>
                <ul className="space-y-1">
                  <li>• {L.fees_info1}</li>
                  <li>• {L.fees_info2}</li>
                  <li>• {L.fees_info3}</li>
                  <li>• {L.fees_info4}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 bg-school-blue text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-school-gold rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{L.cta_title}</h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">{L.cta_desc}</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <button onClick={() => handleNavClick('/about', 'public')} className="bg-school-gold text-school-blue hover:bg-yellow-400 inline-flex items-center px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg">
              {L.cta_btn1}<ArrowRight className="ml-2 h-4 w-4" />
            </button>
            <button onClick={() => handleNavClick('/events', 'public')} className="border-2 border-white text-white hover:bg-white/10 inline-flex items-center px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 hover:scale-105">
              <Calendar className="mr-2 h-4 w-4" />{L.cta_btn2}
            </button>
            <button onClick={() => setShowMessagePopup(true)} className="border-2 border-school-gold text-school-gold hover:bg-school-gold/10 inline-flex items-center px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 hover:scale-105">
              <MessageSquare className="mr-2 h-4 w-4" />{L.cta_btn3}
            </button>
          </div>
        </div>
      </section>

      {/* POPUP MESSAGE */}
      {showMessagePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMessagePopup(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-school-blue text-white p-5 rounded-t-2xl flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-school-gold" />
                <div>
                  <h3 className="font-bold text-lg">{L.popup_title}</h3>
                  <p className="text-white/70 text-xs">{L.popup_role}</p>
                </div>
              </div>
              <button onClick={() => setShowMessagePopup(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              {messageSent ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{L.popup_sent}</h4>
                  <p className="text-gray-600 mb-2">{L.popup_sent_desc}</p>
                  <p className="text-sm text-school-blue font-semibold">{L.popup_delay} {L.popup_hours}</p>
                  <p className="text-xs text-gray-400 mt-2">{L.popup_call} {L.popup_time}</p>
                </div>
              ) : (
                <form onSubmit={handleMessageSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{L.popup_name} <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="text" required value={messageForm.nom} onChange={(e) => setMessageForm({ ...messageForm, nom: e.target.value })} placeholder={L.popup_name_ph} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-school-blue focus:border-school-blue outline-none transition-all text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{L.popup_email} <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="email" required value={messageForm.email} onChange={(e) => setMessageForm({ ...messageForm, email: e.target.value })} placeholder={L.popup_email_ph} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-school-blue focus:border-school-blue outline-none transition-all text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">{L.popup_phone}</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input type="tel" value={messageForm.telephone} onChange={(e) => setMessageForm({ ...messageForm, telephone: e.target.value })} placeholder={L.popup_phone_ph} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-school-blue focus:border-school-blue outline-none transition-all text-sm" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{L.popup_service} <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <select required value={messageForm.service} onChange={(e) => setMessageForm({ ...messageForm, service: e.target.value })} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-school-blue focus:border-school-blue outline-none transition-all text-sm appearance-none bg-white">
                        <option value="">{L.popup_service_ph}</option>
                        {L.popup_services.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{L.popup_message} <span className="text-red-500">*</span></label>
                    <textarea required rows={4} value={messageForm.message} onChange={(e) => setMessageForm({ ...messageForm, message: e.target.value })} placeholder={L.popup_message_ph} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-school-blue focus:border-school-blue outline-none transition-all text-sm resize-none" />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-gray-500 space-y-1">
                      <p className="flex items-center gap-1"><Clock className="h-3 w-3" />{L.popup_delay} <span className="font-semibold text-school-blue">{L.popup_hours}</span></p>
                      <p className="flex items-center gap-1"><Phone className="h-3 w-3" />{L.popup_call} <span className="font-semibold text-school-blue">{L.popup_time}</span></p>
                    </div>
                    <button type="submit" className="bg-school-blue text-white hover:bg-[#162d4d] inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 hover:scale-105">
                      <Send className="h-4 w-4" />{L.popup_send}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}