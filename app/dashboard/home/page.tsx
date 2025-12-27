"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Header } from "@/components/dashboard/home/header"
import { GreetingSection } from "@/components/dashboard/home/greeting-section"
import { UrgentAlerts } from "@/components/dashboard/home/urgent-alerts"
import { QuickActions } from "@/components/dashboard/home/quick-actions"
import { VoiceFeed } from "@/components/dashboard/home/voice-feed"
import { TasksPreview } from "@/components/dashboard/home/tasks-preview"
import { 
  getMockUserProfile, 
  getMockUrgentAlerts,
  getMockVoiceNotes,
  getMockTasks
} from "@/lib/dashboard/mock-data"
import type { UserProfile, UrgentAlert, VoiceNote, Task } from "@/lib/dashboard/types"

/**
 * Home Tab Page
 * 
 * The main landing tab showing:
 * - Header with date and user avatar
 * - Personalized greeting with AI summaries
 * - Urgent alerts
 * - Quick action buttons
 * - Tasks preview
 * - Recent voice notes feed
 * 
 * TODO (Backend Integration):
 * - Fetch user profile from Supabase
 * - Subscribe to real-time alerts
 * - Load voice notes feed with pagination
 */

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [urgentAlerts, setUrgentAlerts] = useState<UrgentAlert[]>([])
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  useEffect(() => {
    const loadData = async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))

      // Try to get user profile from localStorage (set during onboarding)
      const storedProfile = localStorage.getItem('saydo_user_profile')
      if (storedProfile) {
        try {
          const parsed = JSON.parse(storedProfile)
          setUserProfile({
            ...getMockUserProfile(),
            preferredName: parsed.preferredName || 'there',
            language: parsed.language || 'en',
            profession: parsed.profession || 'Professional'
          })
        } catch {
          setUserProfile(getMockUserProfile())
        }
      } else {
        setUserProfile(getMockUserProfile())
      }

      setUrgentAlerts(getMockUrgentAlerts())
      setVoiceNotes(getMockVoiceNotes())
      setTasks(getMockTasks())
      setIsLoading(false)
    }

    loadData()
  }, [])

  if (isLoading || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-4 pt-4 pb-8 space-y-6 max-w-lg mx-auto"
    >
      {/* Header */}
      <Header userProfile={userProfile} />

      {/* Greeting with AI summaries */}
      <GreetingSection userProfile={userProfile} />

      {/* Urgent alerts */}
      <UrgentAlerts alerts={urgentAlerts} />

      {/* Quick actions grid */}
      <QuickActions />

      {/* Tasks preview */}
      <TasksPreview tasks={tasks} />

      {/* Voice notes feed */}
      <VoiceFeed voiceNotes={voiceNotes} />
    </motion.div>
  )
}

