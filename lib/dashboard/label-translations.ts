/**
 * Translation utilities for dashboard labels
 * Provides translations for priority, type, and common tag terms
 */

export type Language = 'en' | 'es' | 'fr' | 'de' | 'ar' | 'zh' | 'ja' | 'pt' | 'it' | 'ru' | 'ko' | 'hi' | 'tr' | 'nl' | 'pl' | 'sv'

// Priority translations
const priorityTranslations: Record<Language, Record<'urgent' | 'high' | 'medium' | 'low', string>> = {
  en: { urgent: 'URGENT', high: 'HIGH', medium: 'MEDIUM', low: 'LOW' },
  es: { urgent: 'URGENTE', high: 'ALTA', medium: 'MEDIA', low: 'BAJA' },
  fr: { urgent: 'URGENT', high: 'ÉLEVÉE', medium: 'MOYENNE', low: 'FAIBLE' },
  de: { urgent: 'DRINGEND', high: 'HOCH', medium: 'MITTEL', low: 'NIEDRIG' },
  ar: { urgent: 'عاجل', high: 'عالية', medium: 'متوسطة', low: 'منخفضة' },
  zh: { urgent: '紧急', high: '高', medium: '中', low: '低' },
  ja: { urgent: '緊急', high: '高', medium: '中', low: '低' },
  pt: { urgent: 'URGENTE', high: 'ALTA', medium: 'MÉDIA', low: 'BAIXA' },
  it: { urgent: 'URGENTE', high: 'ALTA', medium: 'MEDIA', low: 'BASSA' },
  ru: { urgent: 'СРОЧНО', high: 'ВЫСОКИЙ', medium: 'СРЕДНИЙ', low: 'НИЗКИЙ' },
  ko: { urgent: '긴급', high: '높음', medium: '보통', low: '낮음' },
  hi: { urgent: 'जरूरी', high: 'उच्च', medium: 'मध्यम', low: 'कम' },
  tr: { urgent: 'ACİL', high: 'YÜKSEK', medium: 'ORTA', low: 'DÜŞÜK' },
  nl: { urgent: 'URGENT', high: 'HOOG', medium: 'GEMIDDELD', low: 'LAAG' },
  pl: { urgent: 'PILNE', high: 'WYSOKA', medium: 'ŚREDNIA', low: 'NISKA' },
  sv: { urgent: 'BRÅDSKANDE', high: 'HÖG', medium: 'MEDEL', low: 'LÅG' },
}

// Type translations
const typeTranslations: Record<Language, Record<'task' | 'todo' | 'reminder', string>> = {
  en: { task: 'Task', todo: 'Todo', reminder: 'Reminder' },
  es: { task: 'Tarea', todo: 'Pendiente', reminder: 'Recordatorio' },
  fr: { task: 'Tâche', todo: 'À faire', reminder: 'Rappel' },
  de: { task: 'Aufgabe', todo: 'Erledigen', reminder: 'Erinnerung' },
  ar: { task: 'مهمة', todo: 'قائمة', reminder: 'تذكير' },
  zh: { task: '任务', todo: '待办', reminder: '提醒' },
  ja: { task: 'タスク', todo: 'やること', reminder: 'リマインダー' },
  pt: { task: 'Tarefa', todo: 'A fazer', reminder: 'Lembrete' },
  it: { task: 'Compito', todo: 'Da fare', reminder: 'Promemoria' },
  ru: { task: 'Задача', todo: 'Сделать', reminder: 'Напоминание' },
  ko: { task: '작업', todo: '할 일', reminder: '알림' },
  hi: { task: 'कार्य', todo: 'करने योग्य', reminder: 'अनुस्मारक' },
  tr: { task: 'Görev', todo: 'Yapılacak', reminder: 'Hatırlatıcı' },
  nl: { task: 'Taak', todo: 'Te doen', reminder: 'Herinnering' },
  pl: { task: 'Zadanie', todo: 'Do zrobienia', reminder: 'Przypomnienie' },
  sv: { task: 'Uppgift', todo: 'Att göra', reminder: 'Påminnelse' },
}

/**
 * Get translated priority label
 */
export function getPriorityLabel(priority: 'urgent' | 'high' | 'medium' | 'low', language: Language = 'en'): string {
  return priorityTranslations[language]?.[priority] || priorityTranslations.en[priority]
}

/**
 * Get translated type label
 */
export function getTypeLabel(type: 'task' | 'todo' | 'reminder', language: Language = 'en'): string {
  return typeTranslations[language]?.[type] || typeTranslations.en[type]
}

/**
 * Get user language from profile
 * Helper to get language from user profile context
 */
export async function getUserLanguage(): Promise<Language> {
  try {
    const { createClient } = await import('@/lib/supabase')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return 'en'
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('language')
      .eq('id', user.id)
      .single()
    
    return (profile?.language as Language) || 'en'
  } catch {
    return 'en'
  }
}

