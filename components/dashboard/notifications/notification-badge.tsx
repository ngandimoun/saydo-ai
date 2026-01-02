"use client"

import { motion } from "framer-motion"
import { Bell } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase"
import { cn } from "@/lib/utils"

/**
 * Notification Badge Component
 * 
 * Simple badge showing unread notification count
 */

interface NotificationBadgeProps {
  className?: string
}

async function fetchUnreadCount() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return 0
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false)

  if (error) {
    return 0
  }

  return count || 0
}

export function NotificationBadge({ className }: NotificationBadgeProps) {
  const { data: unreadCount } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: fetchUnreadCount,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000,
  })

  if (!unreadCount || unreadCount === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={cn(
        "absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center",
        className
      )}
    >
      <span className="text-xs font-bold text-white">
        {unreadCount > 9 ? "9+" : unreadCount}
      </span>
    </motion.div>
  )
}



