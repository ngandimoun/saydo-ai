"use client"

import { motion } from "framer-motion"
import { Edit2, Sparkles, Droplet, Sun, Shield, Heart } from "lucide-react"
import { useSkincareProfile, useUpdateSkincareProfile } from "@/hooks/queries/use-skincare"
import { cn } from "@/lib/utils"
import { springs } from "@/lib/motion-system"
import { Button } from "@/components/ui/button"
import { useState } from "react"

/**
 * Skincare Profile Component
 * 
 * Displays and allows editing of user's skincare profile:
 * - Skin type
 * - Skin conditions
 * - Skin goals
 * - Skin concerns
 */

interface SkincareProfileProps {
  className?: string
}

const skinTypeLabels: Record<string, string> = {
  oily: "Oily",
  dry: "Dry",
  combination: "Combination",
  sensitive: "Sensitive",
  normal: "Normal",
}

const goalIcons: Record<string, React.ReactNode> = {
  anti_aging: <Heart className="w-4 h-4" />,
  hydration: <Droplet className="w-4 h-4" />,
  brightening: <Sparkles className="w-4 h-4" />,
  acne_control: <Shield className="w-4 h-4" />,
  evening_tone: <Sun className="w-4 h-4" />,
}

export function SkincareProfile({ className }: SkincareProfileProps) {
  const { data: profile, isLoading } = useSkincareProfile()
  const updateProfile = useUpdateSkincareProfile()
  const [isEditing, setIsEditing] = useState(false)

  if (isLoading) {
    return (
      <div className={cn("saydo-card p-4", className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-20 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn("saydo-card p-6 text-center", className)}
      >
        <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-4">
          Complete your skincare profile to get personalized recommendations
        </p>
        <Button onClick={() => setIsEditing(true)} className="rounded-full">
          Set Up Profile
        </Button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("saydo-card p-4", className)}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Skincare Profile</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
          className="rounded-full"
        >
          <Edit2 size={14} />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Skin Type */}
        {profile.skin_type && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Skin Type</p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              {skinTypeLabels[profile.skin_type] || profile.skin_type}
            </div>
          </div>
        )}

        {/* Skin Conditions */}
        {profile.skin_conditions && profile.skin_conditions.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Conditions</p>
            <div className="flex flex-wrap gap-2">
              {profile.skin_conditions.map((condition) => (
                <span
                  key={condition}
                  className="px-2.5 py-1 rounded-full bg-muted text-xs"
                >
                  {condition}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Skin Goals */}
        {profile.skin_goals && profile.skin_goals.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Goals</p>
            <div className="flex flex-wrap gap-2">
              {profile.skin_goals.map((goal) => (
                <div
                  key={goal}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs"
                >
                  {goalIcons[goal]}
                  <span>{goal.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skin Concerns */}
        {profile.skin_concerns && (
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Concerns</p>
            <p className="text-sm">{profile.skin_concerns}</p>
          </div>
        )}
      </div>
    </motion.div>
  )
}


