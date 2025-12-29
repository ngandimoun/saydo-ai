"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { Briefcase, TrendingUp, Clock, FileText, Sparkles, Calendar, CheckCircle2, ArrowRight } from "lucide-react"
import { FileVault } from "@/components/dashboard/pro/file-vault"
import { AIOutputs } from "@/components/dashboard/pro/ai-outputs"
import { DailySummary } from "@/components/dashboard/pro/daily-summary"

// Dynamically import ChatWidget to reduce initial bundle size
const ChatWidget = dynamic(() => import("@/components/dashboard/chat").then(mod => ({ default: mod.ChatWidget })), {
  ssr: false,
  loading: () => null
})
import type { WorkFile, AIDocument, EndOfDaySummary, Reminder } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"
import { springs } from "@/lib/motion-system"
import { createClient } from "@/lib/supabase"
import { logger } from "@/lib/logger"
import {
  useWorkFiles,
  useAIDocuments,
  useEndOfDaySummary,
  useProductivityStats,
  useInvalidateProData,
  useTasks,
  useReminders
} from "@/hooks/queries"

/**
 * Pro Life Tab Page - Airbnb-Inspired
 * 
 * Your professional command center with:
 * - At-a-glance productivity metrics
 * - Smart file vault with AI categorization
 * - AI-generated outputs and drafts
 * - End-of-day summaries with actionable insights
 */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springs.gentle,
  },
}

