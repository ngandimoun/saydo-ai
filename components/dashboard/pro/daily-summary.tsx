"use client"

import { motion } from "framer-motion"
import { Moon, Sun, CheckCircle2, Clock, Lightbulb, TrendingUp, Calendar } from "lucide-react"
import type { EndOfDaySummary } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Daily Summary Component
 * 
 * End-of-day AI summary with insights.
 * Shows achievements, pending items, and tomorrow's priorities.
 * 
 * TODO (AI Integration):
 * - Generate at user's preferred time
 * - Personalize based on work patterns
 * - Include actionable suggestions
 */

interface DailySummaryProps {
  summary: EndOfDaySummary
}

export function DailySummary({ summary }: DailySummaryProps) {
  const getProductivityColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'text-green-500 bg-green-500/20'
      case 'good': return 'text-teal-500 bg-teal-500/20'
      case 'fair': return 'text-amber-500 bg-amber-500/20'
      default: return 'text-red-500 bg-red-500/20'
    }
  }

  const isEvening = new Date().getHours() >= 17

  return (
    <section className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        {isEvening ? (
          <Moon size={16} className="text-indigo-500" />
        ) : (
          <Sun size={16} className="text-amber-500" />
        )}
        <h2 className="font-semibold text-foreground">
          {isEvening ? "Today's Wrap-up" : "Yesterday's Summary"}
        </h2>
      </div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "p-5 rounded-2xl",
          "bg-gradient-to-br from-indigo-900/50 to-purple-900/30",
          "border border-indigo-500/30"
        )}
      >
        {/* Productivity indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-400" />
            <span className="text-sm text-indigo-300">Productivity</span>
          </div>
          <span className={cn(
            "px-2.5 py-1 rounded-full text-xs font-semibold uppercase",
            getProductivityColor(summary.overallProductivity)
          )}>
            {summary.overallProductivity.replace('_', ' ')}
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{summary.tasksCompleted}</p>
            <p className="text-xs text-muted-foreground">Tasks done</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{summary.voiceNotesRecorded}</p>
            <p className="text-xs text-muted-foreground">Voice notes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{summary.hoursWorked}h</p>
            <p className="text-xs text-muted-foreground">Hours</p>
          </div>
        </div>

        {/* Key achievements */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-green-400">
            <CheckCircle2 size={14} />
            <span className="font-medium">Key Achievements</span>
          </div>
          <ul className="space-y-1.5 pl-6">
            {summary.keyAchievements.slice(0, 3).map((item, i) => (
              <li key={i} className="text-sm text-foreground/80 list-disc">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Pending items */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-amber-400">
            <Clock size={14} />
            <span className="font-medium">Still Pending</span>
          </div>
          <ul className="space-y-1.5 pl-6">
            {summary.pendingItems.slice(0, 2).map((item, i) => (
              <li key={i} className="text-sm text-foreground/80 list-disc">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Tomorrow's priorities */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-blue-400">
            <Calendar size={14} />
            <span className="font-medium">Tomorrow's Focus</span>
          </div>
          <ul className="space-y-1.5 pl-6">
            {summary.tomorrowPriorities.slice(0, 2).map((item, i) => (
              <li key={i} className="text-sm text-foreground/80 list-disc">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Insights */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Lightbulb size={14} className="text-amber-500" />
          <span className="text-sm font-medium text-foreground">Insights</span>
        </div>
        <div className="space-y-2">
          {summary.insights.map((insight, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-3 rounded-xl bg-card border border-border/50"
            >
              <p className="text-sm text-muted-foreground">{insight}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}






