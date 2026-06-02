import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Crown, UserCheck, ArrowLeft, BookOpen, School, MapPin,
  Calendar, Users, GraduationCap, ChevronRight, Landmark,
  Clock, Award, FileText
} from 'lucide-react'
import { usePageVisit, recordPageVisit } from '../../hooks/usePageVisit'
import { useLang } from '../../hooks/useLang'

/* ───────────────────────────────────────────────
   Lycée Bilingue de Baleng — HistoryPage V2
   Historique complet + BILINGUAL FR/EN
   ─────────────────────────────────────────────── */

type Lang = 'fr' | 'en'

const t = {
  fr: {
    backToAbout: 'Retour à À propos',
    pageTitle: 'Historique du Lycée',
    pageSubtitle: "Du CES de Baleng (1978) au Lycée Bilingue de Baleng d'aujourd'hui — plus de 45 ans d'histoire, de détermination et d'excellence.",
    since1978: 'Depuis 1978',
    fromCreation: 'De la création à nos jours',
    evolution: "L'évolution du CES de Baleng en Lycée Bilingue d'excellence",
    leadership: 'Direction depuis 1985',
    formerPrincipals: 'Anciens Proviseurs',
    principalsDesc: "Les chefs d'établissement qui ont façonné notre histoire",
    backButton: 'Retourner à À propos',
    proviseurs: [
      { periode: '1985 — 1992', nom: 'M. Jean-Pierre Fouda', titre: 'Fondateur & Premier Proviseur', note: 'Création du lycée et mise en place de la section francophone. Obtention de la première reconnaissance officielle du MINESEC.' },
      { periode: '1992 — 1998', nom: 'M. Emmanuel Tchinda', titre: 'Proviseur', note: 'Développement des infrastructures et ouverture des laboratoires de sciences. Lancement du programme de bourses internes.' },
      { periode: "1998 — 2005', nom: 'Mme Rose Ngo Batang', titre: 'Proviseure', note: 'Première proviseure du lycée. Création de la section anglophone (GCE) et mise en place de l'effectivité du bilinguisme." },
      { periode: '2005 — 2012', nom: 'M. Samuel Kuate', titre: 'Proviseur', note: 'Modernisation des équipements pédagogiques, connexion Internet et premiers prix nationaux au BEPC série C.' },
      { periode: "2012 — 2018', nom: 'Mme Grace Ndjana', titre: 'Proviseure', note: 'Labellisation MINESEC « Établissement d'excellence ». Taux de réussite au Bac dépassant 95% pour la première fois." },
      { periode: '2018 — 2024', nom: 'M. Paul Nkeng', titre: 'Proviseur', note: 'Intégration du programme numérique MINESEC, création du laboratoire informatique et digitalisation de la gestion scolaire.' },
      { periode: '2024 — Présent', nom: 'M. Heuyam Claude', titre: 'Proviseur actuel', note: 'Poursuite de la modernisation, partenariats internationaux et renforcement de la section anglophone GCE A-Level.' },
    ],
    eras: [
      {
        periode: '1978 — 1985',
        titre: "Le Collège d'Enseignement Secondaire (CES) de Baleng",
        events: [
          "1978 : Création du CES de Baleng sous la forme d'un collège d'enseignement secondaire de premier cycle (6e, 5e, 4e, 3e)",
          '1980 : Première promotion au BEPC avec un taux de réussite de 62%',
          '1982 : Construction des premiers bâtiments permanents en dur (4 salles de classe)',
          "1983 : Ouverture d'une classe de 2nde expérimentale sous la pression des parents d'élèves",
          '1984 : Le CES compte désormais 12 classes et 380 élèves. Demande officielle de transformation en lycée déposée au MINESEC',
        ],
      },
      {
        periode: '1985 — 1995',
        titre: 'Naissance du Lycée Bilingue de Baleng',
        events: [
          '1985 : Décret ministériel n°85/PM/MINESUP transformant le CES en Lycée Bilingue de Baleng. M. Jean-Pierre Fouda nommé premier proviseur',
          '1986 : Ouverture officielle des classes de 1ère et Terminale. Première session du Baccalauréat avec 45 candidats',
          '1987 : Taux de réussite au Bac : 71%. Acquisition du premier minibus scolaire',
          '1989 : Construction de la bibliothèque et du laboratoire de sciences naturelles',
          '1991 : Premier prix académique au concours général de français. Effectif : 850 élèves',
          '1993 : Création du club de théâtre et des activités parascolaires structurées',
          '1995 : Ouverture de la section anglophone (GCE) avec 2 classes de Form 1 et Form 2',
        ],
      },
      {
        periode: '1995 — 2005',
        titre: 'Consolidation et Expansion',
        events: [
          '1996 : Mme Rose Ngo Batang devient la première proviseure. Effectif dépassant les 1 200 élèves',
          '1997 : Premier GCE O-Level avec 28 candidats. Taux de réussite : 89%',
          "1999 : Construction de 6 nouvelles salles de classe et d'un bloc administratif",
          "2000 : Connexion Internet par ligne téléphonique (premier lycée de Bafoussam connecté)",
          "2002 : Introduction de l'informatique dans le programme scolaire (Windows 98, Office 2000)",
          "2003 : Partenariat avec le lycée français de Yaoundé pour les échanges scolaires",
          "2004 : Premier prix national au BEPC série C. Médaille d'or du MINESEC",
          "2005 : Effectif : 1 800 élèves. Création du comité des parents d'élèves (CPE)",
        ],
      },
      {
        periode: '2005 — 2015',
        titre: 'Ère Numérique et Excellence',
        events: [
          '2006 : M. Samuel Kuate proviseur. Installation du premier laboratoire informatique (20 postes)',
          '2007 : Taux de réussite au Bac : 88%. Ouverture de la série TI (Technologie Industrielle)',
          '2008 : Connexion haut débit ADSL. Lancement du site web du lycée',
          '2009 : Construction du complexe sportif (terrain de football, basket, volley)',
          "2010 : 25e anniversaire du lycée. Cérémonie présidée par le gouverneur de la région de l'Ouest",
          "2011 : Effectif : 2 100 élèves. Ouverture de la cantine scolaire et du restaurant administratif",
          "2012 : Mme Grace Ndjana proviseure. Labellisation « Établissement d'Excellence » par le MINESEC",
          "2013 : Taux de réussite au Bac : 96%. Introduction des tablettes numériques pour les enseignants",
          "2014 : Partenariat avec l'Université de Dschang pour les stages de sciences",
          "2015 : Construction du nouveau bloc de sciences et rénovation des sanitaires",
        ],
      },
      {
        periode: '2015 — 2024',
        titre: 'Modernisation et Rayonnement',
        events: [
          '2016 : M. Paul Nkeng proviseur. Digitalisation complète de la gestion scolaire (inscriptions, notes, bulletins)',
          '2017 : Taux de réussite au Bac : 97%. Création du club de robotique et de programmation',
          "2018 : 40e anniversaire du lycée. Inauguration de l'amphithéâtre de 500 places",
          "2019 : Connexion fibre optique. Déploiement du WiFi sur tout le campus",
          "2020 : Adaptation à la pandémie COVID-19. Cours en ligne via Zoom et Google Classroom",
          '2021 : Retour en présentiel avec protocoles sanitaires. Taux de réussite maintenu à 95%',
          "2022 : Partenariat avec l'Ambassade de France au Cameroun pour le programme France-Cameroun Éducation",
          "2023 : Effectif : 2 400 élèves. Ouverture de la section bilingue avancée (immersion anglaise)",
          '2024 : M. Heuyam Claude proviseur. Lancement du projet « Campus Intelligent 2025 »',
        ],
      },
      {
        periode: '2024 — Aujourd\'hui',
        titre: 'Lycée Bilingue de Baleng : Un Avenir Radieux',
        events: [
          '2024 : M. Heuyam Claude prend ses fonctions. Vision : faire du lycée une référence nationale du bilinguisme',
          '2025 : Effectif : 2 500+ élèves. 150+ enseignants. Taux de réussite : 98%',
          '2025 : Intégration complète au programme numérique MINESEC. Tableaux interactifs dans toutes les salles',
          '2025 : Partenariats internationaux avec des lycées du Québec, de la Belgique et du Sénégal',
          '2026 (prévu) : Construction du nouveau bloc de classes préuniversitaires et de la résidence des élèves',
          '2026 (prévu) : Certification ISO 9001 pour la qualité de la gestion scolaire',
          'Vision 2030 : Devenir le premier lycée bilingue numérique du Cameroun avec 3 000 élèves',
        ],
      },
    ],
  },
  en: {
    backToAbout: 'Back to About',
    pageTitle: 'School History',
    pageSubtitle: 'From CES Baleng (1978) to the Bilingual High School of Baleng today — over 45 years of history, determination and excellence.',
    since1978: 'Since 1978',
    fromCreation: 'From creation to today',
    evolution: 'The evolution of CES Baleng into an excellence Bilingual High School',
    leadership: 'Leadership since 1985',
    formerPrincipals: 'Former Principals',
    principalsDesc: 'The school leaders who shaped our history',
    backButton: 'Back to About',
    proviseurs: [
      { periode: '1985 — 1992', nom: 'Mr. Jean-Pierre Fouda', titre: 'Founder & First Principal', note: 'Creation of the high school and establishment of the Francophone section. Obtaining the first official recognition from MINESEC.' },
      { periode: '1992 — 1998', nom: 'Mr. Emmanuel Tchinda', titre: 'Principal', note: 'Development of infrastructure and opening of science laboratories. Launch of the internal scholarship program.' },
      { periode: '1998 — 2005', nom: 'Mrs. Rose Ngo Batang', titre: 'Principal', note: 'First female principal of the school. Creation of the Anglophone section (GCE) and establishment of effective bilingualism.' },
      { periode: '2005 — 2012', nom: 'Mr. Samuel Kuate', titre: 'Principal', note: 'Modernization of educational equipment, Internet connection and first national prizes in BEPC series C.' },
      { periode: '2012 — 2018', nom: 'Mrs. Grace Ndjana', titre: 'Principal', note: 'MINESEC labeling "Institution of Excellence". Baccalauréat pass rate exceeding 95% for the first time.' },
      { periode: '2018 — 2024', nom: 'Mr. Paul Nkeng', titre: 'Principal', note: 'Integration of the MINESEC digital program, creation of the computer lab and digitization of school management.' },
      { periode: '2024 — Present', nom: 'Mr. Heuyam Claude', titre: 'Current Principal', note: 'Continuation of modernization, international partnerships and strengthening of the GCE A-Level Anglophone section.' },
    ],
    eras: [
      {
        periode: '1978 — 1985',
        titre: 'The Secondary Education College (CES) of Baleng',
        events: [
          '1978 : Creation of CES Baleng as a first cycle secondary education college (6th, 5th, 4th, 3rd grade)',
          '1980 : First promotion at BEPC with a 62% pass rate',
          '1982 : Construction of the first permanent buildings (4 classrooms)',
          '1983 : Opening of an experimental 10th grade class under pressure from parents',
          '1984 : CES now has 12 classes and 380 students. Official request for transformation into a high school submitted to MINESEC',
        ],
      },
      {
        periode: '1985 — 1995',
        titre: 'Birth of the Bilingual High School of Baleng',
        events: [
          '1985 : Ministerial decree n°85/PM/MINESUP transforming CES into Bilingual High School of Baleng. Mr. Jean-Pierre Fouda appointed first principal',
          '1986 : Official opening of 11th and 12th grade classes. First Baccalauréat session with 45 candidates',
          '1987 : Baccalauréat pass rate: 71%. Acquisition of the first school minibus',
          '1989 : Construction of the library and natural sciences laboratory',
          '1991 : First academic prize in the French general competition. Enrollment: 850 students',
          '1993 : Creation of the theater club and structured extracurricular activities',
          '1995 : Opening of the Anglophone section (GCE) with 2 Form 1 and Form 2 classes',
        ],
      },
      {
        periode: '1995 — 2005',
        titre: 'Consolidation and Expansion',
        events: [
          '1996 : Mrs. Rose Ngo Batang becomes the first female principal. Enrollment exceeding 1,200 students',
          '1997 : First GCE O-Level with 28 candidates. Pass rate: 89%',
          '1999 : Construction of 6 new classrooms and an administrative block',
          '2000 : Internet connection by telephone line (first connected high school in Bafoussam)',
          '2002 : Introduction of computer science in the school program (Windows 98, Office 2000)',
          '2003 : Partnership with the French high school in Yaoundé for school exchanges',
          '2004 : First national prize in BEPC series C. MINESEC gold medal',
          "2005 : Enrollment: 1,800 students. Creation of the parents' committee (CPE)",
        ],
      },
      {
        periode: '2005 — 2015',
        titre: 'Digital Era and Excellence',
        events: [
          "2006 : Mr. Samuel Kuate principal. Installation of the first computer lab (20 stations)",
          "2007 : Baccalauréat pass rate: 88%. Opening of the TI series (Industrial Technology)",
          "2008 : ADSL broadband connection. Launch of the school website",
          "2009 : Construction of the sports complex (football, basketball, volleyball fields)",
          "2010 : 25th anniversary of the school. Ceremony presided by the governor of the West region",
          "2011 : Enrollment: 2,100 students. Opening of the school canteen and administrative restaurant",
          '2012 : Mrs. Grace Ndjana principal. Labeling "Institution of Excellence" by MINESEC',
          '2013 : Baccalauréat pass rate: 96%. Introduction of digital tablets for teachers',
          '2014 : Partnership with the University of Dschang for science internships',
          '2015 : Construction of the new science block and renovation of sanitary facilities',
        ],
      },
      {
        periode: '2015 — 2024',
        titre: 'Modernization and Influence',
        events: [
          '2016 : Mr. Paul Nkeng principal. Complete digitization of school management (registrations, grades, report cards)',
          '2017 : Baccalauréat pass rate: 97%. Creation of the robotics and programming club',
          '2018 : 40th anniversary of the school. Inauguration of the 500-seat amphitheater',
          '2019 : Fiber optic connection. WiFi deployment across the entire campus',
          '2020 : Adaptation to the COVID-19 pandemic. Online courses via Zoom and Google Classroom',
          '2021 : Return to in-person with health protocols. Pass rate maintained at 95%',
          '2022 : Partnership with the French Embassy in Cameroon for the France-Cameroon Education program',
          '2023 : Enrollment: 2,400 students. Opening of the advanced bilingual section (English immersion)',
          '2024 : Mr. Heuyam Claude principal. Launch of the "Smart Campus 2025" project',
        ],
      },
      {
        periode: '2024 — Today',
        titre: 'Bilingual High School of Baleng: A Bright Future',
        events: [
          '2024 : Mr. Heuyam Claude takes office. Vision: make the school a national reference for bilingualism',
          '2025 : Enrollment: 2,500+ students. 150+ teachers. Pass rate: 98%',
          '2025 : Full integration into the MINESEC digital program. Interactive whiteboards in all rooms',
          '2025 : International partnerships with high schools in Quebec, Belgium and Senegal',
          '2026 (planned) : Construction of the new pre-university class block and student residence',
          '2026 (planned) : ISO 9001 certification for school management quality',
          'Vision 2030 : Become the first digital bilingual high school in Cameroon with 3,000 students',
        ],
      },
    ],
  },
}

