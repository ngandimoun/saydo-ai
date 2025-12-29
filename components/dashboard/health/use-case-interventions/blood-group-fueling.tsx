"use client"

import { Utensils, Zap, AlertCircle } from "lucide-react"
import type { UseCaseIntervention } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Blood Group Fueling Use Case Component
 * 
 * Detailed view for Blood Group Metabolic Fueling interventions.
 * Shows recommended foods based on blood type and explains the metabolic reasoning.
 * 
 * TODO (API Integration):
 * - Connect to nutrition database (Nutritionix, USDA) for blood type diet recommendations
 * - Track meal logging to provide real-time recommendations
 * - Analyze meal timing and composition
 * 
 * TODO (Backend Integration):
 * - Store blood type diet preferences
 * - Track meal history and energy levels
 * - Correlate food choices with cognitive performance
 */

interface BloodGroupFuelingProps {
  intervention: UseCaseIntervention
  className?: string
}

export function BloodGroupFueling({ intervention, className }: BloodGroupFuelingProps) {
  const recommendedFood = intervention.useCaseData?.recommendedFood
  const avoidFood = intervention.useCaseData?.avoidFood

  return (
    <div className={cn("space-y-4", className)}>
      {/* Recommended Food */}
      {recommendedFood && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Utensils size={18} className="text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Recommended</p>
              <p className="text-sm font-semibold text-foreground">{recommendedFood}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Your blood type metabolizes this efficiently for sustained mental energy.
          </p>
        </div>
      )}

      {/* Avoid Food */}
      {avoidFood && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle size={18} className="text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avoid</p>
              <p className="text-sm font-semibold text-foreground">{avoidFood}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            This will cause insulin spikes and brain fog in 30-60 minutes.
          </p>
        </div>
      )}

      {/* Action Items */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Zap size={14} className="text-primary" />
          Action Items
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
        <p className="text-xs font-medium text-foreground mb-1">Metabolic Science:</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {intervention.biologicalReason}
        </p>
      </div>
    </div>
  )
}




