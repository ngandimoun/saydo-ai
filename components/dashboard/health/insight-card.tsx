"use client"

import { motion } from "framer-motion"
import { 
  AlertTriangle, 
  Sun, 
  Moon, 
  Pill, 
  Utensils,
  ChevronRight 
} from "lucide-react"
import type { HealthInsight } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Health Insight Card
 * 
 * Displays an individual AI-generated health insight.
 * Color-coded by category for quick visual scanning.
 * 
 * TODO (AI):
 * - Add action button for each insight
 * - Track which insights user has seen/acted on
 * - Allow dismissing or marking as resolved
 */

interface InsightCardProps {
  insight: HealthInsight
  delay?: number
}

// Map icon names to components
const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  AlertTriangle,
  Sun,
  Moon,
  Pill,
  Utensils
}

// Category colors
const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  warning: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    border: 'border-l-amber-500'
  },
  supplement: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-600',
    border: 'border-l-yellow-500'
  },
  nutrition: {
    bg: 'bg-green-500/10',
    text: 'text-green-600',
    border: 'border-l-green-500'
  },
  exercise: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    border: 'border-l-blue-500'
  },
  lifestyle: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-500',
    border: 'border-l-indigo-500'
  }
}

export function InsightCard({ insight, delay = 0 }: InsightCardProps) {
  const Icon = iconMap[insight.iconName] || AlertTriangle
  const colors = categoryColors[insight.category] || categoryColors.warning

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full text-left",
        "saydo-card p-3 border-l-4",
        colors.border,
        "flex items-center gap-3"
      )}
    >
      {/* Icon */}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
        colors.bg
      )}>
        <Icon size={18} className={colors.text} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground text-sm">
          {insight.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {insight.description}
        </p>
      </div>

      {/* Arrow */}
      <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
    </motion.button>
  )
}



