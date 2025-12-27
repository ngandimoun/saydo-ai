"use client"

import { Moon, Shield, Clock } from "lucide-react"
import type { ProactiveIntervention } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Late Night Lockout Component
 * 
 * Detailed view for Late Night Lockout proactive behavior.
 * Shows blue light/stress protection at night.
 * 
 * TODO (Backend Integration):
 * - Track late-night app usage
 * - Monitor blue light exposure
 * - Enforce sleep hygiene rules
 * - Store lockout history
 */

interface LateNightLockoutProps {
  intervention: ProactiveIntervention
  className?: string
}

export function LateNightLockout({ intervention, className }: LateNightLockoutProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Time Context */}
      {intervention.context?.time && (
        <div className="p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-primary" />
            <span className="text-xs text-muted-foreground">Current Time</span>
            <span className="text-sm font-semibold text-foreground ml-auto">
              {intervention.context.time}
            </span>
          </div>
        </div>
      )}

      {/* Protection Alert */}
      <div className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={18} className="text-indigo-500" />
          <h4 className="text-sm font-semibold text-foreground">Sleep Protection Active</h4>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {intervention.description}
        </p>
      </div>

      {/* Action Items */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Moon size={14} className="text-primary" />
          Recommendations
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
    </div>
  )
}

