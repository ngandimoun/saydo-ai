"use client"

import { motion } from "framer-motion"
import { Flame, Zap } from "lucide-react"
import { useStreaks } from "@/hooks/queries/use-health-engagement"
import { cn } from "@/lib/utils"
import { springs } from "@/lib/motion-system"

/**
 * Streak Counter Component
 * 
 * Displays user's active health streaks with:
 * - Fire animation for active streaks
 * - Streak milestone celebrations
 * - Streak protection (miss 1 day warning)
 */

interface StreakCounterProps {
  className?: string
}

export function StreakCounter({ className }: StreakCounterProps) {
  const { data: streaks, isLoading } = useStreaks()

  if (isLoading) {
    return (
      <div className={cn("saydo-card p-4", className)}>
        <div className="animate-pulse h-16 bg-muted rounded" />
      </div>
    )
  }

  const activeStreaks = streaks?.filter(s => s.is_active && s.current_streak > 0) || []
  const mainStreak = activeStreaks.find(s => s.streak_type === 'daily_checkin') || activeStreaks[0]

  if (!mainStreak) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn("saydo-card p-4", className)}
      >
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground">Start your health journey!</p>
        </div>
      </motion.div>
    )
  }

  const isMilestone = mainStreak.current_streak > 0 && 
    (mainStreak.current_streak % 7 === 0 || mainStreak.current_streak % 30 === 0)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("saydo-card p-4", className)}
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={isMilestone ? {
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0],
          } : {}}
          transition={{ duration: 0.5, repeat: isMilestone ? Infinity : 0, repeatDelay: 2 }}
          className={cn(
            "p-2 rounded-full",
            mainStreak.current_streak > 0 ? "bg-orange-500/10" : "bg-muted"
          )}
        >
          <Flame 
            size={24} 
            className={cn(
              mainStreak.current_streak > 0 ? "text-orange-500" : "text-muted-foreground"
            )} 
          />
        </motion.div>

        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-0.5">Current Streak</p>
          <div className="flex items-baseline gap-2">
            <motion.span
              key={mainStreak.current_streak}
              initial={{ scale: 1.5, color: "#F59E0B" }}
              animate={{ scale: 1, color: "inherit" }}
              transition={springs.bouncy}
              className="text-2xl font-display font-bold tabular-nums"
            >
              {mainStreak.current_streak}
            </motion.span>
            <span className="text-sm text-muted-foreground">days</span>
          </div>
          {mainStreak.longest_streak > mainStreak.current_streak && (
            <p className="text-xs text-muted-foreground mt-1">
              Best: {mainStreak.longest_streak} days
            </p>
          )}
        </div>

        {isMilestone && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1 text-amber-500"
          >
            <Zap size={16} />
            <span className="text-xs font-medium">Milestone!</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}



