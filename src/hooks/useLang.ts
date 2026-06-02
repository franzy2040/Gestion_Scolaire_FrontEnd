// src/hooks/useLang.ts
import { useState, useEffect, useCallback } from 'react'

type Lang = 'fr' | 'en'

const STORAGE_KEY = 'lybibal-lang'

export function useLang() {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem(STORAGE_KEY) as Lang) || 'fr'
  })

  const setLang = useCallback((newLang: Lang) => {
    localStorage.setItem(STORAGE_KEY, newLang)
    setLangState(newLang)
    // Notifie tous les composants qui écoutent
    window.dispatchEvent(new CustomEvent('lybibal-lang-change', { detail: newLang }))
  }, [])

  const toggleLang = useCallback(() => {
    setLang(lang === 'fr' ? 'en' : 'fr')
  }, [lang, setLang])

  // Écoute les changements depuis d'autres composants
  useEffect(() => {
    const handler = (e: CustomEvent) => setLangState(e.detail as Lang)
    window.addEventListener('lybibal-lang-change', handler as EventListener)
    return () => window.removeEventListener('lybibal-lang-change', handler as EventListener)
  }, [])

  return { lang, setLang, toggleLang }
}