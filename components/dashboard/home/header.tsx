"use client"

import { useState } from "react"
import { Bell, Settings, Menu, Calendar } from "lucide-react"
import { motion } from "framer-motion"
import type { UserProfile } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Dashboard Header
 * 
 * Sticky header showing:
 * - Menu button
 * - Current date
 * - Notification bell with count
 * - Settings
 * - User avatar
 */

interface HeaderProps {
  userProfile: UserProfile
}

export function Header({ userProfile }: HeaderProps) {
  const [notificationCount] = useState(3) // TODO: Fetch from backend

  const today = new Date()
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  const formattedTime = today.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

  // Get user initials for avatar
  const initials = userProfile.preferredName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <header className="flex items-center justify-between py-2">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <button
          className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors touch-manipulation"
          aria-label="Open menu"
        >
          <Menu size={22} className="text-muted-foreground" />
        </button>

        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border/50 hover:bg-muted transition-colors touch-manipulation"
        >
          <Calendar size={14} className="text-primary" />
          <span className="text-sm font-medium">{formattedDate}</span>
        </button>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Time */}
        <span className="text-sm text-muted-foreground mr-2">
          {formattedTime}
        </span>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-full hover:bg-muted transition-colors touch-manipulation"
          aria-label={`${notificationCount} notifications`}
        >
          <Bell size={20} className="text-muted-foreground" />
          {notificationCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
            >
              {notificationCount}
            </motion.span>
          )}
        </button>

        {/* Settings */}
        <button
          className="p-2 rounded-full hover:bg-muted transition-colors touch-manipulation"
          aria-label="Settings"
        >
          <Settings size={20} className="text-muted-foreground" />
        </button>

        {/* User Avatar */}
        <button
          className={cn(
            "w-9 h-9 rounded-full flex items-center justify-center",
            "bg-primary text-primary-foreground font-semibold text-sm",
            "hover:opacity-90 transition-opacity touch-manipulation"
          )}
          aria-label="Profile"
        >
          {userProfile.avatarUrl ? (
            <img 
              src={userProfile.avatarUrl} 
              alt={userProfile.preferredName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </button>
      </div>
    </header>
  )
}

