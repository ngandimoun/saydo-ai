"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Bell, Settings, Home, LogOut } from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase"
import type { UserProfile } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"
import { springs } from "@/lib/motion-system"

/**
 * Dashboard Header - Airbnb-Inspired
 * 
 * Clean, minimal header with:
 * - Date and day display
 * - Notification bell with badge
 * - Theme toggle
 * - User avatar
 */

interface HeaderProps {
  userProfile: UserProfile
}

export function Header({ userProfile }: HeaderProps) {
  const router = useRouter()
  const today = new Date()
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })

  // Mock notification count - TODO: Fetch from backend
  const notificationCount = 3

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleGoToLanding = () => {
    router.push('/')
  }

  const handlePreferences = () => {
    router.push('/dashboard/preferences')
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springs.gentle}
      className="flex items-center justify-between"
    >
      {/* Date */}
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          {dateString}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={springs.snappy}
          className={cn(
            "relative w-10 h-10 rounded-full",
            "bg-card border border-border",
            "flex items-center justify-center",
            "hover:bg-muted transition-colors",
            "touch-manipulation"
          )}
          aria-label={`${notificationCount} notifications`}
        >
          <Bell size={18} className="text-muted-foreground" />
          {notificationCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={springs.bouncy}
              className={cn(
                "absolute -top-0.5 -right-0.5",
                "w-5 h-5 rounded-full",
                "bg-primary text-primary-foreground",
                "text-[10px] font-bold",
                "flex items-center justify-center"
              )}
            >
              {notificationCount > 9 ? '9+' : notificationCount}
            </motion.span>
          )}
        </motion.button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Avatar with Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={springs.snappy}
              className={cn(
                "w-10 h-10 rounded-full overflow-hidden",
                "bg-gradient-to-br from-primary to-teal-600",
                "flex items-center justify-center",
                "text-white font-semibold text-sm",
                "border-2 border-background shadow-md",
                "touch-manipulation",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              )}
              aria-label="Profile menu"
            >
              {userProfile.avatarUrl ? (
                <img 
                  src={userProfile.avatarUrl} 
                  alt={userProfile.preferredName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>
                  {userProfile.preferredName.charAt(0).toUpperCase()}
                </span>
              )}
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handlePreferences}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Preferences</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleGoToLanding}>
              <Home className="mr-2 h-4 w-4" />
              <span>Go to Landing Page</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} variant="destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-2 text-xs text-muted-foreground text-center">
              Made with ❤️ by{" "}
              <a
                href="https://x.com/ChrisNGAND14511"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                @ChrisNGAND14511
              </a>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  )
}
