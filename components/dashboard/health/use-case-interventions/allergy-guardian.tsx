"use client"

import { AlertTriangle, CheckCircle2, MapPin } from "lucide-react"
import type { UseCaseIntervention } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Allergy Guardian Use Case Component
 * 
 * Detailed view for Allergy Restaurant Guardian interventions.
 * Shows detected allergens, safe menu items, and restaurant context.
 * 
 * TODO (API Integration):
 * - Connect to restaurant database (Yelp, Google Places) for menu information
 * - Use GPS to detect when user enters restaurant
 * - Cross-reference menu items with user's allergies
 * - Real-time alerts when near allergen sources
 * 
 * TODO (Backend Integration):
 * - Store restaurant allergen database
 * - Track user's allergy history and reactions
 * - Learn from user feedback about safe/unsafe restaurants
 */

interface AllergyGuardianProps {
  intervention: UseCaseIntervention
  className?: string
}

export function AllergyGuardian({ intervention, className }: AllergyGuardianProps) {
  const detectedAllergens = intervention.useCaseData?.detectedAllergens || []
  const safeMenuItems = intervention.useCaseData?.safeMenuItems || []

  return (
    <div className={cn("space-y-4", className)}>
      {/* Restaurant Context */}
      {intervention.context?.restaurant && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <MapPin size={16} className="text-amber-500" />
          <div>
            <p className="text-xs text-muted-foreground">Current Location</p>
            <p className="text-sm font-semibold text-foreground">{intervention.context.restaurant}</p>
          </div>
        </div>
      )}

      {/* Detected Allergens */}
      {detectedAllergens.length > 0 && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-red-500" />
            <h4 className="text-sm font-semibold text-foreground">Detected Allergens</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {detectedAllergens.map((allergen, index) => (
              <span
                key={index}
                className="px-2 py-1 rounded-full bg-red-500/20 text-red-600 text-xs font-medium"
              >
                {allergen}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Safe Menu Items */}
      {safeMenuItems.length > 0 && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={18} className="text-green-500" />
            <h4 className="text-sm font-semibold text-foreground">Safe Menu Items</h4>
          </div>
          <ul className="space-y-1.5">
            {safeMenuItems.map((item, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 size={12} className="text-green-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
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




