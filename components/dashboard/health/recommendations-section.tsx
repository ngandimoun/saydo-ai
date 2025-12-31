"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Utensils, 
  Droplets, 
  Dumbbell, 
  Moon, 
  Pill, 
  Sparkles,
  ChevronRight,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRecommendations, useCompleteRecommendation } from "@/hooks/queries/use-health-engagement"
import { RecommendationCard } from "./recommendation-card"
import { AllRecommendationsModal } from "./all-recommendations-modal"

/**
 * Recommendations Section
 * 
 * Displays personalized health recommendations grouped by type:
 * - Food: Dietary suggestions based on lab results
 * - Drink: Hydration and beverage recommendations
 * - Exercise: Physical activity suggestions
 * - Sleep: Rest and recovery tips
 * - Supplement: Vitamin and supplement recommendations
 */

// Category configuration
const categories = [
  { 
    key: "all", 
    label: "All", 
    icon: Sparkles,
    color: "text-primary",
    bgColor: "bg-primary/10",
    activeColor: "bg-primary text-primary-foreground"
  },
  { 
    key: "food", 
    label: "Food", 
    icon: Utensils,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    activeColor: "bg-green-500 text-white"
  },
  { 
    key: "drink", 
    label: "Drinks", 
    icon: Droplets,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    activeColor: "bg-blue-500 text-white"
  },
  { 
    key: "supplement", 
    label: "Supplements", 
    icon: Pill,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    activeColor: "bg-amber-500 text-white"
  },
  { 
    key: "exercise", 
    label: "Exercise", 
    icon: Dumbbell,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    activeColor: "bg-orange-500 text-white"
  },
  { 
    key: "lifestyle", 
    label: "Lifestyle", 
    icon: Moon,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    activeColor: "bg-indigo-500 text-white"
  },
]

interface RecommendationsSectionProps {
  className?: string
}

export function RecommendationsSection({ className }: RecommendationsSectionProps) {
  const [activeCategory, setActiveCategory] = useState("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data: recommendations = [], isLoading } = useRecommendations()
  const { mutate: completeRecommendation } = useCompleteRecommendation()

  // Transform database records to component format
  const formattedRecommendations = recommendations.map((rec: {
    id: string
    user_id: string
    type: string
    title: string
    description: string
    reason: string
    image_url?: string
    timing?: string
    frequency?: string
    created_at: string
    category?: string
    priority?: string
    specific_examples?: string[]
    alternatives?: string[]
    how_to_use?: string
  }) => ({
    id: rec.id,
    userId: rec.user_id,
    type: rec.type === "sleep" ? "lifestyle" : rec.type, // Map sleep to lifestyle
    title: rec.title,
    description: rec.description,
    reason: rec.reason,
    imageUrl: rec.image_url,
    timing: rec.timing,
    frequency: rec.frequency,
    createdAt: new Date(rec.created_at),
    category: rec.category,
    priority: rec.priority,
    specificExamples: rec.specific_examples || [],
    alternatives: rec.alternatives || [],
    howToUse: rec.how_to_use,
  }))

  // Filter by active category
  const filteredRecommendations = activeCategory === "all"
    ? formattedRecommendations
    : formattedRecommendations.filter((rec: { type: string }) => rec.type === activeCategory)

  // Get counts for each category
  const getCategoryCount = (key: string) => {
    if (key === "all") return formattedRecommendations.length
    return formattedRecommendations.filter((rec: { type: string }) => rec.type === key).length
  }

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <h2 className="font-semibold text-foreground">Personalized Recommendations</h2>
        </div>
        <div className="saydo-card p-8 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (formattedRecommendations.length === 0) {
    return null // Don't show section if no recommendations
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-4", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <h2 className="font-semibold text-foreground">Personalized Recommendations</h2>
        </div>
        <span className="text-xs text-muted-foreground">
          {formattedRecommendations.length} for you
        </span>
      </div>

      {/* Category Tabs - Horizontal Scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {categories.map((cat) => {
          const count = getCategoryCount(cat.key)
          if (cat.key !== "all" && count === 0) return null
          
          const Icon = cat.icon
          const isActive = activeCategory === cat.key

          return (
            <motion.button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap",
                "transition-all duration-200",
                isActive
                  ? cat.activeColor
                  : cn("bg-muted/50 dark:bg-muted/30 text-muted-foreground hover:bg-muted dark:hover:bg-muted/40")
              )}
            >
              <Icon size={14} />
              {cat.label}
              {count > 0 && (
                <span className={cn(
                  "ml-0.5 px-1.5 py-0.5 rounded-full text-[10px]",
                  isActive ? "bg-white/20 dark:bg-white/10" : cat.bgColor
                )}>
                  {count}
                </span>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Recommendations Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          {filteredRecommendations.slice(0, 6).map((rec: {
            id: string
            userId: string
            type: string
            title: string
            description: string
            reason: string
            imageUrl?: string
            timing?: string
            frequency?: string
            createdAt: Date
            specificExamples?: string[]
            alternatives?: string[]
            howToUse?: string
          }, index: number) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              delay={index * 0.05}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* View All Button */}
      {formattedRecommendations.length > 6 && (
        <motion.button
          onClick={() => setIsModalOpen(true)}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-1 text-xs text-primary font-medium mx-auto"
        >
          View all {formattedRecommendations.length} recommendations
          <ChevronRight size={14} />
        </motion.button>
      )}

      {/* All Recommendations Modal */}
      <AllRecommendationsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recommendations={formattedRecommendations}
      />
    </motion.div>
  )
}

