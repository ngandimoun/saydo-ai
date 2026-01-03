"use client"

import { useEffect, useRef, useState, Component, ErrorInfo, ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useNotifications, useNotificationsRealtime } from "@/hooks/queries/use-pro-data"
import { showNotification, updateBadge, getNotificationPermission } from "@/lib/notification-manager"
import { getNotificationPreferences } from "@/lib/notification-preferences"

/**
 * Error boundary that catches QueryClient errors
 */
class NotificationErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    // Only catch QueryClient errors
    if (error.message?.includes("QueryClient") || error.message?.includes("useQuery")) {
      return { hasError: true }
    }
    // Re-throw other errors
    throw error
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (error.message?.includes("QueryClient") || error.message?.includes("useQuery")) {
      console.warn("QueryClient not available in NotificationProvider, skipping notification features", error)
    } else {
      console.error("NotificationProvider error:", error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      // Return children without notification features
      return <>{this.props.children}</>
    }

    return this.props.children
  }
}

/**
 * Inner component that uses React Query hooks
 * This component requires QueryClientProvider to be in the component tree
 */
function NotificationProviderInner({ children }: { children: React.ReactNode }) {
  const previousUnreadCount = useRef(0)
  const [preferences] = useState(() => getNotificationPreferences())
  
  // These hooks require QueryClientProvider to be in the component tree
  // If QueryClient is not available, they will throw and be caught by the error boundary
  const queryClient = useQueryClient() // This will throw if QueryClientProvider is not in tree
  const { data: notifications } = useNotifications({ unreadOnly: true })
  const unreadCount = notifications?.length || 0
  
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

/**
 * Notification Provider
 * 
 * Handles:
 * - Real-time notification updates
 * - Browser notifications when app is in background
 * - Badge updates
 * - Notification click handling
 * 
 * Note: Requires QueryClientProvider to be in the component tree above this component
 * If QueryClient is not available, this component will gracefully degrade and just render children
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Only render notification features after mount (client-side only)
  // This ensures QueryClientProvider is fully initialized
  if (!mounted) {
    return <>{children}</>
  }

  return (
    <NotificationErrorBoundary>
      <NotificationProviderInner>{children}</NotificationProviderInner>
    </NotificationErrorBoundary>
  )
}
