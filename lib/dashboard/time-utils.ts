/**
 * Time Utilities for Dashboard
 * 
 * Helpers for time-based greetings and formatting.
 * Supports internationalization based on user's language preference.
 */

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

/**
 * Get the current time of day based on hour.
 * Used for personalized greetings.
 */
export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

/**
 * Get greeting text based on time of day and language.
 * 
 * TODO (i18n):
 * - Move to translations.ts for full language support
 * - Add more languages from onboarding
 */
export function getGreeting(timeOfDay: TimeOfDay, language: string = 'en'): string {
  const greetings: Record<string, Record<TimeOfDay, string>> = {
    en: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
      night: 'Good night'
    },
    es: {
      morning: 'Buenos días',
      afternoon: 'Buenas tardes',
      evening: 'Buenas tardes',
      night: 'Buenas noches'
    },
    fr: {
      morning: 'Bonjour',
      afternoon: 'Bon après-midi',
      evening: 'Bonsoir',
      night: 'Bonne nuit'
    },
    de: {
      morning: 'Guten Morgen',
      afternoon: 'Guten Tag',
      evening: 'Guten Abend',
      night: 'Gute Nacht'
    },
    ar: {
      morning: 'صباح الخير',
      afternoon: 'مساء الخير',
      evening: 'مساء الخير',
      night: 'تصبح على خير'
    },
    zh: {
      morning: '早上好',
      afternoon: '下午好',
      evening: '晚上好',
      night: '晚安'
    },
    ja: {
      morning: 'おはようございます',
      afternoon: 'こんにちは',
      evening: 'こんばんは',
      night: 'おやすみなさい'
    },
    pt: {
      morning: 'Bom dia',
      afternoon: 'Boa tarde',
      evening: 'Boa noite',
      night: 'Boa noite'
    }
  }
  
  return greetings[language]?.[timeOfDay] || greetings.en[timeOfDay]
}

/**
 * Format date for display in header.
 * Example: "Saturday, Dec 27, 2025"
 */
export function formatDisplayDate(date: Date = new Date(), language: string = 'en'): string {
  const localeMap: Record<string, string> = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    ar: 'ar-SA',
    zh: 'zh-CN',
    ja: 'ja-JP',
    pt: 'pt-BR'
  }
  
  const locale = localeMap[language] || 'en-US'
  
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Format time for display.
 * Example: "9:41 AM" or "21:41" based on locale
 */
export function formatDisplayTime(date: Date = new Date(), language: string = 'en'): string {
  const localeMap: Record<string, string> = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    ar: 'ar-SA',
    zh: 'zh-CN',
    ja: 'ja-JP',
    pt: 'pt-BR'
  }
  
  const locale = localeMap[language] || 'en-US'
  
  return date.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit'
  })
}

/**
 * Format duration in seconds to MM:SS display.
 * Used for voice recording timer.
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format audio duration for display.
 * Example: "5 min" or "1h 23m"
 */
export function formatAudioDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`
  
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${mins}m`
}

/**
 * Convenience function: Get time-based greeting.
 * Combines getTimeOfDay and getGreeting.
 */
export function getTimeOfDayGreeting(name: string, language: string = 'en'): string {
  const timeOfDay = getTimeOfDay()
  const greeting = getGreeting(timeOfDay, language)
  return `${greeting}, ${name}`
}

/**
 * Get urgency label translated.
 */
export function getUrgencyLabel(language: string = 'en'): string {
  const labels: Record<string, string> = {
    en: 'Highly Urgent',
    es: 'Muy Urgente',
    fr: 'Très Urgent',
    de: 'Sehr Dringend',
    ar: 'عاجل جداً',
    zh: '非常紧急',
    ja: '非常に緊急',
    pt: 'Muito Urgente'
  }
  
  return labels[language] || labels.en
}

