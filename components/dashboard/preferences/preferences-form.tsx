"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, ArrowLeft, Check } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { createClient } from "@/lib/supabase"
import { LanguageStep } from "@/components/onboarding/steps/language-step"
import { NameStep } from "@/components/onboarding/steps/name-step"
import { ProfessionStep } from "@/components/onboarding/steps/profession-step"
import { InformationDietStep } from "@/components/onboarding/steps/information-diet-step"
import { EssentialsStep } from "@/components/onboarding/steps/essentials-step"
import { HealthStep } from "@/components/onboarding/steps/health-step"
import type { OnboardingData } from "@/components/onboarding/onboarding-form"

const TOTAL_STEPS = 6

interface PreferencesFormProps {
  initialData: OnboardingData
}

export function PreferencesForm({ initialData }: PreferencesFormProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [formData, setFormData] = useState<OnboardingData>(initialData)

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
    setSubmitSuccess(false)

    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error("You must be logged in to save preferences")
      }

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
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
        .eq('id', user.id)

      if (profileError) {
        throw new Error(`Failed to save profile: ${profileError.message}`)
      }

      // Delete and re-insert related data (handles both updates and deletions)
      
      // Allergies
      await supabase
        .from('user_allergies')
        .delete()
        .eq('user_id', user.id)
      
      if (formData.allergies.length > 0) {
        const { error: allergiesError } = await supabase
          .from('user_allergies')
          .insert(
            formData.allergies.map(a => ({ user_id: user.id, allergy: a }))
          )

        if (allergiesError) {
          throw new Error(`Failed to save allergies: ${allergiesError.message}`)
        }
      }

      // Health interests
      await supabase
        .from('user_health_interests')
        .delete()
        .eq('user_id', user.id)
      
      if (formData.healthInterests.length > 0) {
        const { error: healthInterestsError } = await supabase
          .from('user_health_interests')
          .insert(
            formData.healthInterests.map(h => ({ user_id: user.id, interest: h }))
          )

        if (healthInterestsError) {
          throw new Error(`Failed to save health interests: ${healthInterestsError.message}`)
        }
      }

      // Critical artifacts
      await supabase
        .from('user_critical_artifacts')
        .delete()
        .eq('user_id', user.id)
      
      if (formData.criticalArtifacts.length > 0) {
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

      // Social intelligence
      await supabase
        .from('user_social_intelligence')
        .delete()
        .eq('user_id', user.id)
      
      if (formData.socialIntelligence.length > 0) {
        const { error: socialError } = await supabase
          .from('user_social_intelligence')
          .insert(
            formData.socialIntelligence.map(s => ({ user_id: user.id, source_id: s }))
          )

        if (socialError) {
          throw new Error(`Failed to save social intelligence: ${socialError.message}`)
        }
      }

      // News focus
      await supabase
        .from('user_news_focus')
        .delete()
        .eq('user_id', user.id)
      
      if (formData.newsFocus.length > 0) {
        const { error: newsError } = await supabase
          .from('user_news_focus')
          .insert(
            formData.newsFocus.map(n => ({ user_id: user.id, vertical_id: n }))
          )

        if (newsError) {
          throw new Error(`Failed to save news focus: ${newsError.message}`)
        }
      }

      // Show success message
      setSubmitSuccess(true)
      setIsSubmitting(false)
      
      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (error) {
      console.error('Preferences save error:', error)
      setSubmitError(error instanceof Error ? error.message : 'Failed to save preferences. Please try again.')
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
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="saydo-headline text-3xl sm:text-4xl mb-2">Preferences</h1>
        <p className="text-muted-foreground">Update your profile and settings</p>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Step {currentStep} of {TOTAL_STEPS}
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
          Back
        </Button>

        {currentStep < TOTAL_STEPS ? (
          <Button
            onClick={nextStep}
            disabled={!canProceed()}
            className="rounded-full bg-primary hover:bg-primary/90"
          >
            Next
            <ArrowRight size={16} className="ml-2" />
          </Button>
        ) : (
          <div className="flex flex-col items-end gap-2">
            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}
            {submitSuccess && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2"
              >
                <Check size={16} />
                Preferences saved successfully!
              </motion.p>
            )}
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting || submitSuccess}
              className="rounded-full bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? 'Saving...' : submitSuccess ? 'Saved!' : 'Save Changes'}
              {!isSubmitting && !submitSuccess && <ArrowRight size={16} className="ml-2" />}
              {submitSuccess && <Check size={16} className="ml-2" />}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

