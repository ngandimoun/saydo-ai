"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Calendar, 
  ChefHat, 
  ChevronDown, 
  ChevronUp,
  Utensils,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Droplets,
  Pill,
  Loader2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Info
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useMealPlan } from "@/hooks/queries/use-health-data"

/**
 * Meal Plan Section
 * 
 * Displays the weekly meal plan with:
 * - Full meal names (no truncation)
 * - Alternatives for each meal
 * - Substitutions for ingredients
 * - Why each meal is recommended
 * - Mobile-friendly tap interactions
 */

// Meal type icons
const mealIcons = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snacks: Cookie,
}

interface MealCardProps {
  name: string
  description?: string
  calories: number
  protein: number
  imageUrl?: string
  reason?: string
  alternatives?: string[]
  substitutions?: Record<string, string>
}

function MealCard({ 
  name, 
  description, 
  calories, 
  protein, 
  imageUrl, 
  reason,
  alternatives,
  substitutions
}: MealCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasDetails = reason || (alternatives && alternatives.length > 0) || (substitutions && Object.keys(substitutions).length > 0)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "relative overflow-hidden rounded-xl",
        "bg-gradient-to-br from-muted/50 to-muted/30",
        "border border-border/50",
        "transition-colors"
      )}
    >
      {/* Clickable Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left p-3"
      >
        {imageUrl && (
          <div className="absolute inset-0 opacity-10">
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="relative">
          {/* Full meal name - no truncation */}
          <h4 className="font-medium text-sm text-foreground leading-snug">
            {name}
          </h4>
          
          {description && (
            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{description}</p>
          )}
          
          {/* Nutrition info */}
          <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
            <span>{calories} cal</span>
            <span>•</span>
            <span>{protein}g protein</span>
            {hasDetails && (
              <>
                <span className="flex-1" />
                <motion.span
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  className="text-primary"
                >
                  <ChevronDown size={12} />
                </motion.span>
              </>
            )}
          </div>
        </div>
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-border/30 pt-2">
              {/* Why this meal */}
              {reason && (
                <div className="flex items-start gap-1.5 text-[10px]">
                  <Sparkles size={10} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{reason}</span>
                </div>
              )}

              {/* Alternatives */}
              {alternatives && alternatives.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <ArrowRight size={8} />
                    Alternatives
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {alternatives.map((alt, idx) => (
                      <span 
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-white/80 border border-dashed border-border/50 text-muted-foreground"
                      >
                        {alt}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Substitutions */}
              {substitutions && Object.keys(substitutions).length > 0 && (
                <div className="space-y-1">
                  <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <RefreshCw size={8} />
                    Substitutions
                  </span>
                  <div className="space-y-0.5">
                    {Object.entries(substitutions).map(([ingredient, subs], idx) => (
                      <div key={idx} className="text-[10px] text-muted-foreground">
                        <span className="font-medium text-foreground">{ingredient}</span>
                        <span className="mx-1">→</span>
                        <span>{subs}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface DayPlanProps {
  day: {
    date: Date
    breakfast: Array<{ 
      id: string
      name: string
      description?: string
      reason?: string
      nutritionalInfo: { calories: number; protein: number }
      imageUrl?: string
      alternatives?: string[]
      substitutions?: Record<string, string>
    }>
    lunch: Array<{ 
      id: string
      name: string
      description?: string
      reason?: string
      nutritionalInfo: { calories: number; protein: number }
      imageUrl?: string
      alternatives?: string[]
      substitutions?: Record<string, string>
    }>
    dinner: Array<{ 
      id: string
      name: string
      description?: string
      reason?: string
      nutritionalInfo: { calories: number; protein: number }
      imageUrl?: string
      alternatives?: string[]
      substitutions?: Record<string, string>
    }>
    snacks: Array<{ 
      id: string
      name: string
      description?: string
      reason?: string
      nutritionalInfo: { calories: number; protein: number }
      imageUrl?: string
      alternatives?: string[]
      substitutions?: Record<string, string>
    }>
    drinks?: Array<{ id: string; name: string; amount: string; timing: string; reason?: string; alternatives?: string[] }>
    supplements: Array<{ id: string; name: string; dosage: string; timing: string; reason?: string; brand?: string; alternatives?: string[] }>
    nutritionalTargets: { calories: number; protein: number; carbs: number; fats: number }
    notes?: string
    hydration?: string
  }
  isExpanded: boolean
  onToggle: () => void
  isToday: boolean
}

function DayPlan({ day, isExpanded, onToggle, isToday }: DayPlanProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    }).format(date)
  }

  const totalCalories = [...(day.breakfast || []), ...(day.lunch || []), ...(day.dinner || []), ...(day.snacks || [])]
    .reduce((sum, meal) => sum + (meal.nutritionalInfo?.calories || 0), 0)

  return (
    <motion.div
      initial={false}
      className={cn(
        "rounded-xl overflow-hidden",
        "border transition-colors",
        isToday 
          ? "border-primary/50 bg-primary/5" 
          : "border-border/50 bg-muted/20"
      )}
    >
      {/* Day Header */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between p-3",
          "hover:bg-muted/30 transition-colors"
        )}
      >
        <div className="flex items-center gap-2">
          {isToday && (
            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-medium">
              Today
            </span>
          )}
          <span className="font-medium text-sm">{formatDate(day.date)}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {day.nutritionalTargets?.calories || totalCalories} cal target
          </span>
          {isExpanded ? (
            <ChevronUp size={16} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 space-y-4">
              {/* Meals Grid */}
              {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map((mealType) => {
                const meals = day[mealType]
                if (!meals || meals.length === 0) return null
                
                const Icon = mealIcons[mealType]
                
                return (
                  <div key={mealType} className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Icon size={14} className="text-muted-foreground" />
                      <h5 className="text-xs font-medium text-muted-foreground uppercase">
                        {mealType}
                      </h5>
                    </div>
                    <div className="space-y-2">
                      {meals.map((meal) => (
                        <MealCard
                          key={meal.id}
                          name={meal.name}
                          description={meal.description}
                          calories={meal.nutritionalInfo?.calories || 0}
                          protein={meal.nutritionalInfo?.protein || 0}
                          imageUrl={meal.imageUrl}
                          reason={meal.reason}
                          alternatives={meal.alternatives}
                          substitutions={meal.substitutions}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Drinks with alternatives */}
              {day.drinks && day.drinks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Droplets size={14} className="text-blue-500" />
                    <h5 className="text-xs font-medium text-muted-foreground uppercase">
                      Hydration
                    </h5>
                  </div>
                  {day.hydration && (
                    <p className="text-xs text-muted-foreground mb-2">{day.hydration}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {day.drinks.map((drink) => (
                      <div
                        key={drink.id}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs"
                      >
                        <span className="font-medium text-blue-700 dark:text-blue-300">
                          {drink.name}
                        </span>
                        <span className="text-muted-foreground ml-1.5">
                          {drink.amount} • {drink.timing}
                        </span>
                        {drink.alternatives && drink.alternatives.length > 0 && (
                          <div className="text-[10px] text-muted-foreground mt-1">
                            <ArrowRight size={8} className="inline mr-0.5" />
                            {drink.alternatives.join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Supplements with brands and alternatives */}
              {day.supplements && day.supplements.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Pill size={14} className="text-amber-500" />
                    <h5 className="text-xs font-medium text-muted-foreground uppercase">
                      Supplements
                    </h5>
                  </div>
                  <div className="space-y-2">
                    {day.supplements.map((supp) => (
                      <div
                        key={supp.id}
                        className="px-2.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20"
                      >
                        <div className="text-xs">
                          <span className="font-medium text-amber-700 dark:text-amber-300">
                            {supp.name}
                          </span>
                          {supp.brand && (
                            <span className="text-muted-foreground ml-1">
                              ({supp.brand})
                            </span>
                          )}
                          <span className="text-muted-foreground ml-1.5">
                            • {supp.dosage} • {supp.timing}
                          </span>
                        </div>
                        {supp.reason && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            <Sparkles size={8} className="inline mr-0.5" />
                            {supp.reason}
                          </p>
                        )}
                        {supp.alternatives && supp.alternatives.length > 0 && (
                          <div className="text-[10px] text-muted-foreground mt-1">
                            <ArrowRight size={8} className="inline mr-0.5" />
                            Alternatives: {supp.alternatives.join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {day.notes && (
                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">
                  <Info size={12} className="flex-shrink-0 mt-0.5" />
                  <span>{day.notes}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface MealPlanSectionProps {
  className?: string
}

export function MealPlanSection({ className }: MealPlanSectionProps) {
  const { data: mealPlan, isLoading } = useMealPlan()
  const [expandedDay, setExpandedDay] = useState<number>(0) // First day expanded by default

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center gap-2">
          <ChefHat size={18} className="text-primary" />
          <h2 className="font-semibold text-foreground">Your Meal Plan</h2>
        </div>
        <div className="saydo-card p-8 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!mealPlan || !mealPlan.days || mealPlan.days.length === 0) {
    return null // Don't show section if no meal plan
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("space-y-4", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChefHat size={18} className="text-primary" />
          <h2 className="font-semibold text-foreground">Your Meal Plan</h2>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground capitalize">
            {mealPlan.type} plan
          </span>
        </div>
      </div>

      {/* Days List */}
      <div className="space-y-2">
        {mealPlan.days.slice(0, 7).map((day: DayPlanProps['day'], index: number) => {
          const dayDate = new Date(day.date)
          dayDate.setHours(0, 0, 0, 0)
          const isToday = dayDate.getTime() === today.getTime()
          
          return (
            <DayPlan
              key={index}
              day={day}
              isExpanded={expandedDay === index}
              onToggle={() => setExpandedDay(expandedDay === index ? -1 : index)}
              isToday={isToday}
            />
          )
        })}
      </div>

      {/* Based On Info */}
      {(mealPlan.basedOnLabs?.length > 0 || mealPlan.basedOnInsights?.length > 0) && (
        <div className="text-xs text-muted-foreground text-center">
          <Sparkles size={12} className="inline mr-1" />
          Personalized based on {mealPlan.basedOnLabs?.length || 0} lab results
        </div>
      )}
    </motion.div>
  )
}
