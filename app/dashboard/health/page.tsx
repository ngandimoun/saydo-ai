"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Heart, Upload, FileText, ChevronRight, Sparkles } from "lucide-react"
import { 
  getMockHealthDocuments,
  getMockHealthInsights,
  getMockHealthRecommendations 
} from "@/lib/dashboard/mock-data"
import type { HealthDocument, HealthInsight, HealthRecommendation } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Health Tab Page
 * 
 * Full-screen health hub showing:
 * - Upload button for clinical results
 * - Recent documents with analysis status
 * - AI-generated insights
 * - Personalized recommendations (food, drink, exercise)
 * 
 * TODO (Backend Integration):
 * - Implement file upload to Supabase Storage
 * - Trigger AI analysis on upload
 * - Real-time status updates
 */

export default function HealthPage() {
  const [documents, setDocuments] = useState<HealthDocument[]>([])
  const [insights, setInsights] = useState<HealthInsight[]>([])
  const [recommendations, setRecommendations] = useState<HealthRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      setDocuments(getMockHealthDocuments())
      setInsights(getMockHealthInsights())
      setRecommendations(getMockHealthRecommendations())
      setIsLoading(false)
    }
    loadData()
  }, [])

  if (isLoading) {
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
      className="px-4 pt-6 pb-8 space-y-6 max-w-lg mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart size={20} className="text-rose-500" />
          <h1 className="text-2xl font-semibold">Health Hub</h1>
        </div>
        <button
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full",
            "bg-rose-500 text-white font-medium text-sm",
            "hover:bg-rose-600 transition-colors touch-manipulation"
          )}
        >
          <Upload size={16} />
          Upload Results
        </button>
      </div>

      {/* Recent Documents */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Recent Documents
          </h2>
          <button className="text-xs text-primary flex items-center gap-1 hover:underline">
            View all
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
          {documents.map((doc) => (
            <button
              key={doc.id}
              className={cn(
                "flex-shrink-0 p-3 rounded-xl",
                "bg-card border border-border/50",
                "hover:border-border transition-colors",
                "text-left min-w-[160px]"
              )}
            >
              <FileText size={20} className="text-muted-foreground mb-2" />
              <p className="text-sm font-medium truncate">{doc.fileName}</p>
              <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                ✓ {doc.status === 'analyzed' ? 'Analyzed' : doc.status}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* AI Insights */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-primary" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            AI Insights
          </h2>
        </div>

        <div className="space-y-3">
          {insights.map((insight, index) => (
            <motion.button
              key={insight.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "w-full p-4 rounded-2xl text-left",
                "bg-card border-l-4",
                insight.category === 'warning' ? 'border-l-amber-500' : 
                insight.category === 'supplement' ? 'border-l-yellow-500' :
                'border-l-indigo-500'
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                  insight.category === 'warning' ? 'bg-amber-500/20' :
                  insight.category === 'supplement' ? 'bg-yellow-500/20' :
                  'bg-indigo-500/20'
                )}>
                  {insight.category === 'warning' && (
                    <span className="text-amber-500">⚠️</span>
                  )}
                  {insight.category === 'supplement' && (
                    <span className="text-yellow-500">☀️</span>
                  )}
                  {insight.category === 'lifestyle' && (
                    <span className="text-indigo-500">🌙</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{insight.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                </div>
                <ChevronRight size={18} className="text-muted-foreground" />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Today's Recommendations */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Today's Recommendations
        </h2>

        <div className="grid grid-cols-3 gap-3">
          {recommendations.map((rec, index) => (
            <motion.button
              key={rec.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-4 rounded-2xl text-center",
                "bg-gradient-to-br",
                rec.type === 'food' ? 'from-green-900/50 to-green-800/30' :
                rec.type === 'drink' ? 'from-orange-900/50 to-orange-800/30' :
                'from-rose-900/50 to-rose-800/30'
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center",
                rec.type === 'food' ? 'bg-green-500/20' :
                rec.type === 'drink' ? 'bg-orange-500/20' :
                'bg-rose-500/20'
              )}>
                {rec.type === 'food' && <span>🥗</span>}
                {rec.type === 'drink' && <span>🍊</span>}
                {rec.type === 'exercise' && <span>🏃</span>}
              </div>
              <h3 className="font-semibold text-sm">{rec.title}</h3>
              <p className="text-xs text-muted-foreground capitalize">{rec.timing}</p>
            </motion.button>
          ))}
        </div>
      </section>
    </motion.div>
  )
}

