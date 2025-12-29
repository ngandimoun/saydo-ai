"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Sparkles, TrendingUp, Heart } from "lucide-react"
import { getTimeOfDay, getGreeting } from "@/lib/dashboard/time-utils"
import type { UserProfile, DailySummary } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase"
import { logger } from "@/lib/logger"

/**
 * Greeting Section
 * 
 * Personalized greeting based on:
 * - User's preferred name (from onboarding)
 * - Time of day
 * - User's language preference
 * 
 * Also shows AI-generated daily summary of what Saydo did.
 */

interface GreetingSectionProps {
  userProfile: UserProfile | null
  className?: string
}

export function GreetingSection({ userProfile, className }: GreetingSectionProps) {
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null)
  
  const timeOfDay = getTimeOfDay()
  const language = userProfile?.language || 'en'
  const greeting = getGreeting(timeOfDay, language)
  const name = userProfile?.preferredName || 'there'

  // Load daily summary from Supabase
  useEffect(() => {
    const loadSummary = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return

        // Get today's date range
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const { data, error } = await supabase
          .from('daily_summaries')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', today.toISOString())
          .lt('date', tomorrow.toISOString())
          .single()

        if (error) {
          // No summary for today - that's fine, will show fallback
          logger.debug('No daily summary found for today')
          return
        }

        if (data) {
          setDailySummary({
            id: data.id,
            userId: data.user_id,
            date: new Date(data.date),
            proSummary: data.pro_summary,
            healthSummary: data.health_summary,
            tasksCompleted: data.tasks_completed,
            insightsGenerated: data.insights_generated,
            moodTrend: data.mood_trend,
            createdAt: new Date(data.created_at),
          })
        }
      } catch (error) {
        logger.error('Failed to load daily summary', { error })
      }
    }
    loadSummary()
  }, [])

  return (
    <section className={cn("pt-6", className)}>
      {/* Main Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="saydo-headline text-3xl sm:text-4xl text-foreground">
          {greeting},
          <br />
          <span className="text-primary">{name}!</span>
        </h1>
      </motion.div>

      {/* AI Summary Cards */}
      {dailySummary && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Professional Summary Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="saydo-card p-4 border-l-4 border-l-primary"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={12} className="text-primary" />
                  <span className="text-xs font-medium text-primary uppercase tracking-wider">
                    Pro Life
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {dailySummary.proSummary}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-2">
                  {dailySummary.tasksCompleted} tasks completed
                </p>
              </div>
            </div>
          </motion.div>

          {/* Health Summary Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="saydo-card p-4 border-l-4 border-l-rose-500"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center flex-shrink-0">
                <Heart size={18} className="text-rose-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={12} className="text-rose-500" />
                  <span className="text-xs font-medium text-rose-500 uppercase tracking-wider">
                    Health
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {dailySummary.healthSummary}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-2">
                  {dailySummary.insightsGenerated} insights generated
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Ask Anything Input - Placeholder for future AI chat */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="mt-4"
      >
        <button 
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border/50 shadow-sm text-left hover:border-primary/30 transition-colors"
          onClick={() => {
            /**
             * TODO (AI Integration):
             * Open AI chat modal or expand input
             * This will be the main conversational interface
             */
            console.log('Open AI chat')
          }}
        >
          <Sparkles size={18} className="text-primary flex-shrink-0" />
          <span className="text-muted-foreground text-sm">
            Ask anything about your health or work...
          </span>
        </button>
      </motion.div>
    </section>
  )
}




