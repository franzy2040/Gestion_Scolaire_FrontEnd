import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin, Phone, Mail, GraduationCap, Globe, Clock, Calendar,
  Navigation, Send, User, MessageSquare, CheckCircle, ArrowRight,
  BookOpen, Users, Award, Lightbulb, School, ChevronRight
} from 'lucide-react'
import { usePageVisit, recordPageVisit } from '../../hooks/usePageVisit'
import { useLang } from '../../hooks/useLang'

/* ───────────────────────────────────────────────
   Lycée Bilingue de Baleng — AboutPage V4
   BILINGUAL FR/EN
   ─────────────────────────────────────────────── */

type Lang = 'fr' | 'en'

const t = {
  fr: {
    heroTitle: 'À propos du Lycée Bilingue de Baleng',
    heroDesc: "Un établissement d'excellence sous tutelle du MINESEC, engagé dans la formation bilingue des leaders de demain depuis plus de 40 ans.",
    provTitle: 'Mot du Proviseur',
    provLabel: 'Direction',
    provName: 'M. Heuyam Claude',
    provRole: 'Proviseur',
    provEmail: 'heuyam.claude@lycee-baleng.cm',
    provPhone: '+237 233 45 67 90',
    provSince: 'En poste depuis 2024',
    provFormation: 'Formation',
    provDegree: "Doctorat en Sciences de l'Éducation",
    provSchool: 'ENS Yaoundé — Promotion 1998',
    provWelcome: 'Bienvenue à tous',
    provLetter1: 'Chers parents, chers élèves, chers partenaires,',
    provLetter2: "C'est avec une immense fierté que je vous accueille sur le site du Lycée Bilingue de Baleng, un établissement qui porte en lui plus de quatre décennies d'excellence académique et de détermination. Depuis sa création en 1985, notre lycée n'a cessé de grandir, d'évoluer et de s'adapter aux défis de l'enseignement moderne, tout en préservant les valeurs fondamentales qui font sa force : le bilinguisme, la rigueur et l'ouverture d'esprit.",
    provLetter3: "Sous la tutelle du MINESEC, nous formons chaque année plus de 2 500 jeunes camerounais, les préparant avec succès aux examens de l'OBC et du GCE. Notre taux de réussite de 98% au Baccalauréat et au GCE A-Level témoigne de l'engagement sans faille de nos enseignants et de la qualité de notre pédagogie.",
    provLetter4: "Aujourd'hui, avec le programme « Campus Intelligent 2025 », nous entrons dans une nouvelle ère : tableaux interactifs, laboratoires numériques, partenariats internationaux. Notre ambition est claire : faire du Lycée Bilingue de Baleng la référence nationale de l'éducation bilingue de qualité.",
    provLetter5: "Je vous invite à découvrir notre histoire, nos valeurs et nos projets. Ensemble, construisons l'avenir de nos enfants.",
    provLetter6: "Bienvenue au Lycée Bilingue de Baleng. Bienvenue dans l'excellence.",
    provSign: 'Proviseur du Lycée Bilingue de Baleng',
    provDate: 'Bafoussam, mai 2026',
    presentationTitle: 'Présentation du Lycée',
    presentationLabel: 'Notre établissement',
    schoolName: 'Lycée Bilingue de Baleng',
    founded: 'Fondé en 1985',
    presentationDesc1: "Le Lycée Bilingue de Baleng est un établissement public d'excellence situé à Bafoussam, dans la région de l'Ouest du Cameroun. Notre mission est de former des jeunes responsables, compétents et ouverts sur le monde, à travers un enseignement bilingue de qualité.",
    presentationDesc2: "Sous la tutelle du MINESEC, le lycée applique strictement les programmes officiels camerounais et prépare les élèves aux examens de l'OBC (BEPC, Probatoire, Baccalauréat) et du GCE (O-Level, A-Level) avec un taux de réussite exceptionnel de 98%.",
    highlightsTitle: 'Faits marquants',
    highlights: [
      { annee: '1978', texte: 'Création du CES de Baleng (collège)' },
      { annee: '1985', texte: 'Transformation en Lycée Bilingue de Baleng' },
      { annee: '1995', texte: 'Ouverture de la section anglophone (GCE)' },
      { annee: '2005', texte: 'Premier prix national au BEPC, série C' },
      { annee: '2018', texte: "Labellisation MINESEC « Établissement d'excellence »" },
      { annee: '2024', texte: 'M. Heuyam Claude proviseur — Programme Campus Intelligent' },
    ],
    historyLink: "Voir l'historique complet",
    stats: [
      { value: '2,500+', label: 'Élèves inscrits', desc: 'Sections FR & EN' },
      { value: '150+', label: 'Enseignants qualifiés', desc: 'Certifiés MINESEC' },
      { value: '98%', label: 'Taux de réussite', desc: 'Bac & GCE A-Level' },
      { value: '47', label: "Années d'excellence", desc: 'Depuis 1978' },
    ],
    locationTitle: 'Localisation & Contact',
    locationLabel: 'Nous trouver',
    mapTitle: 'Lycée Bilingue de Baleng',
    mapSub: 'Baleng, Bafoussam III',
    mapSource: 'OpenStreetMap — Bafoussam, Cameroun',
    mapFullscreen: 'Voir en plein écran',
    addressTitle: 'Adresse',
    address: "Lycée Bilingue de Baleng Quartier Baleng Arrondissement Bafoussam III Région de l'Ouest, Cameroun",
    gpsTitle: 'Coordonnées GPS',
    gps: '5.4700° N, 10.4200° E',
    altitude: 'Altitude : ~1,521 m (plateau Bamiléké)',
    phoneTitle: 'Téléphone',
    phone1: '+237 233 45 67 89',
    phoneHours: 'Appel : 8h00 — 16h30 (lun-ven)',
    emailTitle: 'Email',
    email1: 'contact@lycee-baleng.cm',
    emailResponse: 'Réponse sous 48h ouvrables',
    hoursTitle: "Horaires d'ouverture",
    hoursWeek: 'Lundi — Vendredi',
    hoursWeekTime: '7h30 — 16h30',
    hoursSat: 'Samedi',
    hoursSatTime: '8h00 — 12h00',
    hoursSun: 'Dimanche',
    hoursSunTime: 'Fermé',
    hoursNote: 'Visites sur rendez-vous au secrétariat du proviseur',
    contactTitle: 'Laissez un message au Secrétariat du Proviseur',
    contactLabel: 'Contactez-nous',
    contactDesc: 'Nous vous répondrons dans les plus brefs délais',
    formName: 'Nom complet',
    formNamePh: 'Votre nom et prénom',
    formEmail: 'Email',
    formEmailPh: 'votre@email.com',
    formPhone: 'Téléphone',
    formPhonePh: '+237 6XX XX XX XX',
    formService: 'Service demandé',
    formServicePh: 'Choisir un service...',
    formMessage: 'Message',
    formMessagePh: 'Décrivez votre demande en détail...',
    formSubmit: 'Envoyer le message',
    formSuccess: 'Message envoyé !',
    formSuccessDesc: 'Votre message a bien été transmis au secrétariat du proviseur.',
    formDelay: 'Délai de réponse :',
    formDelayTime: '48h ouvrables',
    formCall: 'Appel et visite :',
    formCallTime: '8h00 — 16h30 (lun-ven)',
    formReset: 'Le formulaire se réinitialisera automatiquement...',
    tipsTitle: 'Conseils pour votre message',
    tips: [
      'Soyez précis dans votre demande pour un traitement rapide',
      "Indiquez le nom et la classe de l'élève concerné si applicable",
      'Vérifiez votre email pour recevoir la confirmation',
      'Pour les urgences, privilégiez un appel téléphonique',
    ],
    directContactTitle: 'Contact direct',
    directSecretariat: 'Secrétariat :',
    directProviseur: 'Proviseur :',
    directEmail: 'Email :',
    postalTitle: 'Adresse postale',
    postal: "Lycée Bilingue de Baleng BP : 125 Bafoussam Région de l'Ouest République du Cameroun",
    services: [
      'Inscription / Réinscription',
      'Demande de documents (bulletin, attestation)',
      'Renseignements pédagogiques',
      'Réclamation / Suggestion',
      'Partenariat / Collaboration',
      'Autre',
    ],
  },
  en: {
    heroTitle: 'About the Bilingual High School of Baleng',
    heroDesc: 'An institution of excellence under the supervision of MINESEC, committed to bilingual training of future leaders for over 40 years.',
    provTitle: "Principal's Message",
    provLabel: 'Leadership',
    provName: 'Mr. Heuyam Claude',
    provRole: 'Principal',
    provEmail: 'heuyam.claude@lycee-baleng.cm',
    provPhone: '+237 233 45 67 90',
    provSince: 'In office since 2024',
    provFormation: 'Education',
    provDegree: 'PhD in Education Sciences',
    provSchool: 'ENS Yaoundé — Class of 1998',
    provWelcome: 'Welcome to all',
    provLetter1: 'Dear parents, dear students, dear partners,',
    provLetter2: "It is with immense pride that I welcome you to the website of the Bilingual High School of Baleng, an institution that carries more than four decades of academic excellence and determination. Since its creation in 1985, our high school has continued to grow, evolve and adapt to the challenges of modern education, while preserving the fundamental values that make it strong: bilingualism, rigor and open-mindedness.",
    provLetter3: 'Under the supervision of MINESEC, we train more than 2,500 young Cameroonians each year, successfully preparing them for the OBC and GCE exams. Our 98% pass rate at the Baccalauréat and GCE A-Level testifies to the unwavering commitment of our teachers and the quality of our pedagogy.',
    provLetter4: 'Today, with the « Smart Campus 2025 » program, we are entering a new era: interactive whiteboards, digital laboratories, international partnerships. Our ambition is clear: to make the Bilingual High School of Baleng the national reference for quality bilingual education.',
    provLetter5: 'I invite you to discover our history, our values and our projects. Together, let us build the future of our children.',
    provLetter6: 'Welcome to the Bilingual High School of Baleng. Welcome to excellence.',
    provSign: 'Principal of the Bilingual High School of Baleng',
    provDate: 'Bafoussam, May 2026',
    presentationTitle: 'School Presentation',
    presentationLabel: 'Our Institution',
    schoolName: 'Bilingual High School of Baleng',
    founded: 'Founded in 1985',
    presentationDesc1: 'The Bilingual High School of Baleng is a public institution of excellence located in Bafoussam, in the West Region of Cameroon. Our mission is to train responsible, competent and open-minded young people through quality bilingual education.',
    presentationDesc2: "Under the supervision of MINESEC, the school strictly applies the official Cameroonian programs and prepares students for the OBC exams (BEPC, Probatoire, Baccalauréat) and GCE (O-Level, A-Level) with an exceptional 98% pass rate.",
    highlightsTitle: 'Key Milestones',
    highlights: [
      { annee: '1978', texte: 'Creation of CES Baleng (middle school)' },
      { annee: '1985', texte: 'Transformation into Bilingual High School of Baleng' },
      { annee: '1995', texte: 'Opening of the Anglophone section (GCE)' },
      { annee: '2005', texte: 'First national prize at BEPC, series C' },
      { annee: '2018', texte: 'MINESEC labeling "Excellence Institution"' },
      { annee: '2024', texte: 'Mr. Heuyam Claude principal — Smart Campus Program' },
    ],
    historyLink: 'View complete history',
    stats: [
      { value: '2,500+', label: 'Enrolled Students', desc: 'FR & EN Sections' },
      { value: '150+', label: 'Qualified Teachers', desc: 'MINESEC Certified' },
      { value: '98%', label: 'Pass Rate', desc: 'Bac & GCE A-Level' },
      { value: '47', label: 'Years of Excellence', desc: 'Since 1978' },
    ],
    locationTitle: 'Location & Contact',
    locationLabel: 'Find Us',
    mapTitle: 'Bilingual High School of Baleng',
    mapSub: 'Baleng, Bafoussam III',
    mapSource: 'OpenStreetMap — Bafoussam, Cameroon',
    mapFullscreen: 'View full screen',
    addressTitle: 'Address',
    address: 'Bilingual High School of Baleng Baleng Neighborhood Bafoussam III District West Region, Cameroon',
    gpsTitle: 'GPS Coordinates',
    gps: '5.4700° N, 10.4200° E',
    altitude: 'Altitude: ~1,521 m (Bamiléké plateau)',
    phoneTitle: 'Phone',
    phone1: '+237 233 45 67 89',
    phoneHours: 'Call: 8:00 AM — 4:30 PM (Mon-Fri)',
    emailTitle: 'Email',
    email1: 'contact@lycee-baleng.cm',
    emailResponse: 'Response within 48 business hours',
    hoursTitle: 'Opening Hours',
    hoursWeek: 'Monday — Friday',
    hoursWeekTime: '7:30 AM — 4:30 PM',
    hoursSat: 'Saturday',
    hoursSatTime: '8:00 AM — 12:00 PM',
    hoursSun: 'Sunday',
    hoursSunTime: 'Closed',
    hoursNote: "Visits by appointment at the principal's secretariat",
    contactTitle: "Leave a Message for the Principal's Secretariat",
    contactLabel: 'Contact Us',
    contactDesc: 'We will respond as soon as possible',
    formName: 'Full Name',
    formNamePh: 'Your first and last name',
    formEmail: 'Email',
    formEmailPh: 'your@email.com',
    formPhone: 'Phone',
    formPhonePh: '+237 6XX XX XX XX',
    formService: 'Service Requested',
    formServicePh: 'Choose a service...',
    formMessage: 'Message',
    formMessagePh: 'Describe your request in detail...',
    formSubmit: 'Send Message',
    formSuccess: 'Message sent!',
    formSuccessDesc: "Your message has been successfully transmitted to the principal's secretariat.",
    formDelay: 'Response time:',
    formDelayTime: '48h',
    formCall: 'Call and visit:',
    formCallTime: '8:00 AM — 4:30 PM (Mon-Fri)',
    formReset: 'The form will reset automatically...',
    tipsTitle: 'Tips for your message',
    tips: [
      'Be specific in your request for quick processing',
      'Indicate the name and class of the student concerned if applicable',
      'Check your email to receive the confirmation',
      'For emergencies, prefer a phone call',
    ],
    directContactTitle: 'Direct Contact',
    directSecretariat: 'Secretariat:',
    directProviseur: 'Principal:',
    directEmail: 'Email:',
    postalTitle: 'Postal Address',
    postal: 'Bilingual High School of Baleng PO Box: 125 Bafoussam West Region Republic of Cameroon',
    services: [
      'Registration / Re-registration',
      'Document request (report card, certificate)',
      'Academic information',
      'Complaint / Suggestion',
      'Partnership / Collaboration',
      'Other',
    ],
  },
}

