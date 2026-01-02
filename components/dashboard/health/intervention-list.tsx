"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { AlertCircle, Sparkles } from "lucide-react"
import type { ProactiveIntervention } from "@/lib/dashboard/types"
import { ProactiveInterventionCard } from "./proactive-intervention-card"
import { cn } from "@/lib/utils"

/**
 * Intervention List Component
 * 
 * Displays all active proactive interventions grouped by urgency level.
 * Shows critical and high priority interventions first.
 * 
 * TODO (Backend Integration):
 * - Fetch from Supabase: proactive_interventions table
 * - Filter: is_dismissed = false, valid_until > now
 * - Order by: urgency_level (critical first), created_at (newest first)
 * - Subscribe to real-time new interventions
 * 
 * TODO (Pull to Refresh):
 * - Implement pull-to-refresh gesture
 * - Refresh interventions list
 * - Show loading state during refresh
 * 
 * TODO (Grouping):
 * - Group by urgency level (Critical, High, Medium, Low)
 * - Show section headers
 * - Allow collapsing sections
 * 
 * TODO (Empty State):
 * - Show message when no active interventions
 * - Suggest uploading labs or enabling location services
 */

interface InterventionListProps {
  interventions: ProactiveIntervention[]
  onDismiss?: (id: string) => void
  onViewDetails?: (id: string) => void
  className?: string
}

// Group interventions by urgency level
const groupByUrgency = (interventions: ProactiveIntervention[]) => {
  const groups: Record<string, ProactiveIntervention[]> = {
    critical: [],
    high: [],
    medium: [],
    low: []
  }

  interventions.forEach(intervention => {
    if (groups[intervention.urgencyLevel]) {
      groups[intervention.urgencyLevel].push(intervention)
    }
  })

  return groups
}

// Urgency order for display
const urgencyOrder = ['critical', 'high', 'medium', 'low'] as const
const urgencyLabels: Record<string, string> = {
  critical: 'Critical Alerts',
  high: 'High Priority',
  medium: 'Medium Priority',
  low: 'Low Priority'
}

export function InterventionList({
  interventions,
  onDismiss,
  onViewDetails,
  className
}: InterventionListProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  // Filter out dismissed interventions
  const activeInterventions = interventions.filter(
    i => !dismissedIds.has(i.id) && !i.isDismissed
  )

  // Group by urgency
  const grouped = groupByUrgency(activeInterventions)

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]))
    if (onDismiss) {
      // TODO: Call API to update is_dismissed in Supabase
      onDismiss(id)
    }
  }

  // Empty state
  if (activeInterventions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn("text-center py-8", className)}
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles size={24} className="text-primary" />
        </div>
        <h3 className="font-medium text-foreground mb-1">
          No Active Interventions
        </h3>
        <p className="text-sm text-muted-foreground">
          Saydo will alert you when your biology needs attention
        </p>
      </motion.div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <AlertCircle size={16} className="text-primary" />
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Proactive Interventions
        </h2>
        <span className="ml-auto text-xs text-muted-foreground">
          {activeInterventions.length} active
        </span>
      </div>

      {/* Grouped Interventions */}
      {urgencyOrder.map(urgency => {
        const groupInterventions = grouped[urgency]
        if (groupInterventions.length === 0) return null

        return (
          <div key={urgency} className="space-y-2">
            {/* Section Label (only show if multiple urgency levels) */}
            {Object.values(grouped).filter(g => g.length > 0).length > 1 && (
              <h3 className="text-xs font-medium text-muted-foreground px-1">
                {urgencyLabels[urgency]}
              </h3>
            )}

            {/* Interventions */}
            {groupInterventions.map((intervention, index) => (
              <ProactiveInterventionCard
                key={intervention.id}
                intervention={intervention}
                onDismiss={handleDismiss}
                onViewDetails={onViewDetails}
                delay={index * 0.05}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}







