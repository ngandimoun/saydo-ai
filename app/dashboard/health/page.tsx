"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, Upload, FileText, ChevronRight, Sparkles, Loader2 } from "lucide-react"
import type { 
  HealthDocument, 
  FoodAnalysis,
} from "@/lib/dashboard/types"
import { InterventionList } from "@/components/dashboard/health/intervention-list"
import { HealthUploadModal } from "@/components/dashboard/health/health-upload"
import { FoodAnalysisModal } from "@/components/dashboard/health/food-analysis-modal"
// Gamification Components
import { HealthScoreCard } from "@/components/dashboard/health/health-score-card"
import { StreakCounter } from "@/components/dashboard/health/streak-counter"
import { AchievementsPanel } from "@/components/dashboard/health/achievements-panel"
import { DailyChallenges } from "@/components/dashboard/health/daily-challenges"
// Skincare Component - Simplified
import { SkincareCard } from "@/components/dashboard/health/skincare/skincare-card"
// New Cumulative Health Dashboard
import { CumulativeHealthDashboard } from "@/components/dashboard/health/cumulative-health-dashboard"
// Recommendations and Meal Plans
import { RecommendationsSection } from "@/components/dashboard/health/recommendations-section"
import { MealPlanSection } from "@/components/dashboard/health/meal-plan-section"
// Notifications
import { NotificationCenter } from "@/components/dashboard/notifications/notification-center"

// Dynamically import ChatWidget to reduce initial bundle size
const ChatWidget = dynamic(() => import("@/components/dashboard/chat").then(mod => ({ default: mod.ChatWidget })), {
  ssr: false,
  loading: () => null
})
import { cn } from "@/lib/utils"
import { springs } from "@/lib/motion-system"
import { createClient } from "@/lib/supabase"
import { useInterventionsRealtime, useHealthStatusRealtime } from "@/hooks/use-realtime"
import { logger } from "@/lib/logger"
import {
  useInterventions,
  useHealthDocuments,
  useInvalidateHealthData
} from "@/hooks/queries"
import { useInvalidateHealthProfile } from "@/hooks/queries/use-health-profile"

/**
 * Health Hub Page - Smart Cumulative Health Tracking
 * 
 * The Health Hub now shows a cumulative health profile that:
 * - Accumulates findings across body systems
 * - Tracks evolution when same tests are uploaded again
 * - Finds cross-system correlations
 * - Generates holistic, personalized plans
 */

// Animation variants for staggered children
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

