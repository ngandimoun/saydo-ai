"use client"

import { Pill, Calendar, AlertCircle } from "lucide-react"
import type { ProactiveIntervention } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Supplement Verification Component
 * 
 * Detailed view for Supplement Verification proactive behavior.
 * Shows missed supplement reminders and tracking.
 * 
 * TODO (Backend Integration):
 * - Track supplement intake history
 * - Set up recurring reminders
 * - Monitor compliance rates
 * - Alert on missed critical supplements
 */

interface SupplementVerificationProps {
  intervention: ProactiveIntervention
  className?: string
}

export function SupplementVerification({ intervention, className }: SupplementVerificationProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Missed Alert */}
      <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle size={18} className="text-yellow-500" />
          <h4 className="text-sm font-semibold text-foreground">Missed Supplement</h4>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {intervention.description}
        </p>
      </div>

      {/* Action Items */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Pill size={14} className="text-primary" />
          Take Action Now
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






