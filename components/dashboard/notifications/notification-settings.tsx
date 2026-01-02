"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Bell, BellOff, Volume2, VolumeX, Moon, Sun, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/notification-preferences"
import { requestNotificationPermission } from "@/lib/notification-manager"
import { subscribeToPushNotifications, unsubscribeFromPushNotifications } from "@/lib/push-notification-service"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"

/**
 * Notification Settings Component
 * 
 * Allows users to configure:
 * - Browser notifications
 * - Push notifications
 * - Notification sounds
 * - Badge display
 * - Quiet hours
 * - Notification types
 */
export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    getNotificationPreferences()
  )
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const getUserId = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)
    }
    getUserId()
  }, [])

  const updatePreference = (key: keyof NotificationPreferences, value: unknown) => {
    const updated = { ...preferences, [key]: value }
    setPreferences(updated)
    saveNotificationPreferences(updated)
  }

  const handleBrowserNotificationsToggle = async (enabled: boolean) => {
    if (enabled) {
      const permission = await requestNotificationPermission()
      if (permission !== "granted") {
        toast.error("Notification permission denied. Please enable it in your browser settings.")
        return
      }
    }
    updatePreference("browserNotificationsEnabled", enabled)
    toast.success(enabled ? "Browser notifications enabled" : "Browser notifications disabled")
  }

  const handlePushNotificationsToggle = async (enabled: boolean) => {
    if (!userId) {
      toast.error("Please log in to enable push notifications")
      return
    }

    setIsLoading(true)
    try {
      if (enabled) {
        const subscription = await subscribeToPushNotifications(userId)
        if (subscription) {
          updatePreference("pushNotificationsEnabled", true)
          toast.success("Push notifications enabled")
        } else {
          toast.error("Failed to enable push notifications")
        }
      } else {
        const success = await unsubscribeFromPushNotifications(userId)
        if (success) {
          updatePreference("pushNotificationsEnabled", false)
          toast.success("Push notifications disabled")
        } else {
          toast.error("Failed to disable push notifications")
        }
      }
    } catch (error) {
      console.error("[NotificationSettings] Error:", error)
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const updateNotificationType = (type: keyof NotificationPreferences["notificationTypes"], enabled: boolean) => {
    const updated = {
      ...preferences,
      notificationTypes: {
        ...preferences.notificationTypes,
        [type]: enabled,
      },
    }
    setPreferences(updated)
    saveNotificationPreferences(updated)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Notification Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure how you receive notifications
        </p>
      </div>

      {/* Browser Notifications */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {preferences.browserNotificationsEnabled ? (
              <Bell className="w-5 h-5 text-primary" />
            ) : (
              <BellOff className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <Label htmlFor="browser-notifications" className="font-medium">
                Browser Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Show notifications when app is in background
              </p>
            </div>
          </div>
          <Switch
            id="browser-notifications"
            checked={preferences.browserNotificationsEnabled}
            onCheckedChange={handleBrowserNotificationsToggle}
          />
        </div>

        {/* Push Notifications */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {preferences.pushNotificationsEnabled ? (
              <Bell className="w-5 h-5 text-primary" />
            ) : (
              <BellOff className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <Label htmlFor="push-notifications" className="font-medium">
                Push Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive notifications even when app is closed
              </p>
            </div>
          </div>
          <Switch
            id="push-notifications"
            checked={preferences.pushNotificationsEnabled}
            onCheckedChange={handlePushNotificationsToggle}
            disabled={isLoading}
          />
        </div>

        {/* Sound */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {preferences.soundEnabled ? (
              <Volume2 className="w-5 h-5 text-primary" />
            ) : (
              <VolumeX className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <Label htmlFor="sound" className="font-medium">
                Notification Sounds
              </Label>
              <p className="text-xs text-muted-foreground">
                Play sound when notifications arrive
              </p>
            </div>
          </div>
          <Switch
            id="sound"
            checked={preferences.soundEnabled}
            onCheckedChange={(enabled) => {
              updatePreference("soundEnabled", enabled)
              toast.success(enabled ? "Sounds enabled" : "Sounds disabled")
            }}
          />
        </div>

        {/* Badge */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 flex items-center justify-center">
              {preferences.badgeEnabled && (
                <span className="w-3 h-3 bg-primary rounded-full" />
              )}
            </div>
            <div>
              <Label htmlFor="badge" className="font-medium">
                Badge Count
              </Label>
              <p className="text-xs text-muted-foreground">
                Show unread count on app icon
              </p>
            </div>
          </div>
          <Switch
            id="badge"
            checked={preferences.badgeEnabled}
            onCheckedChange={(enabled) => {
              updatePreference("badgeEnabled", enabled)
            }}
          />
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {preferences.quietHoursEnabled ? (
              <Moon className="w-5 h-5 text-primary" />
            ) : (
              <Sun className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <Label htmlFor="quiet-hours" className="font-medium">
                Quiet Hours
              </Label>
              <p className="text-xs text-muted-foreground">
                Suppress notifications during quiet hours
              </p>
            </div>
          </div>
          <Switch
            id="quiet-hours"
            checked={preferences.quietHoursEnabled}
            onCheckedChange={(enabled) => {
              updatePreference("quietHoursEnabled", enabled)
            }}
          />
        </div>

        {preferences.quietHoursEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="px-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              <Label className="text-xs">From:</Label>
              <input
                type="time"
                value={preferences.quietHoursStart}
                onChange={(e) => updatePreference("quietHoursStart", e.target.value)}
                className="px-2 py-1 text-sm border rounded"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">To:</Label>
              <input
                type="time"
                value={preferences.quietHoursEnd}
                onChange={(e) => updatePreference("quietHoursEnd", e.target.value)}
                className="px-2 py-1 text-sm border rounded"
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Notification Types */}
      <div className="space-y-4">
        <div>
          <Label className="font-medium">Notification Types</Label>
          <p className="text-xs text-muted-foreground mb-3">
            Choose which types of notifications you want to receive
          </p>
        </div>
        <div className="space-y-2">
          {Object.entries(preferences.notificationTypes).map(([type, enabled]) => (
            <div
              key={type}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <Label className="capitalize font-normal">
                {type.replace("_", " ")}
              </Label>
              <Switch
                checked={enabled}
                onCheckedChange={(checked) => updateNotificationType(type as keyof NotificationPreferences["notificationTypes"], checked)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