export default function ProPage() {
  // Use query hooks for cached data
  const { data: workFiles = [], isLoading: filesLoading } = useWorkFiles()
  const { data: aiDocuments = [], isLoading: documentsLoading } = useAIDocuments()
  const { data: endOfDaySummary, isLoading: summaryLoading } = useEndOfDaySummary()
  const { data: productivityStats = {
    tasksCompleted: 0,
    focusTime: '0h 0m',
    meetings: 0,
    aiAssists: 0,
  }, isLoading: statsLoading } = useProductivityStats()
  const { data: tasks = [] } = useTasks({ includeCompleted: false, limit: 5 })
  const { data: reminders = [] } = useReminders({ includeCompleted: false, limit: 5 })
  const [upcomingReminder, setUpcomingReminder] = useState<Reminder | null>(null)

  // Find next upcoming reminder
  useEffect(() => {
    const now = new Date()
    const upcoming = reminders
      .filter(r => new Date(r.reminderTime) > now)
      .sort((a, b) => new Date(a.reminderTime).getTime() - new Date(b.reminderTime).getTime())[0]
    setUpcomingReminder(upcoming || null)
  }, [reminders])

  const isLoading = filesLoading || documentsLoading || summaryLoading || statsLoading

  // Generate dynamic AI summary
  const generateAISummary = () => {
    if (endOfDaySummary) {
      const achievements = endOfDaySummary.keyAchievements?.length || 0
      const pending = endOfDaySummary.pendingItems?.length || 0
      return {
        text: achievements > 0 
          ? `Great progress today! ${achievements} key achievement${achievements > 1 ? 's' : ''} completed. ${pending > 0 ? `${pending} item${pending > 1 ? 's' : ''} still pending.` : 'All items completed!'}`
          : productivityStats.tasksCompleted > 0
          ? `You've completed ${productivityStats.tasksCompleted} task${productivityStats.tasksCompleted > 1 ? 's' : ''} today. Keep up the momentum!`
          : "Ready to make today productive? Let's get started!",
        hasUpcoming: upcomingReminder !== null
      }
    }
    
    if (productivityStats.tasksCompleted > 0) {
      return {
        text: `You've been crushing it today! ${productivityStats.tasksCompleted} task${productivityStats.tasksCompleted > 1 ? 's' : ''} completed with ${productivityStats.focusTime} of focused work.`,
        hasUpcoming: upcomingReminder !== null
      }
    }
    
    if (upcomingReminder) {
      const reminderTime = new Date(upcomingReminder.reminderTime)
      const now = new Date()
      const diffMs = reminderTime.getTime() - now.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      
      if (diffMins < 60) {
        return {
          text: `You have a reminder coming up in ${diffMins} minute${diffMins !== 1 ? 's' : ''}: ${upcomingReminder.title}`,
          hasUpcoming: true
        }
      }
    }
    
    return {
      text: "Record a voice note to extract tasks and reminders automatically.",
      hasUpcoming: false
    }
  }

  const aiSummary = generateAISummary()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div 
          className="relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-16 h-16 rounded-full border-3 border-teal-200 dark:border-teal-900" />
          <motion.div 
            className="absolute inset-0 rounded-full border-3 border-transparent border-t-teal-500"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <Briefcase className="absolute inset-0 m-auto w-6 h-6 text-teal-500" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-teal-500/8 via-cyan-500/5 to-transparent pointer-events-none" />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative px-4 pt-6 pb-8 space-y-6 max-w-lg mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/20">
              <Briefcase size={20} className="text-white" />
            </div>
            <div>
              <h1 className="saydo-headline text-2xl font-semibold">Pro Life</h1>
              <p className="text-xs text-muted-foreground">Your work command center</p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-full",
              "glass-card border border-border/50",
              "text-sm font-medium text-muted-foreground",
              "hover:border-teal-500/30 hover:text-foreground",
              "transition-all"
            )}
          >
            <Calendar size={14} />
            Today
          </motion.button>
        </motion.div>

        {/* Productivity Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-4 gap-2">
          {[
            { icon: CheckCircle2, label: 'Done', value: productivityStats.tasksCompleted.toString(), color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { icon: Clock, label: 'Focus', value: productivityStats.focusTime, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { icon: Calendar, label: 'Meetings', value: productivityStats.meetings.toString(), color: 'text-purple-500', bg: 'bg-purple-500/10' },
            { icon: Sparkles, label: 'AI Assists', value: productivityStats.aiAssists.toString(), color: 'text-teal-500', bg: 'bg-teal-500/10' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className={cn(
                "glass-card p-3 rounded-2xl text-center",
                "border border-border/50"
              )}
            >
              <div className={cn("w-8 h-8 rounded-xl mx-auto flex items-center justify-center mb-1", stat.bg)}>
                <stat.icon size={16} className={stat.color} />
              </div>
              <p className={cn("text-lg font-semibold", stat.color)}>{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* AI Summary Card - Featured */}
        <motion.div variants={itemVariants}>
          <motion.div
            whileHover={{ y: -2 }}
            className={cn(
              "relative p-5 rounded-3xl overflow-hidden",
              "bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700",
              "shadow-xl shadow-teal-500/20"
            )}
          >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjgwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] opacity-30" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                  <Sparkles size={14} className="text-white" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-white/80">
                  AI Summary
                </span>
              </div>
              
              <p className="saydo-body text-white text-sm leading-relaxed mb-4">
                {aiSummary.text}
                {aiSummary.hasUpcoming && upcomingReminder && (
                  <span className="block mt-2 text-white/80">
                    {upcomingReminder.priority === 'urgent' && '⚠️ '}
                    Next: {upcomingReminder.title}
                  </span>
                )}
              </p>
              
              <motion.button
                whileHover={{ x: 4 }}
                className="flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white"
              >
                View details
                <ArrowRight size={14} />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants} className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
          {[
            { icon: FileText, label: 'Draft Email', color: 'text-blue-500' },
            { icon: TrendingUp, label: 'Report', color: 'text-emerald-500' },
            { icon: Calendar, label: 'Schedule', color: 'text-purple-500' },
            { icon: Sparkles, label: 'Brainstorm', color: 'text-amber-500' },
          ].map((action, i) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full flex-shrink-0",
                "glass-card border border-border/50",
                "hover:border-teal-500/30 hover:shadow-lg",
                "transition-all duration-200"
              )}
            >
              <action.icon size={14} className={action.color} />
              <span className="text-sm font-medium">{action.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* File Vault */}
        <motion.div variants={itemVariants}>
          <FileVault files={workFiles} />
        </motion.div>

        {/* AI Generated Documents */}
        <motion.div variants={itemVariants}>
          <AIOutputs documents={aiDocuments} />
        </motion.div>

        {/* End of Day Summary */}
        <AnimatePresence>
          {endOfDaySummary && (
            <motion.div variants={itemVariants}>
              <DailySummary summary={endOfDaySummary} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Widget */}
        <ChatWidget pageContext={{ page: 'pro' }} />
      </motion.div>
    </div>
  )
}
