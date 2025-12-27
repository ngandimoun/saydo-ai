"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { SelectionCard } from "../selection-card"
import { BodyTypeCard } from "../body-type-card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { commonAllergies, bodyTypes, bloodGroups, skinTones, type SkinTone } from "@/lib/onboarding-data"
import type { OnboardingData } from "../onboarding-form"

interface EssentialsStepProps {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
}

export function EssentialsStep({ data, updateData }: EssentialsStepProps) {
  const { t } = useLanguage()
  const [showCustomAllergy, setShowCustomAllergy] = useState(false)
  const [customAllergy, setCustomAllergy] = useState("")

  const handleAllergyToggle = (allergy: string) => {
    const isSelected = data.allergies.includes(allergy)
    updateData({
      allergies: isSelected
        ? data.allergies.filter(a => a !== allergy)
        : [...data.allergies, allergy]
    })
  }

  const handleCustomAllergy = () => {
    if (customAllergy.trim()) {
      updateData({
        allergies: [...data.allergies, customAllergy.trim()]
      })
      setCustomAllergy("")
      setShowCustomAllergy(false)
    }
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
          {t.steps.essentials.title}
        </h2>
        <p className="text-muted-foreground text-sm">
          Optional but critical for personalized recommendations
        </p>
      </div>

      {/* Gender */}
      <div>
        <Label className="text-base mb-4 block">{t.steps.essentials.gender.question}</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SelectionCard
            id="male"
            name={t.steps.essentials.gender.male}
            selected={data.gender === 'male'}
            onSelect={(id) => updateData({ gender: id })}
          />
          <SelectionCard
            id="female"
            name={t.steps.essentials.gender.female}
            selected={data.gender === 'female'}
            onSelect={(id) => updateData({ gender: id })}
          />
          <SelectionCard
            id="nonBinary"
            name={t.steps.essentials.gender.nonBinary}
            selected={data.gender === 'nonBinary'}
            onSelect={(id) => updateData({ gender: id })}
          />
          <SelectionCard
            id="preferNotToSay"
            name={t.steps.essentials.gender.preferNotToSay}
            selected={data.gender === 'preferNotToSay'}
            onSelect={(id) => updateData({ gender: id })}
          />
        </div>
      </div>

      {/* Age */}
      <div>
        <Label htmlFor="age" className="text-base mb-2 block">
          {t.steps.essentials.age.question}
        </Label>
        <Input
          id="age"
          type="number"
          value={data.age || ''}
          onChange={(e) => updateData({ age: e.target.value ? parseInt(e.target.value) : null })}
          placeholder={t.steps.essentials.age.placeholder}
          className="max-w-xs"
        />
      </div>

      {/* Blood Group */}
      <div>
        <Label className="text-base mb-2 block">{t.steps.essentials.bloodGroup.question}</Label>
        <Select value={data.bloodGroup} onValueChange={(value) => updateData({ bloodGroup: value })}>
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="Select blood group" />
          </SelectTrigger>
          <SelectContent>
            {bloodGroups.map((group) => (
              <SelectItem key={group} value={group}>
                {group}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Body Type & Weight */}
      <div>
        <Label className="text-base mb-4 block">{t.steps.essentials.bodyType.question}</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-4">
          {bodyTypes.map((type) => (
            <BodyTypeCard
              key={type.id}
              id={type.id}
              name={type.name}
              description={type.description}
              selected={data.bodyType === type.id}
              onSelect={(id) => updateData({ bodyType: id })}
            />
          ))}
        </div>
        <div className="max-w-xs">
          <Label htmlFor="weight" className="text-base mb-2 block">
            {t.steps.essentials.bodyType.weight}
          </Label>
          <Input
            id="weight"
            type="number"
            value={data.weight || ''}
            onChange={(e) => updateData({ weight: e.target.value ? parseFloat(e.target.value) : null })}
            placeholder="Enter weight in kg"
            className="max-w-xs"
          />
        </div>
      </div>

      {/* Allergies */}
      <div>
        <Label className="text-base mb-4 block">{t.steps.essentials.allergies.question}</Label>
        <div className="flex flex-wrap gap-2 mb-4">
          {commonAllergies.map((allergy) => {
            const isSelected = data.allergies.includes(allergy)
            return (
              <motion.button
                key={allergy}
                type="button"
                onClick={() => handleAllergyToggle(allergy)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-all
                  ${isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }
                `}
              >
                {allergy}
              </motion.button>
            )
          })}
        </div>
        <Dialog open={showCustomAllergy} onOpenChange={setShowCustomAllergy}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus size={16} className="mr-2" />
              {t.steps.essentials.allergies.addCustom}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.steps.essentials.allergies.addCustom}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Allergy Name</Label>
                <Input
                  value={customAllergy}
                  onChange={(e) => setCustomAllergy(e.target.value)}
                  placeholder="Enter allergy name"
                  className="mt-2"
                />
              </div>
              <Button onClick={handleCustomAllergy} className="w-full">
                {t.onboarding.continue}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Skin Tone */}
      <div>
        <Label className="text-base mb-4 block">{t.steps.essentials.skinTone.question}</Label>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-3">
          {skinTones.map((tone) => (
            <motion.button
              key={tone.id}
              type="button"
              onClick={() => updateData({ skinTone: tone.id })}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "relative p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 min-h-[100px]",
                data.skinTone === tone.id
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              {data.skinTone === tone.id && (
                <motion.div
                  layoutId="skinToneSelected"
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <svg
                    className="w-3 h-3 text-primary-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </motion.div>
              )}
              <div
                className="w-12 h-12 rounded-full border-2 border-border shadow-sm"
                style={{ backgroundColor: tone.color }}
              />
              <span className="text-xs font-medium text-center">{tone.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

