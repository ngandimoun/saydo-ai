"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, ArrowLeft } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { createClient } from "@/lib/supabase"
import { LanguageStep } from "./steps/language-step"
import { NameStep } from "./steps/name-step"
import { ProfessionStep } from "./steps/profession-step"
import { InformationDietStep } from "./steps/information-diet-step"
import { EssentialsStep } from "./steps/essentials-step"
import { HealthStep } from "./steps/health-step"

export interface OnboardingData {
  language: string
  preferredName: string
  profession: {
    id: string
    name: string
    isCustom: boolean
    description?: string
  } | null
  criticalArtifacts: Array<{
    id: string
    name: string
    isCustom: boolean
    description?: string
  }>
  socialIntelligence: string[]
  newsFocus: string[]
  gender: string
  age: number | null
  bloodGroup: string
  bodyType: string
  weight: number | null
  allergies: string[]
  skinTone: string
  healthInterests: string[]
}

const TOTAL_STEPS = 6

export function OnboardingForm() {
  const { t } = useLanguage()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [formData, setFormData] = useState<OnboardingData>({
    language: 'en',
    preferredName: '',
    profession: null,
    criticalArtifacts: [],
    socialIntelligence: [],
    newsFocus: [],
    gender: '',
    age: null,
    bloodGroup: '',
    bodyType: '',
    weight: null,
    allergies: [],
    skinTone: '',
    healthInterests: []
  })

  const updateFormData = (updates: Partial<OnboardingData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error("You must be logged in to complete onboarding")
      }

      // Save to profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          preferred_name: formData.preferredName,
          language: formData.language,
          profession: formData.profession?.name || null,
          profession_id: formData.profession?.id || null,
          gender: formData.gender || null,
          age: formData.age || null,
          blood_group: formData.bloodGroup || null,
          body_type: formData.bodyType || null,
          weight: formData.weight || null,
          skin_tone: formData.skinTone || null,
        })

      if (profileError) {
        throw new Error(`Failed to save profile: ${profileError.message}`)
      }

      // Save arrays to separate tables (delete existing first to handle updates)
      if (formData.allergies.length > 0) {
        // Delete existing allergies
        await supabase
          .from('user_allergies')
          .delete()
          .eq('user_id', user.id)

        // Insert new allergies
        const { error: allergiesError } = await supabase
          .from('user_allergies')
          .insert(
            formData.allergies.map(a => ({ user_id: user.id, allergy: a }))
          )

        if (allergiesError) {
          throw new Error(`Failed to save allergies: ${allergiesError.message}`)
        }
      }

      if (formData.healthInterests.length > 0) {
        // Delete existing health interests
        await supabase
          .from('user_health_interests')
          .delete()
          .eq('user_id', user.id)

        // Insert new health interests
        const { error: healthInterestsError } = await supabase
          .from('user_health_interests')
          .insert(
            formData.healthInterests.map(h => ({ user_id: user.id, interest: h }))
          )

        if (healthInterestsError) {
          throw new Error(`Failed to save health interests: ${healthInterestsError.message}`)
        }
      }

      if (formData.criticalArtifacts.length > 0) {
        // Delete existing critical artifacts
        await supabase
          .from('user_critical_artifacts')
          .delete()
          .eq('user_id', user.id)

        // Insert new critical artifacts
        const { error: artifactsError } = await supabase
          .from('user_critical_artifacts')
          .insert(
            formData.criticalArtifacts.map(a => ({
              user_id: user.id,
              artifact_id: a.id,
              artifact_name: a.name,
              is_custom: a.isCustom,
              description: a.description || null,
            }))
          )

        if (artifactsError) {
          throw new Error(`Failed to save critical artifacts: ${artifactsError.message}`)
        }
      }

      if (formData.socialIntelligence.length > 0) {
        // Delete existing social intelligence
        await supabase
          .from('user_social_intelligence')
          .delete()
          .eq('user_id', user.id)

        // Insert new social intelligence
        const { error: socialError } = await supabase
          .from('user_social_intelligence')
          .insert(
            formData.socialIntelligence.map(s => ({ user_id: user.id, source_id: s }))
          )

        if (socialError) {
          throw new Error(`Failed to save social intelligence: ${socialError.message}`)
        }
      }

      if (formData.newsFocus.length > 0) {
        // Delete existing news focus
        await supabase
          .from('user_news_focus')
          .delete()
          .eq('user_id', user.id)

        // Insert new news focus
        const { error: newsError } = await supabase
          .from('user_news_focus')
          .insert(
            formData.newsFocus.map(n => ({ user_id: user.id, vertical_id: n }))
          )

        if (newsError) {
          throw new Error(`Failed to save news focus: ${newsError.message}`)
        }
      }

      // Initialize Mastra memory with onboarding data
      // This ensures all onboarding details are available to agents via memory
      try {
        const memoryResponse = await fetch('/api/onboarding/initialize-memory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!memoryResponse.ok) {
          console.warn('Failed to initialize memory, but continuing:', await memoryResponse.text())
          // Don't throw - memory can be initialized later if needed
        } else {
          const memoryData = await memoryResponse.json()
          console.log('Memory initialized successfully:', memoryData)
        }
      } catch (memoryError) {
        console.warn('Error initializing memory, but continuing:', memoryError)
        // Don't throw - memory can be initialized later if needed
      }

      // Navigate to dashboard on success
      router.push('/dashboard')
    } catch (error) {
      console.error('Onboarding submission error:', error)
      setSubmitError(error instanceof Error ? error.message : 'Failed to save onboarding data. Please try again.')
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!formData.language
      case 2:
        return !!formData.preferredName.trim()
      case 3:
        return !!formData.profession && formData.criticalArtifacts.length > 0
      case 4:
        return formData.socialIntelligence.length > 0 || formData.newsFocus.length > 0
      case 5:
        return true // Optional step
      case 6:
        return formData.healthInterests.length > 0
      default:
        return false
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            {t.onboarding.step} {currentStep} {t.onboarding.of} {TOTAL_STEPS}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`
                  h-2 rounded-full transition-all duration-300
                  ${i + 1 <= currentStep ? 'bg-primary w-8' : 'bg-border w-2'}
                `}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="saydo-card p-8 sm:p-10 min-h-[500px]">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <LanguageStep
              key="language"
              data={formData}
              updateData={updateFormData}
            />
          )}
          {currentStep === 2 && (
            <NameStep
              key="name"
              data={formData}
              updateData={updateFormData}
            />
          )}
          {currentStep === 3 && (
            <ProfessionStep
              key="profession"
              data={formData}
              updateData={updateFormData}
            />
          )}
          {currentStep === 4 && (
            <InformationDietStep
              key="information-diet"
              data={formData}
              updateData={updateFormData}
            />
          )}
          {currentStep === 5 && (
            <EssentialsStep
              key="essentials"
              data={formData}
              updateData={updateFormData}
            />
          )}
          {currentStep === 6 && (
            <HealthStep
              key="health"
              data={formData}
              updateData={updateFormData}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="rounded-full"
        >
          <ArrowLeft size={16} className="mr-2" />
          {t.onboarding.back}
        </Button>

        {currentStep < TOTAL_STEPS ? (
          <Button
            onClick={nextStep}
            disabled={!canProceed()}
            className="rounded-full bg-primary hover:bg-primary/90"
          >
            {t.onboarding.next}
            <ArrowRight size={16} className="ml-2" />
          </Button>
        ) : (
          <div className="flex flex-col items-end gap-2">
            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="rounded-full bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? t.onboarding.saving || 'Saving...' : t.onboarding.finish}
              {!isSubmitting && <ArrowRight size={16} className="ml-2" />}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

