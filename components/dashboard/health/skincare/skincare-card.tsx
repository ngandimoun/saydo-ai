"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Sparkles, Sun, Moon, Shield, ChevronRight, 
  Droplet, Heart, AlertTriangle, Loader2, CheckCircle2
} from "lucide-react"
import { useSkincareProfile, useSkincareRoutines, useGenerateRoutine, useUpdateSkincareProfile } from "@/hooks/queries/use-skincare"
import { useInterventions, useBiologicalProfile } from "@/hooks/queries/use-health-data"
import { cn } from "@/lib/utils"
import { springs } from "@/lib/motion-system"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

/**
 * Skincare Card - Simplified Component
 * 
 * A single smart card that combines:
 * - Profile setup (if needed)
 * - Current routine summary
 * - UV alert (when high)
 * 
 * Follows Airbnb design philosophy: clean, intuitive, no clutter
 */

interface SkincareCardProps {
  className?: string
}

const skinTypeLabels: Record<string, string> = {
  oily: "Oily",
  dry: "Dry",
  combination: "Combo",
  sensitive: "Sensitive",
  normal: "Normal",
}

const SKIN_TYPES = ["oily", "dry", "combination", "sensitive", "normal"] as const

export function SkincareCard({ className }: SkincareCardProps) {
  const { data: profile, isLoading: profileLoading } = useSkincareProfile()
  const { data: routines, isLoading: routinesLoading } = useSkincareRoutines()
  const { data: interventions } = useInterventions()
  const { data: biologicalProfile } = useBiologicalProfile()
  const generateRoutine = useGenerateRoutine()
  const updateProfile = useUpdateSkincareProfile()
  
  const [showSetup, setShowSetup] = useState(false)
  const [selectedSkinType, setSelectedSkinType] = useState<string>("")

  const isLoading = profileLoading || routinesLoading

  const uvIntervention = interventions?.find(i => i.type === 'uv_advisor')
  const uvIndex = (uvIntervention?.useCaseData as Record<string, unknown>)?.uvIndex as number | undefined
  const isHighUV = uvIndex && uvIndex >= 6

  const amRoutine = routines?.find(r => r.routine_type === 'am')
  const pmRoutine = routines?.find(r => r.routine_type === 'pm')
  const hasRoutines = amRoutine || pmRoutine

  // Handle profile setup
  const handleSetupProfile = async () => {
    if (!selectedSkinType) {
      toast.error("Please select your skin type")
      return
    }

    console.log("[SkincareCard] Saving profile with skin type:", selectedSkinType)

    try {
      await updateProfile.mutateAsync({
        skinType: selectedSkinType,
      })
      console.log("[SkincareCard] Profile saved successfully")
      setShowSetup(false)
      toast.success("Skincare profile saved!")
    } catch (error) {
      // Log full error for debugging
      console.error("[SkincareCard] Profile save error:", error)
      
      // Extract meaningful error message
      let errorMessage = "Failed to save profile"
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        // Handle Supabase errors
        const supabaseError = error as { message?: string; details?: string; hint?: string }
        errorMessage = supabaseError.message || supabaseError.details || errorMessage
      }
      
      toast.error(errorMessage)
    }
  }

  if (isLoading) {
    return (
      <div className={cn("saydo-card p-4", className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-muted rounded w-1/3" />
          <div className="h-16 bg-muted rounded" />
        </div>
      </div>
    )
  }

  // No profile - show setup prompt
  if (!profile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("saydo-card p-5", className)}
      >
        <AnimatePresence mode="wait">
          {!showSetup ? (
            <motion.div
              key="prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-1">Personalized Skincare</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get AI-powered routines tailored to your skin
              </p>
              <Button 
                onClick={() => setShowSetup(true)} 
                className="rounded-full"
              >
                Set Up Profile
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="setup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h3 className="font-semibold mb-3">What's your skin type?</h3>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {SKIN_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedSkinType(type)}
                    className={cn(
                      "p-3 rounded-xl text-sm font-medium transition-all",
                      selectedSkinType === type 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {skinTypeLabels[type]}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSetup(false)}
                  className="flex-1 rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSetupProfile}
                  disabled={!selectedSkinType || updateProfile.isPending}
                  className="flex-1 rounded-full"
                >
                  {updateProfile.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  // Has profile - show routine summary
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("saydo-card overflow-hidden", className)}
    >
      {/* UV Alert Banner - Only when high UV */}
      {isHighUV && uvIntervention && (
        <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-4 py-2.5 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 flex-1">
            UV Index {uvIndex} - Apply SPF 50+
          </p>
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold">Skincare</h3>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
            {skinTypeLabels[profile.skin_type as string] || profile.skin_type}
          </span>
        </div>

        {/* Routines */}
        {hasRoutines ? (
          <div className="space-y-3">
            {amRoutine && (
              <RoutineSummary 
                type="am" 
                routine={amRoutine} 
              />
            )}
            {pmRoutine && (
              <RoutineSummary 
                type="pm" 
                routine={pmRoutine} 
              />
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Generate your personalized routine
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                size="sm"
                onClick={() => {
                  generateRoutine.mutate(
                    { routineType: 'am' },
                    {
                      onSuccess: () => toast.success("AM routine generated!"),
                      onError: (error) => toast.error(error.message),
                    }
                  )
                }}
                disabled={generateRoutine.isPending}
                className="rounded-full gap-1.5"
              >
                {generateRoutine.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Sun size={14} />
                )}
                AM Routine
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  generateRoutine.mutate(
                    { routineType: 'pm' },
                    {
                      onSuccess: () => toast.success("PM routine generated!"),
                      onError: (error) => toast.error(error.message),
                    }
                  )
                }}
                disabled={generateRoutine.isPending}
                className="rounded-full gap-1.5"
              >
                {generateRoutine.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Moon size={14} />
                )}
                PM Routine
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Compact routine summary row
function RoutineSummary({ type, routine }: { type: 'am' | 'pm'; routine: Record<string, unknown> }) {
  const routineData = routine.routine_data as Record<string, unknown> | undefined
  const products = (routineData?.products as Array<Record<string, unknown>>) || []
  const stepCount = products.length

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
    >
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center",
        type === 'am' ? "bg-amber-500/10" : "bg-indigo-500/10"
      )}>
        {type === 'am' ? (
          <Sun className="w-4 h-4 text-amber-500" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-500" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {type === 'am' ? 'Morning' : 'Evening'} Routine
        </p>
        <p className="text-xs text-muted-foreground">
          {stepCount} {stepCount === 1 ? 'step' : 'steps'}
        </p>
      </div>

      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </motion.div>
  )
}

