/**
 * Push Notification Service
 * 
 * Handles browser push notifications for critical health interventions.
 * Uses Web Push API with service worker.
 */

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications")
    return false
  }

  if (Notification.permission === "granted") {
    return true
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  return false
}

/**
 * Register service worker for push notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service workers are not supported")
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js")
    console.log("Service worker registered:", registration)
    return registration
  } catch (error) {
    console.error("Service worker registration failed:", error)
    return null
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(
  userId: string
): Promise<PushSubscription | null> {
  const permission = await requestNotificationPermission()
  if (!permission) {
    return null
  }

  const registration = await registerServiceWorker()
  if (!registration) {
    return null
  }

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        ? urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
        : undefined,
    })

    // Send subscription to server
    await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        subscription: subscription.toJSON(),
      }),
    })

    return subscription
  } catch (error) {
    console.error("Push subscription failed:", error)
    return null
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(
  userId: string
): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()
      await fetch("/api/notifications/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      return true
    }
    return false
  } catch (error) {
    console.error("Unsubscribe failed:", error)
    return false
  }
}

/**
 * Send a local notification (for testing or immediate display)
 */
export function sendLocalNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return null
  }

  return new Notification(title, {
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    ...options,
  })
}

/**
 * Convert VAPID key from base64 URL to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}



