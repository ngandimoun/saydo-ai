"use client"

import { motion } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { SelectionCard } from "../selection-card"
import { healthInterests } from "@/lib/onboarding-data"
import { Heart, Activity, Brain, Apple, Dumbbell, Moon, Zap, Shield } from "lucide-react"
import type { OnboardingData } from "../onboarding-form"

interface HealthStepProps {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
}

const healthIcons: Record<string, React.ReactNode> = {
  biohacking: <Zap className="w-5 h-5" />,
  longevity: <Heart className="w-5 h-5" />,
  gutHealth: <Apple className="w-5 h-5" />,
  fitness: <Dumbbell className="w-5 h-5" />,
  nutrition: <Apple className="w-5 h-5" />,
  mentalHealth: <Brain className="w-5 h-5" />,
  sleep: <Moon className="w-5 h-5" />,
  hormones: <Activity className="w-5 h-5" />,
  recovery: <Heart className="w-5 h-5" />,
  preventive: <Shield className="w-5 h-5" />
}

export function HealthStep({ data, updateData }: HealthStepProps) {
  const { t } = useLanguage()

  const handleToggle = (id: string) => {
    const isSelected = data.healthInterests.includes(id)
    updateData({
      healthInterests: isSelected
        ? data.healthInterests.filter(h => h !== id)
        : [...data.healthInterests, id]
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div className="text-center mb-8">
        <h2 className="saydo-headline text-2xl sm:text-3xl mb-3">
          {t.steps.health.title}
        </h2>
        <p className="text-muted-foreground text-lg">
          {t.steps.health.question}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {healthInterests.map((interest) => (
          <SelectionCard
            key={interest.id}
            id={interest.id}
            name={interest.name}
            selected={data.healthInterests.includes(interest.id)}
            onSelect={handleToggle}
            multiSelect
            icon={healthIcons[interest.id]}
            color="bg-primary/10"
          />
        ))}
      </div>
    </motion.div>
  )
}



