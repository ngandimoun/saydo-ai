"use client"

import { Activity, TrendingDown, Clock } from "lucide-react"
import type { UseCaseIntervention } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Recovery Adjuster Use Case Component
 * 
 * Detailed view for Mesomorph Recovery Adjuster interventions.
 * Shows HRV data, cortisol levels, and recovery recommendations.
 * 
 * TODO (Wearable Integration):
 * - Connect to Oura Ring API for HRV data
 * - Connect to Whoop API for recovery metrics
 * - Connect to Apple HealthKit for heart rate variability
 * - Real-time HRV monitoring
 * 
 * TODO (Backend Integration):
 * - Store HRV history and trends
 * - Correlate recovery with workout intensity
 * - Predict recovery time based on body type
 */

interface RecoveryAdjusterProps {
  intervention: UseCaseIntervention
  className?: string
}

export function RecoveryAdjuster({ intervention, className }: RecoveryAdjusterProps) {
  const hrvValue = intervention.useCaseData?.hrvValue
  const cortisolLevel = intervention.useCaseData?.cortisolLevel
  const recoveryTime = intervention.useCaseData?.recoveryTime

  return (
    <div className={cn("space-y-4", className)}>
      {/* HRV Display */}
      {hrvValue && (
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-blue-500" />
              <span className="text-xs text-muted-foreground">Heart Rate Variability</span>
            </div>
            <span className="text-lg font-bold text-foreground">{hrvValue} ms</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Lower than usual for your body type
          </p>
        </div>
      )}

      {/* Cortisol Level */}
      {cortisolLevel && (
        <div className={cn(
          "p-3 rounded-lg border",
          cortisolLevel === 'high' 
            ? "bg-red-500/10 border-red-500/20"
            : "bg-green-500/10 border-green-500/20"
        )}>
          <div className="flex items-center gap-2">
            <TrendingDown size={16} className={
              cortisolLevel === 'high' ? "text-red-500" : "text-green-500"
            } />
            <div>
              <p className="text-xs text-muted-foreground">Cortisol Level</p>
              <p className={cn(
                "text-sm font-semibold",
                cortisolLevel === 'high' ? "text-red-600" : "text-green-600"
              )}>
                {cortisolLevel.charAt(0).toUpperCase() + cortisolLevel.slice(1)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recovery Time */}
      {recoveryTime && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30">
          <Clock size={16} className="text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Recommended Recovery</p>
            <p className="text-sm font-semibold text-foreground">{recoveryTime}</p>
          </div>
        </div>
      )}

      {/* Action Items */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Recovery Plan:</h4>
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






