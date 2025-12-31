"use client"

import { motion } from "framer-motion"
import { LanguageProvider } from "@/lib/language-context"
import { PreferencesForm } from "./preferences-form"
import type { OnboardingData } from "@/components/onboarding/onboarding-form"

interface PreferencesPageClientProps {
  initialData: OnboardingData
}

export function PreferencesPageClient({ initialData }: PreferencesPageClientProps) {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl"
        >
          <PreferencesForm initialData={initialData} />
        </motion.div>
      </div>
    </LanguageProvider>
  )
}




