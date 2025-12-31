"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Heart, Upload, FileText, ChevronRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InsightCard } from "./insight-card"
import { RecommendationCard } from "./recommendation-card"
import { HealthUploadModal } from "./health-upload"
import { 
  getMockHealthDocuments, 
  getMockHealthInsights, 
  getMockHealthRecommendations 
} from "@/lib/dashboard/mock-data"
import type { HealthDocument, HealthInsight, HealthRecommendation } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/**
 * Health Section
 * 
 * The Health Hub - central place for:
 * - Uploading health-related items (food, drinks, supplements, products, clinical documents)
 * - Checking health compatibility of uploaded items
 * - Viewing AI-generated insights
 * - Personalized recommendations (food, exercise, supplements)
 * 
 * TODO (Backend Integration):
 * - Fetch health documents from Supabase
 * - Real-time updates when analysis completes
 * - Store user's health preferences
 * 
 * TODO (AI Integration):
 * - Image recognition for food/drinks/supplements/products
 * - Process uploaded PDFs with OCR
 * - Extract biomarkers, ingredients, and nutritional values
 * - Generate personalized insights and compatibility analysis
 * - Cross-reference with allergies and preferences
 */

interface HealthSectionProps {
  className?: string
}

export function HealthSection({ className }: HealthSectionProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [documents, setDocuments] = useState<HealthDocument[]>([])
  const [insights, setInsights] = useState<HealthInsight[]>([])
  const [recommendations, setRecommendations] = useState<HealthRecommendation[]>([])

  // Load mock data
  useEffect(() => {
    /**
     * TODO (Backend):
     * Fetch from Supabase:
     * - health_documents
     * - health_insights
     * - health_recommendations
     * 
     * Subscribe to real-time changes
     */
    setDocuments(getMockHealthDocuments())
    setInsights(getMockHealthInsights())
    setRecommendations(getMockHealthRecommendations())
  }, [])

  return (
    <section id="section-health" className={cn("", className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center">
            <Heart size={16} className="text-rose-500" />
          </div>
          <h2 className="saydo-headline text-xl text-foreground">Health Hub</h2>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsUploadOpen(true)}
          className="rounded-full gap-2"
        >
          <Upload size={14} />
          <span className="hidden sm:inline">Upload Results</span>
          <span className="sm:hidden">Upload</span>
        </Button>
      </div>

      {/* Recent Documents - if any */}
      {documents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Recent Documents
            </span>
            <button className="text-xs text-primary hover:underline flex items-center gap-1">
              View all
              <ChevronRight size={12} />
            </button>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {documents.slice(0, 3).map((doc) => (
              <motion.button
                key={doc.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border/50 shadow-sm"
              >
                <FileText size={16} className="text-rose-500" />
                <div className="text-left">
                  <p className="text-sm font-medium truncate max-w-[120px]">
                    {doc.fileName}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {doc.status === 'analyzed' ? '✓ Analyzed' : 'Processing...'}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={14} className="text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              AI Insights
            </span>
          </div>
          
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <InsightCard 
                key={insight.id} 
                insight={insight}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-3">
            Today's Recommendations
          </span>
          
          <div className="grid grid-cols-3 gap-2">
            {recommendations.map((rec, index) => (
              <RecommendationCard 
                key={rec.id} 
                recommendation={rec}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {documents.length === 0 && insights.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/10 flex items-center justify-center">
            <Heart size={28} className="text-rose-500" />
          </div>
          <h3 className="font-medium text-foreground mb-1">
            Check what's good for your health
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upload food, drinks, supplements, products, or clinical results. Saydo will analyze if it's good for you.
          </p>
          <Button
            onClick={() => setIsUploadOpen(true)}
            className="rounded-full gap-2"
          >
            <Upload size={16} />
            Upload for Analysis
          </Button>
        </motion.div>
      )}

      {/* Upload Modal */}
      <HealthUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={(files) => {
          /**
           * TODO (Backend):
           * 1. Upload files to Supabase Storage
           * 2. Create records in health_documents table
           * 3. Trigger AI processing
           */
          console.log('Uploading files:', files)
          setIsUploadOpen(false)
        }}
      />
    </section>
  )
}




