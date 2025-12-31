"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Minus, Trophy } from "lucide-react"
import { useHealthScore } from "@/hooks/queries/use-health-engagement"
import { cn } from "@/lib/utils"
import { springs } from "@/lib/motion-system"

/**
 * Health Score Card Component
 * 
 * Displays user's daily health score with:
 * - Animated circular score (0-100)
 * - Score breakdown (uploads, daily goals, health insights)
 * - Daily trend indicator
 * - Comparison to yesterday
 */

interface HealthScoreCardProps {
  className?: string
}

function AnimatedScoreRing({ 
  score, 
  size = 120,
  strokeWidth = 8 
}: { 
  score: number
  size?: number
  strokeWidth?: number 
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  // Color based on score
  const getColor = (score: number) => {
    if (score >= 80) return { gradient: ['#10B981', '#34D399'], text: 'text-emerald-500', bg: 'bg-emerald-500/10' }
    if (score >= 60) return { gradient: ['#F59E0B', '#FBBF24'], text: 'text-amber-500', bg: 'bg-amber-500/10' }
    return { gradient: ['#EF4444', '#F87171'], text: 'text-red-500', bg: 'bg-red-500/10' }
  }

  const color = getColor(score)

  return (
    <div className="relative">
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color.gradient[0]} />
            <stop offset="100%" stopColor={color.gradient[1]} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted-foreground/10"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#score-gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, ...springs.bouncy }}
            className={cn("text-3xl font-display font-bold tabular-nums", color.text)}
          >
            {score}
          </motion.div>
          <div className="text-xs text-muted-foreground mt-0.5">Score</div>
        </div>
      </div>
    </div>
  )
}

export function HealthScoreCard({ className }: HealthScoreCardProps) {
  const { data: scoreData, isLoading } = useHealthScore()

  if (isLoading) {
    return (
      <div className={cn("saydo-card p-6", className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    )
  }

  const score = scoreData?.score || 0
  const breakdown = (scoreData?.breakdown as any) || {}
  const trend = scoreData?.trend || 'stable'
  const previousScore = scoreData?.previous_score

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("saydo-card p-6", className)}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Health Score</h3>
          <p className="text-sm text-muted-foreground">Your daily health performance</p>
        </div>
        <Trophy className="w-5 h-5 text-amber-500" />
      </div>

      <div className="flex items-center gap-6">
        <AnimatedScoreRing score={score} />

        <div className="flex-1 space-y-3">
          {/* Trend */}
          {previousScore !== null && previousScore !== undefined && (
            <div className="flex items-center gap-2">
              <TrendIcon size={16} className={trendColor} />
              <span className="text-sm text-muted-foreground">
                {trend === 'up' && `+${score - previousScore} from yesterday`}
                {trend === 'down' && `${score - previousScore} from yesterday`}
                {trend === 'stable' && 'Same as yesterday'}
              </span>
            </div>
          )}

          {/* Breakdown */}
          {Object.keys(breakdown).length > 0 && (
            <div className="space-y-2">
              {breakdown.uploads !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Uploads</span>
                  <span className="font-medium">{breakdown.uploads}/30</span>
                </div>
              )}
              {breakdown.compliance !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Daily Goals</span>
                  <span className="font-medium">{breakdown.compliance}/30</span>
                </div>
              )}
              {breakdown.biomarkers !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Health Insights</span>
                  <span className="font-medium">{breakdown.biomarkers}/40</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

