"use client"

import { motion } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { OnboardingData } from "../onboarding-form"

interface NameStepProps {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
}

export function NameStep({ data, updateData }: NameStepProps) {
  const { t } = useLanguage()

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="saydo-headline text-2xl sm:text-3xl mb-3">
          {t.steps.name.title}
        </h2>
        <p className="text-muted-foreground text-lg">
          {t.steps.name.question}
        </p>
      </div>

      <div className="space-y-4">
        <Label htmlFor="preferredName" className="text-base">
          {t.steps.name.question}
        </Label>
        <Input
          id="preferredName"
          type="text"
          value={data.preferredName}
          onChange={(e) => updateData({ preferredName: e.target.value })}
          placeholder={t.steps.name.placeholder}
          className="h-12 text-lg rounded-xl"
          autoFocus
        />
      </div>
    </motion.div>
  )
}




