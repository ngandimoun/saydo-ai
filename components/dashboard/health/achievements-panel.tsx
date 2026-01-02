"use client"

import { motion } from "framer-motion"
import { Trophy, Lock, CheckCircle2 } from "lucide-react"
import { useAchievements } from "@/hooks/queries/use-health-engagement"
import { cn } from "@/lib/utils"
import { springs } from "@/lib/motion-system"

/**
 * Achievements Panel Component
 * 
 * Displays user's achievements with:
 * - Achievement grid with badges
 * - Progress bars for incomplete achievements
 * - Celebration animation on unlock
 */

interface AchievementsPanelProps {
  className?: string
  limit?: number
}

export function AchievementsPanel({ className, limit = 6 }: AchievementsPanelProps) {
  const { data: achievements, isLoading } = useAchievements()

  if (isLoading) {
    return (
      <div className={cn("saydo-card p-4", className)}>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded" />
          ))}
        </div>
      </div>
    )
  }

  const displayedAchievements = achievements?.slice(0, limit) || []
  const unlockedCount = achievements?.filter(a => a.is_unlocked).length || 0

  if (displayedAchievements.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn("saydo-card p-6 text-center", className)}
      >
        <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Complete activities to unlock achievements!</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("saydo-card p-4", className)}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Achievements</h3>
        <span className="text-sm text-muted-foreground">
          {unlockedCount}/{achievements?.length || 0}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {displayedAchievements.map((achievement, index) => {
          const isUnlocked = achievement.is_unlocked
          const progress = achievement.progress || 0
          const target = achievement.target || 100

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, ...springs.gentle }}
              className={cn(
                "p-3 rounded-lg border transition-all",
                isUnlocked 
                  ? "border-amber-500/20 bg-amber-500/5" 
                  : "border-border bg-muted/30"
              )}
            >
              <div className="flex items-start gap-2">
                <div className={cn(
                  "p-1.5 rounded-full",
                  isUnlocked ? "bg-amber-500/10" : "bg-muted"
                )}>
                  {isUnlocked ? (
                    <CheckCircle2 size={16} className="text-amber-500" />
                  ) : (
                    <Lock size={16} className="text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    isUnlocked ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {achievement.title}
                  </p>
                  {!isUnlocked && (
                    <div className="mt-1.5">
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(progress / target) * 100}%` }}
                          transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                          className="h-full bg-amber-500"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {progress}/{target}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}



