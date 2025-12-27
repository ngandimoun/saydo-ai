"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Language } from './translations'
import { getTranslation } from './translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: ReturnType<typeof getTranslation>
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    // Load language from localStorage if available
    const saved = localStorage.getItem('saydo-language') as Language
    if (saved && ['en', 'es', 'fr', 'de', 'ar', 'zh', 'ja', 'pt', 'it', 'ru', 'ko', 'hi', 'tr', 'nl', 'pl', 'sv', 'no', 'da', 'fi', 'el', 'he', 'th', 'vi', 'id', 'cs', 'ro', 'hu', 'uk', 'bg', 'sw', 'yo', 'ig', 'ha', 'rw', 'zu', 'am', 'tl', 'ms', 'bn', 'ta', 'te', 'ur', 'pa', 'et', 'lv', 'lt', 'sk', 'sl', 'hr', 'sr'].includes(saved)) {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('saydo-language', lang)
  }

  // Recalculate translations whenever language changes
  const t = React.useMemo(() => getTranslation(language), [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

