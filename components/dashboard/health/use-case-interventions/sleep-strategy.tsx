"use client"

import { Moon, Brain, AlertTriangle } from "lucide-react"
import type { UseCaseIntervention } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Sleep-Strategy Use Case Component
 * 
 * Detailed view for Sleep-to-Strategy Connection interventions.
 * Shows deep sleep data, cognitive load assessment, and recommended avoidance.
 * 
 * TODO (Wearable Integration):
 * - Connect to sleep tracking devices (Oura, Whoop, Apple Watch)
 * - Real-time deep sleep monitoring
 * - Sleep quality scoring
 * 
 * TODO (Backend Integration):
 * - Store sleep data history
 * - Correlate sleep quality with cognitive performance
 * - Predict cognitive load based on sleep patterns
 */

interface SleepStrategyProps {
  intervention: UseCaseIntervention
  className?: string
}

export function SleepStrategy({ intervention, className }: SleepStrategyProps) {
  const deepSleepMinutes = intervention.useCaseData?.deepSleepMinutes
  const cognitiveLoad = intervention.useCaseData?.cognitiveLoad
  const recommendedAvoidance = intervention.useCaseData?.recommendedAvoidance || []

  return (
    <div className={cn("space-y-4", className)}>
      {/* Deep Sleep */}
      {deepSleepMinutes !== undefined && (
        <div className={cn(
          "p-4 rounded-lg border",
          deepSleepMinutes < 60
            ? "bg-red-500/10 border-red-500/20"
            : "bg-green-500/10 border-green-500/20"
        )}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Moon size={18} className={
                deepSleepMinutes < 60 ? "text-red-500" : "text-green-500"
              } />
              <span className="text-xs text-muted-foreground">Deep Sleep</span>
            </div>
            <span className={cn(
              "text-lg font-bold",
              deepSleepMinutes < 60 ? "text-red-600" : "text-green-600"
            )}>
              {deepSleepMinutes} min
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {deepSleepMinutes < 60 
              ? "Below optimal (target: 60-90 min)"
              : "Within optimal range"
            }
          </p>
        </div>
      )}

      {/* Cognitive Load */}
      {cognitiveLoad && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Brain size={16} className="text-amber-500" />
            <span className="text-xs text-muted-foreground">Cognitive Load</span>
          </div>
          <p className={cn(
            "text-sm font-semibold capitalize",
            cognitiveLoad === 'high' ? "text-red-600" : 
            cognitiveLoad === 'medium' ? "text-amber-600" : 
            "text-green-600"
          )}>
            {cognitiveLoad}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Risk assessment brain is {cognitiveLoad === 'high' ? 'offline' : 'limited'} today
          </p>
        </div>
      )}

      {/* Recommended Avoidance */}
      {recommendedAvoidance.length > 0 && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-red-500" />
            <h4 className="text-sm font-semibold text-foreground">Avoid Today</h4>
          </div>
          <ul className="space-y-1.5">
            {recommendedAvoidance.map((item, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="text-red-500">⚠</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Items */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Today's Strategy:</h4>
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



