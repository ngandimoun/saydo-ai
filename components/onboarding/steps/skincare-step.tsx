"use client"

import { motion } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { SelectionCard } from "../selection-card"
import { Sparkles, Droplet, Sun, Shield, Heart } from "lucide-react"
import type { OnboardingData } from "../onboarding-form"

interface SkincareStepProps {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
}

const skinTypes = [
  { id: "oily", name: "Oily" },
  { id: "dry", name: "Dry" },
  { id: "combination", name: "Combination" },
  { id: "sensitive", name: "Sensitive" },
  { id: "normal", name: "Normal" },
]

const skinConditions = [
  { id: "acne", name: "Acne" },
  { id: "rosacea", name: "Rosacea" },
  { id: "eczema", name: "Eczema" },
  { id: "hyperpigmentation", name: "Hyperpigmentation" },
  { id: "fine_lines", name: "Fine Lines" },
  { id: "dark_spots", name: "Dark Spots" },
]

const skinGoals = [
  { id: "anti_aging", name: "Anti-Aging", icon: <Heart className="w-5 h-5" /> },
  { id: "hydration", name: "Hydration", icon: <Droplet className="w-5 h-5" /> },
  { id: "brightening", name: "Brightening", icon: <Sparkles className="w-5 h-5" /> },
  { id: "acne_control", name: "Acne Control", icon: <Shield className="w-5 h-5" /> },
  { id: "evening_tone", name: "Evening Tone", icon: <Sun className="w-5 h-5" /> },
]

export function SkincareStep({ data, updateData }: SkincareStepProps) {
  const { t } = useLanguage()

  const handleSkinTypeChange = (type: string) => {
    updateData({ skinType: type })
  }

  const handleConditionToggle = (id: string) => {
    const isSelected = (data.skinConditions || []).includes(id)
    updateData({
      skinConditions: isSelected
        ? (data.skinConditions || []).filter(c => c !== id)
        : [...(data.skinConditions || []), id]
    })
  }

  const handleGoalToggle = (id: string) => {
    const isSelected = (data.skinGoals || []).includes(id)
    updateData({
      skinGoals: isSelected
        ? (data.skinGoals || []).filter(g => g !== id)
        : [...(data.skinGoals || []), id]
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full space-y-8"
    >
      <div className="text-center mb-8">
        <h2 className="saydo-headline text-2xl sm:text-3xl mb-3">
          Skincare Profile
        </h2>
        <p className="text-muted-foreground text-lg">
          Help us personalize your skincare recommendations
        </p>
      </div>

      {/* Skin Type */}
      <div>
        <h3 className="text-lg font-semibold mb-4">What's your skin type?</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {skinTypes.map((type) => (
            <SelectionCard
              key={type.id}
              id={type.id}
              name={type.name}
              selected={data.skinType === type.id}
              onSelect={handleSkinTypeChange}
              multiSelect={false}
            />
          ))}
        </div>
      </div>

      {/* Skin Conditions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Do you have any skin conditions? (Optional)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {skinConditions.map((condition) => (
            <SelectionCard
              key={condition.id}
              id={condition.id}
              name={condition.name}
              selected={(data.skinConditions || []).includes(condition.id)}
              onSelect={handleConditionToggle}
              multiSelect
            />
          ))}
        </div>
      </div>

      {/* Skin Goals */}
      <div>
        <h3 className="text-lg font-semibold mb-4">What are your skincare goals? (Optional)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {skinGoals.map((goal) => (
            <SelectionCard
              key={goal.id}
              id={goal.id}
              name={goal.name}
              selected={(data.skinGoals || []).includes(goal.id)}
              onSelect={handleGoalToggle}
              multiSelect
              icon={goal.icon}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}



