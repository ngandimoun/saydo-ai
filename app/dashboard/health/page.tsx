"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Heart, Upload, FileText, ChevronRight, Sparkles, Activity, Droplets, Brain, Zap } from "lucide-react"
import { 
  getMockHealthDocuments,
  getMockHealthInsights,
  getMockHealthRecommendations,
  getMockBiologicalProfile,
  getMockHealthStatus,
  getMockProactiveInterventions,
  getMockMealPlan,
  getMockFoodAnalysis
} from "@/lib/dashboard/mock-data"
import type { 
  HealthDocument, 
  HealthInsight, 
  HealthRecommendation,
  ProactiveIntervention,
  MealPlan,
  FoodAnalysis,
  HealthStatus
} from "@/lib/dashboard/types"
import { BiologicalTwinDashboard } from "@/components/dashboard/health/biological-twin-dashboard"
import { InterventionList } from "@/components/dashboard/health/intervention-list"
import { HealthUploadModal } from "@/components/dashboard/health/health-upload"
import { InsightCard } from "@/components/dashboard/health/insight-card"
import { RecommendationCard } from "@/components/dashboard/health/recommendation-card"
import { MealPlanComponent } from "@/components/dashboard/health/meal-plan"
import { FoodScanner } from "@/components/dashboard/health/food-scanner"
import { FoodAnalysisModal } from "@/components/dashboard/health/food-analysis-modal"
import { ChatWidget } from "@/components/dashboard/chat"
import { cn } from "@/lib/utils"
import { springs } from "@/lib/motion-system"
import { createClient } from "@/lib/supabase"
import { useInterventionsRealtime, useHealthStatusRealtime } from "@/hooks/use-realtime"
import { logger } from "@/lib/logger"

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
  const [documents, setDocuments] = useState<HealthDocument[]>([])
  const [insights, setInsights] = useState<HealthInsight[]>([])
  const [recommendations, setRecommendations] = useState<HealthRecommendation[]>([])
  const [interventions, setInterventions] = useState<ProactiveIntervention[]>([])
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [foodAnalysis, setFoodAnalysis] = useState<FoodAnalysis | null>(null)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
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
        // Load health status
        const { data: status } = await supabase
          .from('health_status')
          .select('*')
          .eq('user_id', user.id)
          .order('last_updated', { ascending: false })
          .limit(1)
          .single()

        if (status) {
          setHealthStatus({
            userId: status.user_id,
            energy: status.energy,
            stress: status.stress,
            recovery: status.recovery,
            lastUpdated: new Date(status.last_updated),
            source: status.source as HealthStatus['source'],
          })
        } else {
          setHealthStatus(getMockHealthStatus())
        }

        // Load proactive interventions
        const { data: interventionsData } = await supabase
          .from('proactive_interventions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_dismissed', false)
          .order('created_at', { ascending: false })
          .limit(10)

        if (interventionsData) {
          setInterventions(interventionsData.map(i => ({
            id: i.id,
            userId: i.user_id,
            type: i.type as ProactiveIntervention['type'],
            title: i.title,
            description: i.description,
            urgencyLevel: i.urgency_level as ProactiveIntervention['urgencyLevel'],
            category: i.category as ProactiveIntervention['category'],
            context: i.context,
            biologicalReason: i.biological_reason,
            actionItems: i.action_items || [],
            dismissible: i.dismissible,
            validUntil: i.valid_until ? new Date(i.valid_until) : undefined,
            createdAt: new Date(i.created_at),
            isDismissed: i.is_dismissed,
          })))
        } else {
          setInterventions(getMockProactiveInterventions())
        }

        // Load health documents
        const { data: docs } = await supabase
          .from('health_documents')
          .select('*')
          .eq('user_id', user.id)
          .order('uploaded_at', { ascending: false })
          .limit(10)

        if (docs) {
          setDocuments(docs.map(d => ({
            id: d.id,
            userId: d.user_id,
            fileName: d.file_name,
            fileType: d.file_type,
            fileUrl: d.file_url,
            documentType: d.document_type as HealthDocument['documentType'],
            status: d.status as HealthDocument['status'],
            extractedData: d.extracted_data,
            uploadedAt: new Date(d.uploaded_at),
            analyzedAt: d.analyzed_at ? new Date(d.analyzed_at) : undefined,
          })))
        } else {
          setDocuments(getMockHealthDocuments())
        }

        // Load insights
        const { data: insightsData } = await supabase
          .from('health_insights')
          .select('*')
          .eq('user_id', user.id)
          .order('priority', { ascending: true })
          .limit(10)

        if (insightsData) {
          setInsights(insightsData.map(i => ({
            id: i.id,
            userId: i.user_id,
            category: i.category as HealthInsight['category'],
            title: i.title,
            description: i.description,
            iconName: i.icon_name,
            color: i.color,
            priority: i.priority,
            sourceDocumentId: i.source_document_id,
            createdAt: new Date(i.created_at),
            validUntil: i.valid_until ? new Date(i.valid_until) : undefined,
          })))
        } else {
          setInsights(getMockHealthInsights())
        }

        // Load recommendations
        const { data: recs } = await supabase
          .from('health_recommendations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (recs) {
          setRecommendations(recs.map(r => ({
            id: r.id,
            userId: r.user_id,
            type: r.type as HealthRecommendation['type'],
            title: r.title,
            description: r.description,
            reason: r.reason,
            imageUrl: r.image_url,
            timing: r.timing,
            frequency: r.frequency,
            createdAt: new Date(r.created_at),
          })))
        } else {
          setRecommendations(getMockHealthRecommendations())
        }

        // Meal plan and food analysis still use mock for now
        setMealPlan(getMockMealPlan())
      } catch (error) {
        logger.error('Failed to load health data', { error })
        // Fallback to mock data
        setHealthStatus(getMockHealthStatus())
        setInterventions(getMockProactiveInterventions())
        setDocuments(getMockHealthDocuments())
        setInsights(getMockHealthInsights())
        setRecommendations(getMockHealthRecommendations())
        setMealPlan(getMockMealPlan())
      }

      setIsLoading(false)
    }
    loadData()
  }, [])

  // Subscribe to realtime updates
  useInterventionsRealtime(
    userId || '',
    (intervention) => {
      logger.info('New intervention received', { intervention })
      setInterventions(prev => [intervention as ProactiveIntervention, ...prev])
    },
    !!userId
  )

  useHealthStatusRealtime(
    userId || '',
    (status) => {
      logger.info('Health status updated', { status })
      setHealthStatus(status as HealthStatus)
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

  const biologicalProfile = getMockBiologicalProfile()
  const currentHealthStatus = healthStatus || getMockHealthStatus()

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
                const mockAnalysis = getMockFoodAnalysis('', analysis.identifiedFood?.name || 'Unknown')
                setFoodAnalysis(mockAnalysis)
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
            biologicalProfile={biologicalProfile}
            healthStatus={currentHealthStatus}
            biologicalAge={36}
            chronologicalAge={35}
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
