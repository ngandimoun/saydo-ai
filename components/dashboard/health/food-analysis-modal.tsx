"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle2, AlertTriangle, XCircle, Utensils, Info } from "lucide-react"
import type { FoodAnalysis } from "@/lib/dashboard/types"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Food Analysis Modal Component
 * 
 * Displays detailed analysis of uploaded food/drink/supplement image.
 * Shows:
 * - Compatibility assessment (good/caution/not-recommended)
 * - Nutritional information
 * - Allergy check results
 * - Blood group compatibility
 * - Lab results alignment
 * - Recommendations and alternatives
 * 
 * TODO (Backend Integration):
 * - Fetch full analysis from Supabase: food_analyses table
 * - Store user feedback (helpful/not helpful)
 * - Track user's food choices over time
 * 
 * TODO (Enhancements):
 * - Show image preview
 * - Add to meal plan option
 * - Save as favorite if good
 * - Share analysis option
 */

interface FoodAnalysisModalProps {
  analysis: FoodAnalysis | null
  isOpen: boolean
  onClose: () => void
}

// Compatibility styling
const compatibilityStyles: Record<string, {
  icon: typeof CheckCircle2
  color: string
  bg: string
  border: string
  text: string
}> = {
  good: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    text: 'text-green-600'
  },
  caution: {
    icon: AlertTriangle,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-600'
  },
  'not-recommended': {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    text: 'text-red-600'
  }
}

