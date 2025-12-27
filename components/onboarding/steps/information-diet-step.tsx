"use client"

import { motion } from "framer-motion"
import { useLanguage } from "@/lib/language-context"
import { SelectionCard } from "../selection-card"
import { Badge } from "@/components/ui/badge"
import { socialIntelligenceSources, newsVerticals } from "@/lib/onboarding-data"
import { Twitter, MessageSquare, Newspaper, BookOpen, Linkedin, Youtube, Radio, FileText, DollarSign, Zap, Coins, Globe, Heart, Leaf, Cpu, Rocket, Dna, Battery, Building2, GraduationCap, Trophy, Film, Shirt, UtensilsCrossed, Plane, Car, Gamepad2, Share2, ShoppingCart, Cloud, Stethoscope, BookOpen as BookIcon, Store, Truck, Wheat, Factory, Phone, Newspaper as NewsIcon } from "lucide-react"
import type { OnboardingData } from "../onboarding-form"

interface InformationDietStepProps {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
}

const sourceIcons: Record<string, React.ReactNode> = {
  twitter: <Twitter className="w-5 h-5" />,
  reddit: <MessageSquare className="w-5 h-5" />,
  hackernews: <Newspaper className="w-5 h-5" />,
  substack: <BookOpen className="w-5 h-5" />,
  linkedin: <Linkedin className="w-5 h-5" />,
  medium: <FileText className="w-5 h-5" />,
  youtube: <Youtube className="w-5 h-5" />,
  podcasts: <Radio className="w-5 h-5" />
}

const verticalIcons: Record<string, React.ReactNode> = {
  fintech: <DollarSign className="w-5 h-5" />,
  ai: <Zap className="w-5 h-5" />,
  crypto: <Coins className="w-5 h-5" />,
  geopolitics: <Globe className="w-5 h-5" />,
  health: <Heart className="w-5 h-5" />,
  climate: <Leaf className="w-5 h-5" />,
  tech: <Cpu className="w-5 h-5" />,
  startups: <Rocket className="w-5 h-5" />,
  biotech: <Dna className="w-5 h-5" />,
  energy: <Battery className="w-5 h-5" />,
  realEstate: <Building2 className="w-5 h-5" />,
  education: <GraduationCap className="w-5 h-5" />,
  sports: <Trophy className="w-5 h-5" />,
  entertainment: <Film className="w-5 h-5" />,
  fashion: <Shirt className="w-5 h-5" />,
  food: <UtensilsCrossed className="w-5 h-5" />,
  travel: <Plane className="w-5 h-5" />,
  automotive: <Car className="w-5 h-5" />,
  gaming: <Gamepad2 className="w-5 h-5" />,
  socialMedia: <Share2 className="w-5 h-5" />,
  ecommerce: <ShoppingCart className="w-5 h-5" />,
  saas: <Cloud className="w-5 h-5" />,
  healthcareTech: <Stethoscope className="w-5 h-5" />,
  edtech: <BookIcon className="w-5 h-5" />,
  retail: <Store className="w-5 h-5" />,
  logistics: <Truck className="w-5 h-5" />,
  agriculture: <Wheat className="w-5 h-5" />,
  manufacturing: <Factory className="w-5 h-5" />,
  telecom: <Phone className="w-5 h-5" />,
  media: <NewsIcon className="w-5 h-5" />
}

export function InformationDietStep({ data, updateData }: InformationDietStepProps) {
  const { t } = useLanguage()

  const handleSocialToggle = (id: string) => {
    const isSelected = data.socialIntelligence.includes(id)
    updateData({
      socialIntelligence: isSelected
        ? data.socialIntelligence.filter(s => s !== id)
        : [...data.socialIntelligence, id]
    })
  }

  const handleNewsToggle = (id: string) => {
    const isSelected = data.newsFocus.includes(id)
    updateData({
      newsFocus: isSelected
        ? data.newsFocus.filter(n => n !== id)
        : [...data.newsFocus, id]
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
        <div className="flex items-center justify-center gap-2 mb-3">
          <h2 className="saydo-headline text-2xl sm:text-3xl">
            {t.steps.informationDiet.title}
          </h2>
          <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary">
            {t.steps.informationDiet.privacyBadge}
          </Badge>
        </div>
      </div>

      <div className="space-y-8">
        {/* Social Intelligence */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            {t.steps.informationDiet.socialIntelligence.question}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {socialIntelligenceSources.map((source) => (
              <SelectionCard
                key={source.id}
                id={source.id}
                name={source.name}
                selected={data.socialIntelligence.includes(source.id)}
                onSelect={handleSocialToggle}
                multiSelect
                icon={sourceIcons[source.id]}
                color="bg-primary/10"
              />
            ))}
          </div>
        </div>

        {/* News & Market Focus */}
        <div>
          <h3 className="text-lg font-semibold mb-4">
            {t.steps.informationDiet.newsFocus.question}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {newsVerticals.map((vertical) => (
              <SelectionCard
                key={vertical.id}
                id={vertical.id}
                name={vertical.name}
                selected={data.newsFocus.includes(vertical.id)}
                onSelect={handleNewsToggle}
                multiSelect
                icon={verticalIcons[vertical.id]}
                color="bg-primary/10"
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

