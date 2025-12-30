"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Home } from "lucide-react"
import { Header } from "@/components/dashboard/home/header"
import { GreetingSection } from "@/components/dashboard/home/greeting-section"
import { UrgentAlerts } from "@/components/dashboard/home/urgent-alerts"
import { QuickActions } from "@/components/dashboard/home/quick-actions"
import { VoiceFeed } from "@/components/dashboard/home/voice-feed"
import { TasksPreview } from "@/components/dashboard/home/tasks-preview"

// Dynamically import ChatWidget to reduce initial bundle size
const ChatWidget = dynamic(() => import("@/components/dashboard/chat").then(mod => ({ default: mod.ChatWidget })), {
  ssr: false,
  loading: () => null
})
import type { UserProfile, UrgentAlert, VoiceNote, Task } from "@/lib/dashboard/types"
import { springs } from "@/lib/motion-system"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase"
import { useUrgentAlertsRealtime, useTasksRealtime, useVoiceRecordingsRealtime } from "@/hooks/use-realtime"
import { logger } from "@/lib/logger"
import { 
  useProfile, 
  useUrgentAlerts, 
  useTasks, 
  useVoiceRecordings,
  useInvalidateUrgentAlerts,
  useInvalidateTasks,
  useInvalidateVoiceRecordings
} from "@/hooks/queries"

/**
 * Home Tab Page - Airbnb-Inspired
 * 
 * Philosophy: "Inspire, Don't Demand"
 * Start with emotional connection, then gradually reveal actionable items.
 * 
 * Design Elements:
 * - Ambient gradient background
 * - Staggered animations for content sections
 * - Glass-morphism cards
 * - Emotional, time-aware greeting
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

export default function HomePage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [todayStats, setTodayStats] = useState<{
    tasksCompletedToday: number
    voiceNotesToday: number
    insightsGenerated: number
  }>({ tasksCompletedToday: 0, voiceNotesToday: 0, insightsGenerated: 0 })

  // Use query hooks for cached data
  const { data: userProfile, isLoading: profileLoading } = useProfile()
  const { data: urgentAlerts = [], isLoading: alertsLoading } = useUrgentAlerts()
  const { data: tasks = [], isLoading: tasksLoading } = useTasks({ includeCompleted: false, limit: 10 })
  const { data: voiceNotes = [], isLoading: voiceNotesLoading } = useVoiceRecordings({ limit: 5 })

  const isLoading = profileLoading || alertsLoading || tasksLoading || voiceNotesLoading

  // Get user ID for realtime subscriptions
  useEffect(() => {
    const mountTime = Date.now()
    const getUserId = async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
        } else if (error) {
          // Suppress errors during initialization (first 3 seconds)
          const isInitializing = Date.now() - mountTime < 3000
          if (!isInitializing) {
            logger.debug('Failed to get user for realtime subscriptions', { error })
          }
        }
      } catch (error) {
        // Suppress network errors during initialization
        const isInitializing = Date.now() - mountTime < 3000
        if (!isInitializing) {
          logger.debug('Error getting user for realtime subscriptions', { error })
        }
      }
    }
    getUserId()
  }, [])

  // Fetch today's stats (not cached, calculated fresh)
  useEffect(() => {
    const loadStats = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      
      const [tasksResult, voiceNotesResult, insightsResult] = await Promise.all([
        supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', todayStart.toISOString()),
        supabase
          .from('voice_recordings')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', todayStart.toISOString()),
        supabase
          .from('health_insights')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('generated_at', todayStart.toISOString()),
      ])

      setTodayStats({
        tasksCompletedToday: tasksResult.count || 0,
        voiceNotesToday: voiceNotesResult.count || 0,
        insightsGenerated: insightsResult.count || 0,
      })
    }

    loadStats()
  }, [])

  // Subscribe to realtime updates and invalidate queries
  const invalidateUrgentAlerts = useInvalidateUrgentAlerts()
  const invalidateTasks = useInvalidateTasks()
  const invalidateVoiceRecordings = useInvalidateVoiceRecordings()

  useUrgentAlertsRealtime(
    userId || '',
    (alert) => {
      logger.info('New urgent alert received', { alert })
      invalidateUrgentAlerts()
    },
    !!userId
  )

  useTasksRealtime(
    userId || '',
    (task) => {
      logger.info('Task updated', { task })
      invalidateTasks()
    },
    !!userId
  )

  useVoiceRecordingsRealtime(
    userId || '',
    (recording) => {
      logger.info('Voice recording updated', { recording })
      invalidateVoiceRecordings()
    },
    !!userId
  )

  if (isLoading || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          {/* Saydo loading orb */}
          <motion.div
            className="relative"
          >
            <motion.div
              className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-teal-600 shadow-lg shadow-primary/30"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/50 to-teal-600/50"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles size={24} className="text-white" />
            </div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-muted-foreground font-medium"
          >
            Loading your day...
          </motion.p>
        </motion.div>
      </div>
    )
  }

  // Determine time-based ambient color
  const hour = new Date().getHours()
  const ambientGradient = hour < 12 
    ? 'from-amber-500/8 via-orange-500/5' // Morning
    : hour < 17 
    ? 'from-teal-500/8 via-cyan-500/5'    // Afternoon
    : 'from-indigo-500/8 via-purple-500/5' // Evening

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient Background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-b to-transparent pointer-events-none",
        ambientGradient
      )} />
      
      {/* Subtle grid pattern */}
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
        className="relative px-4 pt-4 pb-8 space-y-6 max-w-lg mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <Header userProfile={userProfile} />
        </motion.div>

        {/* Hero Greeting with achievements */}
        <motion.div variants={itemVariants}>
          <GreetingSection 
            userProfile={userProfile} 
            proSummary={todayStats.tasksCompletedToday > 0 || todayStats.voiceNotesToday > 0 ? {
              text: todayStats.voiceNotesToday > 0 
                ? `Processed ${todayStats.voiceNotesToday} voice note${todayStats.voiceNotesToday > 1 ? 's' : ''} and extracted actionable items.`
                : "Your tasks are organized and ready.",
              metric: `${todayStats.tasksCompletedToday} task${todayStats.tasksCompletedToday !== 1 ? 's' : ''} completed today`
            } : undefined}
            healthSummary={todayStats.insightsGenerated > 0 ? {
              text: "I've analyzed your health data and generated personalized insights.",
              metric: `${todayStats.insightsGenerated} insight${todayStats.insightsGenerated !== 1 ? 's' : ''} generated`
            } : undefined}
          />
        </motion.div>

        {/* Urgent alerts - shown prominently if any */}
        <AnimatePresence>
          {urgentAlerts.length > 0 && (
            <motion.div variants={itemVariants}>
              <UrgentAlerts alerts={urgentAlerts} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick actions grid */}
        <motion.div variants={itemVariants}>
          <QuickActions />
        </motion.div>

        {/* Tasks preview */}
        <motion.div variants={itemVariants}>
          <TasksPreview tasks={tasks} />
        </motion.div>

        {/* Voice notes feed */}
        <motion.div variants={itemVariants}>
          <VoiceFeed voiceNotes={voiceNotes} />
        </motion.div>

        {/* Chat Widget */}
        <ChatWidget pageContext={{ page: 'home' }} />
      </motion.div>
    </div>
  )
}
