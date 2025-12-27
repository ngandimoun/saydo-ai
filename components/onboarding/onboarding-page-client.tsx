"use client"

import { motion } from "framer-motion"
import { LanguageProvider } from "@/lib/language-context"
import { OnboardingForm } from "@/components/onboarding/onboarding-form"

export function OnboardingPageClient() {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <OnboardingForm />
        </motion.div>
      </div>
    </LanguageProvider>
  )
}

