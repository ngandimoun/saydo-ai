"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Bell, Calendar, Menu, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDisplayDate, formatDisplayTime } from "@/lib/dashboard/time-utils"
import type { UserProfile } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Dashboard Header
 * 
 * Shows current date/time, notifications, and user avatar.
 * Fixed at top with gradient background.
 * 
 * TODO (Backend Integration):
 * - Fetch unread notification count
 * - Real-time subscription for new notifications
 * - User avatar from Supabase Storage
 */

interface DashboardHeaderProps {
  userProfile: UserProfile | null
  className?: string
}

export function DashboardHeader({ userProfile, className }: DashboardHeaderProps) {
  const [currentTime] = useState(new Date())
  const [notificationCount] = useState(3) // TODO: Fetch from backend
  
  const language = userProfile?.language || 'en'

  return (
    <header 
      className={cn(
        "sticky top-0 z-40 w-full",
        "bg-gradient-to-b from-primary/5 to-background",
        "backdrop-blur-sm",
        "border-b border-border/50",
        className
      )}
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Menu & Date */}
          <div className="flex items-center gap-3">
            {/* Menu button - for future sidebar/navigation */}
            <Button 
              variant="ghost" 
              size="icon"
              className="h-10 w-10 rounded-full"
              aria-label="Menu"
            >
              <Menu size={20} />
            </Button>

            {/* Date picker trigger */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border/50 shadow-sm"
            >
              <Calendar size={14} className="text-primary" />
              <span className="text-sm font-medium">
                {formatDisplayDate(currentTime, language)}
              </span>
            </motion.button>
          </div>

          {/* Right: Time, Notifications, Avatar */}
          <div className="flex items-center gap-2">
            {/* Current time */}
            <span className="text-sm text-muted-foreground hidden sm:block">
              {formatDisplayTime(currentTime, language)}
            </span>

            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="icon"
              className="h-10 w-10 rounded-full relative"
              aria-label="Notifications"
            >
              <Bell size={20} />
              {notificationCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center"
                >
                  {notificationCount > 9 ? '9+' : notificationCount}
                </motion.span>
              )}
            </Button>

            {/* Settings */}
            <Button 
              variant="ghost" 
              size="icon"
              className="h-10 w-10 rounded-full"
              aria-label="Settings"
            >
              <Settings size={20} />
            </Button>

            {/* User Avatar */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-semibold shadow-sm"
            >
              {/* 
                TODO: Show actual avatar if available
                {userProfile?.avatarUrl ? (
                  <img src={userProfile.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  initials
                )}
              */}
              {userProfile?.preferredName?.charAt(0).toUpperCase() || 'U'}
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  )
}



