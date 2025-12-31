"use client"

import { Globe, Clock, Sun } from "lucide-react"
import type { UseCaseIntervention } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Jet-Lag Bio-Sync Use Case Component
 * 
 * Detailed view for Jet-Lag Bio-Sync interventions.
 * Shows timezone information, wait time, and light exposure recommendations.
 * 
 * TODO (API Integration):
 * - Flight API (Amadeus) to detect travel
 * - Calendar API to detect timezone changes
 * - Circadian rhythm calculator
 * - Light exposure timing recommendations
 */

interface JetlagBiosyncProps {
  intervention: UseCaseIntervention
  className?: string
}

export function JetlagBiosync({ intervention, className }: JetlagBiosyncProps) {
  const timezoneFrom = intervention.useCaseData?.timezoneFrom
  const timezoneTo = intervention.useCaseData?.timezoneTo
  const waitTime = intervention.useCaseData?.waitTime
  const lightExposure = intervention.useCaseData?.lightExposure

  return (
    <div className={cn("space-y-4", className)}>
      {/* Timezone Info */}
      {(timezoneFrom || timezoneTo) && (
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={18} className="text-blue-500" />
            <h4 className="text-sm font-semibold text-foreground">Timezone Change</h4>
          </div>
          <div className="space-y-2">
            {timezoneFrom && (
              <div>
                <p className="text-xs text-muted-foreground">From</p>
                <p className="text-sm font-semibold text-foreground">{timezoneFrom}</p>
              </div>
            )}
            {timezoneTo && (
              <div>
                <p className="text-xs text-muted-foreground">To</p>
                <p className="text-sm font-semibold text-foreground">{timezoneTo}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wait Time */}
      {waitTime && (
        <div className="p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} className="text-primary" />
            <span className="text-xs text-muted-foreground">Wait Before Eating</span>
          </div>
          <p className="text-sm font-semibold text-foreground">{waitTime}</p>
        </div>
      )}

      {/* Light Exposure */}
      {lightExposure && (
        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Sun size={16} className="text-yellow-500" />
            <span className="text-xs text-muted-foreground">Light Exposure</span>
          </div>
          <p className="text-sm font-semibold text-foreground">{lightExposure}</p>
        </div>
      )}

      {/* Action Items */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Sync Your Biological Clock:</h4>
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






