"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Calendar, Utensils, ChevronLeft, ChevronRight, Pill, Target, Droplets } from "lucide-react"
import type { MealPlan, MealItem, DrinkItem } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Meal Plan Component
 * 
 * Displays weekly or monthly meal plan based on:
 * - Uploaded clinical results (lab values, biomarkers)
 * - AI insights from document analysis
 * - Biological profile (blood group, body type, allergies)
 * - Health status rings (energy, stress, recovery)
 * 
 * Features:
 * - Toggle between weekly/monthly views
 * - Daily meal breakdown (breakfast, lunch, dinner, snacks)
 * - Nutritional targets aligned with lab results
 * - Blood group optimized meals
 * - Allergy-safe options
 * - Supplement timing recommendations
 * 
 * TODO (Backend Integration):
 * - Fetch from Supabase: meal_plans table
 * - Subscribe to real-time updates when new labs are uploaded
 * - Regenerate plan when new insights are created
 * 
 * TODO (AI Integration):
 * - Generate meal plans using AI/ML models
 * - Personalize based on user preferences
 * - Adjust based on seasonal availability
 * - Consider location and cuisine preferences
 */

interface MealPlanProps {
  mealPlan: MealPlan
  className?: string
}

export function MealPlanComponent({ mealPlan, className }: MealPlanProps) {
  const [viewType, setViewType] = useState<'weekly' | 'monthly'>(mealPlan.type)
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0)

  // For weekly view, show current week
  // For monthly view, show all days (grouped by week)
  const displayDays = viewType === 'weekly' 
    ? mealPlan.days.slice(currentWeekIndex * 7, (currentWeekIndex + 1) * 7)
    : mealPlan.days

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    }).format(date)
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
          <Calendar size={18} className="text-primary" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Meal Plan
          </h2>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center gap-2 p-1 rounded-lg bg-muted/50">
          <button
            onClick={() => setViewType('weekly')}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-colors",
              viewType === 'weekly'
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Weekly
          </button>
          <button
            onClick={() => setViewType('monthly')}
            className={cn(
              "px-3 py-1 rounded-md text-xs font-medium transition-colors",
              viewType === 'monthly'
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* Meal Plan Days */}
      <div className="space-y-4">
        {displayDays.map((day, dayIndex) => (
          <motion.div
            key={dayIndex}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: dayIndex * 0.05 }}
            className="saydo-card p-4 space-y-3"
          >
            {/* Day Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="font-semibold text-foreground">
                  {formatDate(day.date)}
                </h3>
                {day.notes && (
                  <p className="text-xs text-muted-foreground mt-0.5">{day.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Target size={14} />
                <span>{day.nutritionalTargets.calories} cal</span>
              </div>
            </div>

            {/* Meals Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Breakfast */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase">Breakfast</h4>
                {day.breakfast.map((meal) => (
                  <MealItemCard key={meal.id} meal={meal} />
                ))}
              </div>

              {/* Lunch */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase">Lunch</h4>
                {day.lunch.map((meal) => (
                  <MealItemCard key={meal.id} meal={meal} />
                ))}
              </div>

              {/* Dinner */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase">Dinner</h4>
                {day.dinner.map((meal) => (
                  <MealItemCard key={meal.id} meal={meal} />
                ))}
              </div>

              {/* Snacks */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase">Snacks</h4>
                {day.snacks.map((meal) => (
                  <MealItemCard key={meal.id} meal={meal} />
                ))}
              </div>
            </div>

            {/* Drinks */}
            {day.drinks && day.drinks.length > 0 && (
              <div className="pt-2 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets size={14} className="text-blue-500" />
                  <h4 className="text-xs font-medium text-muted-foreground uppercase">Recommended Drinks</h4>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {day.drinks.map((drink) => (
                    <div
                      key={drink.id}
                      className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{drink.name}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{drink.timing}</p>
                        </div>
                        <span className="text-[10px] text-blue-600 font-medium flex-shrink-0">
                          {drink.amount}
                        </span>
                      </div>
                      {drink.reason && (
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{drink.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Supplements */}
            {day.supplements.length > 0 && (
              <div className="pt-2 border-t border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Pill size={14} className="text-primary" />
                  <h4 className="text-xs font-medium text-muted-foreground uppercase">Supplements</h4>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {day.supplements.map((supplement) => (
                    <div
                      key={supplement.id}
                      className="p-2 rounded-lg bg-muted/30 border border-border/50"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{supplement.name}</p>
                          <p className="text-[10px] text-muted-foreground">{supplement.dosage}</p>
                        </div>
                        <span className="text-[10px] text-primary font-medium capitalize flex-shrink-0">
                          {supplement.timing}
                        </span>
                      </div>
                      {supplement.reason && (
                        <p className="text-[10px] text-muted-foreground line-clamp-2">{supplement.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nutritional Targets */}
            <div className="pt-2 border-t border-border">
              <h4 className="text-xs font-medium text-muted-foreground uppercase mb-2">Daily Targets</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Protein</p>
                  <p className="font-semibold text-foreground">{day.nutritionalTargets.protein}g</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Carbs</p>
                  <p className="font-semibold text-foreground">{day.nutritionalTargets.carbs}g</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fats</p>
                  <p className="font-semibold text-foreground">{day.nutritionalTargets.fats}g</p>
                </div>
                {day.nutritionalTargets.iron && (
                  <div>
                    <p className="text-muted-foreground">Iron</p>
                    <p className="font-semibold text-amber-600">{day.nutritionalTargets.iron}mg</p>
                  </div>
                )}
                {day.nutritionalTargets.vitaminD && (
                  <div>
                    <p className="text-muted-foreground">Vitamin D</p>
                    <p className="font-semibold text-yellow-600">{day.nutritionalTargets.vitaminD} IU</p>
                  </div>
                )}
                {day.nutritionalTargets.b12 && (
                  <div>
                    <p className="text-muted-foreground">B12</p>
                    <p className="font-semibold text-blue-600">{day.nutritionalTargets.b12} mcg</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// Meal Item Card Component
function MealItemCard({ meal }: { meal: MealItem }) {
  return (
    <div className="p-2 rounded-lg bg-muted/30 border border-border/50">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">{meal.name}</p>
          {meal.description && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{meal.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {meal.bloodGroupCompatible && (
            <span className="text-[10px] text-green-500">✓</span>
          )}
          {!meal.allergySafe && (
            <span className="text-[10px] text-red-500">⚠</span>
          )}
        </div>
      </div>
      {meal.reason && (
        <p className="text-[10px] text-muted-foreground line-clamp-2">{meal.reason}</p>
      )}
      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
        <span>{meal.nutritionalInfo.calories} cal</span>
        <span>•</span>
        <span>{meal.nutritionalInfo.protein}g protein</span>
      </div>
    </div>
  )
}

