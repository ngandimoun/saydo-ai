"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Home } from "lucide-react"
import { Header } from "@/components/dashboard/home/header"
import { GreetingSection } from "@/components/dashboard/home/greeting-section"
import { UrgentAlerts } from "@/components/dashboard/home/urgent-alerts"
import { QuickActions } from "@/components/dashboard/home/quick-actions"
import { VoiceFeed } from "@/components/dashboard/home/voice-feed"
import { TasksPreview } from "@/components/dashboard/home/tasks-preview"
import { ChatWidget } from "@/components/dashboard/chat"
import { 
  getMockUserProfile, 
  getMockUrgentAlerts,
  getMockVoiceNotes,
  getMockTasks
} from "@/lib/dashboard/mock-data"
import type { UserProfile, UrgentAlert, VoiceNote, Task } from "@/lib/dashboard/types"
import { springs } from "@/lib/motion-system"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase"
import { useUrgentAlertsRealtime, useTasksRealtime, useVoiceRecordingsRealtime } from "@/hooks/use-realtime"
import { logger } from "@/lib/logger"

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
  const [isLoading, setIsLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [urgentAlerts, setUrgentAlerts] = useState<UrgentAlert[]>([])
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [userId, setUserId] = useState<string | null>(null)

  // Get user ID for realtime subscriptions
  useEffect(() => {
    const getUserId = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUserId()
  }, [])

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        // Load user profile from database
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile) {
          setUserProfile({
            id: profile.id,
            preferredName: profile.preferred_name || 'there',
            language: profile.language || 'en',
            profession: profile.profession || 'Professional',
            avatarUrl: profile.avatar_url,
            createdAt: new Date(profile.created_at),
            updatedAt: new Date(profile.updated_at),
          })
        } else {
          setUserProfile(getMockUserProfile())
        }

        // Load urgent alerts
        const { data: alerts } = await supabase
          .from('urgent_alerts')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_dismissed', false)
          .order('created_at', { ascending: false })
          .limit(5)

        if (alerts) {
          setUrgentAlerts(alerts.map(a => ({
            id: a.id,
            userId: a.user_id,
            title: a.title,
            description: a.description,
            urgencyLevel: a.urgency_level as UrgentAlert['urgencyLevel'],
            category: a.category as UrgentAlert['category'],
            audioSummaryUrl: a.audio_summary_url,
            sourceType: a.source_type as UrgentAlert['sourceType'],
            sourceId: a.source_id,
            isRead: a.is_read,
            isDismissed: a.is_dismissed,
            createdAt: new Date(a.created_at),
            expiresAt: a.expires_at ? new Date(a.expires_at) : undefined,
          })))
        } else {
          setUrgentAlerts(getMockUrgentAlerts())
        }

        // Load tasks
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .neq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(10)

        if (tasksData) {
          setTasks(tasksData.map(t => ({
            id: t.id,
            userId: t.user_id,
            title: t.title,
            description: t.description,
            priority: t.priority as Task['priority'],
            status: t.status as Task['status'],
            dueDate: t.due_date ? new Date(t.due_date) : undefined,
            dueTime: t.due_time,
            category: t.category,
            tags: t.tags || [],
            sourceRecordingId: t.source_recording_id,
            createdAt: new Date(t.created_at),
            completedAt: t.completed_at ? new Date(t.completed_at) : undefined,
          })))
        } else {
          setTasks(getMockTasks())
        }

        // Load voice notes
        const { data: recordings } = await supabase
          .from('voice_recordings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (recordings) {
          setVoiceNotes(recordings.map(r => ({
            id: r.id,
            userId: r.user_id,
            durationSeconds: r.duration_seconds,
            audioUrl: r.audio_url,
            transcription: r.transcription,
            status: r.status as VoiceNote['status'],
            contextChainId: r.context_chain_id,
            createdAt: new Date(r.created_at),
            extractedTasks: [],
            extractedReminders: [],
            extractedHealthNotes: [],
          })))
        } else {
          setVoiceNotes(getMockVoiceNotes())
        }
      } catch (error) {
        logger.error('Failed to load dashboard data', { error })
        // Fallback to mock data
        setUserProfile(getMockUserProfile())
        setUrgentAlerts(getMockUrgentAlerts())
        setTasks(getMockTasks())
        setVoiceNotes(getMockVoiceNotes())
      }

      setIsLoading(false)
    }

    loadData()
  }, [])

  // Subscribe to realtime updates
  useUrgentAlertsRealtime(
    userId || '',
    (alert) => {
      logger.info('New urgent alert received', { alert })
      setUrgentAlerts(prev => [alert as UrgentAlert, ...prev])
    },
    !!userId
  )

  useTasksRealtime(
    userId || '',
    (task) => {
      logger.info('Task updated', { task })
      setTasks(prev => {
        const existing = prev.findIndex(t => t.id === (task as Task).id)
        if (existing >= 0) {
          return prev.map((t, i) => i === existing ? task as Task : t)
        }
        return [task as Task, ...prev]
      })
    },
    !!userId
  )

  useVoiceRecordingsRealtime(
    userId || '',
    (recording) => {
      logger.info('Voice recording updated', { recording })
      // Transform recording to VoiceNote format with required fields
      const voiceNote: VoiceNote = {
        id: (recording as any).id,
        userId: (recording as any).user_id,
        durationSeconds: (recording as any).duration_seconds,
        audioUrl: (recording as any).audio_url,
        transcription: (recording as any).transcription,
        status: (recording as any).status as VoiceNote['status'],
        contextChainId: (recording as any).context_chain_id,
        createdAt: new Date((recording as any).created_at),
        extractedTasks: [],
        extractedReminders: [],
        extractedHealthNotes: [],
        aiSummary: (recording as any).ai_summary,
      }
      setVoiceNotes(prev => {
        const existing = prev.findIndex(v => v.id === voiceNote.id)
        if (existing >= 0) {
          return prev.map((v, i) => i === existing ? voiceNote : v)
        }
        return [voiceNote, ...prev]
      })
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
          <GreetingSection userProfile={userProfile} />
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
