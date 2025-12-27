"use client"

import { motion } from "framer-motion"
import { Sparkles, TrendingUp, Heart, Briefcase, MessageSquare } from "lucide-react"
import type { UserProfile } from "@/lib/dashboard/types"
import { getTimeOfDayGreeting } from "@/lib/dashboard/time-utils"
import { cn } from "@/lib/utils"

/**
 * Greeting Section
 * 
 * Shows personalized greeting with time of day.
 * Displays AI-generated summaries for Pro Life and Health.
 * Includes an "Ask Saydo" input for quick interactions.
 */

interface GreetingSectionProps {
  userProfile: UserProfile
}

export function GreetingSection({ userProfile }: GreetingSectionProps) {
  const greeting = getTimeOfDayGreeting(userProfile.preferredName, userProfile.language)

  // Mock data - TODO: Fetch from backend
  const proSummary = {
    text: "Saydo organized 3 meetings and drafted 2 follow-up emails from your voice notes.",
    metric: "7 tasks completed"
  }

  const healthSummary = {
    text: "Your iron levels suggest adding more leafy greens. I've updated your meal suggestions.",
    metric: "3 insights generated"
  }

  return (
    <section className="space-y-4">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-1"
      >
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          <span className="text-foreground">{greeting.split(',')[0]},</span>
          <br />
          <span className="text-primary">{userProfile.preferredName}!</span>
        </h1>
      </motion.div>

      {/* AI Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-3"
      >
        {/* Pro Life Summary */}
        <div className={cn(
          "p-4 rounded-2xl",
          "bg-gradient-to-br from-card to-card/80",
          "border border-teal-500/30"
        )}>
          <div className="flex items-start gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-teal-500/20">
              <TrendingUp size={16} className="text-teal-500" />
            </div>
            <div className="flex items-center gap-1">
              <Sparkles size={12} className="text-teal-500" />
              <span className="text-xs font-semibold text-teal-500 uppercase tracking-wide">
                Pro Life
              </span>
            </div>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {proSummary.text}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {proSummary.metric}
          </p>
        </div>

        {/* Health Summary */}
        <div className={cn(
          "p-4 rounded-2xl",
          "bg-gradient-to-br from-card to-card/80",
          "border border-rose-500/30"
        )}>
          <div className="flex items-start gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-rose-500/20">
              <Heart size={16} className="text-rose-500" />
            </div>
            <div className="flex items-center gap-1">
              <Sparkles size={12} className="text-rose-500" />
              <span className="text-xs font-semibold text-rose-500 uppercase tracking-wide">
                Health
              </span>
            </div>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {healthSummary.text}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {healthSummary.metric}
          </p>
        </div>
      </motion.div>

      {/* Ask Saydo Input */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={cn(
          "w-full p-4 rounded-2xl",
          "bg-card border border-border/50",
          "flex items-center gap-3",
          "hover:bg-muted/50 transition-colors",
          "touch-manipulation text-left"
        )}
      >
        <div className="p-2 rounded-lg bg-primary/10">
          <Sparkles size={16} className="text-primary" />
        </div>
        <span className="text-muted-foreground">
          Ask anything about your health or work...
        </span>
      </motion.button>
    </section>
  )
}

