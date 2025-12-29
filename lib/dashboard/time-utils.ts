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

/**
 * Smart date/time formatting result
 */
export interface SmartDateTimeResult {
  text: string
  color: string
  urgent: boolean
}

/**
 * Format date/time with smart relative display.
 * 
 * Examples:
 * - "in 25 min" for tasks in 25 minutes
 * - "Tomorrow at 8:00 AM" for tomorrow's tasks
 * - "in 2 days" for tasks 2 days away
 * - "in 1 week" for tasks a week away
 * - "in 1 month" for tasks a month away
 * 
 * @param date - Date object or date string
 * @param time - Optional time string (HH:mm format) for tasks
 * @param language - User's language preference
 * @returns Object with formatted text, color class, and urgency flag
 */
export function formatSmartDateTime(
  date: Date | string | undefined,
  time?: string,
  language: string = 'en'
): SmartDateTimeResult | null {
  if (!date) return null

  const now = new Date()
  let targetDate: Date

  // Handle date + time combination (for tasks)
  if (typeof date === 'string') {
    targetDate = new Date(date)
  } else {
    targetDate = new Date(date)
  }

  // If time string is provided, combine with date
  if (time) {
    const [hours, minutes] = time.split(':').map(Number)
    if (!isNaN(hours) && !isNaN(minutes)) {
      targetDate.setHours(hours, minutes, 0, 0)
    }
  }

  const diffMs = targetDate.getTime() - now.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)

  // Localization strings
  const translations: Record<string, Record<string, string>> = {
    en: {
      now: 'Now',
      inMin: 'in {n} min',
      inHour: 'in {n} hour',
      inHours: 'in {n} hours',
      today: 'Today',
      todayAt: 'Today at {time}',
      inHoursToday: 'in {n} hours',
      tomorrow: 'Tomorrow',
      tomorrowAt: 'Tomorrow at {time}',
      inDays: 'in {n} day',
      inDaysPlural: 'in {n} days',
      inWeeks: 'in {n} week',
      inWeeksPlural: 'in {n} weeks',
      inMonths: 'in {n} month',
      inMonthsPlural: 'in {n} months',
      past: 'past'
    },
    fr: {
      now: 'Maintenant',
      inMin: 'dans {n} min',
      inHour: 'dans {n} heure',
      inHours: 'dans {n} heures',
      today: "Aujourd'hui",
      todayAt: "Aujourd'hui à {time}",
      inHoursToday: 'dans {n} heures',
      tomorrow: 'Demain',
      tomorrowAt: 'Demain à {time}',
      inDays: 'dans {n} jour',
      inDaysPlural: 'dans {n} jours',
      inWeeks: 'dans {n} semaine',
      inWeeksPlural: 'dans {n} semaines',
      inMonths: 'dans {n} mois',
      inMonthsPlural: 'dans {n} mois',
      past: 'passé'
    },
    es: {
      now: 'Ahora',
      inMin: 'en {n} min',
      inHour: 'en {n} hora',
      inHours: 'en {n} horas',
      today: 'Hoy',
      todayAt: 'Hoy a las {time}',
      inHoursToday: 'en {n} horas',
      tomorrow: 'Mañana',
      tomorrowAt: 'Mañana a las {time}',
      inDays: 'en {n} día',
      inDaysPlural: 'en {n} días',
      inWeeks: 'en {n} semana',
      inWeeksPlural: 'en {n} semanas',
      inMonths: 'en {n} mes',
      inMonthsPlural: 'en {n} meses',
      past: 'pasado'
    },
    de: {
      now: 'Jetzt',
      inMin: 'in {n} Min',
      inHour: 'in {n} Stunde',
      inHours: 'in {n} Stunden',
      today: 'Heute',
      todayAt: 'Heute um {time}',
      inHoursToday: 'in {n} Stunden',
      tomorrow: 'Morgen',
      tomorrowAt: 'Morgen um {time}',
      inDays: 'in {n} Tag',
      inDaysPlural: 'in {n} Tagen',
      inWeeks: 'in {n} Woche',
      inWeeksPlural: 'in {n} Wochen',
      inMonths: 'in {n} Monat',
      inMonthsPlural: 'in {n} Monaten',
      past: 'vergangen'
    }
  }

  const t = translations[language] || translations.en

  // Format time for display
  const formatTime = (date: Date): string => {
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
      minute: '2-digit',
      hour12: language === 'en' ? true : false
    })
  }

  // Past dates
  if (diffMs < 0) {
    const absMins = Math.abs(diffMins)
    if (absMins < 60) {
      return {
        text: `${t.past} (${absMins} ${absMins === 1 ? 'min' : 'min'})`,
        color: 'text-muted-foreground',
        urgent: false
      }
    }
    // For past dates, show the date
    const localeMap: Record<string, string> = {
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE'
    }
    const locale = localeMap[language] || 'en-US'
    return {
      text: targetDate.toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric'
      }) + (time ? ` ${formatTime(targetDate)}` : ''),
      color: 'text-muted-foreground',
      urgent: false
    }
  }

  // < 1 minute
  if (diffMins < 1) {
    return {
      text: t.now,
      color: 'text-red-500',
      urgent: true
    }
  }

  // < 1 hour
  if (diffMins < 60) {
    return {
      text: t.inMin.replace('{n}', diffMins.toString()),
      color: diffMins < 30 ? 'text-red-500' : 'text-amber-500',
      urgent: diffMins < 30
    }
  }

  // < 2 hours
  if (diffHours < 2) {
    return {
      text: t.inHour.replace('{n}', '1'),
      color: 'text-amber-500',
      urgent: false
    }
  }

  // Today (same day, but > 2 hours away)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const targetDay = new Date(targetDate)
  targetDay.setHours(0, 0, 0, 0)
  const isToday = targetDay.getTime() === today.getTime()

  if (isToday) {
    if (time) {
      return {
        text: t.todayAt.replace('{time}', formatTime(targetDate)),
        color: 'text-blue-500',
        urgent: false
      }
    }
    return {
      text: t.today,
      color: 'text-blue-500',
      urgent: false
    }
  }

  // Tomorrow
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isTomorrow = targetDay.getTime() === tomorrow.getTime()

  if (isTomorrow) {
    if (time) {
      return {
        text: t.tomorrowAt.replace('{time}', formatTime(targetDate)),
        color: 'text-blue-500',
        urgent: false
      }
    }
    return {
      text: t.tomorrow,
      color: 'text-blue-500',
      urgent: false
    }
  }

  // 2-7 days
  if (diffDays >= 2 && diffDays < 7) {
    return {
      text: diffDays === 1 
        ? t.inDays.replace('{n}', diffDays.toString())
        : t.inDaysPlural.replace('{n}', diffDays.toString()),
      color: 'text-blue-500',
      urgent: false
    }
  }

  // 1-4 weeks
  if (diffWeeks >= 1 && diffWeeks < 4) {
    return {
      text: diffWeeks === 1
        ? t.inWeeks.replace('{n}', diffWeeks.toString())
        : t.inWeeksPlural.replace('{n}', diffWeeks.toString()),
      color: 'text-muted-foreground',
      urgent: false
    }
  }

  // 1-3 months
  if (diffMonths >= 1 && diffMonths < 3) {
    return {
      text: diffMonths === 1
        ? t.inMonths.replace('{n}', diffMonths.toString())
        : t.inMonthsPlural.replace('{n}', diffMonths.toString()),
      color: 'text-muted-foreground',
      urgent: false
    }
  }

  // > 3 months - show full date
  const localeMap: Record<string, string> = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE'
  }
  const locale = localeMap[language] || 'en-US'
  return {
    text: targetDate.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      year: diffDays > 365 ? 'numeric' : undefined
    }) + (time ? ` ${formatTime(targetDate)}` : ''),
    color: 'text-muted-foreground',
    urgent: false
  }
}

