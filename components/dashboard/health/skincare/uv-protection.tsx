"use client"

import { motion } from "framer-motion"
import { Sun, Shield, AlertTriangle } from "lucide-react"
import { useInterventions } from "@/hooks/queries/use-health-data"
import { cn } from "@/lib/utils"
import { useBiologicalProfile } from "@/hooks/queries/use-health-data"

/**
 * UV Protection Component
 * 
 * Displays personalized UV protection recommendations:
 * - SPF recommendations based on skin tone + UV index
 * - Sunscreen reapplication reminders
 * - Sun exposure time calculator
 * - Integration with UV Advisor intervention
 */

interface UVProtectionProps {
  className?: string
}

export function UVProtection({ className }: UVProtectionProps) {
  const { data: interventions } = useInterventions()
  const { data: biologicalProfile } = useBiologicalProfile()

  const uvIntervention = interventions?.find(i => i.type === 'uv_advisor')

  if (!uvIntervention) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn("saydo-card p-4", className)}
      >
        <div className="flex items-center gap-2 mb-2">
          <Sun className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-semibold">UV Protection</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          No UV alert at this time
        </p>
      </motion.div>
    )
  }

  const uvIndex = (uvIntervention.useCaseData as any)?.uvIndex
  const skinTone = biologicalProfile?.skinTone

  // Calculate recommended SPF based on skin tone and UV index
  const getRecommendedSPF = () => {
    if (!uvIndex) return 30

    const isFair = skinTone?.includes('fair') || skinTone?.includes('light')
    const isMedium = skinTone?.includes('medium') || skinTone?.includes('olive')
    
    if (uvIndex >= 8) {
      return isFair ? 50 : isMedium ? 50 : 30
    } else if (uvIndex >= 6) {
      return isFair ? 50 : isMedium ? 30 : 30
    } else if (uvIndex >= 3) {
      return isFair ? 30 : isMedium ? 30 : 15
    }
    return 15
  }

  const recommendedSPF = getRecommendedSPF()
  const isHighUV = uvIndex && uvIndex >= 6

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "saydo-card p-4",
        isHighUV && "border-amber-500/20 bg-amber-500/5",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-full",
          isHighUV ? "bg-amber-500/10" : "bg-primary/10"
        )}>
          {isHighUV ? (
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          ) : (
            <Shield className="w-5 h-5 text-primary" />
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{uvIntervention.title}</h3>
          <p className="text-sm text-muted-foreground mb-3">
            {uvIntervention.description}
          </p>

          {uvIndex && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">UV Index</span>
                <span className={cn(
                  "text-lg font-bold",
                  uvIndex >= 8 ? "text-red-500" :
                  uvIndex >= 6 ? "text-amber-500" :
                  uvIndex >= 3 ? "text-yellow-500" : "text-emerald-500"
                )}>
                  {uvIndex}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Recommended SPF</span>
                <span className="text-lg font-bold text-primary">
                  SPF {recommendedSPF}
                </span>
              </div>
            </div>
          )}

          {uvIntervention.actionItems && uvIntervention.actionItems.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs font-medium mb-2">Action Items</p>
              <ul className="space-y-1">
                {uvIntervention.actionItems.map((action, index) => (
                  <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}


