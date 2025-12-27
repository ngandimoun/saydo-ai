"use client"

import { motion } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { SelectionCard } from "../selection-card"
import type { Language } from "@/lib/translations"
import type { OnboardingData } from "../onboarding-form"

interface LanguageStepProps {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
}

const languages = [
  { id: 'en', name: 'English', flag: '🇺🇸' },
  { id: 'es', name: 'Español', flag: '🇪🇸' },
  { id: 'fr', name: 'Français', flag: '🇫🇷' },
  { id: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { id: 'ar', name: 'العربية', flag: '🇸🇦' },
  { id: 'zh', name: '中文', flag: '🇨🇳' },
  { id: 'ja', name: '日本語', flag: '🇯🇵' },
  { id: 'pt', name: 'Português', flag: '🇵🇹' },
  { id: 'it', name: 'Italiano', flag: '🇮🇹' },
  { id: 'ru', name: 'Русский', flag: '🇷🇺' },
  { id: 'ko', name: '한국어', flag: '🇰🇷' },
  { id: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { id: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { id: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { id: 'pl', name: 'Polski', flag: '🇵🇱' },
  { id: 'sv', name: 'Svenska', flag: '🇸🇪' },
  { id: 'no', name: 'Norsk', flag: '🇳🇴' },
  { id: 'da', name: 'Dansk', flag: '🇩🇰' },
  { id: 'fi', name: 'Suomi', flag: '🇫🇮' },
  { id: 'el', name: 'Ελληνικά', flag: '🇬🇷' },
  { id: 'he', name: 'עברית', flag: '🇮🇱' },
  { id: 'th', name: 'ไทย', flag: '🇹🇭' },
  { id: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { id: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { id: 'cs', name: 'Čeština', flag: '🇨🇿' },
  { id: 'ro', name: 'Română', flag: '🇷🇴' },
  { id: 'hu', name: 'Magyar', flag: '🇭🇺' },
  { id: 'uk', name: 'Українська', flag: '🇺🇦' },
  { id: 'bg', name: 'Български', flag: '🇧🇬' },
  // African languages
  { id: 'sw', name: 'Kiswahili', flag: '🇰🇪' },
  { id: 'yo', name: 'Yorùbá', flag: '🇳🇬' },
  { id: 'ig', name: 'Igbo', flag: '🇳🇬' },
  { id: 'ha', name: 'Hausa', flag: '🇳🇬' },
  { id: 'rw', name: 'Kinyarwanda', flag: '🇷🇼' },
  { id: 'zu', name: 'isiZulu', flag: '🇿🇦' },
  { id: 'am', name: 'አማርኛ', flag: '🇪🇹' },
  // Asian dialects
  { id: 'tl', name: 'Tagalog', flag: '🇵🇭' },
  { id: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' },
  { id: 'bn', name: 'বাংলা', flag: '🇧🇩' },
  { id: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { id: 'te', name: 'తెలుగు', flag: '🇮🇳' },
  { id: 'ur', name: 'اردو', flag: '🇵🇰' },
  { id: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  // European languages
  { id: 'et', name: 'Eesti', flag: '🇪🇪' },
  { id: 'lv', name: 'Latviešu', flag: '🇱🇻' },
  { id: 'lt', name: 'Lietuvių', flag: '🇱🇹' },
  { id: 'sk', name: 'Slovenčina', flag: '🇸🇰' },
  { id: 'sl', name: 'Slovenščina', flag: '🇸🇮' },
  { id: 'hr', name: 'Hrvatski', flag: '🇭🇷' },
  { id: 'sr', name: 'Српски', flag: '🇷🇸' }
]

export function LanguageStep({ data, updateData }: LanguageStepProps) {
  const { t, setLanguage } = useLanguage()

  const handleSelect = (langId: string) => {
    updateData({ language: langId })
    // Type assertion is safe here as we validate language codes
    setLanguage(langId as Language)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div className="text-center mb-8">
        <h2 className="saydo-headline text-2xl sm:text-3xl mb-3">
          {t.steps.language.title}
        </h2>
        <p className="text-muted-foreground text-lg">
          {t.steps.language.question}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {languages.map((lang) => (
          <SelectionCard
            key={lang.id}
            id={lang.id}
            name={lang.name}
            selected={data.language === lang.id}
            onSelect={handleSelect}
            icon={<span className="text-2xl">{lang.flag}</span>}
            color="bg-primary/10"
          />
        ))}
      </div>
    </motion.div>
  )
}

