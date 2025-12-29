"use client"

import { motion } from "framer-motion"
import { 
  Mic, 
  FileText, 
  Heart, 
  CheckSquare, 
  Moon, 
  Sparkles,
  type LucideIcon 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { springs, fadeInUp } from "@/lib/motion-system"

/**
 * Empty State Component - Airbnb-Inspired
 * 
 * Thoughtful empty states that guide and encourage users.
 * Features:
 * - Custom icons with subtle animations
 * - Helpful copy with action suggestions
 * - Consistent styling across all contexts
 */

type EmptyStateType = 
  | "voice-notes"
  | "tasks"
  | "health"
  | "documents"
  | "calm"
  | "search"
  | "generic"

interface EmptyStateConfig {
  icon: LucideIcon
  iconColor: string
  iconBg: string
  title: string
  description: string
  actionLabel?: string
}

const emptyStateConfigs: Record<EmptyStateType, EmptyStateConfig> = {
  "voice-notes": {
    icon: Mic,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    title: "No voice notes yet",
    description: "Tap the mic button to record your first thought. Saydo will turn it into action.",
    actionLabel: "Record now"
  },
  "tasks": {
    icon: CheckSquare,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-500/10",
    title: "All caught up!",
    description: "You have no pending tasks. Record a voice note or add a task manually.",
    actionLabel: "Add task"
  },
  "health": {
    icon: Heart,
    iconColor: "text-rose-500",
    iconBg: "bg-rose-500/10",
    title: "Start your health journey",
    description: "Upload your first lab results and Saydo will generate personalized insights.",
    actionLabel: "Upload results"
  },
  "documents": {
    icon: FileText,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-500/10",
    title: "No documents yet",
    description: "Upload work files and Saydo will help you organize and extract insights.",
    actionLabel: "Upload file"
  },
  "calm": {
    icon: Moon,
    iconColor: "text-indigo-500",
    iconBg: "bg-indigo-500/10",
    title: "Find your calm",
    description: "Browse our collection of sleep stories, meditations, and relaxation content.",
    actionLabel: "Explore"
  },
  "search": {
    icon: Sparkles,
    iconColor: "text-muted-foreground",
    iconBg: "bg-muted",
    title: "No results found",
    description: "Try adjusting your search or browse different categories.",
  },
  "generic": {
    icon: Sparkles,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    title: "Nothing here yet",
    description: "Content will appear here once available.",
  }
}

interface EmptyStateProps {
  type?: EmptyStateType
  title?: string
  description?: string
  icon?: LucideIcon
  iconColor?: string
  iconBg?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  type = "generic",
  title,
  description,
  icon,
  iconColor,
  iconBg,
  actionLabel,
  onAction,
  className
}: EmptyStateProps) {
  const config = emptyStateConfigs[type]
  const Icon = icon || config.icon
  const finalTitle = title || config.title
  const finalDescription = description || config.description
  const finalIconColor = iconColor || config.iconColor
  const finalIconBg = iconBg || config.iconBg
  const finalActionLabel = actionLabel || config.actionLabel

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6",
        className
      )}
    >
      {/* Animated icon container */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, ...springs.bouncy }}
        className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center mb-5",
          finalIconBg
        )}
      >
        <motion.div
          animate={{
            y: [0, -4, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Icon size={32} className={finalIconColor} />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-display font-semibold text-foreground mb-2"
      >
        {finalTitle}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-muted-foreground max-w-xs leading-relaxed"
      >
        {finalDescription}
      </motion.p>

      {/* Action button */}
      {finalActionLabel && onAction && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAction}
          className={cn(
            "mt-6 px-6 py-2.5 rounded-full",
            "bg-primary text-primary-foreground",
            "font-medium text-sm",
            "shadow-md shadow-primary/20",
            "hover:shadow-lg hover:shadow-primary/30",
            "transition-shadow duration-200"
          )}
        >
          {finalActionLabel}
        </motion.button>
      )}
    </motion.div>
  )
}




