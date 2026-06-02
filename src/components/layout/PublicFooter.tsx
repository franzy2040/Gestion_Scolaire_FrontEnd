import { GraduationCap, MapPin, Phone, Mail, Facebook, Globe, ExternalLink, Youtube, Monitor } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLang } from '@/hooks/useLang'

const t = {
  fr: {
    schoolName: 'Lycée Bilingue de Baleng',
    tagline: 'Excellence académique et bilinguisme pour un avenir brillant.',
    address: 'Baleng, Bafoussam, Cameroun',
    phone: '+237 233 45 67 89',
    email: 'contact@lycee-baleng.cm',
    quickLinks: 'Liens rapides',
    home: 'Accueil',
    news: 'Actualités',
    events: 'Événements',
    about: 'À propos',
    history: 'Historique',
    adminSpace: 'Espace Admin',
    usefulLinks: 'Liens utiles',
    minesec: 'Ministère des Enseignements Secondaires',
    minesecUrl: 'www.minesec.gov.cm',
    distanceLearning: 'Distance Learning MINESEC',
    distanceUrl: 'distancelearning.minesec.cm',
    youtubeChannel: 'Chaîne YouTube MINESEC',
    youtubeLabel: 'YouTube MINESEC',
    followUs: 'Suivez-nous',
    facebookLabel: 'Facebook',
    websiteLabel: 'Site web',
    youtubeFooter: 'YouTube MINESEC',
    copyright: 'Tous droits réservés. Sous tutelle du MINESEC Cameroun.',
    bottomBar: "Lycée Bilingue de Baleng — Arrondissement Bafoussam II — Région de l'Ouest — Cameroun",
    legal: 'Mentions légales',
    privacy: 'Politique de confidentialité',
    designedBy: 'Tout droit réservé. Designed by kofl',
  },
  en: {
    schoolName: 'Bilingual High School of Baleng',
    tagline: 'Academic excellence and bilingualism for a bright future.',
    address: 'Baleng, Bafoussam, Cameroon',
    phone: '+237 233 45 67 89',
    email: 'contact@lycee-baleng.cm',
    quickLinks: 'Quick Links',
    home: 'Home',
    news: 'News',
    events: 'Events',
    about: 'About',
    history: 'History',
    adminSpace: 'Admin Portal',
    usefulLinks: 'Useful Links',
    minesec: 'Ministry of Secondary Education',
    minesecUrl: 'www.minesec.gov.cm',
    distanceLearning: 'MINESEC Distance Learning',
    distanceUrl: 'distancelearning.minesec.cm',
    youtubeChannel: 'MINESEC YouTube Channel',
    youtubeLabel: 'YouTube MINESEC',
    followUs: 'Follow Us',
    facebookLabel: 'Facebook',
    websiteLabel: 'Website',
    youtubeFooter: 'YouTube MINESEC',
    copyright: 'All rights reserved. Under the supervision of MINESEC Cameroon.',
    bottomBar: 'Bilingual High School of Baleng — Bafoussam II District — West Region — Cameroon',
    legal: 'Legal Notice',
    privacy: 'Privacy Policy',
    designedBy: 'All rights reserved. Designed by kofl',
  },
}

export default function PublicFooter() {
  const { lang } = useLang()
  const L = t[lang]

  return (
    <footer className="bg-school-blue text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* ── Info établissement ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-8 w-8 text-school-gold" />
              <span className="font-bold text-lg">{L.schoolName}</span>
            </div>
            <p className="text-white/70 text-sm mb-4">
              {L.tagline}
            </p>
            <div className="space-y-2 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-school-gold shrink-0" />
                <span>{L.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-school-gold shrink-0" />
                <span>{L.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-school-gold shrink-0" />
                <span>{L.email}</span>
              </div>
            </div>
          </div>

          {/* ── Liens rapides ── */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-school-gold">{L.quickLinks}</h3>
            <div className="space-y-2 text-sm">
              <Link to="/" className="block text-white/70 hover:text-school-gold transition-colors">{L.home}</Link>
              <Link to="/news" className="block text-white/70 hover:text-school-gold transition-colors">{L.news}</Link>
              <Link to="/events" className="block text-white/70 hover:text-school-gold transition-colors">{L.events}</Link>
              <Link to="/about" className="block text-white/70 hover:text-school-gold transition-colors">{L.about}</Link>
              <Link to="/history" className="block text-white/70 hover:text-school-gold transition-colors">{L.history}</Link>
              <Link to="/login" className="block text-white/70 hover:text-school-gold transition-colors">{L.adminSpace}</Link>
            </div>
          </div>

          {/* ── Liens utiles MINESEC ── */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-school-gold">{L.usefulLinks}</h3>
            <div className="space-y-3 text-sm">
              <a
                href="https://www.minesec.gov.cm"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 text-white/70 hover:text-school-gold transition-colors group"
              >
                <ExternalLink className="h-4 w-4 text-school-gold shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-medium">{L.minesec}</p>
                  <p className="text-xs text-white/50">{L.minesecUrl}</p>
                </div>
              </a>
              <a
                href="https://distancelearning.minesec.cm"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 text-white/70 hover:text-school-gold transition-colors group"
              >
                <Monitor className="h-4 w-4 text-school-gold shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-medium">{L.distanceLearning}</p>
                  <p className="text-xs text-white/50">{L.distanceUrl}</p>
                </div>
              </a>
              <a
                href="https://www.youtube.com/@mineseccameroun"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 text-white/70 hover:text-school-gold transition-colors group"
              >
                <Youtube className="h-4 w-4 text-school-gold shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-medium">{L.youtubeChannel}</p>
                  <p className="text-xs text-white/50">{L.youtubeLabel}</p>
                </div>
              </a>
            </div>
          </div>

          {/* ── Réseaux sociaux ── */}
          <div>
            <h3 className="font-semibold text-lg mb-4 text-school-gold">{L.followUs}</h3>
            <div className="flex gap-3">
              <a
                href="#"
                className="p-2.5 bg-white/10 rounded-full hover:bg-school-gold hover:text-school-blue transition-all duration-300"
                aria-label={L.facebookLabel}
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="p-2.5 bg-white/10 rounded-full hover:bg-school-gold hover:text-school-blue transition-all duration-300"
                aria-label={L.websiteLabel}
              >
                <Globe className="h-5 w-5" />
              </a>
              <a
                href="https://www.youtube.com/@mineseccameroun"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-white/10 rounded-full hover:bg-school-gold hover:text-school-blue transition-all duration-300"
                aria-label={L.youtubeFooter}
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
            <p className="mt-6 text-xs text-white/50 leading-relaxed">
              © {new Date().getFullYear()} {L.schoolName}.<br />
              {L.copyright}
            </p>
          </div>
        </div>

        {/* ── Barre inférieure ── */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            {L.bottomBar}
          </p>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <Link to="/about" className="hover:text-school-gold transition-colors">{L.legal}</Link>
            <span>|</span>
            <Link to="/about" className="hover:text-school-gold transition-colors">{L.privacy}</Link>
            <span>|</span>
            <Link to="/about" className="hover:text-school-gold transition-colors">© {new Date().getFullYear()} {L.designedBy}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}