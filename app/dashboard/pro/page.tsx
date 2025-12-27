"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Briefcase } from "lucide-react"
import { FileVault } from "@/components/dashboard/pro/file-vault"
import { AIOutputs } from "@/components/dashboard/pro/ai-outputs"
import { DailySummary } from "@/components/dashboard/pro/daily-summary"
import { 
  getMockWorkFiles, 
  getMockAIDocuments, 
  getMockEndOfDaySummary 
} from "@/lib/dashboard/mock-data"
import type { WorkFile, AIDocument, EndOfDaySummary } from "@/lib/dashboard/types"

/**
 * Pro Life Tab Page
 * 
 * Dedicated section for professional/work activities.
 * Features:
 * - File vault for uploading work documents
 * - AI-generated documents and outputs
 * - End-of-day summary with insights
 * 
 * TODO (Backend Integration):
 * - Fetch work files from Supabase Storage
 * - Load AI-generated documents
 * - Generate daily summary at user's preferred time
 */

export default function ProPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [workFiles, setWorkFiles] = useState<WorkFile[]>([])
  const [aiDocuments, setAIDocuments] = useState<AIDocument[]>([])
  const [endOfDaySummary, setEndOfDaySummary] = useState<EndOfDaySummary | null>(null)

  useEffect(() => {
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      setWorkFiles(getMockWorkFiles())
      setAIDocuments(getMockAIDocuments())
      setEndOfDaySummary(getMockEndOfDaySummary())
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
      <div className="flex items-center gap-2">
        <Briefcase size={20} className="text-teal-500" />
        <h1 className="text-2xl font-semibold">Pro Life</h1>
      </div>

      {/* File Vault */}
      <FileVault files={workFiles} />

      {/* AI Generated Documents */}
      <AIOutputs documents={aiDocuments} />

      {/* End of Day Summary */}
      {endOfDaySummary && (
        <DailySummary summary={endOfDaySummary} />
      )}
    </motion.div>
  )
}

