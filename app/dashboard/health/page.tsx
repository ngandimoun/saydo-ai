"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, Upload, FileText, ChevronRight, Sparkles, Activity, Droplets, Brain, Zap } from "lucide-react"
import type { 
  HealthDocument, 
  HealthInsight, 
  HealthRecommendation,
  ProactiveIntervention,
  MealPlan,
  FoodAnalysis,
  HealthStatus,
  BiologicalProfile
} from "@/lib/dashboard/types"
import { BiologicalTwinDashboard } from "@/components/dashboard/health/biological-twin-dashboard"
import { InterventionList } from "@/components/dashboard/health/intervention-list"
import { HealthUploadModal } from "@/components/dashboard/health/health-upload"
import { InsightCard } from "@/components/dashboard/health/insight-card"
import { RecommendationCard } from "@/components/dashboard/health/recommendation-card"
import { MealPlanComponent } from "@/components/dashboard/health/meal-plan"
import { FoodScanner } from "@/components/dashboard/health/food-scanner"
import { FoodAnalysisModal } from "@/components/dashboard/health/food-analysis-modal"

// Dynamically import ChatWidget and modals to reduce initial bundle size
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
  useHealthStatus,
  useBiologicalProfile,
  useInterventions,
  useHealthDocuments,
  useHealthInsights,
  useHealthRecommendations,
  useMealPlan,
  useBiologicalAge,
  useInvalidateHealthData
} from "@/hooks/queries"

/**
 * Health Hub Page - Airbnb-Inspired
 * 
 * The Health Hub presents your "Biological Twin" - a living,
 * breathing representation of your health data with:
 * - Ambient gradient backgrounds based on health status
 * - Animated health rings with contextual glow
 * - Glass-morphism intervention cards
 * - Smooth staggered animations
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

  // Use query hooks for cached data
  const { data: healthStatus, isLoading: statusLoading } = useHealthStatus()
  const { data: biologicalProfile, isLoading: profileLoading } = useBiologicalProfile()
  const { data: interventions = [], isLoading: interventionsLoading } = useInterventions()
  const { data: documents = [], isLoading: documentsLoading } = useHealthDocuments()
  const { data: insights = [], isLoading: insightsLoading } = useHealthInsights()
  const { data: recommendations = [], isLoading: recommendationsLoading } = useHealthRecommendations()
  const { data: mealPlan, isLoading: mealPlanLoading } = useMealPlan()
  const { data: ageData, isLoading: ageLoading } = useBiologicalAge()

  const isLoading = statusLoading || profileLoading || interventionsLoading || 
                    documentsLoading || insightsLoading || recommendationsLoading || 
                    mealPlanLoading || ageLoading

  const biologicalAge = ageData?.biological ?? null
  const chronologicalAge = ageData?.chronological ?? null

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

  useInterventionsRealtime(
    userId || '',
    (intervention) => {
      logger.info('New intervention received', { intervention })
      invalidateHealthData()
    },
    !!userId
  )

  useHealthStatusRealtime(
    userId || '',
    (status) => {
      logger.info('Health status updated', { status })
      invalidateHealthData()
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

  // Calculate days since last lab
  const daysSinceLastLab = documents.length > 0 && documents[0].analyzedAt
    ? Math.floor((Date.now() - documents[0].analyzedAt.getTime()) / (1000 * 60 * 60 * 24))
    : undefined

  const currentHealthStatus = healthStatus ?? {
    userId: '',
    energy: 70,
    stress: 30,
    recovery: 65,
    lastUpdated: new Date(),
    source: 'manual' as const,
  }

  const currentBiologicalProfile = biologicalProfile ?? {
    userId: '',
    allergies: [],
  }

  // Determine ambient background based on overall health
  const healthScore = (currentHealthStatus.energy + (100 - currentHealthStatus.stress) + currentHealthStatus.recovery) / 3
  const ambientColor = healthScore > 70 
    ? 'from-emerald-500/10 via-teal-500/5' 
    : healthScore > 50 
    ? 'from-amber-500/10 via-orange-500/5' 
    : 'from-rose-500/10 via-red-500/5'

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient Background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-b to-transparent pointer-events-none",
        ambientColor
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
              <p className="text-xs text-muted-foreground">Your biological twin</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FoodScanner
              variant="button"
              onAnalysisComplete={(analysis) => {
                // Use the real analysis from the food scanner
                setFoodAnalysis(analysis as FoodAnalysis)
                setIsAnalysisModalOpen(true)
              }}
            />
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

        {/* Quick Health Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-4 gap-2">
          {[
            { icon: Zap, label: 'Energy', value: `${currentHealthStatus.energy}%`, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { icon: Brain, label: 'Focus', value: '85%', color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { icon: Droplets, label: 'Hydration', value: '72%', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
            { icon: Activity, label: 'Active', value: '45m', color: 'text-green-500', bg: 'bg-green-500/10' },
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

        {/* Biological Twin Dashboard */}
        <motion.div variants={itemVariants}>
          <BiologicalTwinDashboard
            biologicalProfile={currentBiologicalProfile}
            healthStatus={currentHealthStatus}
            biologicalAge={biologicalAge ?? undefined}
            chronologicalAge={chronologicalAge ?? undefined}
            daysSinceLastLab={daysSinceLastLab}
            activeInterventionsCount={interventions.filter(i => !i.isDismissed).length}
          />
        </motion.div>

        {/* Proactive Interventions */}
        <AnimatePresence>
          {interventions.filter(i => !i.isDismissed).length > 0 && (
            <motion.div variants={itemVariants}>
              <InterventionList
                interventions={interventions}
                onDismiss={(id) => {
                  setInterventions(prev => prev.map(i => 
                    i.id === id ? { ...i, isDismissed: true } : i
                  ))
                }}
                onViewDetails={(id) => {
                  console.log('View details for intervention:', id)
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Documents */}
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
            {documents.map((doc, index) => (
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

        {/* AI Insights */}
        {insights.length > 0 && (
          <motion.section variants={itemVariants} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Sparkles size={14} className="text-primary" />
              </div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                AI Insights
              </h2>
            </div>

            <div className="space-y-2">
              {insights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.08 }}
                >
                  <InsightCard
                    insight={insight}
                    delay={0}
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Today's Recommendations */}
        {recommendations.length > 0 && (
          <motion.section variants={itemVariants} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Today's Recommendations
            </h2>

            <div className="grid grid-cols-3 gap-2">
              {recommendations.map((rec, index) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                >
                  <RecommendationCard
                    recommendation={rec}
                    delay={0}
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Meal Plan */}
        {mealPlan && (
          <motion.div variants={itemVariants}>
            <MealPlanComponent mealPlan={mealPlan} />
          </motion.div>
        )}

        {/* Upload Modal */}
        <HealthUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onUpload={(files) => {
            console.log('Uploading files:', files)
            setIsUploadOpen(false)
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
