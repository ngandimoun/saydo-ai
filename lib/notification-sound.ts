/**
 * Notification Sound Utility
 * 
 * Handles playing notification sounds for PWA notifications.
 * Works with service worker messages and direct calls.
 */

/**
 * Play notification sound
 * Tries multiple formats and handles errors gracefully
 */
export async function playNotificationSound(): Promise<void> {
  // Check if sound is enabled in preferences
  const preferences = getNotificationPreferences();
  if (!preferences.soundEnabled) {
    return;
  }

  // Try to play sound with fallback formats
  const soundFormats = [
    "/sounds/notification.mp3",
    "/sounds/notification.ogg",
    "/sounds/notification.wav",
  ];

  for (const soundUrl of soundFormats) {
    try {
      const audio = new Audio(soundUrl);
      audio.volume = 0.7; // Set volume to 70%
      
      // Handle autoplay restrictions
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        await playPromise.catch((error) => {
          // Autoplay was prevented, but that's okay for notifications
          // The sound will play on next user interaction
          console.log("[Notification Sound] Autoplay prevented, will play on next interaction");
        });
      }
      
      // If we successfully started playing, break
      if (!audio.paused) {
        return;
      }
    } catch (error) {
      // Try next format
      console.log(`[Notification Sound] Failed to play ${soundUrl}, trying next format`);
      continue;
    }
  }

  console.warn("[Notification Sound] All sound formats failed to play");
}

/**
 * Get notification preferences from localStorage
 */
function getNotificationPreferences(): { soundEnabled: boolean } {
  if (typeof window === "undefined") {
    return { soundEnabled: true }; // Default to enabled
  }

  try {
    const stored = localStorage.getItem("saydo_notification_prefs");
    if (stored) {
      const prefs = JSON.parse(stored);
      return {
        soundEnabled: prefs.soundEnabled !== false, // Default to true if not set
      };
    }
  } catch (error) {
    console.error("[Notification Sound] Error reading preferences:", error);
  }

  return { soundEnabled: true }; // Default to enabled
}

/**
 * Setup service worker message listener for sound playback
 * Call this once when the app initializes
 */
export function setupNotificationSoundListener(): () => void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return () => {}; // No-op cleanup
  }

  const handleMessage = async (event: MessageEvent) => {
    if (event.data?.type === "PLAY_NOTIFICATION_SOUND") {
      await playNotificationSound();
    }
  };

  navigator.serviceWorker.addEventListener("message", handleMessage);

  // Return cleanup function
  return () => {
    navigator.serviceWorker.removeEventListener("message", handleMessage);
  };
}

