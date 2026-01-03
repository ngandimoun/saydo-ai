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

// ============================================
// Background Sync Handlers for Voice Processing
// ============================================

// Handle background sync events for voice processing
self.addEventListener("sync", (event: SyncEvent) => {
  console.log("[Service Worker] Background sync event:", event.tag);

  // Check if this is a voice processing sync event
  if (event.tag.startsWith("voice-processing-")) {
    event.waitUntil(handleVoiceProcessingSync(event.tag));
  }
});

/**
 * Handle voice processing background sync
 * The job ID is embedded in the sync tag: "voice-processing-{jobId}"
 * 
 * Note: Since service workers can't directly access IndexedDB, we'll use
 * a cache API approach or request job data from clients via postMessage.
 * For now, we'll use a simpler approach: store job data in Cache API
 * when registering sync, and retrieve it here.
 */
async function handleVoiceProcessingSync(syncTag: string): Promise<void> {
  try {
    // Extract job ID from sync tag
    const jobId = syncTag.replace("voice-processing-", "");
    console.log("[Service Worker] Processing voice job:", jobId);

    // Try to get job data from cache (stored when sync was registered)
    const cache = await caches.open("voice-jobs");
    const cachedResponse = await cache.match(`job-${jobId}`);

    let jobData: any = null;

    if (cachedResponse) {
      jobData = await cachedResponse.json();
      // Delete from cache after retrieving
      await cache.delete(`job-${jobId}`);
    } else {
      // Fallback: request from clients
      const clients = await self.clients.matchAll({
        includeUncontrolled: true,
        type: "window",
      });

      if (clients.length > 0) {
        // Send message to get job data
        const messageChannel = new MessageChannel();
        const jobDataPromise = new Promise<any>((resolve, reject) => {
          messageChannel.port1.onmessage = (event) => {
            if (event.data.error) {
              reject(new Error(event.data.error));
            } else {
              resolve(event.data.job);
            }
          };

          // Timeout after 5 seconds
          setTimeout(() => {
            reject(new Error("Timeout waiting for job data"));
          }, 5000);
        });

        clients[0].postMessage(
          {
            type: "GET_VOICE_JOB",
            jobId,
          },
          [messageChannel.port2]
        );

        try {
          jobData = await jobDataPromise;
        } catch (error) {
          console.error("[Service Worker] Failed to get job data from client:", error);
        }
      }
    }

    if (!jobData) {
      console.warn("[Service Worker] No job data available, skipping");
      return;
    }

    // Process the job by calling the API
    const response = await fetch("/api/voice/process", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        sourceRecordingId: jobData.recordingId,
        transcription: jobData.transcription,
        aiSummary: jobData.aiSummary,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.error || `Processing failed: ${response.status}`);
    }

    const result = await response.json();
    console.log("[Service Worker] Voice processing completed:", result);

    // Notify clients of completion
    const allClients = await self.clients.matchAll({
      includeUncontrolled: true,
      type: "window",
    });

    allClients.forEach((client) => {
      client.postMessage({
        type: "VOICE_JOB_COMPLETE",
        jobId,
        result: {
          tasksCount: result.saved?.tasks || 0,
          remindersCount: result.saved?.reminders || 0,
        },
      });
    });

    // Show notification
    const tasksCount = result.saved?.tasks || 0;
    const remindersCount = result.saved?.reminders || 0;
    const totalItems = tasksCount + remindersCount;

    let body = "Voice processing completed";
    if (totalItems > 0) {
      const items = [];
      if (tasksCount > 0) items.push(`${tasksCount} task${tasksCount > 1 ? "s" : ""}`);
      if (remindersCount > 0)
        items.push(`${remindersCount} reminder${remindersCount > 1 ? "s" : ""}`);
      body = `Created ${items.join(" and ")}`;
    }

    await self.registration.showNotification("Voice Processing Complete", {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: `voice-job-${jobId}`,
      data: {
        jobId,
        actionUrl: "/dashboard/tasks",
        tasksCount,
        remindersCount,
      },
      requireInteraction: false,
    });
  } catch (error) {
    console.error("[Service Worker] Voice processing sync failed:", error);

    // Notify clients of failure
    const clients = await self.clients.matchAll({
      includeUncontrolled: true,
      type: "window",
    });

    clients.forEach((client) => {
      client.postMessage({
        type: "VOICE_JOB_FAILED",
        jobId: syncTag.replace("voice-processing-", ""),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    });
  }
}