export default function AboutPage() {
  const navigate = useNavigate()
  const { lang } = useLang()
  const L = t[lang]

  usePageVisit('/about', 'public')

  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    service: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handleNavClick = (path: string, category: string = 'public') => {
    recordPageVisit(path, category)
    navigate(path)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Message au proviseur :', formData)
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setFormData({ nom: '', email: '', telephone: '', service: '', message: '' })
    }, 5000)
  }

  return (
    <div className="animate-fade-in">
      {/* Hero About */}
      <section className="bg-school-blue text-white py-14 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-school-gold rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <GraduationCap className="h-14 w-14 text-school-gold mx-auto mb-4" />
          <h1 className="text-3xl lg:text-4xl font-bold mb-3">{L.heroTitle}</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">{L.heroDesc}</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* MOT DU CHEF D'ÉTABLISSEMENT */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-school-gold/10 rounded-full mb-4">
              <User className="h-5 w-5 text-school-gold" />
              <span className="text-sm font-semibold text-school-gold">{L.provLabel}</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{L.provTitle}</h2>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="grid lg:grid-cols-3 gap-0">
              <div className="lg:col-span-1 bg-school-blue p-8 text-white flex flex-col items-center text-center">
                <div className="w-40 h-40 rounded-full bg-white/20 border-4 border-school-gold flex items-center justify-center mb-6 overflow-hidden">
                  <GraduationCap className="h-20 w-20 text-white/60" />
                </div>
                <h3 className="text-2xl font-bold mb-1">{L.provName}</h3>
                <p className="text-school-gold font-semibold mb-4">{L.provRole}</p>
                <div className="w-full space-y-3 text-sm text-white/80">
                  <div className="flex items-center gap-2 justify-center">
                    <Mail className="h-4 w-4 text-school-gold" />
                    <span>{L.provEmail}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <Phone className="h-4 w-4 text-school-gold" />
                    <span>{L.provPhone}</span>
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    <Clock className="h-4 w-4 text-school-gold" />
                    <span>{L.provSince}</span>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-white/20 w-full">
                  <p className="text-xs text-white/60 uppercase tracking-wider font-semibold mb-2">{L.provFormation}</p>
                  <p className="text-sm text-white/80">{L.provDegree}</p>
                  <p className="text-sm text-white/80">{L.provSchool}</p>
                </div>
              </div>

              <div className="lg:col-span-2 p-8">
                <div className="flex items-center gap-2 mb-6">
                  <MessageSquare className="h-6 w-6 text-school-blue" />
                  <h4 className="text-xl font-bold text-gray-900">{L.provWelcome}</h4>
                </div>
                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <p className="text-lg text-school-blue font-semibold">« {L.provLetter1}</p>
                  <p>{L.provLetter2}</p>
                  <p>{L.provLetter3}</p>
                  <p>{L.provLetter4}</p>
                  <p>{L.provLetter5}</p>
                  <p className="text-lg text-school-blue font-semibold mt-6">{L.provLetter6}</p>
                </div>
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <p className="text-gray-900 font-bold">{L.provName}</p>
                  <p className="text-gray-500 text-sm">{L.provSign}</p>
                  <p className="text-gray-400 text-xs">{L.provDate}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRÉSENTATION */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-school-blue/10 rounded-full mb-4">
              <School className="h-5 w-5 text-school-blue" />
              <span className="text-sm font-semibold text-school-blue">{L.presentationLabel}</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{L.presentationTitle}</h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-10">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-school-gold/10 rounded-xl">
                  <GraduationCap className="h-8 w-8 text-school-gold" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{L.schoolName}</h3>
                  <p className="text-gray-500">{L.founded}</p>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed mb-4">{L.presentationDesc1}</p>
              <p className="text-gray-600 leading-relaxed">{L.presentationDesc2}</p>
            </div>

            <div className="bg-school-blue rounded-xl p-6 text-white">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-school-gold" />
                {L.highlightsTitle}
              </h3>
              <div className="space-y-4">
                {L.highlights.map((fait, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-16 text-right shrink-0">
                      <span className="font-bold text-school-gold">{fait.annee}</span>
                    </div>
                    <p className="text-white/80 text-sm">{fait.texte}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => handleNavClick('/history', 'public')}
                className="mt-6 inline-flex items-center gap-2 text-school-gold hover:text-yellow-300 transition-colors text-sm font-semibold"
              >
                {L.historyLink}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Users, value: L.stats[0].value, label: L.stats[0].label, desc: L.stats[0].desc },
              { icon: GraduationCap, value: L.stats[1].value, label: L.stats[1].label, desc: L.stats[1].desc },
              { icon: Award, value: L.stats[2].value, label: L.stats[2].label, desc: L.stats[2].desc },
              { icon: Calendar, value: L.stats[3].value, label: L.stats[3].label, desc: L.stats[3].desc },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-xl p-5 text-center shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <stat.icon className="h-8 w-8 text-school-blue mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-700 font-medium">{stat.label}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* LOCALISATION & CONTACT */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-school-gold/10 rounded-full mb-4">
              <MapPin className="h-5 w-5 text-school-gold" />
              <span className="text-sm font-semibold text-school-gold">{L.locationLabel}</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{L.locationTitle}</h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="h-[350px] w-full relative">
                  <iframe
                    src="https://www.openstreetmap.org/export/embed.html?bbox=10.38%2C5.43%2C10.46%2C5.51&layer=mapnik&marker=5.47%2C10.42"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Carte Lycée Bilingue de Baleng"
                    className="grayscale-[0.2] hover:grayscale-0 transition-all duration-500"
                  />
                  <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border-l-4 border-school-gold">
                    <p className="font-bold text-school-blue text-sm">{L.mapTitle}</p>
                    <p className="text-xs text-gray-600">{L.mapSub}</p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 flex items-center justify-between text-sm">
                  <span className="text-gray-600">{L.mapSource}</span>
                  <a
                    href="https://www.openstreetmap.org/?mlat=5.47&mlon=10.42#map=14/5.47/10.42"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-school-blue hover:text-school-gold font-medium transition-colors inline-flex items-center gap-1"
                  >
                    <Navigation className="h-4 w-4" />
                    {L.mapFullscreen}
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-school-blue/10">
                    <MapPin className="h-5 w-5 text-school-blue" />
                  </div>
                  <h3 className="font-bold text-gray-900">{L.addressTitle}</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed pl-11 whitespace-pre-line">{L.address}</p>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-school-gold/10">
                    <Globe className="h-5 w-5 text-school-gold" />
                  </div>
                  <h3 className="font-bold text-gray-900">{L.gpsTitle}</h3>
                </div>
                <p className="text-gray-600 text-sm font-mono pl-11">{L.gps}</p>
                <p className="text-gray-500 text-xs mt-1 pl-11">{L.altitude}</p>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">{L.phoneTitle}</h3>
                </div>
                <p className="text-gray-600 text-sm pl-11">{L.phone1}<br />
                  <span className="text-gray-400 text-xs">{L.phoneHours}</span>
                </p>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">{L.emailTitle}</h3>
                </div>
                <p className="text-gray-600 text-sm pl-11">{L.email1}<br />
                  <span className="text-gray-400 text-xs">{L.emailResponse}</span>
                </p>
              </div>

              <div className="bg-school-blue rounded-xl p-5 text-white">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-school-gold" />
                  {L.hoursTitle}
                </h3>
                <div className="space-y-2 text-sm text-white/80">
                  <div className="flex justify-between">
                    <span>{L.hoursWeek}</span>
                    <span className="font-semibold text-white">{L.hoursWeekTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{L.hoursSat}</span>
                    <span className="font-semibold text-white">{L.hoursSatTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{L.hoursSun}</span>
                    <span className="text-white/50">{L.hoursSunTime}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-xs text-white/60">{L.hoursNote}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FORMULAIRE CONTACT */}
        <section className="mb-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-school-blue/10 rounded-full mb-4">
              <MessageSquare className="h-5 w-5 text-school-blue" />
              <span className="text-sm font-semibold text-school-blue">{L.contactLabel}</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{L.contactTitle}</h2>
            <p className="mt-2 text-gray-600">{L.contactDesc}</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{L.formSuccess}</h3>
                    <p className="text-gray-600 mb-2">{L.formSuccessDesc}</p>
                    <p className="text-sm text-school-blue font-semibold">{L.formDelay} {L.formDelayTime}</p>
                    <p className="text-xs text-gray-400 mt-4">{L.formReset}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {L.formName} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            required
                            value={formData.nom}
                            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                            placeholder={L.formNamePh}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-school-blue focus:border-school-blue outline-none transition-all text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {L.formEmail} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder={L.formEmailPh}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-school-blue focus:border-school-blue outline-none transition-all text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{L.formPhone}</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="tel"
                            value={formData.telephone}
                            onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                            placeholder={L.formPhonePh}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-school-blue focus:border-school-blue outline-none transition-all text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          {L.formService} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <select
                            required
                            value={formData.service}
                            onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-school-blue focus:border-school-blue outline-none transition-all text-sm appearance-none bg-white"
                          >
                            <option value="">{L.formServicePh}</option>
                            {L.services.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {L.formMessage} <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder={L.formMessagePh}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-school-blue focus:border-school-blue outline-none transition-all text-sm resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs text-gray-500">
                        <p className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {L.formDelay} <span className="font-semibold text-school-blue">{L.formDelayTime}</span>
                        </p>
                        <p className="flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" />
                          {L.formCall} <span className="font-semibold text-school-blue">{L.formCallTime}</span>
                        </p>
                      </div>
                      <button
                        type="submit"
                        className="bg-school-blue text-white hover:bg-[#162d4d] inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      >
                        <Send className="h-4 w-4" />
                        {L.formSubmit}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-school-blue rounded-xl p-6 text-white">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-school-gold" />
                  {L.tipsTitle}
                </h3>
                <ul className="space-y-3 text-sm text-white/80">
                  {L.tips.map((tip, i) => (
                    <li key={i} className="flex gap-2">
                      <CheckCircle className="h-4 w-4 text-school-gold shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-school-gold/10 rounded-xl p-6 border border-school-gold/20">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-school-gold" />
                  {L.directContactTitle}
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-700">
                    <span className="font-semibold">{L.directSecretariat}</span> +237 233 45 67 89
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">{L.directProviseur}</span> +237 233 45 67 90
                  </p>
                  <p className="text-gray-700">
                    <span className="font-semibold">{L.directEmail}</span> contact@lycee-baleng.cm
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-school-blue" />
                  {L.postalTitle}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{L.postal}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}