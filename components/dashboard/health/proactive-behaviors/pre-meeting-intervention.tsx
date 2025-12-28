"use client"

import { Calendar, Zap, Bell } from "lucide-react"
import type { ProactiveIntervention } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Pre-Meeting Intervention Component
 * 
 * Detailed view for Pre-Meeting Intervention proactive behavior.
 * Shows glucose/stress check before meetings and recommended actions.
 * 
 * TODO (API Integration):
 * - Connect to Calendar API (Google Calendar, Outlook)
 * - Connect to glucose monitor (Dexcom, Freestyle Libre)
 * - Real-time glucose and stress monitoring
 * - Automatic intervention 15 minutes before meetings
 * 
 * TODO (Backend Integration):
 * - Store meeting intervention history
 * - Track meeting performance vs intervention compliance
 * - Learn optimal timing for interventions
 */

interface PreMeetingInterventionProps {
  intervention: ProactiveIntervention
  className?: string
}

export function PreMeetingIntervention({ intervention, className }: PreMeetingInterventionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Meeting Context */}
      {intervention.context?.calendarEvent && (
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={18} className="text-blue-500" />
            <h4 className="text-sm font-semibold text-foreground">Upcoming Meeting</h4>
          </div>
          <p className="text-sm text-foreground">{intervention.context.calendarEvent}</p>
        </div>
      )}

      {/* Intervention Alert */}
      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-center gap-2 mb-2">
          <Bell size={18} className="text-amber-500" />
          <h4 className="text-sm font-semibold text-foreground">Pre-Meeting Alert</h4>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {intervention.description}
        </p>
      </div>

      {/* Action Items */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Zap size={14} className="text-primary" />
          Quick Actions
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



