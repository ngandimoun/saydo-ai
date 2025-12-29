"use client"

import { Sun, MapPin, Shield } from "lucide-react"
import type { UseCaseIntervention } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * UV Advisor Use Case Component
 * 
 * Detailed view for UV Advisor interventions.
 * Shows UV index, skin tone-specific recommendations, and Vitamin D tracking.
 * 
 * TODO (API Integration):
 * - Connect to Weather API (OpenWeatherMap, WeatherAPI) for real-time UV index
 * - Use GPS location to determine current UV exposure
 * - Track daily Vitamin D exposure based on skin tone
 * - Calculate safe exposure time remaining
 * 
 * TODO (Backend Integration):
 * - Store UV exposure history in database
 * - Track Vitamin D levels from labs
 * - Personalize recommendations based on historical data
 */

interface UVAdvisorProps {
  intervention: UseCaseIntervention
  className?: string
}

export function UVAdvisor({ intervention, className }: UVAdvisorProps) {
  const uvIndex = intervention.useCaseData?.uvIndex || 0
  const vitaminDLimit = intervention.useCaseData?.vitaminDLimit || false

  // UV Index severity
  const getUVSeverity = (index: number) => {
    if (index <= 2) return { level: 'Low', color: 'text-green-500' }
    if (index <= 5) return { level: 'Moderate', color: 'text-yellow-500' }
    if (index <= 7) return { level: 'High', color: 'text-orange-500' }
    if (index <= 10) return { level: 'Very High', color: 'text-red-500' }
    return { level: 'Extreme', color: 'text-red-600' }
  }

  const severity = getUVSeverity(uvIndex)

  return (
    <div className={cn("space-y-4", className)}>
      {/* UV Index Display */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
            <Sun size={24} className="text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Current UV Index</p>
            <p className={cn("text-2xl font-bold", severity.color)}>
              {uvIndex}
            </p>
            <p className={cn("text-xs font-medium", severity.color)}>
              {severity.level}
            </p>
          </div>
        </div>
        {vitaminDLimit && (
          <div className="text-right">
            <Shield size={20} className="text-amber-500 mb-1" />
            <p className="text-xs text-amber-600 font-medium">Limit Reached</p>
          </div>
        )}
      </div>

      {/* Location Context */}
      {intervention.context?.location && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin size={14} />
          <span>{intervention.context.location}</span>
        </div>
      )}

      {/* Recommendations */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Recommendations:</h4>
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




