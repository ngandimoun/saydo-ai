"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { springs } from "@/lib/motion-system"

/**
 * Theme Toggle - Airbnb-Inspired
 * 
 * Elegant theme switcher with:
 * - Smooth icon transitions
 * - Spring animations
 * - Proper dark mode support
 */

interface ThemeToggleProps {
  className?: string
  size?: "sm" | "default" | "lg"
}

export function ThemeToggle({ className, size = "default" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const sizeClasses = {
    sm: "w-8 h-8",
    default: "w-10 h-10",
    lg: "w-12 h-12"
  }

  const iconSizes = {
    sm: 14,
    default: 18,
    lg: 22
  }

  if (!mounted) {
    return (
      <div
        className={cn(
          sizeClasses[size],
          "rounded-full bg-secondary flex items-center justify-center text-muted-foreground",
          className
        )}
        aria-label="Toggle theme"
      >
        <Sun className="opacity-50" style={{ width: iconSizes[size], height: iconSizes[size] }} />
      </div>
    )
  }

  const isDark = theme === "dark"

  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      transition={springs.snappy}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        sizeClasses[size],
        "relative rounded-full overflow-hidden",
        "bg-secondary hover:bg-accent",
        "flex items-center justify-center",
        "text-muted-foreground hover:text-foreground",
        "transition-colors duration-200",
        "touch-manipulation",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className
      )}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {/* Background gradient for dark mode */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20"
        initial={false}
        animate={{ opacity: isDark ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Icon container */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.div
              key="sun"
              initial={{ rotate: -90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0, opacity: 0 }}
              transition={springs.bouncy}
            >
              <Sun style={{ width: iconSizes[size], height: iconSizes[size] }} />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ rotate: 90, scale: 0, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0, opacity: 0 }}
              transition={springs.bouncy}
            >
              <Moon style={{ width: iconSizes[size], height: iconSizes[size] }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Subtle glow effect in dark mode */}
      {isDark && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400/20 to-orange-400/10 blur-sm"
        />
      )}
    </motion.button>
  )
}
