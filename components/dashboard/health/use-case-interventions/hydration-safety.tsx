"use client"

import { Droplets, AlertTriangle } from "lucide-react"
import type { UseCaseIntervention } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Hydration Safety Use Case Component
 * 
 * Detailed view for Hydration/Kidney Safety Loop interventions.
 * Shows creatinine levels, protein intake, and recommended water intake.
 * 
 * TODO (Backend Integration):
 * - Track protein intake from food logging
 * - Monitor creatinine from lab results
 * - Calculate optimal water intake based on protein
 * - Alert on kidney stress indicators
 */

interface HydrationSafetyProps {
  intervention: UseCaseIntervention
  className?: string
}

export function HydrationSafety({ intervention, className }: HydrationSafetyProps) {
  const creatinineLevel = intervention.useCaseData?.creatinineLevel
  const proteinIntake = intervention.useCaseData?.proteinIntake
  const recommendedWater = intervention.useCaseData?.recommendedWater

  return (
    <div className={cn("space-y-4", className)}>
      {/* Creatinine Level */}
      {creatinineLevel && (
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-amber-500" />
            <span className="text-xs text-muted-foreground">Creatinine Level</span>
          </div>
          <p className="text-lg font-bold text-foreground">{creatinineLevel} mg/dL</p>
          <p className="text-xs text-muted-foreground mt-1">
            Lab history shows your kidneys work hard
          </p>
        </div>
      )}

      {/* Protein Intake */}
      {proteinIntake && (
        <div className="p-3 rounded-lg bg-muted/30">
          <span className="text-xs text-muted-foreground">Current Protein Intake</span>
          <p className="text-sm font-semibold text-foreground">{proteinIntake}g</p>
        </div>
      )}

      {/* Recommended Water */}
      {recommendedWater && (
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Droplets size={18} className="text-blue-500" />
            <span className="text-xs text-muted-foreground">Recommended Water</span>
          </div>
          <p className="text-lg font-bold text-foreground">{recommendedWater}ml</p>
          <p className="text-xs text-muted-foreground mt-1">
            With lemon to balance pH
          </p>
        </div>
      )}

      {/* Action Items */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Action Items:</h4>
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