export default function HealthPage() {
  const [foodAnalysis, setFoodAnalysis] = useState<FoodAnalysis | null>(null)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Use query hooks for data
  const { data: interventions = [], isLoading: interventionsLoading } = useInterventions()
  const { data: documents = [], isLoading: documentsLoading } = useHealthDocuments()

  const isLoading = interventionsLoading || documentsLoading

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

  // Subscribe to realtime updates and invalidate queries
  const invalidateHealthData = useInvalidateHealthData()
  const invalidateHealthProfile = useInvalidateHealthProfile()

  // Combined invalidation
  const refreshAllHealthData = () => {
    invalidateHealthData()
    invalidateHealthProfile()
  }

  useInterventionsRealtime(
    userId || '',
    (intervention) => {
      logger.info('New intervention received', { intervention })
      refreshAllHealthData()
    },
    !!userId
  )

  useHealthStatusRealtime(
    userId || '',
    (status) => {
      logger.info('Health status updated', { status })
      refreshAllHealthData()
    },
    !!userId
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div 
          className="relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-16 h-16 rounded-full border-3 border-rose-200 dark:border-rose-900" />
          <motion.div 
            className="absolute inset-0 rounded-full border-3 border-transparent border-t-rose-500"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <Heart className="absolute inset-0 m-auto w-6 h-6 text-rose-500" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
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
        className="relative px-4 pt-6 pb-8 space-y-6 max-w-lg mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/20">
              <Heart size={20} className="text-white" />
            </div>
            <div>
              <h1 className="saydo-headline text-2xl font-semibold">Health Hub</h1>
              <p className="text-xs text-muted-foreground">Your complete health picture</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsUploadOpen(true)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-full",
                "bg-gradient-to-r from-rose-500 to-pink-600",
                "text-white font-medium text-sm",
                "shadow-lg shadow-rose-500/25",
                "transition-shadow hover:shadow-xl hover:shadow-rose-500/30",
                "touch-manipulation"
              )}
            >
              <Upload size={16} />
              Upload
            </motion.button>
          </div>
        </motion.div>

        {/* Smart Cumulative Health Dashboard - PRIMARY DISPLAY */}
        {/* This is the main focus - shows dynamic body system findings, correlations, evolution */}
        <motion.div variants={itemVariants}>
          <CumulativeHealthDashboard 
            onUpload={() => setIsUploadOpen(true)}
          />
        </motion.div>

        {/* Personalized Recommendations - Based on health findings */}
        <motion.div variants={itemVariants}>
          <RecommendationsSection />
        </motion.div>

        {/* Weekly Meal Plan - Personalized nutrition */}
        <motion.div variants={itemVariants}>
          <MealPlanSection />
        </motion.div>

        {/* Daily Progress - Now secondary */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
          <HealthScoreCard />
          <StreakCounter />
        </motion.div>

        {/* Daily Challenges */}
        <motion.div variants={itemVariants}>
          <DailyChallenges />
        </motion.div>

        {/* Proactive Interventions */}
        <AnimatePresence>
          {interventions.filter(i => !i.isDismissed).length > 0 && (
            <motion.div variants={itemVariants}>
              <InterventionList
                interventions={interventions}
                onDismiss={async (id) => {
                  // Update intervention in database
                  const supabase = createClient()
                  const { data: { user } } = await supabase.auth.getUser()
                  if (user) {
                    await supabase
                      .from("proactive_interventions")
                      .update({ is_dismissed: true, dismissed_at: new Date().toISOString() })
                      .eq("id", id)
                      .eq("user_id", user.id)
                    refreshAllHealthData()
                  }
                }}
                onViewDetails={(id) => {
                  console.log('View details for intervention:', id)
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Documents */}
        {documents.length > 0 && (
          <motion.section variants={itemVariants} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Recent Documents
              </h2>
              <button className="text-xs text-primary flex items-center gap-1 hover:underline">
                View all
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {documents.slice(0, 5).map((doc, index) => (
                <motion.button
                  key={doc.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                  whileHover={{ y: -2 }}
                  className={cn(
                    "flex-shrink-0 p-4 rounded-2xl",
                    "glass-card border border-border/50",
                    "hover:border-rose-500/30 hover:shadow-lg hover:shadow-rose-500/10",
                    "transition-all duration-300",
                    "text-left min-w-[160px]"
                  )}
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center mb-3">
                    <FileText size={18} className="text-rose-500" />
                  </div>
                  <p className="text-sm font-medium truncate">{doc.fileName}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      {doc.status === 'analyzed' ? 'Analyzed' : doc.status}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}

        {/* Skincare - Simplified */}
        <motion.div variants={itemVariants}>
          <SkincareCard />
        </motion.div>

        {/* Achievements */}
        <motion.div variants={itemVariants}>
          <AchievementsPanel limit={6} />
        </motion.div>

        {/* Upload Modal */}
        <HealthUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onUploadComplete={(result) => {
            // If analysis contains food data, show in analysis modal
            if (result.documentType === 'food_photo' && result.analysis) {
              setFoodAnalysis({
                detected: result.analysis.detected || '',
                calories: result.analysis.calories,
                nutrients: result.analysis.nutrients,
                healthScore: result.healthImpact?.score || 0,
                benefits: result.healthImpact?.benefits || [],
                concerns: result.healthImpact?.concerns || [],
                allergyWarnings: result.allergyWarnings,
                recommendations: result.recommendations,
              } as FoodAnalysis)
              setIsAnalysisModalOpen(true)
            }
            // Invalidate health data queries to refresh the list
            refreshAllHealthData()
          }}
        />

        {/* Food Analysis Modal */}
        <FoodAnalysisModal
          analysis={foodAnalysis}
          isOpen={isAnalysisModalOpen}
          onClose={() => {
            setIsAnalysisModalOpen(false)
            setFoodAnalysis(null)
          }}
        />

        {/* Chat Widget */}
        <ChatWidget pageContext={{ page: 'health' }} />
      </motion.div>
    </div>
  )
}
