"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { ProfessionCard } from "../profession-card"
import { SelectionCard } from "../selection-card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, ArrowLeft } from "lucide-react"
import { professions, getProfessionById } from "@/lib/onboarding-data"
import type { OnboardingData } from "../onboarding-form"

interface ProfessionStepProps {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
}

export function ProfessionStep({ data, updateData }: ProfessionStepProps) {
  const { t } = useLanguage()
  const [showCustomProfession, setShowCustomProfession] = useState(false)
  const [showCustomArtifact, setShowCustomArtifact] = useState(false)
  const [customProfessionName, setCustomProfessionName] = useState("")
  const [customProfessionDesc, setCustomProfessionDesc] = useState("")
  const [customArtifactName, setCustomArtifactName] = useState("")
  const [customArtifactDesc, setCustomArtifactDesc] = useState("")

  const selectedProfession = data.profession
  const professionData = selectedProfession ? getProfessionById(selectedProfession.id) : null
  const availableArtifacts = professionData?.criticalArtifacts || []

  const handleProfessionSelect = (professionId: string) => {
    const profession = getProfessionById(professionId)
    if (profession) {
      updateData({
        profession: {
          id: profession.id,
          name: profession.name,
          isCustom: false
        },
        criticalArtifacts: []
      })
    }
  }

  const handleArtifactToggle = (artifactName: string) => {
    const existing = data.criticalArtifacts.find(a => a.name === artifactName)
    if (existing) {
      updateData({
        criticalArtifacts: data.criticalArtifacts.filter(a => a.name !== artifactName)
      })
    } else {
      updateData({
        criticalArtifacts: [...data.criticalArtifacts, {
          id: artifactName.toLowerCase().replace(/\s+/g, '-'),
          name: artifactName,
          isCustom: false
        }]
      })
    }
  }

  const handleCustomProfession = () => {
    if (customProfessionName.trim()) {
      updateData({
        profession: {
          id: `custom-${customProfessionName.toLowerCase().replace(/\s+/g, '-')}`,
          name: customProfessionName,
          isCustom: true,
          description: customProfessionDesc
        },
        criticalArtifacts: []
      })
      setCustomProfessionName("")
      setCustomProfessionDesc("")
      setShowCustomProfession(false)
    }
  }

  const handleCustomArtifact = () => {
    if (customArtifactName.trim()) {
      updateData({
        criticalArtifacts: [...data.criticalArtifacts, {
          id: `custom-${customArtifactName.toLowerCase().replace(/\s+/g, '-')}`,
          name: customArtifactName,
          isCustom: true,
          description: customArtifactDesc
        }]
      })
      setCustomArtifactName("")
      setCustomArtifactDesc("")
      setShowCustomArtifact(false)
    }
  }

  const professionName = selectedProfession?.name || ''
  const questionText = selectedProfession && professionName
    ? t.steps.profession.criticalArtifacts.replace('{profession}', professionName)
    : t.steps.profession.question

  const titleText = selectedProfession && professionName
    ? t.steps.profession.criticalArtifacts.replace('{profession}', professionName)
    : t.steps.profession.title

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
          {selectedProfession ? titleText : t.steps.profession.title}
        </h2>
        <p className="text-muted-foreground text-lg">
          {questionText}
        </p>
      </div>

      {!selectedProfession ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
            {professions.map((prof) => (
              <ProfessionCard
                key={prof.id}
                id={prof.id}
                name={prof.name}
                selected={data.profession?.id === prof.id}
                onSelect={handleProfessionSelect}
                color={prof.color}
              />
            ))}
          </div>

          <Dialog open={showCustomProfession} onOpenChange={setShowCustomProfession}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full rounded-xl">
                <Plus size={16} className="mr-2" />
                {t.steps.profession.manualEntry}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t.steps.profession.customProfession}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{t.steps.profession.customProfessionDesc}</Label>
                  <Input
                    value={customProfessionName}
                    onChange={(e) => setCustomProfessionName(e.target.value)}
                    placeholder={t.steps.profession.customProfessionDesc}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Description (Optional)</Label>
                  <Textarea
                    value={customProfessionDesc}
                    onChange={(e) => setCustomProfessionDesc(e.target.value)}
                    placeholder="Brief description of your profession"
                    className="mt-2"
                  />
                </div>
                <Button onClick={handleCustomProfession} className="w-full">
                  {t.onboarding.continue}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {t.steps.profession.criticalArtifacts.replace('{profession}', professionName)}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateData({ profession: null, criticalArtifacts: [] })}
                className="text-xs"
              >
                Change Profession
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {availableArtifacts.map((artifact) => {
                const isSelected = data.criticalArtifacts.some(a => a.name === artifact)
                return (
                  <SelectionCard
                    key={artifact}
                    id={artifact.toLowerCase().replace(/\s+/g, '-')}
                    name={artifact}
                    selected={isSelected}
                    onSelect={() => handleArtifactToggle(artifact)}
                    multiSelect
                  />
                )
              })}
            </div>
          </div>

          <Dialog open={showCustomArtifact} onOpenChange={setShowCustomArtifact}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full rounded-xl">
                <Plus size={16} className="mr-2" />
                {t.steps.profession.addCustom}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t.steps.profession.customArtifact}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>{t.steps.profession.customArtifactDesc}</Label>
                  <Input
                    value={customArtifactName}
                    onChange={(e) => setCustomArtifactName(e.target.value)}
                    placeholder={t.steps.profession.customArtifactDesc}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Description (Optional)</Label>
                  <Textarea
                    value={customArtifactDesc}
                    onChange={(e) => setCustomArtifactDesc(e.target.value)}
                    placeholder="Brief description of this artifact"
                    className="mt-2"
                  />
                </div>
                <Button onClick={handleCustomArtifact} className="w-full">
                  {t.onboarding.continue}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </motion.div>
  )
}

