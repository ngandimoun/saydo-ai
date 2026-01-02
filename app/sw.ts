/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  // Cache audio files for offline playback
  additionalPrecacheEntries: [
    // Add any static audio files here if needed
  ],
});

// Cache audio files with network-first strategy for background playback
// This ensures audio continues playing even when network is interrupted
serwist.addRuntimeCaching({
  urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/.*\.(mp3|wav|ogg|m4a)$/,
  handler: "NetworkFirst",
  options: {
    cacheName: "audio-cache",
    networkTimeoutSeconds: 10,
    cacheableResponse: {
      statuses: [0, 200],
    },
    expiration: {
      maxEntries: 100, // Increased for better playlist support
      maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
    },
  },
});

// Cache cover images
serwist.addRuntimeCaching({
  urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/.*\.(jpg|jpeg|png|webp)$/,
  handler: "CacheFirst",
  options: {
    cacheName: "image-cache",
    cacheableResponse: {
      statuses: [0, 200],
    },
    expiration: {
      maxEntries: 100,
      maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
    },
  },
});

serwist.addEventListeners();

// ============================================
// Push Notification Handlers
// ============================================

// Handle push events (when server sends push notification)
self.addEventListener("push", (event: PushEvent) => {
  console.log("[Service Worker] Push event received:", event);

  let notificationData: {
    title: string;
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: Record<string, unknown>;
    requireInteraction?: boolean;
  } = {
    title: "New Notification",
    body: "You have a new notification",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || data.message || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || data.notificationId || notificationData.tag,
        data: data.data || { notificationId: data.notificationId, actionUrl: data.actionUrl },
        requireInteraction: data.requireInteraction || false,
      };
    } catch (error) {
      console.error("[Service Worker] Error parsing push data:", error);
      // Use text if JSON parsing fails
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  // Show notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: notificationData.requireInteraction,
      vibrate: notificationData.requireInteraction ? [200, 100, 200] : undefined,
    })
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event: NotificationEvent) => {
  console.log("[Service Worker] Notification clicked:", event);

  event.notification.close();

  const notificationData = event.notification.data || {};
  const actionUrl = notificationData.actionUrl || "/dashboard";

  // Handle notification actions
  if (event.action === "view" || !event.action) {
    event.waitUntil(
      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        .then((clientList) => {
          // Check if there's already a window open
          for (const client of clientList) {
            if (client.url.includes(self.location.origin) && "focus" in client) {
              return client.focus().then(() => {
                // Navigate to action URL if different
                if (client.url !== `${self.location.origin}${actionUrl}`) {
                  return client.navigate(actionUrl);
                }
              });
            }
          }
          // If no window is open, open a new one
          if (clients.openWindow) {
            return clients.openWindow(actionUrl);
          }
        })
    );
  }
});

// Handle notification close
self.addEventListener("notificationclose", (event: NotificationEvent) => {
  console.log("[Service Worker] Notification closed:", event);
  // Could track analytics here if needed
});
