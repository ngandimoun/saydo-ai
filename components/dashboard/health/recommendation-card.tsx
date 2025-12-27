"use client"

import { motion } from "framer-motion"
import { Utensils, Droplets, Dumbbell, Moon, Pill } from "lucide-react"
import type { HealthRecommendation } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Health Recommendation Card
 * 
 * Displays a specific actionable recommendation.
 * Types: food, drink, exercise, sleep, supplement
 * 
 * TODO (Future):
 * - Add to grocery list action
 * - Mark as done for the day
 * - Show AI reasoning on tap
 */

interface RecommendationCardProps {
  recommendation: HealthRecommendation
  delay?: number
}

// Type to icon/color mapping
const typeConfig: Record<string, {
  icon: React.ComponentType<{ size?: number; className?: string }>
  gradient: string
  iconBg: string
}> = {
  food: {
    icon: Utensils,
    gradient: 'from-green-500/20 to-emerald-500/10',
    iconBg: 'bg-green-500'
  },
  drink: {
    icon: Droplets,
    gradient: 'from-blue-500/20 to-cyan-500/10',
    iconBg: 'bg-blue-500'
  },
  exercise: {
    icon: Dumbbell,
    gradient: 'from-orange-500/20 to-amber-500/10',
    iconBg: 'bg-orange-500'
  },
  sleep: {
    icon: Moon,
    gradient: 'from-indigo-500/20 to-purple-500/10',
    iconBg: 'bg-indigo-500'
  },
  supplement: {
    icon: Pill,
    gradient: 'from-yellow-500/20 to-amber-500/10',
    iconBg: 'bg-yellow-500'
  }
}

export function RecommendationCard({ recommendation, delay = 0 }: RecommendationCardProps) {
  const config = typeConfig[recommendation.type] || typeConfig.food
  const Icon = config.icon

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-3",
        "bg-gradient-to-br",
        config.gradient,
        "border border-border/30",
        "text-left"
      )}
    >
      {/* Icon Badge */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center mb-2",
        config.iconBg
      )}>
        <Icon size={16} className="text-white" />
      </div>

      {/* Title */}
      <h4 className="font-medium text-foreground text-sm line-clamp-2 mb-1">
        {recommendation.title}
      </h4>

      {/* Timing */}
      {recommendation.timing && (
        <span className="text-[10px] text-muted-foreground capitalize">
          {recommendation.timing}
        </span>
      )}

      {/* 
        TODO: Show image if available
        {recommendation.imageUrl && (
          <img 
            src={recommendation.imageUrl} 
            alt="" 
            className="absolute inset-0 w-full h-full object-cover opacity-10"
          />
        )}
      */}
    </motion.button>
  )
}

