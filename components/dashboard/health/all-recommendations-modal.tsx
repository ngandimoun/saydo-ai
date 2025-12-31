"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Utensils,
  Droplets,
  Dumbbell,
  Moon,
  Pill,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { RecommendationCard } from "./recommendation-card"

/**
 * All Recommendations Modal
 * 
 * Displays all recommendations in a scrollable, filterable modal dialog.
 * Mobile-friendly with category filtering.
 */

interface RecommendationData {
  id: string
  userId: string
  type: string
  title: string
  description?: string
  reason?: string
  imageUrl?: string
  timing?: string
  frequency?: string
  specificExamples?: string[]
  alternatives?: string[]
  howToUse?: string
  createdAt: Date
}

interface AllRecommendationsModalProps {
  isOpen: boolean
  onClose: () => void
  recommendations: RecommendationData[]
}

// Category configuration (same as RecommendationsSection)
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

export function AllRecommendationsModal({
  isOpen,
  onClose,
  recommendations,
}: AllRecommendationsModalProps) {
  const [activeCategory, setActiveCategory] = useState("all")

  // Filter by active category
  const filteredRecommendations = activeCategory === "all"
    ? recommendations
    : recommendations.filter((rec) => rec.type === activeCategory)

  // Get counts for each category
  const getCategoryCount = (categoryKey: string) => {
    if (categoryKey === "all") return recommendations.length
    return recommendations.filter((rec) => rec.type === categoryKey).length
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "max-w-4xl w-full h-[90vh] max-h-[90vh] p-0 gap-0",
          "flex flex-col overflow-hidden",
          "sm:max-w-4xl sm:rounded-lg",
          "max-sm:max-w-full max-sm:h-full max-sm:max-h-full max-sm:rounded-none"
        )}
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-primary" />
              <DialogTitle className="text-xl font-semibold">
                All Recommendations
              </DialogTitle>
            </div>
            <span className="text-sm text-muted-foreground">
              {filteredRecommendations.length} {filteredRecommendations.length === 1 ? "recommendation" : "recommendations"}
            </span>
          </div>
        </DialogHeader>

        {/* Category Tabs */}
        <div className="px-6 pt-4 pb-2 border-b border-border">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
                      isActive 
                        ? "bg-white/20 dark:bg-white/10" 
                        : cat.bgColor
                    )}>
                      {count}
                    </span>
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Scrollable Recommendations List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {filteredRecommendations.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles size={48} className="mx-auto text-muted-foreground/50 dark:text-muted-foreground/70 mb-4" />
                  <p className="text-muted-foreground dark:text-muted-foreground/90">
                    No recommendations in this category yet.
                  </p>
                </div>
              ) : (
                filteredRecommendations.map((rec, index) => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    delay={index * 0.02}
                  />
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}

