/**
 * Notification Manager
 * 
 * Handles browser notifications, permission requests, and notification display
 */

export interface NotificationOptions {
  title: string
  body?: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, unknown>
  requireInteraction?: boolean
  silent?: boolean
  actions?: NotificationAction[]
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
  return "Notification" in window && "serviceWorker" in navigator
}

/**
 * Get current notification permission
 */
export function getNotificationPermission(): NotificationPermission | null {
  if (!("Notification" in window)) {
    return null
  }
  return Notification.permission
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    throw new Error("Notifications are not supported in this browser")
  }

  if (Notification.permission === "granted") {
    return "granted"
  }

  if (Notification.permission === "denied") {
    return "denied"
  }

  const permission = await Notification.requestPermission()
  return permission
}

/**
 * Show a browser notification
 */
export async function showNotification(options: NotificationOptions): Promise<Notification | null> {
  if (!isNotificationSupported()) {
    console.warn("Notifications are not supported")
    return null
  }

  if (Notification.permission !== "granted") {
    console.warn("Notification permission not granted")
    return null
  }

  try {
    // Use service worker for better PWA experience
    const registration = await navigator.serviceWorker.ready
    
    const notification = await registration.showNotification(options.title, {
      body: options.body,
      icon: options.icon || "/icon-192.png",
      badge: options.badge || "/icon-192.png",
      tag: options.tag,
      data: { ...(options.data || {}), playSound: !options.silent },
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false,
      actions: options.actions,
      vibrate: options.requireInteraction ? [200, 100, 200] : undefined,
    })
    
    // Play sound if not silent (service worker will also send message, but play directly as backup)
    if (!options.silent) {
      import("@/lib/notification-sound").then(({ playNotificationSound }) => {
        playNotificationSound().catch(() => {
          // Ignore errors - sound is optional
        });
      });
    }
    
    return notification
  } catch (error) {
    console.error("[showNotification] Error:", error)
    
    // Fallback to basic Notification API
    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || "/icon-192.png",
        tag: options.tag,
        data: options.data,
      })
      
      // Play sound for fallback notifications too (if not silent)
      if (!options.silent) {
        import("@/lib/notification-sound").then(({ playNotificationSound }) => {
          playNotificationSound().catch(() => {
            // Ignore errors - sound is optional
          });
        });
      }
      
      return notification
    } catch (fallbackError) {
      console.error("[showNotification] Fallback error:", fallbackError)
      return null
    }
  }
}

/**
 * Close a notification by tag
 */
export async function closeNotification(tag: string): Promise<void> {
  if (!isNotificationSupported()) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const notifications = await registration.getNotifications({ tag })
    notifications.forEach((notification) => notification.close())
  } catch (error) {
    console.error("[closeNotification] Error:", error)
  }
}

/**
 * Close all notifications
 */
export async function closeAllNotifications(): Promise<void> {
  if (!isNotificationSupported()) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const notifications = await registration.getNotifications()
    notifications.forEach((notification) => notification.close())
  } catch (error) {
    console.error("[closeAllNotifications] Error:", error)
  }
}

/**
 * Update browser badge (for PWA)
 */
export async function updateBadge(count: number): Promise<void> {
  if (!("setAppBadge" in navigator)) {
    return
  }

  try {
    if (count > 0) {
      await navigator.setAppBadge(count)
    } else {
      await navigator.clearAppBadge()
    }
  } catch (error) {
    console.error("[updateBadge] Error:", error)
  }
}

