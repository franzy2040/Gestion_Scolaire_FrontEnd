import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Menu, X, GraduationCap, Globe } from 'lucide-react'
import { recordPageVisit } from '@/hooks/usePageVisit'
import { useLang } from '@/hooks/useLang'

const navLinksData = {
  fr: [
    { path: '/', label: 'Accueil', category: 'public' },
    { path: '/news', label: 'Actualités', category: 'public' },
    { path: '/events', label: 'Événements', category: 'public' },
    { path: '/forum', label: 'Forum', category: 'public' },
    { path: '/history', label: 'Historique', category: 'public' },
    { path: '/about', label: 'À propos', category: 'public' },
  ],
  en: [
    { path: '/', label: 'Home', category: 'public' },
    { path: '/news', label: 'News', category: 'public' },
    { path: '/events', label: 'Events', category: 'public' },
    { path: '/forum', label: 'Forum', category: 'public' },
    { path: '/history', label: 'History', category: 'public' },
    { path: '/about', label: 'About', category: 'public' },
  ],
}

const t = {
  fr: {
    login: 'Connexion',
    schoolName: 'Lycée Bilingue',
    schoolSub: 'de Baleng - Bafoussam',
    langLabel: 'FR',
    langTitle: 'Changer de langue',
  },
  en: {
    login: 'Login',
    schoolName: 'Bilingual High School',
    schoolSub: 'of Baleng - Bafoussam',
    langLabel: 'EN',
    langTitle: 'Switch language',
  },
}

export default function PublicNavbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { lang, toggleLang } = useLang()
  const location = useLocation()
  const navigate = useNavigate()

  const isHomePage = location.pathname === '/'
  const L = t[lang]
  const navLinks = navLinksData[lang]

  // ── Détection du scroll pour transparence ──
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [location.pathname])

  const handleNavClick = (path: string, category: string = 'public') => {
    recordPageVisit(path, category)
    setIsOpen(false)
    navigate(path)
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 text-white transition-all duration-500 ${
        isHomePage && !scrolled
          ? 'bg-transparent'
          : scrolled
            ? 'bg-school-blue/80 backdrop-blur-lg shadow-lg border-b border-white/10'
            : 'bg-school-blue shadow-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => handleNavClick('/', 'public')}
            className="flex items-center gap-2 hover:opacity-90 transition bg-transparent border-none text-left"
          >
            <GraduationCap className="h-8 w-8 text-school-gold" />
            <div className="hidden sm:block">
              <span className="font-bold text-lg leading-tight block text-white">{L.schoolName}</span>
              <span className="block text-xs text-school-gold">{L.schoolSub}</span>
            </div>
          </button>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => handleNavClick(link.path, link.category)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition bg-transparent border-none ${
                  location.pathname === link.path
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}

            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              title={L.langTitle}
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:scale-105"
            >
              <Globe className="h-3.5 w-3.5" />
              {L.langLabel}
            </button>

            <button
              onClick={() => handleNavClick('/login', 'auth')}
              className="ml-3 px-4 py-2 bg-school-gold text-school-blue rounded-md text-sm font-bold hover:bg-yellow-400 transition border-none"
            >
              {L.login}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-md hover:bg-white/10 bg-transparent border-none"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className={`md:hidden border-t border-white/10 transition-all duration-500 ${
          isHomePage && !scrolled
            ? 'bg-school-blue/95 backdrop-blur-lg'
            : scrolled
              ? 'bg-school-blue/95 backdrop-blur-lg'
              : 'bg-school-blue'
        }`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => handleNavClick(link.path, link.category)}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium bg-transparent border-none ${
                  location.pathname === link.path
                    ? 'bg-white/20 text-white'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                {link.label}
              </button>
            ))}

            {/* Language Toggle Mobile */}
            <button
              onClick={() => { toggleLang(); setIsOpen(false); }}
              className="block w-full text-left px-3 py-2 rounded-md text-base font-medium bg-white/10 border-none text-white/90 hover:bg-white/20 transition-colors"
            >
              <Globe className="h-4 w-4 inline mr-2" />
              {lang === 'fr' ? 'Switch to English' : 'Passer en Français'}
            </button>

            <button
              onClick={() => handleNavClick('/login', 'auth')}
              className="block w-full text-left px-3 py-2 bg-school-gold text-school-blue rounded-md text-base font-bold mt-2 border-none"
            >
              {L.login}
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}