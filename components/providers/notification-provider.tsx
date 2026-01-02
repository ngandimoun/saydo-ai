"use client"

import { useEffect, useRef, useState } from "react"
import { useNotifications, useNotificationsRealtime } from "@/hooks/queries/use-pro-data"
import { showNotification, updateBadge, getNotificationPermission } from "@/lib/notification-manager"
import { getNotificationPreferences } from "@/lib/notification-preferences"

/**
 * Notification Provider
 * 
 * Handles:
 * - Real-time notification updates
 * - Browser notifications when app is in background
 * - Badge updates
 * - Notification click handling
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const previousUnreadCount = useRef(0)
  const { data: notifications } = useNotifications({ unreadOnly: true })
  const unreadCount = notifications?.length || 0
  const [preferences] = useState(() => getNotificationPreferences())
  
  // Enable real-time updates
  useNotificationsRealtime()

  // Update badge
  useEffect(() => {
    if (preferences.badgeEnabled) {
      updateBadge(unreadCount)
    } else {
      updateBadge(0)
    }
  }, [unreadCount, preferences.badgeEnabled])

  // Show browser notifications for new notifications
  useEffect(() => {
    // Skip if notifications are disabled or permission not granted
    if (!preferences.browserNotificationsEnabled) {
      return
    }

    if (getNotificationPermission() !== "granted") {
      return
    }

    // Only show notification if count increased (new notification)
    if (unreadCount > previousUnreadCount.current && previousUnreadCount.current > 0) {
      const newNotifications = notifications?.slice(0, unreadCount - previousUnreadCount.current) || []
      
      // Show notification for the most recent one
      if (newNotifications.length > 0) {
        const latest = newNotifications[0]
        
        // Check if app is in background (document.hidden)
        if (document.hidden) {
          showNotification({
            title: latest.title,
            body: latest.message || "",
            tag: `notification-${latest.id}`,
            data: {
              notificationId: latest.id,
              actionUrl: latest.deepLink || "",
            },
            requireInteraction: false,
            silent: !preferences.soundEnabled,
          })
        }
      }
    }

    previousUnreadCount.current = unreadCount
  }, [unreadCount, notifications, preferences])

  return <>{children}</>
}

