"use client"

import { motion } from "framer-motion"
import { CheckCircle2, Circle, Target, Sparkles } from "lucide-react"
import { useDailyChallenges, useCompleteChallenge } from "@/hooks/queries/use-health-engagement"
import { cn } from "@/lib/utils"
import { springs } from "@/lib/motion-system"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

/**
 * Daily Challenges Component
 * 
 * Displays today's health challenges with:
 * - 3 daily challenges
 * - Progress tracking
 * - Reward points on completion
 */

interface DailyChallengesProps {
  className?: string
}

export function DailyChallenges({ className }: DailyChallengesProps) {
  const { data: challenges, isLoading } = useDailyChallenges()
  const completeChallenge = useCompleteChallenge()

  if (isLoading) {
    return (
      <div className={cn("saydo-card p-4", className)}>
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (!challenges || challenges.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn("saydo-card p-6 text-center", className)}
      >
        <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No challenges today. Check back tomorrow!</p>
      </motion.div>
    )
  }

  const handleComplete = async (challengeId: string, isCompleted: boolean) => {
    try {
      await completeChallenge.mutateAsync({ challengeId, completed: !isCompleted })
      if (!isCompleted) {
        toast.success("Challenge completed! 🎉")
      }
    } catch (error) {
      toast.error("Failed to update challenge")
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("saydo-card p-4", className)}
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-semibold">Daily Challenges</h3>
      </div>

      <div className="space-y-3">
        {challenges.map((challenge, index) => {
          const isCompleted = challenge.is_completed
          const progress = challenge.target_value 
            ? (challenge.current_value || 0) / challenge.target_value 
            : 0

          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, ...springs.gentle }}
              className={cn(
                "p-3 rounded-lg border transition-all",
                isCompleted 
                  ? "border-emerald-500/20 bg-emerald-500/5" 
                  : "border-border bg-muted/30"
              )}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleComplete(challenge.id, isCompleted)}
                  className={cn(
                    "mt-0.5 transition-all",
                    isCompleted && "scale-110"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 size={20} className="text-emerald-500" />
                  ) : (
                    <Circle size={20} className="text-muted-foreground" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium mb-1",
                    isCompleted && "line-through text-muted-foreground"
                  )}>
                    {challenge.title}
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    {challenge.description}
                  </p>

                  {challenge.target_value && !isCompleted && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {challenge.current_value || 0}/{challenge.target_value} {challenge.unit}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(progress * 100, 100)}%` }}
                          transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                          className="h-full bg-amber-500"
                        />
                      </div>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <Sparkles size={12} />
                      <span>+{challenge.points_reward} points</span>
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


