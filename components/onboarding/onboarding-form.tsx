"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, ArrowLeft } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
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
  const [currentStep, setCurrentStep] = useState(1)
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
    /**
     * TODO (Backend Integration):
     * Save onboarding data to Supabase:
     * 
     * const { data: user } = await supabase.auth.getUser()
     * 
     * await supabase.from('profiles').upsert({
     *   id: user.id,
     *   preferred_name: formData.preferredName,
     *   language: formData.language,
     *   profession: formData.profession?.name,
     *   profession_id: formData.profession?.id,
     *   gender: formData.gender,
     *   age: formData.age,
     *   blood_group: formData.bloodGroup,
     *   body_type: formData.bodyType,
     *   weight: formData.weight,
     *   skin_tone: formData.skinTone
     * })
     * 
     * // Save arrays to separate tables
     * await supabase.from('user_allergies').insert(
     *   formData.allergies.map(a => ({ user_id: user.id, allergy: a }))
     * )
     * 
     * await supabase.from('user_health_interests').insert(
     *   formData.healthInterests.map(h => ({ user_id: user.id, interest: h }))
     * )
     */
    
    // For now, save to localStorage for UI demo
    localStorage.setItem('saydo_user_profile', JSON.stringify({
      preferredName: formData.preferredName,
      language: formData.language,
      profession: formData.profession?.name || 'Professional',
      createdAt: new Date().toISOString()
    }))
    
    console.log('Onboarding data:', formData)
    
    // Navigate to dashboard
    window.location.href = '/dashboard'
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
          <Button
            onClick={handleSubmit}
            disabled={!canProceed()}
            className="rounded-full bg-primary hover:bg-primary/90"
          >
            {t.onboarding.finish}
            <ArrowRight size={16} className="ml-2" />
          </Button>
        )}
      </div>
    </div>
  )
}

