"use client"

import { TrendingDown, Calendar, Sparkles } from "lucide-react"
import type { UseCaseIntervention } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Longevity Tracker Use Case Component
 * 
 * Detailed view for Longevity Biomarker Tracker interventions.
 * Shows biological age vs chronological age and improvement factors.
 * 
 * TODO (Backend Integration):
 * - Calculate biological age from biomarkers
 * - Track improvements over time
 * - Correlate interventions with age changes
 * - Show trend graphs
 */

interface LongevityTrackerProps {
  intervention: UseCaseIntervention
  className?: string
}

export function LongevityTracker({ intervention, className }: LongevityTrackerProps) {
  const biologicalAge = intervention.useCaseData?.biologicalAge
  const chronologicalAge = intervention.useCaseData?.chronologicalAge
  const improvementFactors = intervention.useCaseData?.improvementFactors || []
  const ageDifference = biologicalAge && chronologicalAge 
    ? chronologicalAge - biologicalAge 
    : null

  return (
    <div className={cn("space-y-4", className)}>
      {/* Age Comparison */}
      {biologicalAge && chronologicalAge && (
        <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Biological Age</p>
              <p className="text-3xl font-bold text-foreground">{biologicalAge}</p>
            </div>
            {ageDifference !== null && ageDifference > 0 && (
              <div className="text-right">
                <div className="flex items-center gap-1 text-green-500 mb-1">
                  <TrendingDown size={20} />
                  <span className="text-lg font-bold">{ageDifference}</span>
                </div>
                <p className="text-xs text-muted-foreground">years younger</p>
              </div>
            )}
          </div>
          <div className="pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground">Chronological Age</p>
            <p className="text-lg font-semibold text-foreground">{chronologicalAge}</p>
          </div>
        </div>
      )}

      {/* Improvement Factors */}
      {improvementFactors.length > 0 && (
        <div className="p-4 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} className="text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Improvement Factors</h4>
          </div>
          <ul className="space-y-2">
            {improvementFactors.map((factor, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-green-500">✓</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Items */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Continue Progress:</h4>
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




