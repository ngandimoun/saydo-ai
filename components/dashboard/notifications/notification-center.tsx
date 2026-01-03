"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion"
import { Bell, X, Check, ChevronRight, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useNotificationsRealtime } from "@/hooks/queries/use-pro-data"
import { toast } from "sonner"

/**
 * Notification Center Component
 * 
 * Displays in-app notifications with:
 * - Unread count badge
 * - Notification dropdown/panel
 * - Mark as read functionality
 * - Action buttons
 */

interface NotificationCenterProps {
  className?: string
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  showButton?: boolean
}

async function fetchNotifications(unreadOnly = false) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return []
  }

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  if (unreadOnly) {
    query = query.eq("is_read", false)
  }

  const { data, error } = await query
  if (error) {
    throw error
  }

  return data || []
}

export function NotificationCenter({ 
  className, 
  isOpen: controlledIsOpen,
  onOpenChange,
  showButton = true 
}: NotificationCenterProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const queryClient = useQueryClient()
  
  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen
  const setIsOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open)
    } else {
      setInternalIsOpen(open)
    }
  }

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications(false),
    staleTime: 1 * 60 * 1000, // 1 minute
  })

  const { data: unreadNotifications } = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () => fetchNotifications(true),
    staleTime: 30 * 1000, // 30 seconds
  })

  const router = useRouter()
  const [filter, setFilter] = useState<"all" | "unread">("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const y = useMotionValue(0)
  const previousUnreadCount = useRef(0)

  // Enable real-time updates
  useNotificationsRealtime()

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId, isRead: true }),
      })
      if (!response.ok) {
        throw new Error("Failed to mark as read")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!notifications) return
      const unreadIds = notifications
        .filter((n) => !n.is_read)
        .map((n) => n.id)
      
      if (unreadIds.length === 0) return

      const response = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: unreadIds }),
      })
      if (!response.ok) {
        throw new Error("Failed to mark all as read")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: ["notifications"] })
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // Pull to refresh on mobile
  useEffect(() => {
    if (!isOpen || !panelRef.current) return

    const handleTouchStart = (e: TouchEvent) => {
      startY.current = e.touches[0].clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY
      const diff = currentY - startY.current
      if (diff > 0 && window.scrollY === 0) {
        y.set(diff)
      }
    }

    const handleTouchEnd = () => {
      if (y.get() > 80) {
        handleRefresh()
      }
      y.set(0)
    }

    const panel = panelRef.current
    panel.addEventListener("touchstart", handleTouchStart)
    panel.addEventListener("touchmove", handleTouchMove)
    panel.addEventListener("touchend", handleTouchEnd)

    return () => {
      panel.removeEventListener("touchstart", handleTouchStart)
      panel.removeEventListener("touchmove", handleTouchMove)
      panel.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isOpen, y])

  const unreadCount = unreadNotifications?.length || 0
  const filteredNotifications = notifications?.filter((n) => 
    filter === "all" ? true : !n.is_read
  ) || []

  // Show toast when new notifications arrive
  useEffect(() => {
    if (unreadCount > previousUnreadCount.current && previousUnreadCount.current > 0) {
      const newCount = unreadCount - previousUnreadCount.current
      toast.info(`You have ${newCount} new notification${newCount > 1 ? 's' : ''}`, {
        action: {
          label: "View",
          onClick: () => setIsOpen(true),
        },
      })
    }
    previousUnreadCount.current = unreadCount
  }, [unreadCount])

  return (
    <div className={cn("relative", className)}>
      {showButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="relative rounded-full"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
            >
              <span className="text-xs font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </motion.div>
          )}
        </Button>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              style={{ y }}
              className={cn(
                "fixed sm:absolute right-0 top-0 sm:top-12",
                "w-full sm:w-80 h-screen sm:h-auto sm:max-h-[80vh]",
                "bg-background border sm:rounded-lg shadow-lg z-50",
                "flex flex-col overflow-hidden"
              )}
            >
              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAllAsRead.mutate()}
                      disabled={markAllAsRead.isPending}
                      className="h-8 px-2 text-xs"
                      title="Mark all as read"
                    >
                      <CheckCheck size={14} className="mr-1" />
                      <span className="hidden sm:inline">Mark all read</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 p-0 rounded-full"
                  >
                    <X size={16} />
                  </Button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex border-b px-4 flex-shrink-0">
                <button
                  onClick={() => setFilter("all")}
                  className={cn(
                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                    "touch-manipulation min-h-[44px]",
                    filter === "all"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("unread")}
                  className={cn(
                    "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                    "touch-manipulation min-h-[44px]",
                    filter === "unread"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  Unread {unreadCount > 0 && `(${unreadCount})`}
                </button>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {isRefreshing && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Refreshing...
                  </div>
                )}
                {filteredNotifications.length > 0 ? (
                  <div className="divide-y">
                    {filteredNotifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          "p-4 hover:bg-muted/50 active:bg-muted transition-colors cursor-pointer",
                          "touch-manipulation min-h-[60px]",
                          !notification.is_read && "bg-primary/5"
                        )}
                        onClick={() => {
                          if (!notification.is_read) {
                            markAsRead.mutate(notification.id)
                          }
                          setIsOpen(false)
                          if (notification.action_url) {
                            // Handle deep linking
                            if (notification.action_url.startsWith("/")) {
                              router.push(notification.action_url)
                            } else if (notification.action_url.startsWith("http")) {
                              window.open(notification.action_url, "_blank")
                            } else {
                              router.push(notification.action_url)
                            }
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-1">
                              <p className="text-sm font-medium flex-1">
                                {notification.title}
                              </p>
                              {!notification.is_read && (
                                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(notification.created_at).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {filter === "unread" ? "No unread notifications" : "No notifications"}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}



