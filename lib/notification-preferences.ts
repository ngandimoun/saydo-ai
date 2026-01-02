/**
 * Notification Preferences
 * 
 * Manages user notification preferences in localStorage
 */

export interface NotificationPreferences {
  browserNotificationsEnabled: boolean
  pushNotificationsEnabled: boolean
  soundEnabled: boolean
  badgeEnabled: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string // HH:mm format
  quietHoursEnd: string // HH:mm format
  notificationTypes: {
    intervention: boolean
    achievement: boolean
    challenge: boolean
    recommendation: boolean
    reminder: boolean
    system: boolean
    health_alert: boolean
  }
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  browserNotificationsEnabled: true,
  pushNotificationsEnabled: false,
  soundEnabled: true,
  badgeEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "08:00",
  notificationTypes: {
    intervention: true,
    achievement: true,
    challenge: true,
    recommendation: true,
    reminder: true,
    system: true,
    health_alert: true,
  },
}

const STORAGE_KEY = "notification-preferences"

/**
 * Get notification preferences
 */
export function getNotificationPreferences(): NotificationPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return { ...DEFAULT_PREFERENCES, ...parsed }
    }
  } catch (error) {
    console.error("[getNotificationPreferences] Error:", error)
  }

  return DEFAULT_PREFERENCES
}

/**
 * Save notification preferences
 */
export function saveNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    const current = getNotificationPreferences()
    const updated = { ...current, ...preferences }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error("[saveNotificationPreferences] Error:", error)
  }
}

/**
 * Check if we're in quiet hours
 */
export function isQuietHours(): boolean {
  const preferences = getNotificationPreferences()
  
  if (!preferences.quietHoursEnabled) {
    return false
  }

  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentTime = currentHour * 60 + currentMinute

  const [startHour, startMinute] = preferences.quietHoursStart.split(":").map(Number)
  const [endHour, endMinute] = preferences.quietHoursEnd.split(":").map(Number)
  const startTime = startHour * 60 + startMinute
  const endTime = endHour * 60 + endMinute

  // Handle quiet hours that span midnight
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime < endTime
  }

  return currentTime >= startTime && currentTime < endTime
}

/**
 * React hook for notification preferences
 * Note: This is a simple implementation that reads from localStorage
 * For a more robust solution, consider using React Context or a state management library
 */
export function useNotificationPreferences(): NotificationPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES
  }

  // Read from localStorage on each call
  // In a production app, you might want to use React state with useEffect
  return getNotificationPreferences()
}