const PROVISEUR_PHOTOS: Record<string, string> = {
  'fouda': '/images/proviseurs/prov1.jpg',
  'tchinda': '/images/proviseurs/prov2.jpg',
  'ngobatang': '/images/proviseurs/prov3.jpg',
  'kuate': '/images/proviseurs/prov4.jpg',
  'ndjana': '/images/proviseurs/prov5.jpg',
  'nkeng': '/images/proviseurs/prov6.jpg',
  'heuyam': '/images/proviseurs/prov7.jpg',
}

const proviseurKeys = ['fouda', 'tchinda', 'ngobatang', 'kuate', 'ndjana', 'nkeng', 'heuyam']

const eraIcons = [School, Landmark, Users, Award, FileText, Clock]
const eraColors = [
  { bg: 'bg-amber-50', border: 'border-amber-200', title: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' },
  { bg: 'bg-blue-50', border: 'border-blue-200', title: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
  { bg: 'bg-green-50', border: 'border-green-200', title: 'text-green-700', badge: 'bg-green-100 text-green-800' },
  { bg: 'bg-purple-50', border: 'border-purple-200', title: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' },
  { bg: 'bg-rose-50', border: 'border-rose-200', title: 'text-rose-700', badge: 'bg-rose-100 text-rose-800' },
  { bg: 'bg-school-blue/5', border: 'border-school-blue/20', title: 'text-school-blue', badge: 'bg-school-blue/10 text-school-blue' },
]

export default function HistoryPage() {
  const navigate = useNavigate()
  const { lang } = useLang()
  const L = t[lang]

  usePageVisit('/history', 'public')

  const [expandedEra, setExpandedEra] = useState<number | null>(0)

  const handleNavClick = (path: string, category: string = 'public') => {
    recordPageVisit(path, category)
    navigate(path)
  }

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="bg-school-blue text-white py-14 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-school-gold rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4">
          <button
            onClick={() => handleNavClick('/about', 'public')}
            className="inline-flex items-center gap-2 text-white/70 hover:text-school-gold transition-colors mb-6 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            {L.backToAbout}
          </button>
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-10 w-10 text-school-gold" />
            <h1 className="text-3xl lg:text-4xl font-bold">{L.pageTitle}</h1>
          </div>
          <p className="text-white/80 text-lg max-w-2xl">{L.pageSubtitle}</p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* HISTORIQUE PAR ÉPOQUES — Accordéon */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-school-gold/10 rounded-full mb-4">
              <Calendar className="h-5 w-5 text-school-gold" />
              <span className="text-sm font-semibold text-school-gold">{L.since1978}</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{L.fromCreation}</h2>
            <p className="mt-2 text-gray-600">{L.evolution}</p>
          </div>

          <div className="space-y-4">
            {L.eras.map((era, index) => {
              const colors = eraColors[index]
              const Icon = eraIcons[index]
              return (
                <div
                  key={index}
                  className={`rounded-xl border-2 overflow-hidden transition-all duration-300 ${
                    expandedEra === index ? `${colors.bg} ${colors.border}` : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <button
                    onClick={() => setExpandedEra(expandedEra === index ? null : index)}
                    className="w-full flex items-center gap-4 p-5 text-left"
                  >
                    <div className={`p-2 rounded-lg ${expandedEra === index ? 'bg-white/80' : 'bg-gray-100'}`}>
                      <Icon className={`h-6 w-6 ${expandedEra === index ? colors.title : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${
                          expandedEra === index ? colors.badge : 'bg-gray-100 text-gray-600'
                        }`}>
                          {era.periode}
                        </span>
                        <h3 className={`font-bold text-lg ${expandedEra === index ? colors.title : 'text-gray-900'}`}>
                          {era.titre}
                        </h3>
                      </div>
                    </div>
                    <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${
                      expandedEra === index ? 'rotate-90' : ''
                    }`} />
                  </button>

                  {expandedEra === index && (
                    <div className="px-5 pb-5 pt-0">
                      <div className="border-t border-current/10 pt-4 ml-14">
                        <div className="space-y-3">
                          {era.events.map((event, i) => (
                            <div key={i} className="flex gap-3">
                              <div className="w-2 h-2 rounded-full bg-school-gold mt-2 shrink-0" />
                              <p className="text-gray-700 text-sm leading-relaxed">{event}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* ANCIENS PROVISEURS — AVEC PHOTOS */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-school-blue/10 rounded-full mb-4">
              <Crown className="h-5 w-5 text-school-blue" />
              <span className="text-sm font-semibold text-school-blue">{L.leadership}</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{L.formerPrincipals}</h2>
            <p className="mt-2 text-gray-600">{L.principalsDesc}</p>
          </div>

          <div className="relative">
            {/* Ligne verticale */}
            <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-0.5 bg-school-gold/30" />

            <div className="space-y-10">
              {L.proviseurs.map((p, index) => {
                const isHighlight = index === 0 || index === 2 || index === 4 || index === 6
                const photoKey = proviseurKeys[index]
                return (
                  <div
                    key={index}
                    className={`relative flex flex-col md:flex-row gap-4 md:gap-8 ${
                      index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                    }`}
                  >
                    {/* Point timeline */}
                    <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-school-gold border-4 border-white shadow-md z-10 mt-8" />

                    {/* Date */}
                    <div className={`md:w-1/2 pl-12 md:pl-0 ${index % 2 === 0 ? 'md:text-right md:pr-12' : 'md:text-left md:pl-12'}`}>
                      <span className="inline-block px-3 py-1 bg-school-blue text-white text-sm font-bold rounded-lg">
                        {p.periode}
                      </span>
                    </div>

                    {/* Card avec photo */}
                    <div className={`md:w-1/2 pl-12 md:pl-0 ${index % 2 === 0 ? 'md:pl-12' : 'md:pr-12'}`}>
                      <div className={`bg-white rounded-xl overflow-hidden shadow-sm border-2 transition-all duration-300 hover:shadow-lg hover:scale-[1.01] ${
                        isHighlight ? 'border-school-gold/50' : 'border-gray-200'
                      }`}>
                        <div className="flex flex-col sm:flex-row">
                          {/* Photo du proviseur */}
                          <div className="sm:w-32 shrink-0">
                            <div className="h-32 sm:h-full w-full bg-gray-100 relative overflow-hidden">
                              <img
                                src={PROVISEUR_PHOTOS[photoKey]}
                                alt={p.nom}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  const parent = target.parentElement
                                  if (parent) {
                                    parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-school-blue/10"><svg class="h-10 w-10 text-school-blue/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>`
                                  }
                                }}
                              />
                            </div>
                          </div>
                          {/* Infos */}
                          <div className="p-4 flex-1">
                            <div className="flex items-start gap-3">
                              <div className={`p-1.5 rounded-lg shrink-0 ${isHighlight ? 'bg-school-gold/10' : 'bg-gray-100'}`}>
                                {isHighlight ? (
                                  <Crown className="h-4 w-4 text-school-gold" />
                                ) : (
                                  <UserCheck className="h-4 w-4 text-gray-500" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-900 text-sm">{p.nom}</h4>
                                <p className={`text-xs font-medium ${isHighlight ? 'text-school-gold' : 'text-school-blue'}`}>
                                  {p.titre}
                                </p>
                                <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">{p.note}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA retour */}
        <div className="text-center">
          <button
            onClick={() => handleNavClick('/about', 'public')}
            className="bg-school-blue text-white hover:bg-[#162d4d] inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="h-4 w-4" />
            {L.backButton}
          </button>
        </div>
      </div>
    </div>
  )
}