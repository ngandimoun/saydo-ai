"use client"

import { MapPin, Wind, Volume2 } from "lucide-react"
import type { ProactiveIntervention } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Environmental Shield Component
 * 
 * Detailed view for Environmental Shield proactive behavior.
 * Shows air quality/noise level warnings.
 * 
 * TODO (API Integration):
 * - Air quality API (AQI, OpenAQ)
 * - Noise level detection (phone sensors)
 * - GPS for location-based alerts
 * - Real-time environmental monitoring
 */

interface EnvironmentalShieldProps {
  intervention: ProactiveIntervention
  className?: string
}

export function EnvironmentalShield({ intervention, className }: EnvironmentalShieldProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Location Context */}
      {intervention.context?.location && (
        <div className="p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-primary" />
            <span className="text-xs text-muted-foreground">Current Location</span>
            <span className="text-sm font-semibold text-foreground ml-auto">
              {intervention.context.location}
            </span>
          </div>
        </div>
      )}

      {/* Environmental Alert */}
      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Wind size={18} className="text-amber-500" />
          <h4 className="text-sm font-semibold text-foreground">Environmental Alert</h4>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {intervention.description}
        </p>
      </div>

      {/* Action Items */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Recommended Actions:</h4>
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



