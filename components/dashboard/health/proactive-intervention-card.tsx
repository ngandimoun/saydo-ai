"use client"

import { motion } from "framer-motion"
import { 
  X, 
  ChevronRight, 
  MapPin, 
  Clock, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Info
} from "lucide-react"
import type { ProactiveIntervention } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * Proactive Intervention Card Component
 * 
 * Displays a single proactive intervention with:
 * - Urgency level (color-coded)
 * - Title and description
 * - Context (location, time, calendar event)
 * - Biological reason
 * - Action items
 * - Dismiss button (if dismissible)
 * 
 * TODO (Backend Integration):
 * - Handle dismiss action: Update is_dismissed in Supabase
 * - Track interaction: Log when user views/dismisses
 * - Auto-expire: Remove after valid_until date
 * 
 * TODO (Actions):
 * - Add "Take Action" button for actionable interventions
 * - Link to relevant screens (e.g., restaurant menu, supplement tracker)
 * - Show follow-up after action is taken
 * 
 * TODO (Real-time):
 * - Subscribe to intervention updates
 * - Show new interventions with animation
 * - Remove expired interventions automatically
 */

interface ProactiveInterventionCardProps {
  intervention: ProactiveIntervention
  onDismiss?: (id: string) => void
  onViewDetails?: (id: string) => void
  delay?: number
  className?: string
}

// Urgency level styling
const urgencyStyles: Record<string, {
  border: string
  bg: string
  iconBg: string
  iconColor: string
  text: string
}> = {
  critical: {
    border: 'border-l-red-500',
    bg: 'bg-red-500/5',
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-500',
    text: 'text-red-600'
  },
  high: {
    border: 'border-l-amber-500',
    bg: 'bg-amber-500/5',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-500',
    text: 'text-amber-600'
  },
  medium: {
    border: 'border-l-yellow-500',
    bg: 'bg-yellow-500/5',
    iconBg: 'bg-yellow-500/20',
    iconColor: 'text-yellow-500',
    text: 'text-yellow-600'
  },
  low: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-500/5',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-500',
    text: 'text-blue-600'
  }
}

// Category icons
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'health':
      return AlertCircle
    case 'nutrition':
      return CheckCircle2
    case 'environment':
      return MapPin
    case 'recovery':
      return CheckCircle2
    case 'cognitive':
      return Info
    default:
      return AlertCircle
  }
}

export function ProactiveInterventionCard({
  intervention,
  onDismiss,
  onViewDetails,
  delay = 0,
  className
}: ProactiveInterventionCardProps) {
  const urgency = urgencyStyles[intervention.urgencyLevel] || urgencyStyles.medium
  const CategoryIcon = getCategoryIcon(intervention.category)

  const handleDismiss = () => {
    if (intervention.dismissible && onDismiss) {
      // TODO: Call API to update is_dismissed in Supabase
      onDismiss(intervention.id)
    }
  }

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(intervention.id)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(
        "saydo-card p-4 border-l-4",
        urgency.border,
        urgency.bg,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Icon */}
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
            urgency.iconBg
          )}>
            <CategoryIcon size={18} className={urgency.iconColor} />
          </div>

          {/* Title and Description */}
          <div className="flex-1 min-w-0">
            <h3 className={cn("font-semibold text-sm mb-1", urgency.text)}>
              {intervention.title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {intervention.description}
            </p>
          </div>
        </div>

        {/* Dismiss Button */}
        {intervention.dismissible && (
          <button
            onClick={handleDismiss}
            className="p-1 rounded-full hover:bg-muted/50 transition-colors flex-shrink-0"
            aria-label="Dismiss intervention"
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Context */}
      {intervention.context && (
        <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-muted-foreground">
          {intervention.context.location && (
            <div className="flex items-center gap-1">
              <MapPin size={12} />
              <span>{intervention.context.location}</span>
            </div>
          )}
          {intervention.context.time && (
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{intervention.context.time}</span>
            </div>
          )}
          {intervention.context.calendarEvent && (
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{intervention.context.calendarEvent}</span>
            </div>
          )}
          {intervention.context.weather && (
            <div className="flex items-center gap-1">
              <span>☀️</span>
              <span>{intervention.context.weather}</span>
            </div>
          )}
        </div>
      )}

      {/* Biological Reason */}
      {intervention.biologicalReason && (
        <div className="mb-3 p-2 rounded-lg bg-muted/30">
          <p className="text-xs font-medium text-foreground mb-1">Why this matters:</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {intervention.biologicalReason}
          </p>
        </div>
      )}

      {/* Action Items */}
      {intervention.actionItems && intervention.actionItems.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-foreground mb-2">Action items:</p>
          <ul className="space-y-1.5">
            {intervention.actionItems.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                <span className="text-primary mt-0.5">•</span>
                <span className="flex-1 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
          {intervention.urgencyLevel} • {intervention.category}
        </span>
        {onViewDetails && (
          <button
            onClick={handleViewDetails}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View details
            <ChevronRight size={12} />
          </button>
        )}
      </div>
    </motion.div>
  )
}