export function FoodAnalysisModal({ analysis, isOpen, onClose }: FoodAnalysisModalProps) {
  if (!analysis) return null

  const styles = compatibilityStyles[analysis.compatibility]
  const Icon = styles.icon

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-x-4 bottom-4 top-auto z-50 max-w-lg mx-auto max-h-[85vh] overflow-y-auto"
          >
            <div className="bg-card rounded-3xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Utensils size={20} className="text-primary" />
                  <h3 className="font-semibold text-foreground">Food Analysis</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full"
                >
                  <X size={20} />
                </Button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Identified Food */}
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-foreground mb-1">
                    {analysis.identifiedFood.name}
                  </h4>
                  <p className="text-xs text-muted-foreground capitalize">
                    {analysis.identifiedFood.category} • {analysis.identifiedFood.confidence}% confidence
                  </p>
                </div>

                {/* Compatibility Badge */}
                <div className={cn(
                  "p-4 rounded-xl border-2 text-center",
                  styles.bg,
                  styles.border
                )}>
                  <Icon size={32} className={cn("mx-auto mb-2", styles.color)} />
                  <p className={cn("text-lg font-bold mb-1", styles.text)}>
                    {analysis.compatibility === 'good' && '✅ Good for you'}
                    {analysis.compatibility === 'caution' && '⚠️ Use caution'}
                    {analysis.compatibility === 'not-recommended' && '❌ Not recommended'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {analysis.compatibilityDetails.overallReason}
                  </p>
                </div>

                {/* Compatibility Details */}
                <div className="space-y-3">
                  {/* Allergy Check */}
                  <div className={cn(
                    "p-3 rounded-lg border",
                    analysis.compatibilityDetails.allergyCheck.safe
                      ? "bg-green-500/10 border-green-500/20"
                      : "bg-red-500/10 border-red-500/20"
                  )}>
                    <div className="flex items-center gap-2 mb-1">
                      {analysis.compatibilityDetails.allergyCheck.safe ? (
                        <CheckCircle2 size={16} className="text-green-500" />
                      ) : (
                        <XCircle size={16} className="text-red-500" />
                      )}
                      <span className="text-xs font-medium text-foreground">Allergy Check</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {analysis.compatibilityDetails.allergyCheck.message}
                    </p>
                    {analysis.compatibilityDetails.allergyCheck.detectedAllergens && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {analysis.compatibilityDetails.allergyCheck.detectedAllergens.map((allergen, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-600 text-[10px] font-medium"
                          >
                            {allergen}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Blood Group Check */}
                  <div className={cn(
                    "p-3 rounded-lg border",
                    analysis.compatibilityDetails.bloodGroupCheck.compatible
                      ? "bg-green-500/10 border-green-500/20"
                      : "bg-amber-500/10 border-amber-500/20"
                  )}>
                    <div className="flex items-center gap-2 mb-1">
                      {analysis.compatibilityDetails.bloodGroupCheck.compatible ? (
                        <CheckCircle2 size={16} className="text-green-500" />
                      ) : (
                        <AlertTriangle size={16} className="text-amber-500" />
                      )}
                      <span className="text-xs font-medium text-foreground">Blood Group Compatibility</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {analysis.compatibilityDetails.bloodGroupCheck.message}
                    </p>
                  </div>

                  {/* Lab Results Check */}
                  {analysis.compatibilityDetails.labResultsCheck && (
                    <div className={cn(
                      "p-3 rounded-lg border",
                      analysis.compatibilityDetails.labResultsCheck.beneficial
                        ? "bg-green-500/10 border-green-500/20"
                        : "bg-amber-500/10 border-amber-500/20"
                    )}>
                      <div className="flex items-center gap-2 mb-1">
                        {analysis.compatibilityDetails.labResultsCheck.beneficial ? (
                          <CheckCircle2 size={16} className="text-green-500" />
                        ) : (
                          <Info size={16} className="text-amber-500" />
                        )}
                        <span className="text-xs font-medium text-foreground">Lab Results Alignment</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {analysis.compatibilityDetails.labResultsCheck.message}
                      </p>
                      {analysis.compatibilityDetails.labResultsCheck.relevantNutrients && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {analysis.compatibilityDetails.labResultsCheck.relevantNutrients.map((nutrient, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 text-[10px] font-medium"
                            >
                              {nutrient}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Nutritional Info */}
                {analysis.nutritionalInfo && (
                  <div className="p-3 rounded-lg bg-muted/30">
                    <h4 className="text-xs font-medium text-foreground mb-2">Nutritional Information</h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Calories</p>
                        <p className="font-semibold text-foreground">
                          {analysis.nutritionalInfo.calories || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Protein</p>
                        <p className="font-semibold text-foreground">
                          {analysis.nutritionalInfo.protein ? `${analysis.nutritionalInfo.protein}g` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Carbs</p>
                        <p className="font-semibold text-foreground">
                          {analysis.nutritionalInfo.carbs ? `${analysis.nutritionalInfo.carbs}g` : 'N/A'}
                        </p>
                      </div>
                      {analysis.nutritionalInfo.iron && (
                        <div>
                          <p className="text-muted-foreground">Iron</p>
                          <p className="font-semibold text-amber-600">
                            {analysis.nutritionalInfo.iron}mg
                          </p>
                        </div>
                      )}
                      {analysis.nutritionalInfo.b12 && (
                        <div>
                          <p className="text-muted-foreground">B12</p>
                          <p className="font-semibold text-blue-600">
                            {analysis.nutritionalInfo.b12} mcg
                          </p>
                        </div>
                      )}
                      {analysis.nutritionalInfo.vitaminD && (
                        <div>
                          <p className="text-muted-foreground">Vitamin D</p>
                          <p className="font-semibold text-yellow-600">
                            {analysis.nutritionalInfo.vitaminD} IU
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <h4 className="text-xs font-medium text-foreground mb-2">Recommendation</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {analysis.recommendations.reasoning}
                  </p>
                  {analysis.recommendations.timing && (
                    <p className="text-xs text-muted-foreground italic">
                      💡 {analysis.recommendations.timing}
                    </p>
                  )}
                </div>

                {/* Alternatives */}
                {analysis.recommendations.alternatives && analysis.recommendations.alternatives.length > 0 && (
                  <div className="p-3 rounded-lg bg-muted/30">
                    <h4 className="text-xs font-medium text-foreground mb-2">Better Alternatives</h4>
                    <ul className="space-y-1.5">
                      {analysis.recommendations.alternatives.map((alt, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="text-primary">•</span>
                          <span>{alt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border">
                <Button
                  onClick={onClose}
                  className="w-full rounded-full"
                >
                  Got it
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}



