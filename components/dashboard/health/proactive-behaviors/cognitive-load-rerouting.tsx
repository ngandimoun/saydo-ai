"use client"

import { Brain, ListChecks, TrendingDown } from "lucide-react"
import type { ProactiveIntervention } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Cognitive Load Rerouting Component
 * 
 * Detailed view for Cognitive Load Rerouting proactive behavior.
 * Shows task prioritization based on bio-rings.
 * 
 * TODO (Backend Integration):
 * - Analyze task complexity and cognitive load
 * - Prioritize tasks based on health status rings
 * - Auto-reschedule tasks when cognitive load is high
 * - Track task completion rates vs cognitive state
 */

interface CognitiveLoadReroutingProps {
  intervention: ProactiveIntervention
  className?: string
}

export function CognitiveLoadRerouting({ intervention, className }: CognitiveLoadReroutingProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Cognitive Status */}
      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Brain size={18} className="text-amber-500" />
          <h4 className="text-sm font-semibold text-foreground">Cognitive Load Assessment</h4>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {intervention.description}
        </p>
      </div>

      {/* Action Items */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ListChecks size={14} className="text-primary" />
          Task Prioritization
        </h4>
        <ul className="space-y-1.5">
          {intervention.actionItems?.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-primary mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Biological Reason */}
      <div className="p-3 rounded-lg bg-muted/30">
        <p className="text-xs font-medium text-foreground mb-1">Why this matters:</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {intervention.biologicalReason}
        </p>
      </div>
    </div>
  )
}




